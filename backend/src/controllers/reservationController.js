const { Reservation, Driver } = require('../models');
const { generateReservationPdf, generateInvoicePdf } = require('../services/pdfService');
const { sendAdminNotification, sendClientConfirmation, sendInvoiceToClient, sendInvoiceToDriver } = require('../services/emailService');
const { sendAdminSms } = require('../services/smsService');
const sseService = require('../services/sseService');
const logger = require('../middleware/logger');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { normalizeFrenchPhone, isValidFrenchPhone } = require('../utils/phone');
const { likeContains } = require('../utils/search');
const {
  calculateTrip, calculateHourlyService, getTripCalculationHttpError,
} = require('../services/tripCalculationService');
const { PDF_DIR } = require('../config/storage');

// ── Créer une réservation (public) ────────────────────────────────────────────
exports.createReservation = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone,
      departureAddress, arrivalAddress,
      date, time, passengers, luggage, comments,
      gdprConsent, termsAccepted,
      driverSlug,
      serviceType,
      serviceDuration,
    } = req.body;

    const validationErrors = {};
    if (!firstName?.trim()) validationErrors.firstName = 'Le prénom est requis.';
    if (!lastName?.trim()) validationErrors.lastName = 'Le nom est requis.';
    if (!email?.trim() || !/\S+@\S+\.\S+/.test(email)) {
      validationErrors.email = 'Adresse email invalide.';
    }
    const normalizedPhone = normalizeFrenchPhone(phone);
    if (!normalizedPhone || !isValidFrenchPhone(normalizedPhone)) {
      validationErrors.phone = 'Numéro de téléphone invalide (format français).';
    }
    if (!departureAddress?.trim()) {
      validationErrors.departureAddress = 'L\'adresse de départ est requise.';
    }
    if (serviceType === 'transfert' && !arrivalAddress?.trim()) {
      validationErrors.arrivalAddress = 'L\'adresse d\'arrivée est requise.';
    }
    if (!date) validationErrors.date = 'La date est requise.';
    if (!time) validationErrors.time = 'L\'heure est requise.';
    if (!driverSlug?.trim()) validationErrors.driverSlug = 'Le chauffeur doit être sélectionné.';
    if (!['transfert', 'mise_a_disposition'].includes(serviceType)) {
      validationErrors.serviceType = 'Type de prestation invalide.';
    }
    if (serviceType === 'mise_a_disposition' && !serviceDuration) {
      validationErrors.serviceDuration = 'La durée de mise à disposition est requise.';
    }
    if (gdprConsent !== true) {
      validationErrors.gdprConsent = 'Le consentement à la politique de confidentialité est requis.';
    }
    if (termsAccepted !== true) {
      validationErrors.termsAccepted = 'L\'acceptation des CGU est requise.';
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        error: 'Formulaire incomplet ou invalide.',
        fields: validationErrors,
      });
    }

    // Le propriétaire est toujours déterminé explicitement par son slug.
    const targetDriver = await Driver.findOne({
      where: {
        slug: driverSlug,
        role: 'driver',
        status: { [Op.in]: ['trial', 'active'] },
      },
    });
    if (!targetDriver) {
      return res.status(404).json({ error: 'Chauffeur introuvable ou compte inactif.' });
    }

    // Le calcul serveur est obligatoire dans les deux modes et précède
    // strictement toute écriture en base.
    //
    // Transfert : géocodage puis itinéraire, donc distance et prix au km.
    // Mise à disposition : aucune destination, donc aucune distance — le prix
    // annoncé ne couvre que la part horaire. Le supplément kilométrique est
    // calculé à la validation de la course, une fois le kilométrage relevé.
    let trip = null;
    let hourlyService = null;
    let hours = null;

    if (serviceType === 'transfert') {
      try {
        trip = await calculateTrip(departureAddress, arrivalAddress);
      } catch (calculationError) {
        logger.warn(`[RESERVATION] Calcul trajet refusé : ${calculationError.message}`);
        const httpError = getTripCalculationHttpError(calculationError);
        return res.status(httpError.status).json({ error: httpError.message });
      }
    } else {
      hours = parseInt(serviceDuration, 10);
      if (!Number.isFinite(hours) || hours <= 0) {
        return res.status(400).json({
          error: 'Formulaire incomplet ou invalide.',
          fields: { serviceDuration: 'Durée de mise à disposition invalide.' },
        });
      }
      hourlyService = calculateHourlyService(hours);
    }

    const reservation = await Reservation.createUnique({
      firstName, lastName, email, phone: normalizedPhone,
      // L'adresse d'arrivée n'est plus détournée pour encoder le mode de
      // prestation (« Mise à disposition – 3h ») : serviceType porte désormais
      // cette information. Une mise à disposition n'ayant pas de destination,
      // le champ reste vide.
      //
      // Chaîne vide et non NULL : la colonne est déclarée allowNull: false et
      // la rendre nullable exigerait une migration supplémentaire. À reprendre
      // le jour où le schéma évoluera de nouveau — NULL exprimerait plus
      // justement « pas de destination » qu'une chaîne vide.
      departureAddress, arrivalAddress: serviceType === 'transfert' ? arrivalAddress : '',
      date, time,
      passengers:     parseInt(passengers) || 1,
      luggage:        parseInt(luggage) || 0,
      comments:       comments || null,
      serviceType,
      serviceDurationHours: hourlyService ? hourlyService.hours : null,
      distance:       trip?.distance_km ?? null,
      estimatedPrice: trip?.estimatedPrice ?? hourlyService?.estimatedPrice ?? null,
      gdprConsent,
      termsAccepted,
      status:         'pending',
      chauffeurId:   targetDriver.id,  // ── Isolation multi-tenant
    });

    logger.info(`[RESERVATION] Créée : ${reservation.reservationNumber} – ${email} – IP: ${req.ip}`);

    // Notification SSE temps réel au chauffeur concerné (non-bloquant)
    const sseCount = sseService.emit(targetDriver.id, 'new_reservation', {
      id:                reservation.id,
      reservationNumber: reservation.reservationNumber,
      firstName:         reservation.firstName,
      lastName:          reservation.lastName,
      departureAddress:  reservation.departureAddress,
      arrivalAddress:    reservation.arrivalAddress,
      date:              reservation.date,
      time:              reservation.time,
      passengers:        reservation.passengers,
      estimatedPrice:    reservation.estimatedPrice,
      ts:                Date.now(),
    });
    if (sseCount > 0) {
      logger.info(`[SSE] Notification envoyée à ${targetDriver.email} (${sseCount} onglet(s))`);
    }

    // Répond tout de suite — la génération du PDF (PDFKit) et les
    // notifications (email/SMS) ne bloquent plus la réponse au client.
    res.status(201).json({
      message: 'Réservation enregistrée avec succès !',
      reservation: {
        id: reservation.id,
        reservationNumber: reservation.reservationNumber,
        status: reservation.status,
        serviceType: reservation.serviceType,
        serviceDurationHours: reservation.serviceDurationHours,
        distance: reservation.distance,
        duration: trip?.duration_min ?? null,
        estimatedPrice: reservation.estimatedPrice,
        includedKm: hourlyService?.includedKm ?? null,
      },
    });

    // Génération PDF réservation + notifications — après la réponse HTTP.
    (async () => {
      let pdfPath = null;
      try {
        const { filepath } = await generateReservationPdf(reservation);
        pdfPath = filepath;
        reservation.pdfReservationPath = filepath;
        await reservation.save();
        logger.info(`[PDF] Bon de réservation généré : ${reservation.reservationNumber}`);
      } catch (pdfErr) {
        logger.error(`[PDF] Erreur génération bon réservation ${reservation.reservationNumber} : ${pdfErr.message}`);
      }

      const results = await Promise.allSettled([
        sendAdminNotification(reservation, pdfPath, targetDriver.email),
        sendClientConfirmation(reservation, pdfPath),
        sendAdminSms(reservation),
      ]);
      const labels = ['email-admin', 'email-client', 'sms-admin'];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          if (r.value?.skipped) {
            logger.warn(`[NOTIF] ${labels[i]} ignoré – ${reservation.reservationNumber} : ${r.value.reason}`);
          } else {
            logger.info(`[NOTIF] ${labels[i]} envoyé – ${reservation.reservationNumber}`);
          }
        } else {
          logger.error(`[NOTIF] ${labels[i]} échoué – ${reservation.reservationNumber} : ${r.reason?.message}`);
        }
      });
    })();
  } catch (err) {
    logger.error(`[RESERVATION] Erreur création : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors de la création de la réservation.' });
  }
};

// ── Lister les réservations du chauffeur connecté (protégé) ───────────────────
exports.getAllReservations = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    // Sécuriser les valeurs numériques
    const safePage  = Math.max(1, parseInt(page)  || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

    // ── Isolation multi-tenant : OBLIGATOIRE ─────────────────────────────────
    const where = { chauffeurId: req.driver.id };

    // Filtre date pour le planning hebdomadaire
    const dateFrom = req.query.dateFrom;
    const dateTo   = req.query.dateTo;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date[Op.gte] = dateFrom;
      if (dateTo)   where.date[Op.lte] = dateTo;
    }

    if (status && status !== 'all') {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (validStatuses.includes(status)) where.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim().substring(0, 100);
      where[Op.or] = [
        likeContains('firstName', term),
        likeContains('lastName', term),
        likeContains('email', term),
        likeContains('reservationNumber', term),
        likeContains('phone', term),
      ];
    }

    const offset = (safePage - 1) * safeLimit;
    const { count, rows } = await Reservation.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: safeLimit,
      offset,
      attributes: { exclude: ['pdfReservationPath', 'pdfInvoicePath'] },
    });

    res.json({
      total: count,
      page: safePage,
      pages: Math.ceil(count / safeLimit),
      reservations: rows,
    });
  } catch (err) {
    logger.error(`[RESERVATION] Erreur liste : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations.' });
  }
};

// ── Détail d'une réservation (protégé, isolation chauffeur) ─────────────────
exports.getReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      where: { id: req.params.id, chauffeurId: req.driver.id },
    });
    if (!reservation) {
      return res.status(404).json({ error: 'Réservation introuvable.' });
    }
    res.json(reservation);
  } catch (err) {
    logger.error(`[RESERVATION] Erreur détail : ${err.message}`);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── Mettre à jour le statut (protégé, isolation chauffeur) ───────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide. Utilisez /complete pour terminer une course.' });
    }

    // ── Isolation multi-tenant ───────────────────────────────────────────────
    const reservation = await Reservation.findOne({
      where: { id: req.params.id, chauffeurId: req.driver.id },
    });
    if (!reservation) {
      return res.status(404).json({ error: 'Réservation introuvable.' });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({ error: 'Une course terminée ne peut plus être modifiée.' });
    }

    const oldStatus = reservation.status;
    reservation.status = status;
    await reservation.save();

    logger.info(`[STATUT] ${reservation.reservationNumber} : ${oldStatus} → ${status} (par ${req.driver.email})`);
    res.json({ message: 'Statut mis à jour.', reservation });
  } catch (err) {
    logger.error(`[STATUT] Erreur mise à jour : ${err.message}`);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── Compléter une course → génère et envoie facture (protégé, isolation chauffeur)
exports.completeReservation = async (req, res) => {
  try {
    const { price } = req.body;

    // ── Isolation multi-tenant ───────────────────────────────────────────────
    const reservation = await Reservation.findOne({
      where: { id: req.params.id, chauffeurId: req.driver.id },
    });
    if (!reservation) {
      return res.status(404).json({ error: 'Réservation introuvable.' });
    }

    // Prévenir la double validation
    if (reservation.status === 'completed' && reservation.pdfInvoicePath) {
      return res.status(409).json({
        error: 'Cette course a déjà été validée et la facture a été générée.',
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Impossible de valider une course annulée.' });
    }

    reservation.status = 'completed';
    reservation.price  = parseFloat(price);
    // Générer un token unique pour le lien de notation client
    if (!reservation.reviewToken) {
      const { v4: uuidv4 } = require('uuid');
      reservation.reviewToken = uuidv4();
    }
    await reservation.save();

    logger.info(`[COURSE] Validée : ${reservation.reservationNumber} – ${price}€ (par ${req.driver.email})`);

    // Répond tout de suite — la génération du PDF (PDFKit) et l'envoi des
    // emails (SMTP) ne bloquent plus la réponse au chauffeur. Rien dans la
    // réponse ne dépend plus de leur résultat (l'ancien champ invoicePdfUrl
    // pointait vers une route /pdfs publique retirée pour raison de sécurité
    // — le client reçoit déjà sa facture en pièce jointe email).
    res.json({
      message: 'Course validée avec succès.',
      reservation,
    });

    // Génération facture PDF + envoi email — après la réponse HTTP.
    (async () => {
      let invoiceFilePath = null;
      try {
        const { filepath } = await generateInvoicePdf(reservation);
        invoiceFilePath = filepath;
        reservation.pdfInvoicePath = filepath;
        await reservation.save();
        logger.info(`[PDF] Facture générée : ${reservation.reservationNumber}`);
      } catch (pdfErr) {
        logger.error(`[PDF] Erreur génération facture ${reservation.reservationNumber} : ${pdfErr.message}`);
        return;
      }

      const results = await Promise.allSettled([
        sendInvoiceToClient(reservation, invoiceFilePath, reservation.reviewToken),
        sendInvoiceToDriver(reservation, invoiceFilePath, req.driver.email),
      ]);
      const labels = ['facture-client', 'facture-chauffeur'];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          if (r.value?.skipped) {
            logger.warn(`[NOTIF] ${labels[i]} ignorée – ${reservation.reservationNumber} : ${r.value.reason}`);
          } else {
            logger.info(`[NOTIF] ${labels[i]} envoyée – ${reservation.reservationNumber}`);
          }
        } else {
          logger.error(`[NOTIF] ${labels[i]} échouée – ${reservation.reservationNumber} : ${r.reason?.message}`);
        }
      });
    })();
  } catch (err) {
    logger.error(`[COURSE] Erreur validation : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors de la validation de la course.' });
  }
};

// ── Télécharger PDF bon de réservation (protégé, isolation chauffeur) ────────
exports.downloadReservationPdf = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      where: { id: req.params.id, chauffeurId: req.driver.id },
    });
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable.' });

    const filename = `reservation-${reservation.reservationNumber}.pdf`;
    const filepath = path.join(PDF_DIR, filename);

    if (!fs.existsSync(filepath)) {
      logger.warn(`[PDF] Bon manquant, régénération : ${filename}`);
      const { filepath: newPath } = await generateReservationPdf(reservation);
      return res.download(newPath, filename);
    }

    logger.info(`[PDF] Téléchargement bon : ${filename} (par ${req.driver.email})`);
    res.download(filepath, filename);
  } catch (err) {
    logger.error(`[PDF] Erreur téléchargement bon : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors du téléchargement du PDF.' });
  }
};

// ── Télécharger PDF facture (protégé, isolation chauffeur) ───────────────────
exports.downloadInvoicePdf = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      where: { id: req.params.id, chauffeurId: req.driver.id },
    });
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable.' });

    if (reservation.status !== 'completed' || !reservation.price) {
      return res.status(400).json({ error: 'La course doit être validée avec un prix pour accéder à la facture.' });
    }

    const filename = `facture-${reservation.reservationNumber}.pdf`;
    const filepath = path.join(PDF_DIR, filename);

    if (!fs.existsSync(filepath)) {
      logger.warn(`[PDF] Facture manquante, régénération : ${filename}`);
      const { filepath: newPath } = await generateInvoicePdf(reservation);
      return res.download(newPath, filename);
    }

    logger.info(`[PDF] Téléchargement facture : ${filename} (par ${req.driver.email})`);
    res.download(filepath, filename);
  } catch (err) {
    logger.error(`[PDF] Erreur téléchargement facture : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors du téléchargement de la facture.' });
  }
};

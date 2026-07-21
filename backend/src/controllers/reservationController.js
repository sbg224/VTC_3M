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

// ── Créer une réservation (public) ────────────────────────────────────────────
exports.createReservation = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone,
      departureAddress, arrivalAddress,
      date, time, passengers, luggage, comments,
      distance, estimatedPrice,
      gdprConsent, termsAccepted,
      driverSlug,   // optionnel : slug du chauffeur ciblé (URL /book/:slug)
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
    if (!arrivalAddress?.trim()) {
      validationErrors.arrivalAddress = 'L\'adresse d\'arrivée est requise.';
    }
    if (!date) validationErrors.date = 'La date est requise.';
    if (!time) validationErrors.time = 'L\'heure est requise.';
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

    // ── Résoudre le chauffeur destinataire ──────────────────────────────────
    // Priorité 1 : slug passé explicitement dans le formulaire
    // Priorité 2 : premier chauffeur actif en DB (compatibilité mono-chauffeur)
    let targetDriver = null;
    if (driverSlug) {
      targetDriver = await Driver.findOne({
        where: { slug: driverSlug, status: { [Op.in]: ['trial', 'active'] } },
      });
      if (!targetDriver) {
        return res.status(404).json({ error: 'Chauffeur introuvable ou compte inactif.' });
      }
    } else {
      // Fallback : premier chauffeur actif — exclure les admins (role:'driver' obligatoire)
      targetDriver = await Driver.findOne({
        where: { role: 'driver', status: { [Op.in]: ['trial', 'active'] } },
        order: [['createdAt', 'ASC']],
      });
    }

    if (!targetDriver) {
      logger.error('[RESERVATION] Aucun chauffeur actif trouvé pour assigner la réservation.');
      return res.status(503).json({ error: 'Le service de réservation est temporairement indisponible.' });
    }

    const reservation = await Reservation.createUnique({
      firstName, lastName, email, phone: normalizedPhone,
      departureAddress, arrivalAddress,
      date, time,
      passengers:     parseInt(passengers) || 1,
      luggage:        parseInt(luggage) || 0,
      comments:       comments || null,
      distance:       distance       ? parseFloat(distance)       : null,
      estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : null,
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
    const filepath = path.join(__dirname, '../../pdfs', filename);

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
    const filepath = path.join(__dirname, '../../pdfs', filename);

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

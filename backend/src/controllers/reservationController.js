const { Reservation, Driver } = require('../models');
const { generateReservationPdf, generateInvoicePdf } = require('../services/pdfService');
const { sendAdminNotification, sendClientConfirmation, sendInvoiceToClient } = require('../services/emailService');
const { sendAdminSms } = require('../services/smsService');
const sseService = require('../services/sseService');
const logger = require('../middleware/logger');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

// ── Créer une réservation (public) ────────────────────────────────────────────
exports.createReservation = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone,
      departureAddress, arrivalAddress,
      date, time, passengers, luggage, comments,
      distance, estimatedPrice,
      driverSlug,   // optionnel : slug du chauffeur ciblé (URL /book/:slug)
    } = req.body;

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
      targetDriver = await Driver.findOne({
        where: { status: { [Op.in]: ['trial', 'active'] } },
        order: [['createdAt', 'ASC']],
      });
    }

    if (!targetDriver) {
      logger.error('[RESERVATION] Aucun chauffeur actif trouvé pour assigner la réservation.');
      return res.status(503).json({ error: 'Le service de réservation est temporairement indisponible.' });
    }

    const reservation = await Reservation.create({
      firstName, lastName, email, phone,
      departureAddress, arrivalAddress,
      date, time,
      passengers:     parseInt(passengers) || 1,
      luggage:        parseInt(luggage) || 0,
      comments:       comments || null,
      distance:       distance       ? parseFloat(distance)       : null,
      estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : null,
      gdprConsent:    true,
      status:         'pending',
      chauffeur_id:   targetDriver.id,  // ── Isolation multi-tenant
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

    // Génération PDF réservation
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

    // Notifications asynchrones – ne bloquent pas la réponse
    Promise.allSettled([
      sendAdminNotification(reservation, pdfPath, targetDriver.email),
      sendClientConfirmation(reservation, pdfPath),
      sendAdminSms(reservation),
    ]).then((results) => {
      const labels = ['email-admin', 'email-client', 'sms-admin'];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          logger.info(`[NOTIF] ${labels[i]} envoyé – ${reservation.reservationNumber}`);
        } else {
          logger.error(`[NOTIF] ${labels[i]} échoué – ${reservation.reservationNumber} : ${r.reason?.message}`);
        }
      });
    });

    res.status(201).json({
      message: 'Réservation enregistrée avec succès !',
      reservation: {
        id: reservation.id,
        reservationNumber: reservation.reservationNumber,
        status: reservation.status,
        pdfUrl: pdfPath ? `/pdfs/reservation-${reservation.reservationNumber}.pdf` : null,
      },
    });
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
    const where = { chauffeur_id: req.driver.id };

    if (status && status !== 'all') {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (validStatuses.includes(status)) where.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim().substring(0, 100);
      where[Op.or] = [
        { firstName: { [Op.like]: `%${term}%` } },
        { lastName:  { [Op.like]: `%${term}%` } },
        { email:     { [Op.like]: `%${term}%` } },
        { reservationNumber: { [Op.like]: `%${term}%` } },
        { phone:     { [Op.like]: `%${term}%` } },
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
      where: { id: req.params.id, chauffeur_id: req.driver.id },
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
      where: { id: req.params.id, chauffeur_id: req.driver.id },
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
      where: { id: req.params.id, chauffeur_id: req.driver.id },
    });
    if (!reservation) {
      return res.status(404).json({ error: 'Réservation introuvable.' });
    }

    // Prévenir la double validation
    if (reservation.status === 'completed' && reservation.pdfInvoicePath) {
      return res.status(409).json({
        error: 'Cette course a déjà été validée et la facture a été générée.',
        invoicePdfUrl: `/pdfs/facture-${reservation.reservationNumber}.pdf`,
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Impossible de valider une course annulée.' });
    }

    reservation.status = 'completed';
    reservation.price  = parseFloat(price);
    await reservation.save();

    logger.info(`[COURSE] Validée : ${reservation.reservationNumber} – ${price}€ (par ${req.driver.email})`);

    // Génération facture PDF
    let invoicePdfUrl = null;
    let invoiceFilePath = null;
    try {
      const { filepath } = await generateInvoicePdf(reservation);
      invoiceFilePath = filepath;
      reservation.pdfInvoicePath = filepath;
      await reservation.save();
      invoicePdfUrl = `/pdfs/facture-${reservation.reservationNumber}.pdf`;
      logger.info(`[PDF] Facture générée : ${reservation.reservationNumber}`);
    } catch (pdfErr) {
      logger.error(`[PDF] Erreur génération facture ${reservation.reservationNumber} : ${pdfErr.message}`);
    }

    // Envoi email facture au client (une seule fois)
    if (invoiceFilePath) {
      sendInvoiceToClient(reservation, invoiceFilePath)
        .then(() => logger.info(`[NOTIF] Facture envoyée au client – ${reservation.reservationNumber}`))
        .catch((err) => logger.error(`[NOTIF] Erreur envoi facture client ${reservation.reservationNumber} : ${err.message}`));
    }

    res.json({
      message: 'Course validée et facture générée avec succès.',
      reservation,
      invoicePdfUrl,
    });
  } catch (err) {
    logger.error(`[COURSE] Erreur validation : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors de la validation de la course.' });
  }
};

// ── Télécharger PDF bon de réservation (protégé, isolation chauffeur) ────────
exports.downloadReservationPdf = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      where: { id: req.params.id, chauffeur_id: req.driver.id },
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
      where: { id: req.params.id, chauffeur_id: req.driver.id },
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

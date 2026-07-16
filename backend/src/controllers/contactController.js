const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Contact, ContactEvent } = require('../models');
const { buildVcard } = require('../services/vcardService');
const { CONTACT_UPLOADS_DIR, ALLOWED_MIME_TYPES } = require('../middleware/uploadContactPhoto');
const logger = require('../middleware/logger');

// Champs exposés publiquement — jamais d'id, jamais de driverId, jamais de
// champ non prévu pour l'exposition publique (choix de sécurité délibéré,
// même logique que driverController.getPublicProfile mais whitelist propre
// à ce module, indépendante).
const PUBLIC_FIELDS = [
  'firstName', 'lastName', 'company', 'jobTitle', 'shortDescription',
  'phone', 'email', 'website', 'address', 'photoUrl', 'bookingUrl', 'slug',
];

function ensureUploadsDir() {
  if (!fs.existsSync(CONTACT_UPLOADS_DIR)) {
    fs.mkdirSync(CONTACT_UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Enregistre un événement Contact sans jamais bloquer la réponse HTTP
 * (fire-and-forget) — utilisé pour visit/vcard_download déclenchés par le
 * serveur lui-même.
 * @param {string} contactId
 * @param {string} type
 */
function recordEvent(contactId, type) {
  ContactEvent.create({ contactId, type }).catch((err) => {
    logger.warn('Erreur enregistrement ContactEvent', { error: err.message, contactId, type });
  });
}

/**
 * GET /api/contacts/public/:slug
 * Profil public d'une carte de visite — uniquement si isPublic = true.
 */
exports.getPublicProfile = async (req, res) => {
  try {
    const { slug } = req.params;
    const contact = await Contact.findOne({ where: { slug, isPublic: true } });

    if (!contact) {
      return res.status(404).json({ error: 'Carte de visite introuvable.' });
    }

    recordEvent(contact.id, 'visit');

    const publicContact = {};
    for (const field of PUBLIC_FIELDS) publicContact[field] = contact[field];

    res.json({ contact: publicContact });
  } catch (err) {
    logger.error('Erreur getPublicProfile (contact)', { error: err.message, slug: req.params.slug });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/**
 * GET /api/contacts/vcard/:slug
 * Génère et streame une vCard 3.0 en mémoire — jamais de fichier .vcf
 * écrit sur disque.
 */
exports.downloadVcard = async (req, res) => {
  try {
    const { slug } = req.params;
    const contact = await Contact.findOne({ where: { slug, isPublic: true } });

    if (!contact) {
      return res.status(404).json({ error: 'Carte de visite introuvable.' });
    }

    recordEvent(contact.id, 'vcard_download');

    const vcard = buildVcard(contact);
    const filename = `${contact.firstName}-${contact.lastName}`
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'contact';

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.vcf"`);
    res.send(vcard);
  } catch (err) {
    logger.error('Erreur downloadVcard', { error: err.message, slug: req.params.slug });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/**
 * POST /api/contacts/events/:slug
 * Tracking de clic public (téléphone, WhatsApp, réservation, email).
 * visit/vcard_download restent internes aux routes ci-dessus — non
 * insérables depuis cet endpoint.
 */
const TRACKABLE_CLICK_TYPES = ['click_phone', 'click_whatsapp', 'click_booking', 'click_email'];

exports.trackEvent = async (req, res) => {
  try {
    const { slug } = req.params;
    const { type } = req.body;

    if (!TRACKABLE_CLICK_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Type d\'événement invalide.' });
    }

    const contact = await Contact.findOne({ where: { slug, isPublic: true }, attributes: ['id'] });
    if (!contact) {
      return res.status(404).json({ error: 'Carte de visite introuvable.' });
    }

    await ContactEvent.create({ contactId: contact.id, type });
    res.status(201).json({ ok: true });
  } catch (err) {
    logger.error('Erreur trackEvent (contact)', { error: err.message, slug: req.params.slug });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── CRUD admin (auth + requireAdmin appliqués au niveau des routes) ─────────

/**
 * GET /api/contacts
 * Liste paginée de toutes les cartes de visite (admin).
 */
exports.listContacts = async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page  || '1',  10), 1);
    const limit  = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName:  { [Op.like]: `%${search}%` } },
        { company:   { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: contacts } = await Contact.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({ contacts, total: count, page, limit });
  } catch (err) {
    logger.error('Erreur listContacts', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/**
 * GET /api/contacts/:id
 * Détail d'une carte de visite (admin).
 */
exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Carte de visite introuvable.' });
    }
    res.json({ contact });
  } catch (err) {
    logger.error('Erreur getContact', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

const WRITABLE_FIELDS = [
  'firstName', 'lastName', 'company', 'jobTitle', 'shortDescription',
  'phone', 'email', 'website', 'address', 'bookingUrl', 'driverId', 'isPublic',
];

function pickWritableFields(body) {
  const data = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
}

/**
 * POST /api/contacts
 * Création d'une carte de visite (admin).
 */
exports.createContact = async (req, res) => {
  try {
    const contact = await Contact.create(pickWritableFields(req.body));
    res.status(201).json({ contact });
  } catch (err) {
    logger.error('Erreur createContact', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/**
 * PUT /api/contacts/:id
 * Édition d'une carte de visite (admin).
 */
exports.updateContact = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Carte de visite introuvable.' });
    }
    await contact.update(pickWritableFields(req.body));
    res.json({ contact });
  } catch (err) {
    logger.error('Erreur updateContact', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/**
 * DELETE /api/contacts/:id
 * Suppression d'une carte de visite (admin). Supprime aussi la photo
 * associée sur disque si elle existe.
 */
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Carte de visite introuvable.' });
    }

    if (contact.photoUrl) {
      const filePath = path.join(CONTACT_UPLOADS_DIR, path.basename(contact.photoUrl));
      fs.unlink(filePath, () => {}); // best-effort, ne bloque pas la suppression
    }

    // Les ContactEvent référencent ce contact par FK — les supprimer d'abord
    // pour éviter une violation de contrainte (pas de CASCADE au niveau DB,
    // volontairement portable entre SQLite et Postgres sans migration).
    await ContactEvent.destroy({ where: { contactId: contact.id } });
    await contact.destroy();
    res.json({ ok: true });
  } catch (err) {
    logger.error('Erreur deleteContact', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/**
 * POST /api/contacts/:id/photo
 * Upload de la photo d'une carte de visite (admin). Le nom de fichier est
 * généré côté serveur — jamais celui fourni par le client. L'ancienne
 * photo, si elle existe, est supprimée.
 */
exports.uploadPhoto = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Carte de visite introuvable.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    ensureUploadsDir();

    const oldPhotoUrl = contact.photoUrl;
    const ext = ALLOWED_MIME_TYPES[req.file.mimetype];
    const filename = `${uuidv4()}.${ext}`;
    fs.writeFileSync(path.join(CONTACT_UPLOADS_DIR, filename), req.file.buffer);

    const photoUrl = `/uploads/contacts/${filename}`;
    await contact.update({ photoUrl });

    if (oldPhotoUrl) {
      const oldFilePath = path.join(CONTACT_UPLOADS_DIR, path.basename(oldPhotoUrl));
      fs.unlink(oldFilePath, () => {});
    }

    res.json({ contact });
  } catch (err) {
    logger.error('Erreur uploadPhoto (contact)', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

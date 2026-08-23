/**
 * Emplacements de stockage sur disque.
 *
 * Les PDF (bons de réservation, factures, relevés comptables) et les photos de
 * cartes de visite sont écrits sur le système de fichiers. Sur un hébergeur
 * dont le disque applicatif est éphémère — Render recrée le conteneur à chaque
 * déploiement — ces fichiers doivent vivre sur un volume persistant monté à un
 * chemin fixe, et Render n'autorise qu'un disque par service.
 *
 * PDF_DIR et UPLOAD_DIR permettent de les rediriger sous ce volume unique
 * (ex. PDF_DIR=/data/pdfs, UPLOAD_DIR=/data/uploads) sans toucher au code.
 * Les valeurs par défaut reproduisent exactement l'arborescence historique,
 * afin que le développement local et les tests soient inchangés.
 */
const path = require('path');

const BACKEND_ROOT = path.join(__dirname, '../..');

const PDF_DIR = process.env.PDF_DIR
  ? path.resolve(process.env.PDF_DIR)
  : path.join(BACKEND_ROOT, 'pdfs');

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(BACKEND_ROOT, 'uploads');

// Sous-répertoire des photos de cartes de visite, servi en statique sous
// /uploads/contacts (voir src/index.js).
const CONTACT_UPLOADS_DIR = path.join(UPLOAD_DIR, 'contacts');

module.exports = { PDF_DIR, UPLOAD_DIR, CONTACT_UPLOADS_DIR };

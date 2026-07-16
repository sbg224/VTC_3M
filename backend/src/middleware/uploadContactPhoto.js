/**
 * Middleware d'upload de la photo d'un Contact.
 * Aucun précédent dans le projet (pas de multer avant ce module) : whitelist
 * stricte de mime-types, taille limitée, buffer en mémoire — le nom de
 * fichier final est généré par le contrôleur (jamais celui du client).
 */
const multer = require('multer');
const path = require('path');

const CONTACT_UPLOADS_DIR = path.join(__dirname, '../../uploads/contacts');

const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 Mo

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    return cb(new Error('Format d\'image non autorisé (jpg, png ou webp uniquement).'));
  }
  cb(null, true);
};

const uploadContactPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
}).single('photo');

module.exports = uploadContactPhoto;
module.exports.CONTACT_UPLOADS_DIR = CONTACT_UPLOADS_DIR;
module.exports.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;

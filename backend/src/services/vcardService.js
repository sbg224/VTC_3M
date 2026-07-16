const fs = require('fs');
const path = require('path');
const { CONTACT_UPLOADS_DIR } = require('../middleware/uploadContactPhoto');

/**
 * Échappe les caractères spéciaux d'un champ texte vCard 3.0
 * (virgule, point-virgule, antislash, retour à la ligne).
 * @param {string} value
 * @returns {string}
 */
function escapeVcardText(value) {
  if (!value) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Résout un photoUrl public (ex. "/uploads/contacts/xxx.jpg") en base64,
 * en le relisant directement depuis le dossier d'upload — jamais depuis
 * une URL externe (évite toute requête sortante non maîtrisée).
 * @param {string|null} photoUrl
 * @returns {{ base64: string, type: string } | null}
 */
function readPhotoAsBase64(photoUrl) {
  if (!photoUrl) return null;
  const filename = path.basename(photoUrl); // ignore tout chemin fourni, ne garde que le nom de fichier
  const filePath = path.join(CONTACT_UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;

  const ext = path.extname(filename).slice(1).toUpperCase();
  const type = ext === 'JPG' ? 'JPEG' : ext; // JPEG/PNG/WEBP
  const base64 = fs.readFileSync(filePath).toString('base64');
  return { base64, type };
}

/**
 * Génère une vCard 3.0 en mémoire pour un Contact — jamais écrite sur
 * disque, streamée directement en réponse HTTP par le contrôleur.
 * @param {object} contact - instance ou objet plain Contact
 * @returns {string} contenu texte de la vCard (.vcf)
 */
function buildVcard(contact) {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

  const firstName = escapeVcardText(contact.firstName);
  const lastName  = escapeVcardText(contact.lastName);
  lines.push(`N:${lastName};${firstName};;;`);
  lines.push(`FN:${escapeVcardText(`${contact.firstName} ${contact.lastName}`.trim())}`);

  if (contact.company)  lines.push(`ORG:${escapeVcardText(contact.company)}`);
  if (contact.jobTitle) lines.push(`TITLE:${escapeVcardText(contact.jobTitle)}`);
  if (contact.phone)    lines.push(`TEL;TYPE=WORK,VOICE:${escapeVcardText(contact.phone)}`);
  if (contact.email)    lines.push(`EMAIL;TYPE=WORK:${escapeVcardText(contact.email)}`);
  if (contact.website)  lines.push(`URL:${escapeVcardText(contact.website)}`);
  if (contact.address)  lines.push(`ADR;TYPE=WORK:;;${escapeVcardText(contact.address)};;;;`);
  if (contact.bookingUrl) lines.push(`NOTE:Réserver un trajet : ${escapeVcardText(contact.bookingUrl)}`);

  const photo = readPhotoAsBase64(contact.photoUrl);
  if (photo) {
    lines.push(`PHOTO;ENCODING=b;TYPE=${photo.type}:${photo.base64}`);
  }

  lines.push('END:VCARD');
  // CRLF requis par la RFC vCard
  return lines.join('\r\n') + '\r\n';
}

module.exports = { buildVcard, escapeVcardText };

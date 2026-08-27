// Source unique des coordonnées publiques de contact.
//
// Les mentions légales et la politique de confidentialité affichent le numéro
// en clair (obligation LCEN art. 6-III : un numéro de téléphone doit y être
// directement lisible) et n'utilisent donc jamais WHATSAPP_URL à la place.
// WhatsApp reste un canal commercial : footer et section contact de l'accueil.

export const CONTACT_EMAIL = 'ahadi.service31@gmail.com';
export const CONTACT_PHONE_E164 = '+33666604133';
export const CONTACT_PHONE_DISPLAY = '+33 6 66 60 41 33';

const WHATSAPP_NUMBER = '33666604133';
const WHATSAPP_MESSAGE = 'Bonjour, je souhaite réserver une course avec 3M Drive';

// Format wa.me : indicatif international sans « + » ni « 0 » initial, sans
// séparateur. Fonctionne sur mobile (ouvre l'application) comme sur poste fixe
// (bascule sur WhatsApp Web).
export const WHATSAPP_URL =
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export const WHATSAPP_LABEL = 'Contacter sur WhatsApp';
export const WHATSAPP_ARIA_LABEL = 'Contacter 3M Drive sur WhatsApp';

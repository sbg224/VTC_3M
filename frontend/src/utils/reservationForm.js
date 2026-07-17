// Partagé entre Reservation.jsx (page générique) et BookingPage.jsx (page
// liée à un chauffeur via /book/:slug) — les deux formulaires étaient
// auparavant validés par deux copies quasi identiques de cette logique,
// avec des messages d'erreur légèrement différents selon le fichier.

export const emptyReservationForm = {
  firstName: '', lastName: '', email: '', phone: '',
  departureAddress: '', arrivalAddress: '',
  date: '', time: '', passengers: '1', luggage: '0',
  comments: '', gdprConsent: false, termsAccepted: false,
};

/**
 * @param {object} form
 * @param {{ requireArrival?: boolean }} options - requireArrival=false pour
 *   le service "mise à disposition" de Reservation.jsx, qui n'a pas d'adresse
 *   d'arrivée. Toujours true pour BookingPage.jsx.
 */
export function validateReservationForm(form, { requireArrival = true } = {}) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = 'Le prénom est requis.';
  if (!form.lastName.trim())  errors.lastName  = 'Le nom est requis.';
  if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
    errors.email = 'Adresse email invalide.';
  if (!form.phone.trim() || !/^(\+33|0033|0)[1-9](\d{8})$/.test(form.phone.replace(/\s/g, '')))
    errors.phone = 'Numéro de téléphone invalide (format français).';
  if (!form.departureAddress.trim())
    errors.departureAddress = 'L\'adresse de départ est requise.';
  if (requireArrival && !form.arrivalAddress.trim())
    errors.arrivalAddress = 'L\'adresse d\'arrivée est requise.';
  if (!form.date) {
    errors.date = 'La date est requise.';
  } else {
    const sel = new Date(form.date);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (sel < now) errors.date = 'La date doit être dans le futur.';
  }
  if (!form.time) errors.time = 'L\'heure est requise.';
  if (!form.gdprConsent) errors.gdprConsent = 'Vous devez accepter la politique de confidentialité.';
  if (!form.termsAccepted) errors.termsAccepted = 'Vous devez accepter les CGU.';
  return errors;
}

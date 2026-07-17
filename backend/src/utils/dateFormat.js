// Trois styles de date fr-FR étaient dupliqués sous le même nom formatDate()
// dans pdfService, smsService, emailService et crmController — centralisés
// ici sous des noms distincts (les formats affichés restent différents,
// volontairement, selon le contexte : SMS terse, PDF formel, email complet).

// SMS / export CSV — format court par défaut (ex. "17/07/2026").
// Retourne '' pour une valeur vide (le CSV client a des dates optionnelles).
function formatDateShort(dateStr) {
  return dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : '';
}

// Bons de réservation / factures PDF (ex. "17 juillet 2026")
function formatDateLong(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// Emails de notification (ex. "vendredi 17 juillet 2026")
function formatDateFull(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

module.exports = { formatDateShort, formatDateLong, formatDateFull };

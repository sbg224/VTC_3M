const FRENCH_PHONE_PATTERN = /^(\+33|0)[1-9](\d{8})$/;

function normalizeFrenchPhone(value) {
  const normalized = String(value || '').replace(/\s/g, '');
  return normalized.startsWith('0033') ? `+33${normalized.slice(4)}` : normalized;
}

function isValidFrenchPhone(value) {
  return FRENCH_PHONE_PATTERN.test(normalizeFrenchPhone(value));
}

module.exports = { FRENCH_PHONE_PATTERN, normalizeFrenchPhone, isValidFrenchPhone };

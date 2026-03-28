/**
 * Configuration tarifaire
 * Valeurs surchargeables via .env : PRICE_PER_KM, MINIMUM_PRICE, BASE_FEE
 */
module.exports = {
  PRICE_PER_KM:  parseFloat(process.env.PRICE_PER_KM)  || 2.0,
  MINIMUM_PRICE: parseFloat(process.env.MINIMUM_PRICE) || 10.0,
  BASE_FEE:      parseFloat(process.env.BASE_FEE)      || 0.0,
};

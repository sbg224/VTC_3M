const { InvoiceSequence, sequelize } = require('../models');

/**
 * Attribution des numéros de facture.
 *
 * L'article 242 nonies A du CGI impose une numérotation chronologique continue,
 * sans rupture. Deux conséquences guident cette implémentation :
 *
 * 1. Le numéro n'est attribué qu'au moment de facturer, jamais à la
 *    réservation : une course annulée ne doit pas laisser de trou dans la série.
 * 2. L'incrément et l'écriture du numéro sur la réservation doivent être
 *    atomiques. Deux validations concurrentes lisant le même compteur
 *    produiraient deux factures portant le même numéro.
 */

const PREFIX = 'AH';
const PAD = 6;

/**
 * Verrouille la ligne de compteur de l'exercice pour la durée de la
 * transaction.
 *
 * PostgreSQL sérialise les accès concurrents par un verrou de ligne explicite.
 * SQLite ne connaît pas `FOR UPDATE` mais sérialise déjà les écritures au
 * niveau du fichier : le verrou y est implicite et la requête simple suffit.
 */
async function lockSequenceRow(year, transaction) {
  const isPostgres = sequelize.getDialect() === 'postgres';
  return InvoiceSequence.findByPk(year, {
    transaction,
    ...(isPostgres ? { lock: transaction.LOCK.UPDATE } : {}),
  });
}

/**
 * Formate un numéro de facture.
 *
 * @param {number} year - exercice
 * @param {number} number - rang dans l'exercice
 * @returns {string} par exemple « AH-2026-000001 »
 */
function formatInvoiceNumber(year, number) {
  return `${PREFIX}-${year}-${String(number).padStart(PAD, '0')}`;
}

/**
 * Attribue le prochain numéro de facture à une réservation et la marque
 * terminée, le tout dans une transaction unique.
 *
 * Si l'enregistrement de la réservation échoue, l'incrément du compteur est
 * annulé avec lui : aucun numéro n'est consommé pour une facture qui n'existe
 * pas.
 *
 * Une réservation déjà facturée conserve son numéro — la fonction est sûre à
 * rejouer et n'en consomme pas un second.
 *
 * @param {object} reservation - instance Sequelize de Reservation
 * @param {object} changes - champs à enregistrer en même temps que le numéro
 * @returns {Promise<string>} le numéro attribué
 */
async function assignInvoiceNumber(reservation, changes = {}) {
  if (reservation.invoiceNumber) {
    if (Object.keys(changes).length > 0) {
      await reservation.update(changes);
    }
    return reservation.invoiceNumber;
  }

  // L'exercice est celui de la date d'émission, c'est-à-dire de la
  // facturation — pas celui de la date de course, qui peut relever de
  // l'exercice précédent pour une course validée en janvier.
  const year = new Date().getFullYear();

  return sequelize.transaction(async (transaction) => {
    let sequence = await lockSequenceRow(year, transaction);
    if (!sequence) {
      // Premier exercice ou première facture de l'année.
      sequence = await InvoiceSequence.create(
        { year, lastNumber: 0 },
        { transaction },
      );
      // Relecture verrouillée : entre le findByPk et le create, une autre
      // transaction a pu créer la même ligne. Sur PostgreSQL, la contrainte de
      // clé primaire ferait échouer le create et la transaction serait rejouée
      // par l'appelant ; cette relecture couvre le cas où le create a réussi.
      sequence = await lockSequenceRow(year, transaction) || sequence;
    }

    const nextNumber = sequence.lastNumber + 1;
    const invoiceNumber = formatInvoiceNumber(year, nextNumber);

    await sequence.update({ lastNumber: nextNumber }, { transaction });
    await reservation.update({ ...changes, invoiceNumber }, { transaction });

    return invoiceNumber;
  });
}

module.exports = { assignInvoiceNumber, formatInvoiceNumber };

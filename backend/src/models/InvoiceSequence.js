/**
 * InvoiceSequence — compteur de numérotation des factures, une ligne par
 * exercice (`year` = clé primaire).
 *
 * L'article 242 nonies A du CGI impose une numérotation chronologique continue,
 * sans rupture. Le numéro est donc attribué au moment de la facturation, dans
 * la même transaction que le passage de la course en `completed` : une course
 * annulée ne consomme jamais de numéro, et un échec de facturation n'en laisse
 * pas un inutilisé derrière lui.
 *
 * Sans horodatage : la table ne porte qu'un état courant, jamais un historique.
 */
module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const InvoiceSequence = sequelize.define('InvoiceSequence', {
    year: {
      type:          DataTypes.INTEGER,
      primaryKey:    true,
      autoIncrement: false,
      allowNull:     false,
      comment:       'Exercice comptable',
    },
    lastNumber: {
      type:         DataTypes.INTEGER,
      allowNull:    false,
      defaultValue: 0,
      comment:      'Dernier numéro de facture attribué pour cet exercice',
    },
  }, {
    tableName:  'invoice_sequences',
    timestamps: false,
    comment:    'Compteur de numérotation légale des factures',
  });

  return InvoiceSequence;
};

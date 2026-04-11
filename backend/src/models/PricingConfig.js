/**
 * PricingConfig — table singleton (id = 1 toujours).
 * Stocke la tarification dynamique gérée par l'admin.
 */
module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const PricingConfig = sequelize.define('PricingConfig', {
    id: {
      type:          DataTypes.INTEGER,
      primaryKey:    true,
      autoIncrement: false,
      defaultValue:  1,
    },
    pricePerKm: {
      type:         DataTypes.FLOAT,
      allowNull:    false,
      defaultValue: 2.0,
      comment:      'Prix par kilomètre (€)',
    },
    minimumPrice: {
      type:         DataTypes.FLOAT,
      allowNull:    false,
      defaultValue: 10.0,
      comment:      'Prix minimum garanti (€)',
    },
    baseFee: {
      type:         DataTypes.FLOAT,
      allowNull:    false,
      defaultValue: 0.0,
      comment:      'Frais de prise en charge fixes (€)',
    },
    updatedBy: {
      type:      DataTypes.STRING,
      allowNull: true,
      comment:   'Nom de l\'admin ayant fait la dernière modification',
    },
  }, {
    tableName: 'PricingConfigs',
    comment:   'Configuration tarifaire — une seule ligne (id=1)',
  });

  return PricingConfig;
};

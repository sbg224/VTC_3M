const { DataTypes } = require('sequelize');

// Table d'événements append-only : pas d'UI de reporting dans ce lot, juste
// le modèle et les points d'insertion (visite, téléchargement vCard, clics).
module.exports = (sequelize) => {
  const ContactEvent = sequelize.define('ContactEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    contactId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'visit',
        'vcard_download',
        'click_phone',
        'click_whatsapp',
        'click_booking',
        'click_email',
      ),
      allowNull: false,
    },
  }, {
    tableName: 'contact_events',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['contactId'], name: 'contact_events_contact_id' },
    ],
  });

  return ContactEvent;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Contact = sequelize.define('Contact', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // ── Slug public — dédié à la carte de visite, distinct du slug Driver
    //    (/book/:slug). Ne jamais réutiliser l'un pour l'autre : ce sont
    //    deux identifiants publics avec des enjeux différents (le slug
    //    Driver est lié au flux de réservation/revenu). ────────────────────
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shortDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true },
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    photoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // URL de réservation optionnelle (ex. /book/:slug d'un chauffeur) —
    // simple champ texte, aucune contrainte FK vers Reservation/Driver.
    bookingUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Lien optionnel vers un chauffeur existant — jamais une dépendance
    // obligatoire, le module Contact doit rester utilisable sans Driver.
    driverId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    // Opt-in strict : un Contact créé sans validation explicite n'est
    // jamais exposé publiquement.
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'contacts',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['slug'], name: 'contacts_slug_unique' },
    ],
  });

  // ── Hook : générer le slug unique de la carte de visite ─────────────────
  // Algorithme identique à celui de Driver.js (normalisation, dédup par
  // suffixe numérique) mais dupliqué ici volontairement — pas d'import
  // croisé avec le module Driver, ce sont deux identifiants indépendants.
  Contact.beforeCreate(async (contact) => {
    if (!contact.slug && (contact.firstName || contact.lastName)) {
      const base = `${contact.firstName || ''} ${contact.lastName || ''}`
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 40);
      let slug = base || 'contact';
      let n = 1;
      while (await Contact.findOne({ where: { slug } })) {
        slug = `${base || 'contact'}-${n}`;
        n++;
      }
      contact.slug = slug;
    }
  });

  return Contact;
};

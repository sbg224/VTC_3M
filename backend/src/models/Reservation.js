const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reservation = sequelize.define('Reservation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reservationNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    // Client
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Course
    departureAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    arrivalAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    passengers: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    luggage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Tarification calculée à la réservation
    distance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    estimatedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    // Gestion
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    // PDFs
    pdfReservationPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pdfInvoicePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reviewToken: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    // RGPD / consentements
    gdprConsent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    termsAccepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // ── Multi-tenant : lien vers le chauffeur propriétaire ────────────────────
    // Nullable pour compatibilité avec les réservations antérieures
    // Attribut JS unifié en camelCase (cohérent avec Review.chauffeurId) —
    // la colonne SQL reste chauffeur_id (field:) pour ne pas nécessiter de
    // migration de schéma sur les bases existantes.
    chauffeurId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'chauffeur_id',
      references: { model: 'drivers', key: 'id' },
      onDelete: 'SET NULL',
    },
  }, {
    tableName: 'reservations',
    timestamps: true,
  });

  // Hook pour générer le numéro de réservation
  Reservation.beforeCreate(async (reservation) => {
    const count = await Reservation.count();
    const year = new Date().getFullYear();
    reservation.reservationNumber = `VTC-${year}-${String(count + 1).padStart(4, '0')}`;
  });

  // Deux créations concurrentes peuvent lire le même COUNT() dans le hook
  // ci-dessus avant que l'une des deux n'ait inséré sa ligne, et générer
  // ainsi le même reservationNumber (contrainte unique en base) — la
  // seconde création échoue alors avec SequelizeUniqueConstraintError.
  // createUnique() retente la création (le hook relit un COUNT() à jour à
  // chaque tentative) plutôt que de faire échouer la réservation du client.
  // Un court backoff aléatoire évite que deux tentatives concurrentes ne se
  // re-percutent immédiatement l'une l'autre en relisant le même COUNT().
  Reservation.createUnique = async function createUnique(data, maxAttempts = 8) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await Reservation.create(data);
      } catch (err) {
        const isDuplicateNumber = err.name === 'SequelizeUniqueConstraintError'
          && err.errors?.some((e) => e.path === 'reservationNumber');
        if (!isDuplicateNumber || attempt === maxAttempts) throw err;
        const jitterMs = Math.floor(Math.random() * 40) + 10;
        await new Promise((resolve) => setTimeout(resolve, jitterMs));
      }
    }
  };

  return Reservation;
};

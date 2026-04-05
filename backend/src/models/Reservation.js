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
    // RGPD
    gdprConsent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // ── Multi-tenant : lien vers le chauffeur propriétaire ────────────────────
    // Nullable pour compatibilité avec les réservations antérieures
    chauffeur_id: {
      type: DataTypes.UUID,
      allowNull: true,
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

  return Reservation;
};

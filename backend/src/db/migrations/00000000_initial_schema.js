const { DataTypes } = require('sequelize');

module.exports = {
  name: '00000000_initial_schema',
  up: async (sequelize, logger) => {
    const qi = sequelize.getQueryInterface();

    await qi.createTable('drivers', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: true },
      role: { type: DataTypes.ENUM('admin', 'driver'), allowNull: false, defaultValue: 'driver' },
      status: { type: DataTypes.ENUM('pending', 'trial', 'active', 'suspended', 'expired'), allowNull: false, defaultValue: 'pending' },
      plan: { type: DataTypes.ENUM('free', 'pro'), allowNull: false, defaultValue: 'free' },
      trialEndDate: { type: DataTypes.DATE, allowNull: true },
      subscriptionStatus: { type: DataTypes.STRING, allowNull: true, defaultValue: 'trialing' },
      stripeCustomerId: { type: DataTypes.STRING, allowNull: true },
      stripeSubscriptionId: { type: DataTypes.STRING, allowNull: true },
      slug: { type: DataTypes.STRING, allowNull: true },
      businessName: { type: DataTypes.STRING, allowNull: true },
      siret: { type: DataTypes.STRING, allowNull: true },
      vtcCardNumber: { type: DataTypes.STRING, allowNull: true },
      gdprConsent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      termsAccepted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      commissionRate: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 20 },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('drivers', ['slug'], { unique: true, name: 'drivers_slug_unique' });
    await qi.addIndex('drivers', ['stripeCustomerId'], { unique: true, name: 'drivers_stripe_customer_unique' });
    await qi.addIndex('drivers', ['stripeSubscriptionId'], { unique: true, name: 'drivers_stripe_subscription_unique' });

    await qi.createTable('reservations', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      reservationNumber: { type: DataTypes.STRING, allowNull: true, unique: true },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: false },
      departureAddress: { type: DataTypes.TEXT, allowNull: false },
      arrivalAddress: { type: DataTypes.TEXT, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      time: { type: DataTypes.STRING, allowNull: false },
      passengers: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
      luggage: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      comments: { type: DataTypes.TEXT, allowNull: true },
      distance: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      estimatedPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      status: { type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'), allowNull: true, defaultValue: 'pending' },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      pdfReservationPath: { type: DataTypes.STRING, allowNull: true },
      pdfInvoicePath: { type: DataTypes.STRING, allowNull: true },
      reviewToken: { type: DataTypes.STRING, allowNull: true },
      gdprConsent: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
      termsAccepted: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
      chauffeur_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'drivers', key: 'id' },
        onDelete: 'SET NULL',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('reservations', ['reviewToken'], { unique: true, name: 'reservations_review_token_unique' });

    await qi.createTable('PricingConfigs', {
      id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, defaultValue: 1 },
      pricePerKm: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 2 },
      minimumPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 10 },
      baseFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      updatedBy: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await qi.createTable('reviews', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      reservationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'reservations', key: 'id' },
        onDelete: 'CASCADE',
      },
      chauffeurId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'drivers', key: 'id' },
        onDelete: 'CASCADE',
      },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      comment: { type: DataTypes.TEXT, allowNull: true },
      clientName: { type: DataTypes.STRING, allowNull: false },
      clientEmail: { type: DataTypes.STRING, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await qi.createTable('revoked_tokens', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      jti: { type: DataTypes.STRING(36), allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('revoked_tokens', ['jti'], { name: 'revoked_tokens_jti' });
    await qi.addIndex('revoked_tokens', ['expiresAt'], { name: 'revoked_tokens_expires_at' });

    await qi.createTable('contacts', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: true },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      company: { type: DataTypes.STRING, allowNull: true },
      jobTitle: { type: DataTypes.STRING, allowNull: true },
      shortDescription: { type: DataTypes.TEXT, allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      website: { type: DataTypes.STRING, allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      photoUrl: { type: DataTypes.STRING, allowNull: true },
      bookingUrl: { type: DataTypes.STRING, allowNull: true },
      driverId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'drivers', key: 'id' },
        onDelete: 'SET NULL',
      },
      isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('contacts', ['slug'], { unique: true, name: 'contacts_slug_unique' });

    await qi.createTable('contact_events', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      contactId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'contacts', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: { type: DataTypes.ENUM('visit', 'vcard_download', 'click_phone', 'click_whatsapp', 'click_booking', 'click_email'), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('contact_events', ['contactId'], { name: 'contact_events_contact_id' });

    logger.info('[MIGRATION] Schéma initial complet créé.');
  },
};

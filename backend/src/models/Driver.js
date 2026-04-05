const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Driver = sequelize.define('Driver', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // ── Rôle & accès ─────────────────────────────────────────────────────────
    role: {
      type: DataTypes.ENUM('admin', 'driver'),
      defaultValue: 'driver',
      allowNull: false,
    },

    // ── Statut du compte ─────────────────────────────────────────────────────
    // trial    : essai gratuit actif
    // active   : abonnement payant actif
    // suspended: suspendu manuellement par l'admin plateforme
    // expired  : essai ou abonnement expiré, accès bloqué
    status: {
      type: DataTypes.ENUM('trial', 'active', 'suspended', 'expired'),
      defaultValue: 'trial',
      allowNull: false,
    },

    // ── Abonnement ───────────────────────────────────────────────────────────
    plan: {
      type: DataTypes.ENUM('free', 'pro'),
      defaultValue: 'free',
      allowNull: false,
    },
    trialEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    subscriptionStatus: {
      // Valeurs Stripe : trialing | active | past_due | canceled | unpaid
      type: DataTypes.STRING,
      defaultValue: 'trialing',
      allowNull: true,
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // ── Profil public & URL de réservation ───────────────────────────────────
    // Slug unique utilisé dans l'URL de réservation publique : /book/:slug
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Infos affichées sur la page de réservation publique du chauffeur
    businessName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    siret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vtcCardNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'drivers',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['slug'],                name: 'drivers_slug_unique' },
      { unique: true, fields: ['stripeCustomerId'],    name: 'drivers_stripe_customer_unique' },
      { unique: true, fields: ['stripeSubscriptionId'], name: 'drivers_stripe_subscription_unique' },
    ],
  });

  // ── Hook : générer le slug automatiquement à la création ─────────────────
  Driver.beforeCreate(async (driver) => {
    if (!driver.slug && driver.name) {
      const base = driver.name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 40);
      // S'assurer de l'unicité en ajoutant un suffix si nécessaire
      let slug = base;
      let n = 1;
      while (await Driver.findOne({ where: { slug } })) {
        slug = `${base}-${n}`;
        n++;
      }
      driver.slug = slug;
    }
    // Essai gratuit de 14 jours à compter de la création
    if (!driver.trialEndDate) {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      driver.trialEndDate = d;
    }
  });

  return Driver;
};

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
      type: DataTypes.ENUM('pending', 'trial', 'active', 'suspended', 'expired'),
      defaultValue: 'pending',   // ← nouveau défaut : en attente de validation admin
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

    // ── Comptabilité ─────────────────────────────────────────────────────────
    // Taux de commission de la plateforme (%) appliqué sur le CA brut du chauffeur
    // Valeur par défaut : 20 % — modifiable individuellement par l'admin
    commissionRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 20.0,
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

  // ── Hook : générer le slug et le trial uniquement pour les chauffeurs ──────
  // L'admin n'a pas de slug (pas de page publique) ni de trialEndDate (pas d'abonnement)
  Driver.beforeCreate(async (driver) => {
    if (driver.role === 'admin') return; // ← admin ignoré totalement

    // Slug unique pour le chauffeur
    if (!driver.slug && driver.name) {
      const base = driver.name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 40);
      let slug = base;
      let n = 1;
      while (await Driver.findOne({ where: { slug } })) {
        slug = `${base}-${n}`;
        n++;
      }
      driver.slug = slug;
    }

    // Essai gratuit de 14 jours — uniquement si le compte n'est pas en attente de validation
    // (le trial commence quand l'admin valide le chauffeur, pas à l'inscription)
    if (!driver.trialEndDate && driver.status !== 'pending') {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      driver.trialEndDate = d;
    }
  });

  return Driver;
};

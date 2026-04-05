const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Driver } = require('../models');
const logger = require('../middleware/logger');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const driver = await Driver.findOne({ where: { email } });
    if (!driver) {
      logger.warn(`Tentative de connexion échouée – email inconnu : ${email} – IP: ${req.ip}`);
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const isValid = await bcrypt.compare(password, driver.password);
    if (!isValid) {
      logger.warn(`Tentative de connexion échouée – mauvais mdp : ${email} – IP: ${req.ip}`);
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const token = jwt.sign(
      { id: driver.id, email: driver.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    logger.info(`Connexion réussie : ${driver.email}`);

    res.json({
      token,
      driver: {
        id:           driver.id,
        name:         driver.name,
        email:        driver.email,
        phone:        driver.phone,
        role:         driver.role,
        status:       driver.status,
        plan:         driver.plan,
        slug:         driver.slug,
        trialEndDate: driver.trialEndDate,
        businessName: driver.businessName,
      },
    });
  } catch (err) {
    logger.error(`Erreur login : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
};

exports.me = async (req, res) => {
  // Recharger le driver depuis la DB pour avoir les champs à jour (statut, trial…)
  try {
    const driver = await Driver.findByPk(req.driver.id, {
      attributes: { exclude: ['password'] },
    });
    if (!driver) return res.status(404).json({ error: 'Compte introuvable.' });
    res.json({ driver });
  } catch (err) {
    logger.error(`[ME] Erreur : ${err.message}`);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── Inscription chauffeur (auto-onboarding) ───────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Vérifier l'unicité de l'email
    const existing = await Driver.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer le compte avec essai gratuit de 14 jours
    const driver = await Driver.create({
      name,
      email,
      password: hashedPassword,
      phone:    phone || null,
      role:     'driver',
      status:   'trial',
      plan:     'free',
      subscriptionStatus: 'trialing',
      // trialEndDate et slug sont générés automatiquement par les hooks beforeCreate
    });

    const token = jwt.sign(
      { id: driver.id, email: driver.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    logger.info(`[REGISTER] Nouveau chauffeur inscrit : ${driver.email} – essai jusqu'au ${driver.trialEndDate}`);

    res.status(201).json({
      message: 'Compte créé avec succès. Votre essai gratuit de 14 jours est activé.',
      token,
      driver: {
        id:            driver.id,
        name:          driver.name,
        email:         driver.email,
        phone:         driver.phone,
        role:          driver.role,
        status:        driver.status,
        plan:          driver.plan,
        trialEndDate:  driver.trialEndDate,
        slug:          driver.slug,
      },
    });
  } catch (err) {
    logger.error(`[REGISTER] Erreur inscription : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors de la création du compte.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Champs requis manquants.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères.' });
    }

    const driver = await Driver.findByPk(req.driver.id);
    const isValid = await bcrypt.compare(currentPassword, driver.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    }

    driver.password = await bcrypt.hash(newPassword, 12);
    await driver.save();

    logger.info(`Mot de passe modifié : ${driver.email}`);
    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    logger.error(`Erreur changement mdp : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe.' });
  }
};

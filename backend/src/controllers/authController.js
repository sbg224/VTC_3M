const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Driver, RevokedToken } = require('../models');
const logger = require('../middleware/logger');

// ── Helper : signe un JWT avec un JTI unique ──────────────────────────────────
function signToken(driver) {
  const jti = uuidv4(); // Identifiant unique du token — permet la révocation
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  const token = jwt.sign(
    { id: driver.id, email: driver.email, jti },
    process.env.JWT_SECRET,
    { expiresIn }
  );
  return { token, jti };
}

// ── Payload public chauffeur ──────────────────────────────────────────────────
function driverPayload(driver) {
  return {
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
  };
}

// ── Login ─────────────────────────────────────────────────────────────────────
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

    if (driver.status === 'pending') {
      return res.status(403).json({
        error: 'Votre compte est en attente de validation par l\'administrateur.',
        code: 'ACCOUNT_PENDING',
      });
    }

    if (driver.status === 'suspended') {
      return res.status(403).json({
        error: 'Votre compte est suspendu. Contactez l\'administrateur.',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    const { token } = signToken(driver);
    logger.info(`Connexion réussie : ${driver.email}`);

    res.json({ token, driver: driverPayload(driver) });
  } catch (err) {
    logger.error(`Erreur login : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
};

// ── Me (profil chauffeur connecté) ────────────────────────────────────────────
exports.me = async (req, res) => {
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

// ── Logout — révoque le JWT courant ──────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    const { jti, exp } = req.tokenPayload; // injecté par auth.js
    if (jti) {
      await RevokedToken.create({
        jti,
        expiresAt: new Date(exp * 1000), // exp est en secondes UNIX
      });
      logger.info(`[LOGOUT] Token révoqué : jti=${jti} – driver: ${req.driver.email}`);
    }
    res.json({ message: 'Déconnexion réussie.' });
  } catch (err) {
    // Ne pas bloquer la déconnexion côté client si la DB échoue
    logger.error(`[LOGOUT] Erreur révocation token : ${err.message}`);
    res.json({ message: 'Déconnexion réussie.' }); // On renvoie succès quand même
  }
};

// ── Inscription chauffeur (auto-onboarding) ───────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, gdprConsent, termsAccepted } = req.body;

    if (!name?.trim() || name.trim().length < 2) {
      return res.status(400).json({ error: 'Le nom complet est requis.' });
    }
    if (!email?.trim() || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }
    if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Le mot de passe ne respecte pas les critères minimums.' });
    }
    const normalizedPhone = phone?.replace(/\s/g, '') || '';
    if (normalizedPhone && !/^(\+33|0)[1-9](\d{8})$/.test(normalizedPhone)) {
      return res.status(400).json({ error: 'Numéro de téléphone invalide (format français).' });
    }
    if (gdprConsent !== true) {
      return res.status(400).json({ error: 'Le consentement à la politique de confidentialité est requis.' });
    }
    if (termsAccepted !== true) {
      return res.status(400).json({ error: 'L\'acceptation des CGU est requise.' });
    }

    const existing = await Driver.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const driver = await Driver.create({
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      phone: normalizedPhone || null,
      role:     'driver',
      status:   'pending',
      plan:     'free',
      subscriptionStatus: 'trialing',
      gdprConsent,
      termsAccepted,
    });

    logger.info(`[REGISTER] Nouveau chauffeur : ${driver.email}`);

    res.status(201).json({
      message: 'Compte créé. En attente de validation par l\'administrateur.',
      driver: driverPayload(driver),
    });
  } catch (err) {
    logger.error(`[REGISTER] Erreur inscription : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors de la création du compte.' });
  }
};

// ── Changement de mot de passe ────────────────────────────────────────────────
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

    // Révoquer aussi le token courant pour forcer une reconnexion
    const { jti, exp } = req.tokenPayload || {};
    if (jti) {
      await RevokedToken.create({ jti, expiresAt: new Date((exp || 0) * 1000) })
        .catch(() => {}); // Non-bloquant
    }

    logger.info(`Mot de passe modifié : ${driver.email}`);
    res.json({ message: 'Mot de passe modifié. Veuillez vous reconnecter.' });
  } catch (err) {
    logger.error(`Erreur changement mdp : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe.' });
  }
};

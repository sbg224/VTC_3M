const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
      },
    });
  } catch (err) {
    logger.error(`Erreur login : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
};

exports.me = async (req, res) => {
  res.json({ driver: req.driver });
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

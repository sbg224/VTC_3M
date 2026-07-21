const jwt = require('jsonwebtoken');

const JWT_ALGORITHM = 'HS256';

function signSessionToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { algorithm: JWT_ALGORITHM, expiresIn });
}

function verifySessionToken(token, secret) {
  return jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] });
}

function isStrongPassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && /[A-Z]/.test(password)
    && /[0-9]/.test(password);
}

module.exports = { JWT_ALGORITHM, signSessionToken, verifySessionToken, isStrongPassword };

const logger = require('../middleware/logger');

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

async function sendAdminSms(reservation) {
  if (String(process.env.SMS_ENABLED || 'true').toLowerCase() === 'false') {
    logger.warn(`[SMS] Envoi désactivé par SMS_ENABLED=false (${reservation.reservationNumber})`);
    return;
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN ||
      process.env.TWILIO_ACCOUNT_SID.startsWith('AC0000')) {
    logger.warn('SMS désactivé : identifiants Twilio non configurés');
    return;
  }

  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const message = `🚗 VTC 3M – Nouvelle réservation !
N° ${reservation.reservationNumber}
Client : ${reservation.firstName} ${reservation.lastName} – ${reservation.phone}
Course : ${reservation.departureAddress} → ${reservation.arrivalAddress}
Date : ${formatDate(reservation.date)} à ${reservation.time}
Connectez-vous au tableau de bord pour confirmer.`;

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.ADMIN_PHONE,
    });
    logger.info(`SMS admin envoyé : ${result.sid}`);
    return result;
  } catch (err) {
    logger.error(`Erreur SMS admin : ${err.message}`);
    // Ne pas bloquer la réservation
  }
}

module.exports = { sendAdminSms };

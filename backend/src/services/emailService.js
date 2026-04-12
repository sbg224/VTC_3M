const nodemailer = require('nodemailer');
const logger = require('../middleware/logger');

function emailsEnabled() {
  return String(process.env.EMAIL_ENABLED || 'true').toLowerCase() !== 'false';
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Email au chauffeur assigné ────────────────────────────────────────────────
// driverEmail : email du chauffeur qui reçoit la course (pas l'email fixe du .env)
async function sendAdminNotification(reservation, pdfPath, driverEmail) {
  if (!emailsEnabled()) {
    logger.warn(`[EMAIL] Envoi désactivé par EMAIL_ENABLED=false (admin notification ${reservation.reservationNumber})`);
    return;
  }
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"><style>
      body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .header { background: #1a1a2e; color: #c9a227; padding: 30px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; }
      .badge { background: #c9a227; color: #1a1a2e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 8px; display: inline-block; }
      .body { padding: 30px; }
      .alert { background: #fff3cd; border-left: 4px solid #c9a227; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
      .section { margin-bottom: 24px; }
      .section h3 { color: #1a1a2e; border-bottom: 2px solid #c9a227; padding-bottom: 8px; margin-bottom: 12px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .info-item { background: #f9f9f9; padding: 10px; border-radius: 4px; }
      .info-item label { font-size: 11px; color: #888; display: block; margin-bottom: 2px; text-transform: uppercase; }
      .info-item span { font-weight: bold; color: #333; }
      .footer { background: #1a1a2e; color: #888; padding: 20px; text-align: center; font-size: 12px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚗 ${process.env.COMPANY_NAME || 'VTC 3M'}</h1>
          <div class="badge">NOUVELLE RÉSERVATION</div>
        </div>
        <div class="body">
          <div class="alert">
            <strong>📋 N° ${reservation.reservationNumber}</strong> – Nouvelle course à confirmer !
          </div>
          <div class="section">
            <h3>👤 Client</h3>
            <div class="info-grid">
              <div class="info-item"><label>Nom complet</label><span>${reservation.firstName} ${reservation.lastName}</span></div>
              <div class="info-item"><label>Téléphone</label><span>${reservation.phone}</span></div>
              <div class="info-item"><label>Email</label><span>${reservation.email}</span></div>
            </div>
          </div>
          <div class="section">
            <h3>🗺️ Course</h3>
            <div class="info-item" style="margin-bottom:8px"><label>Départ</label><span>${reservation.departureAddress}</span></div>
            <div class="info-item" style="margin-bottom:8px"><label>Arrivée</label><span>${reservation.arrivalAddress}</span></div>
            <div class="info-grid">
              <div class="info-item"><label>Date</label><span>${formatDate(reservation.date)}</span></div>
              <div class="info-item"><label>Heure</label><span>${reservation.time}</span></div>
              <div class="info-item"><label>Passagers</label><span>${reservation.passengers}</span></div>
              <div class="info-item"><label>Bagages</label><span>${reservation.luggage}</span></div>
            </div>
            ${reservation.comments ? `<div class="info-item" style="margin-top:8px"><label>Commentaires</label><span>${reservation.comments}</span></div>` : ''}
          </div>
        </div>
        <div class="footer">
          ${process.env.COMPANY_NAME || 'VTC 3M'} – ${process.env.COMPANY_PHONE || ''}<br>
          Connectez-vous au tableau de bord pour confirmer cette course.
        </div>
      </div>
    </body></html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'VTC 3M <noreply@vtc3m.fr>',
    to: driverEmail || process.env.ADMIN_EMAIL,  // chauffeur ciblé, fallback sur ADMIN_EMAIL
    subject: `🚗 Nouvelle réservation ${reservation.reservationNumber} – ${reservation.firstName} ${reservation.lastName}`,
    html,
    attachments: pdfPath ? [{
      filename: `reservation-${reservation.reservationNumber}.pdf`,
      path: pdfPath,
    }] : [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email admin envoyé : ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Erreur email admin : ${err.message}`);
    throw err;
  }
}

// ── Email de confirmation au client ──────────────────────────────────────────
async function sendClientConfirmation(reservation, pdfPath) {
  if (!emailsEnabled()) {
    logger.warn(`[EMAIL] Envoi désactivé par EMAIL_ENABLED=false (confirmation client ${reservation.reservationNumber})`);
    return;
  }
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"><style>
      body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; }
      .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .header { background: #1a1a2e; color: #c9a227; padding: 30px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; }
      .body { padding: 30px; }
      .confirm-box { background: #e8f5e9; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
      .section { margin-bottom: 24px; }
      .section h3 { color: #1a1a2e; border-bottom: 2px solid #c9a227; padding-bottom: 8px; }
      .info-item { background: #f9f9f9; padding: 10px; border-radius: 4px; margin-bottom: 8px; }
      .info-item label { font-size: 11px; color: #888; display: block; text-transform: uppercase; }
      .info-item span { font-weight: bold; color: #333; }
      .footer { background: #1a1a2e; color: #888; padding: 20px; text-align: center; font-size: 12px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚗 ${process.env.COMPANY_NAME || 'VTC 3M'}</h1>
          <p style="color:#aaa;margin:5px 0 0">Confirmation de votre réservation</p>
        </div>
        <div class="body">
          <p>Bonjour <strong>${reservation.firstName}</strong>,</p>
          <div class="confirm-box">
            ✅ Votre réservation <strong>${reservation.reservationNumber}</strong> a bien été enregistrée. Notre chauffeur vous contactera pour confirmation.
          </div>
          <div class="section">
            <h3>🗺️ Votre course</h3>
            <div class="info-item"><label>Départ</label><span>${reservation.departureAddress}</span></div>
            <div class="info-item"><label>Arrivée</label><span>${reservation.arrivalAddress}</span></div>
            <div class="info-item"><label>Date & Heure</label><span>${formatDate(reservation.date)} à ${reservation.time}</span></div>
          </div>
          <p style="color:#666;font-size:13px">Votre bon de réservation est joint à cet email. Pour toute question, contactez-nous au <strong>${process.env.COMPANY_PHONE || ''}</strong>.</p>
        </div>
        <div class="footer">
          ${process.env.COMPANY_NAME || 'VTC 3M'} – ${process.env.COMPANY_EMAIL || ''}<br>
          Merci de votre confiance !
        </div>
      </div>
    </body></html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'VTC 3M <noreply@vtc3m.fr>',
    to: reservation.email,
    subject: `✅ Confirmation réservation ${reservation.reservationNumber} – ${process.env.COMPANY_NAME || 'VTC 3M'}`,
    html,
    attachments: pdfPath ? [{
      filename: `reservation-${reservation.reservationNumber}.pdf`,
      path: pdfPath,
    }] : [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email client envoyé : ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Erreur email client : ${err.message}`);
    // Ne pas bloquer la réservation si l'email échoue
  }
}

// ── Email de facture au client ────────────────────────────────────────────────
async function sendInvoiceToClient(reservation, pdfPath, reviewToken) {
  if (!emailsEnabled()) {
    logger.warn(`[EMAIL] Envoi désactivé par EMAIL_ENABLED=false (facture client ${reservation.reservationNumber})`);
    return;
  }
  const transporter = createTransporter();

  const appUrl    = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0];
  const reviewUrl = reviewToken ? `${appUrl}/review/${reviewToken}` : null;

  const reviewBlock = reviewUrl ? `
    <div style="margin:28px 0 0;padding:24px;background:#fffbf0;border-radius:12px;border:2px solid #c9a227;text-align:center">
      <p style="margin:0 0 6px;font-size:1rem;font-weight:700;color:#1a1a2e">Votre avis compte pour nous !</p>
      <p style="margin:0 0 16px;font-size:0.88rem;color:#555">Comment s'est passée votre course ? Notez-nous en 30 secondes.</p>
      <div style="font-size:1.8rem;margin-bottom:14px;letter-spacing:4px">&#11088;&#11088;&#11088;&#11088;&#11088;</div>
      <a href="${reviewUrl}" style="display:inline-block;background:#c9a227;color:#1a1a2e;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:700;font-size:0.95rem">
        Laisser un avis
      </a>
      <p style="margin:12px 0 0;font-size:0.75rem;color:#aaa">Lien valable une seule fois</p>
    </div>` : '';

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'VTC 3M <noreply@vtc3m.fr>',
    to: reservation.email,
    subject: `🧾 Facture ${reservation.reservationNumber} – ${process.env.COMPANY_NAME || 'VTC 3M'}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1a1a2e;color:#c9a227;padding:30px;text-align:center">
          <h1 style="margin:0">🚗 ${process.env.COMPANY_NAME || 'VTC 3M'}</h1>
        </div>
        <div style="padding:30px">
          <p>Bonjour <strong>${reservation.firstName}</strong>,</p>
          <p>Veuillez trouver ci-joint votre facture pour la course du <strong>${formatDate(reservation.date)}</strong>.</p>
          <p style="color:#666">Montant total : <strong>${Number(reservation.price).toFixed(2)} €</strong></p>
          ${reviewBlock}
          <p style="margin-top:24px">Merci de votre confiance et à bientôt !</p>
        </div>
        <div style="background:#1a1a2e;color:#888;padding:20px;text-align:center;font-size:12px">
          ${process.env.COMPANY_NAME || 'VTC 3M'} – ${process.env.COMPANY_PHONE || ''}
        </div>
      </div>
    `,
    attachments: pdfPath ? [{
      filename: `facture-${reservation.reservationNumber}.pdf`,
      path: pdfPath,
    }] : [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email facture envoyé : ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Erreur email facture : ${err.message}`);
  }
}

// ── Email de facture au chauffeur ─────────────────────────────────────────────
async function sendInvoiceToDriver(reservation, pdfPath, driverEmail) {
  if (!driverEmail) {
    logger.warn(`[EMAIL] sendInvoiceToDriver : aucun email chauffeur fourni pour ${reservation.reservationNumber}`);
    return;
  }
  if (!emailsEnabled()) {
    logger.warn(`[EMAIL] Envoi désactivé par EMAIL_ENABLED=false (facture chauffeur ${reservation.reservationNumber})`);
    return;
  }
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'VTC 3M <noreply@vtc3m.fr>',
    to: driverEmail,
    subject: `🧾 Facture émise – ${reservation.reservationNumber} (${reservation.firstName} ${reservation.lastName})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1a1a2e;color:#c9a227;padding:30px;text-align:center">
          <h1 style="margin:0">🚗 ${process.env.COMPANY_NAME || 'VTC 3M'}</h1>
          <p style="color:#aaa;margin:5px 0 0">Récapitulatif de course</p>
        </div>
        <div style="padding:30px">
          <p>Bonjour,</p>
          <p>La course <strong>${reservation.reservationNumber}</strong> a été validée et la facture a été émise.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr style="background:#f9f9f9">
              <td style="padding:8px 12px;font-size:12px;color:#888;text-transform:uppercase">Client</td>
              <td style="padding:8px 12px;font-weight:bold">${reservation.firstName} ${reservation.lastName}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-size:12px;color:#888;text-transform:uppercase">Date</td>
              <td style="padding:8px 12px;font-weight:bold">${formatDate(reservation.date)} à ${reservation.time}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:8px 12px;font-size:12px;color:#888;text-transform:uppercase">Trajet</td>
              <td style="padding:8px 12px;font-weight:bold">${reservation.departureAddress} → ${reservation.arrivalAddress}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-size:12px;color:#888;text-transform:uppercase">Montant facturé</td>
              <td style="padding:8px 12px;font-weight:bold;color:#c9a227">${Number(reservation.price).toFixed(2)} €</td>
            </tr>
          </table>
          <p style="color:#666;font-size:13px">La facture PDF est jointe à cet email pour vos archives.</p>
        </div>
        <div style="background:#1a1a2e;color:#888;padding:20px;text-align:center;font-size:12px">
          ${process.env.COMPANY_NAME || 'VTC 3M'} – Tableau de bord disponible sur votre espace chauffeur
        </div>
      </div>
    `,
    attachments: pdfPath ? [{
      filename: `facture-${reservation.reservationNumber}.pdf`,
      path: pdfPath,
    }] : [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`[EMAIL] Facture envoyée au chauffeur (${driverEmail}) : ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`[EMAIL] Erreur envoi facture chauffeur ${reservation.reservationNumber} : ${err.message}`);
  }
}

module.exports = { sendAdminNotification, sendClientConfirmation, sendInvoiceToClient, sendInvoiceToDriver };

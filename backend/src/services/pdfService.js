const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../middleware/logger');

const PDFS_DIR = path.join(__dirname, '../../pdfs');

function ensurePdfsDir() {
  if (!fs.existsSync(PDFS_DIR)) {
    fs.mkdirSync(PDFS_DIR, { recursive: true });
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function statusLabel(status) {
  const labels = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    completed: 'Terminée',
    cancelled: 'Annulée',
  };
  return labels[status] || status;
}

function drawHeader(doc, title) {
  // Fond sombre header
  doc.rect(0, 0, doc.page.width, 110).fill('#1a1a2e');

  // Bande dorée
  doc.rect(0, 105, doc.page.width, 5).fill('#c9a227');

  // Nom entreprise
  doc.fontSize(26)
    .fillColor('#c9a227')
    .font('Helvetica-Bold')
    .text(process.env.COMPANY_NAME || 'VTC 3M', 50, 30);

  // Sous-titre
  doc.fontSize(10)
    .fillColor('#aaaaaa')
    .font('Helvetica')
    .text('Transport VTC – Service Premium', 50, 62);

  // Titre du document (droite)
  doc.fontSize(14)
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .text(title, 0, 40, { align: 'right', width: doc.page.width - 50 });

  doc.moveDown(4);
}

function drawFooter(doc) {
  const footerY = doc.page.height - 60;
  doc.rect(0, footerY - 5, doc.page.width, 65).fill('#1a1a2e');
  doc.rect(0, footerY - 10, doc.page.width, 5).fill('#c9a227');

  doc.fontSize(8)
    .fillColor('#aaaaaa')
    .font('Helvetica')
    .text(
      `${process.env.COMPANY_NAME || 'VTC 3M'} – SIRET : ${process.env.COMPANY_SIRET || 'XXX XXX XXX XXXXX'} – ${process.env.COMPANY_ADDRESS || ''}`,
      50, footerY + 5, { align: 'center', width: doc.page.width - 100 }
    );
  doc.text(
    `Tél : ${process.env.COMPANY_PHONE || ''} – Email : ${process.env.COMPANY_EMAIL || ''}`,
    50, footerY + 20, { align: 'center', width: doc.page.width - 100 }
  );
  doc.text(
    'Document généré automatiquement – Conservez ce document.',
    50, footerY + 35, { align: 'center', width: doc.page.width - 100 }
  );
}

function drawInfoBlock(doc, label, value, x, y, width = 230) {
  doc.fontSize(9).fillColor('#888888').font('Helvetica').text(label.toUpperCase(), x, y);
  doc.fontSize(11).fillColor('#1a1a2e').font('Helvetica-Bold').text(value || '—', x, y + 14, { width });
  return y + 40;
}

function drawSection(doc, title, yStart) {
  doc.rect(50, yStart, doc.page.width - 100, 24).fill('#1a1a2e');
  doc.fontSize(11)
    .fillColor('#c9a227')
    .font('Helvetica-Bold')
    .text(title, 60, yStart + 6);
  return yStart + 34;
}

// ── BON DE RÉSERVATION ────────────────────────────────────────────────────────
async function generateReservationPdf(reservation) {
  ensurePdfsDir();
  const filename = `reservation-${reservation.reservationNumber}.pdf`;
  const filepath = path.join(PDFS_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    drawHeader(doc, 'BON DE RÉSERVATION');

    // Numéro & date
    let y = 130;
    doc.rect(50, y, doc.page.width - 100, 40).fill('#f5f0e8').stroke('#c9a227');
    doc.fontSize(12).fillColor('#1a1a2e').font('Helvetica-Bold')
      .text(`N° ${reservation.reservationNumber}`, 65, y + 13);
    doc.fontSize(10).fillColor('#666666').font('Helvetica')
      .text(`Réservation du ${formatDate(reservation.createdAt)}`, 0, y + 15, {
        align: 'right', width: doc.page.width - 65,
      });
    y += 60;

    // Statut
    const statusColors = {
      pending: '#f59e0b', confirmed: '#10b981',
      completed: '#3b82f6', cancelled: '#ef4444',
    };
    const color = statusColors[reservation.status] || '#666';
    doc.roundedRect(50, y, 120, 24, 4).fill(color);
    doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold')
      .text(statusLabel(reservation.status), 55, y + 6, { width: 110, align: 'center' });
    y += 44;

    // Section client
    y = drawSection(doc, '👤 INFORMATIONS CLIENT', y);
    const leftX = 50, rightX = 310;
    let rowY = y;
    drawInfoBlock(doc, 'Nom', `${reservation.firstName} ${reservation.lastName}`, leftX, rowY);
    drawInfoBlock(doc, 'Email', reservation.email, rightX, rowY);
    rowY += 42;
    drawInfoBlock(doc, 'Téléphone', reservation.phone, leftX, rowY);
    y = rowY + 42;

    // Section course
    y = drawSection(doc, '🚗 DÉTAILS DE LA COURSE', y);
    rowY = y;
    drawInfoBlock(doc, 'Adresse de départ', reservation.departureAddress, leftX, rowY, 460);
    rowY += 42;
    drawInfoBlock(doc, 'Adresse d\'arrivée', reservation.arrivalAddress, leftX, rowY, 460);
    rowY += 42;
    drawInfoBlock(doc, 'Date', formatDate(reservation.date), leftX, rowY);
    drawInfoBlock(doc, 'Heure', reservation.time, rightX, rowY);
    rowY += 42;
    drawInfoBlock(doc, 'Passagers', String(reservation.passengers || 1), leftX, rowY);
    drawInfoBlock(doc, 'Bagages', String(reservation.luggage || 0), rightX, rowY);
    y = rowY + 42;

    // Section tarification (si prix calculé)
    if (reservation.estimatedPrice) {
      y = drawSection(doc, '💰 TARIFICATION', y);
      rowY = y;
      if (reservation.distance) {
        drawInfoBlock(doc, 'Distance estimée', `${Number(reservation.distance).toFixed(1)} km`, leftX, rowY);
      }
      drawInfoBlock(doc, 'Prix estimé', `${Number(reservation.estimatedPrice).toFixed(2)} €`, rightX, rowY);
      y = rowY + 42;
    }

    // Commentaires
    if (reservation.comments) {
      y = drawSection(doc, '💬 COMMENTAIRES', y);
      doc.rect(50, y, doc.page.width - 100, 60).fill('#fafafa').stroke('#e5e7eb');
      doc.fontSize(10).fillColor('#444444').font('Helvetica')
        .text(reservation.comments, 60, y + 10, { width: doc.page.width - 120 });
      y += 70;
    }

    // Message de confirmation
    y += 10;
    doc.rect(50, y, doc.page.width - 100, 50).fill('#e8f5e9').stroke('#10b981');
    doc.fontSize(10).fillColor('#1a6b3c').font('Helvetica-Bold')
      .text('✅ Votre réservation a bien été enregistrée.', 60, y + 8, { width: doc.page.width - 120 });
    doc.fontSize(9).fillColor('#2d6a4f').font('Helvetica')
      .text('Vous recevrez une confirmation par email sous peu. Merci de votre confiance.', 60, y + 25, { width: doc.page.width - 120 });

    drawFooter(doc);
    doc.end();

    stream.on('finish', () => {
      logger.info(`PDF réservation généré : ${filename}`);
      resolve({ filename, filepath });
    });
    stream.on('error', reject);
  });
}

// ── FACTURE ───────────────────────────────────────────────────────────────────
async function generateInvoicePdf(reservation) {
  ensurePdfsDir();
  const filename = `facture-${reservation.reservationNumber}.pdf`;
  const filepath = path.join(PDFS_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    drawHeader(doc, 'FACTURE');

    let y = 130;

    // Bloc numéro & date
    doc.rect(50, y, doc.page.width - 100, 40).fill('#f5f0e8').stroke('#c9a227');
    doc.fontSize(12).fillColor('#1a1a2e').font('Helvetica-Bold')
      .text(`Facture N° ${reservation.reservationNumber}`, 65, y + 13);
    doc.fontSize(10).fillColor('#666666').font('Helvetica')
      .text(`Émise le ${formatDate(new Date())}`, 0, y + 15, {
        align: 'right', width: doc.page.width - 65,
      });
    y += 60;

    // Blocs prestataire / client côte à côte
    const halfW = (doc.page.width - 120) / 2;
    doc.rect(50, y, halfW, 90).fill('#1a1a2e');
    doc.fontSize(9).fillColor('#c9a227').font('Helvetica-Bold').text('PRESTATAIRE', 60, y + 8);
    doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold')
      .text(process.env.COMPANY_NAME || 'VTC 3M', 60, y + 22);
    doc.fontSize(9).fillColor('#cccccc').font('Helvetica')
      .text(process.env.COMPANY_ADDRESS || '', 60, y + 36, { width: halfW - 20 })
      .text(`Tél : ${process.env.COMPANY_PHONE || ''}`, 60, y + 52)
      .text(`SIRET : ${process.env.COMPANY_SIRET || ''}`, 60, y + 66);

    const rightBlockX = 50 + halfW + 20;
    doc.rect(rightBlockX, y, halfW, 90).fill('#f9f9f9').stroke('#e5e7eb');
    doc.fontSize(9).fillColor('#888888').font('Helvetica-Bold').text('CLIENT', rightBlockX + 10, y + 8);
    doc.fontSize(10).fillColor('#1a1a2e').font('Helvetica-Bold')
      .text(`${reservation.firstName} ${reservation.lastName}`, rightBlockX + 10, y + 22);
    doc.fontSize(9).fillColor('#444444').font('Helvetica')
      .text(reservation.email, rightBlockX + 10, y + 38)
      .text(reservation.phone, rightBlockX + 10, y + 52);
    y += 110;

    // Tableau prestations
    y = drawSection(doc, '📋 DÉTAIL DE LA PRESTATION', y);

    // En-tête tableau
    doc.rect(50, y, doc.page.width - 100, 24).fill('#c9a227');
    doc.fontSize(9).fillColor('#1a1a2e').font('Helvetica-Bold')
      .text('DESCRIPTION', 60, y + 7)
      .text('DATE', 280, y + 7)
      .text('MONTANT', 430, y + 7, { width: 80, align: 'right' });
    y += 24;

    // Ligne prestation
    doc.rect(50, y, doc.page.width - 100, 30).fill('#fafafa').stroke('#e5e7eb');
    doc.fontSize(9).fillColor('#333333').font('Helvetica')
      .text(`Course VTC – ${reservation.departureAddress} → ${reservation.arrivalAddress}`, 60, y + 10, { width: 200 })
      .text(`${formatDate(reservation.date)} à ${reservation.time}`, 280, y + 10)
      .text(`${Number(reservation.price).toFixed(2)} €`, 430, y + 10, { width: 80, align: 'right' });
    y += 30;

    // Ligne passagers/bagages/distance
    const detailLine = [
      `Passagers : ${reservation.passengers || 1}`,
      `Bagages : ${reservation.luggage || 0}`,
      reservation.distance ? `Distance : ${Number(reservation.distance).toFixed(1)} km` : null,
    ].filter(Boolean).join(' – ');
    doc.rect(50, y, doc.page.width - 100, 24).fill('#ffffff').stroke('#e5e7eb');
    doc.fontSize(9).fillColor('#666666').font('Helvetica')
      .text(detailLine, 60, y + 7);
    y += 24;

    // Totaux
    y += 10;
    const totalsX = 350;
    const totalsW = doc.page.width - totalsX - 50;

    const ht = Number(reservation.price);
    const tvaRate = 0; // TVA 0% pour auto-entrepreneur
    const ttc = ht;

    doc.rect(totalsX, y, totalsW, 24).fill('#f9f9f9').stroke('#e5e7eb');
    doc.fontSize(9).fillColor('#666666').font('Helvetica')
      .text('Sous-total HT :', totalsX + 10, y + 7)
      .text(`${ht.toFixed(2)} €`, totalsX + 10, y + 7, { width: totalsW - 20, align: 'right' });
    y += 24;

    doc.rect(totalsX, y, totalsW, 24).fill('#f9f9f9').stroke('#e5e7eb');
    doc.fontSize(9).fillColor('#666666').font('Helvetica')
      .text('TVA (0% – Auto-entrepreneur)', totalsX + 10, y + 7)
      .text('0,00 €', totalsX + 10, y + 7, { width: totalsW - 20, align: 'right' });
    y += 24;

    doc.rect(totalsX, y, totalsW, 30).fill('#1a1a2e');
    doc.fontSize(11).fillColor('#c9a227').font('Helvetica-Bold')
      .text('TOTAL TTC :', totalsX + 10, y + 9)
      .text(`${ttc.toFixed(2)} €`, totalsX + 10, y + 9, { width: totalsW - 20, align: 'right' });
    y += 40;

    // Note TVA
    doc.fontSize(8).fillColor('#888888').font('Helvetica')
      .text('TVA non applicable, art. 293 B du CGI.', 50, y);
    y += 20;

    // Mentions légales
    if (reservation.comments) {
      y += 10;
      doc.fontSize(9).fillColor('#666').font('Helvetica-Bold').text('Notes :', 50, y);
      doc.fontSize(9).fillColor('#666').font('Helvetica').text(reservation.comments, 50, y + 14, { width: doc.page.width - 100 });
      y += 34;
    }

    y += 20;
    doc.rect(50, y, doc.page.width - 100, 40).fill('#e8f5e9').stroke('#10b981');
    doc.fontSize(9).fillColor('#1a6b3c').font('Helvetica-Bold')
      .text('✅ Course effectuée et payée. Merci de votre confiance !', 60, y + 14, { width: doc.page.width - 120 });

    drawFooter(doc);
    doc.end();

    stream.on('finish', () => {
      logger.info(`PDF facture généré : ${filename}`);
      resolve({ filename, filepath });
    });
    stream.on('error', reject);
  });
}

module.exports = { generateReservationPdf, generateInvoicePdf };

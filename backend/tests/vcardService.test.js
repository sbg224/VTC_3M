const fs = require('fs');
const path = require('path');
const { buildVcard, escapeVcardText } = require('../src/services/vcardService');
const { CONTACT_UPLOADS_DIR } = require('../src/middleware/uploadContactPhoto');

describe('vcardService', () => {
  const baseContact = {
    firstName: 'Marie',
    lastName: 'Dupont',
    company: '3M Drive',
    jobTitle: 'Chauffeure VTC',
    phone: '+33612345678',
    email: 'marie@example.com',
    website: 'https://3mdrive.fr',
    address: '12 Allée Jean Jaurès, Toulouse',
    bookingUrl: 'https://3mdrive.fr/book/marie',
    photoUrl: null,
  };

  test('génère une vCard 3.0 avec les champs de base', () => {
    const vcard = buildVcard(baseContact);
    expect(vcard).toMatch(/^BEGIN:VCARD\r\n/);
    expect(vcard).toMatch(/VERSION:3\.0\r\n/);
    expect(vcard).toMatch(/N:Dupont;Marie;;;\r\n/);
    expect(vcard).toMatch(/FN:Marie Dupont\r\n/);
    expect(vcard).toMatch(/ORG:3M Drive\r\n/);
    expect(vcard).toMatch(/TITLE:Chauffeure VTC\r\n/);
    expect(vcard).toMatch(/TEL;TYPE=WORK,VOICE:\+33612345678\r\n/);
    expect(vcard).toMatch(/EMAIL;TYPE=WORK:marie@example\.com\r\n/);
    expect(vcard).toMatch(/URL:https:\/\/3mdrive\.fr\r\n/);
    expect(vcard).toMatch(/END:VCARD\r\n$/);
  });

  test('omet les champs optionnels absents sans lever d\'erreur', () => {
    const vcard = buildVcard({ firstName: 'Jean', lastName: 'Martin' });
    expect(vcard).toMatch(/FN:Jean Martin/);
    expect(vcard).not.toMatch(/ORG:/);
    expect(vcard).not.toMatch(/TEL/);
    expect(vcard).not.toMatch(/PHOTO/);
  });

  test('échappe les virgules, points-virgules et antislashs', () => {
    expect(escapeVcardText('Toulouse, Haute-Garonne')).toBe('Toulouse\\, Haute-Garonne');
    expect(escapeVcardText('A;B')).toBe('A\\;B');
    expect(escapeVcardText('C\\D')).toBe('C\\\\D');
  });

  test('ignore un photoUrl pointant vers un fichier inexistant (pas de crash)', () => {
    const vcard = buildVcard({ ...baseContact, photoUrl: '/uploads/contacts/inexistant.jpg' });
    expect(vcard).not.toMatch(/PHOTO/);
  });

  test('intègre la photo en base64 quand le fichier existe sur disque', () => {
    if (!fs.existsSync(CONTACT_UPLOADS_DIR)) fs.mkdirSync(CONTACT_UPLOADS_DIR, { recursive: true });
    const filename = 'test-fixture.png';
    const filePath = path.join(CONTACT_UPLOADS_DIR, filename);
    // 1x1 PNG minimal
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    fs.writeFileSync(filePath, pngBuffer);

    try {
      const vcard = buildVcard({ ...baseContact, photoUrl: `/uploads/contacts/${filename}` });
      expect(vcard).toMatch(/PHOTO;ENCODING=b;TYPE=PNG:/);
    } finally {
      fs.unlinkSync(filePath);
    }
  });
});

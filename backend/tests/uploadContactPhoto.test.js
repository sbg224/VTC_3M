const express = require('express');
const request = require('supertest');
const uploadContactPhoto = require('../src/middleware/uploadContactPhoto');

// Petite app isolée (sans auth/DB) pour tester uniquement la validation
// mime-type / taille du middleware d'upload.
function buildTestApp() {
  const app = express();
  app.post('/upload', (req, res) => {
    uploadContactPhoto(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.status(200).json({ ok: true, size: req.file?.size });
    });
  });
  return app;
}

describe('uploadContactPhoto middleware', () => {
  const app = buildTestApp();

  test('accepte une image jpeg valide', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('photo', Buffer.from('fake-jpeg-bytes'), { filename: 'photo.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('rejette un mime-type non autorisé (ex. application/pdf)', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('photo', Buffer.from('%PDF-1.4'), { filename: 'doc.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/non autorisé/);
  });

  test('rejette un fichier dépassant la limite de taille (2 Mo)', async () => {
    const oversized = Buffer.alloc(3 * 1024 * 1024, 'a'); // 3 Mo
    const res = await request(app)
      .post('/upload')
      .attach('photo', oversized, { filename: 'gros.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(400);
  });
});

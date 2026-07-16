const request = require('supertest');
const app = require('../src/index.js');
const { sequelize, Contact, ContactEvent } = require('../src/models');
const contactController = require('../src/controllers/contactController');

describe('Routes publiques /api/contacts', () => {
  let publicContact;
  let privateContact;

  beforeAll(async () => {
    await sequelize.sync();
    publicContact = await Contact.create({
      firstName: 'Marie', lastName: 'Dupont', company: '3M Drive',
      phone: '+33612345678', email: 'marie@example.com', isPublic: true,
    });
    privateContact = await Contact.create({
      firstName: 'Paul', lastName: 'Martin', isPublic: false,
    });
  });

  afterAll(async () => {
    await ContactEvent.destroy({ where: { contactId: [publicContact.id, privateContact.id] } });
    await Contact.destroy({ where: { id: [publicContact.id, privateContact.id] } });
    await sequelize.close();
  });

  test('GET /public/:slug retourne 404 pour un slug inexistant', async () => {
    const res = await request(app).get('/api/contacts/public/ce-slug-nexiste-pas');
    expect(res.status).toBe(404);
  });

  test('GET /public/:slug retourne 404 pour un contact isPublic=false', async () => {
    const res = await request(app).get(`/api/contacts/public/${privateContact.slug}`);
    expect(res.status).toBe(404);
  });

  test('GET /public/:slug retourne uniquement les champs whitelistés pour un contact public', async () => {
    const res = await request(app).get(`/api/contacts/public/${publicContact.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.contact).toMatchObject({
      firstName: 'Marie', lastName: 'Dupont', company: '3M Drive',
    });
    expect(res.body.contact.id).toBeUndefined();
    expect(res.body.contact.driverId).toBeUndefined();
    expect(res.body.contact.isPublic).toBeUndefined();
  });

  test('GET /public/:slug avec un slug invalide (caractères non autorisés) retourne 400', async () => {
    const res = await request(app).get('/api/contacts/public/slug%20avec%20espace');
    expect(res.status).toBe(400);
  });

  test('GET /vcard/:slug retourne un fichier .vcf pour un contact public', async () => {
    const res = await request(app).get(`/api/contacts/vcard/${publicContact.slug}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/vcard/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.text).toMatch(/BEGIN:VCARD/);
  });

  test('GET /vcard/:slug retourne 404 pour un contact privé', async () => {
    const res = await request(app).get(`/api/contacts/vcard/${privateContact.slug}`);
    expect(res.status).toBe(404);
  });

  test('POST /events/:slug rejette un type non whitelisté', async () => {
    const res = await request(app)
      .post(`/api/contacts/events/${publicContact.slug}`)
      .send({ type: 'visit' }); // visit n'est pas insérable via cet endpoint public
    expect(res.status).toBe(400);
  });

  test('POST /events/:slug enregistre un clic valide', async () => {
    const res = await request(app)
      .post(`/api/contacts/events/${publicContact.slug}`)
      .send({ type: 'click_phone' });
    expect(res.status).toBe(201);
  });

  test('routes admin protégées : 401 sans token', async () => {
    const res = await request(app).get('/api/contacts');
    expect(res.status).toBe(401);
  });

  // Régression : la suppression échouait avec SQLITE_CONSTRAINT (FK) dès
  // qu'un ContactEvent existait pour ce contact — deleteContact doit purger
  // les événements avant de détruire le contact.
  test('deleteContact supprime les ContactEvent associés avant le contact (pas de violation FK)', async () => {
    const toDelete = await Contact.create({ firstName: 'Temp', lastName: 'ToDelete', isPublic: true });
    await ContactEvent.create({ contactId: toDelete.id, type: 'visit' });
    await ContactEvent.create({ contactId: toDelete.id, type: 'click_phone' });

    const req = { params: { id: toDelete.id } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await contactController.deleteContact(req, res);

    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(await Contact.findByPk(toDelete.id)).toBeNull();
    expect(await ContactEvent.count({ where: { contactId: toDelete.id } })).toBe(0);
  });
});

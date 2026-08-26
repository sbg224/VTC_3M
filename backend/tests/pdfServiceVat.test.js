const { splitVat, TVA_RATE } = require('../src/services/pdfService');

/**
 * La ventilation HT/TVA d'une facture n'est vérifiable qu'ici : les suites qui
 * touchent aux réservations remplacent pdfService par un bouchon (jest.mock),
 * et ne contrôlent donc jamais les montants réellement imprimés.
 */
describe('pdfService — ventilation de la TVA', () => {
  test('applique le taux réduit de 10 % du transport de voyageurs', () => {
    expect(TVA_RATE).toBe(0.10);
  });

  describe('extrait la base HT du prix TTC convenu avec le client', () => {
    // Le prix annoncé au client est TTC : la taxe en est extraite, jamais
    // ajoutée par-dessus. Un TTC de 44 € doit rester facturé 44 €.
    const cas = [
      { ttc: 44.00, ht: 40.00, tva: 4.00 },   // division exacte
      { ttc: 10.00, ht: 9.09,  tva: 0.91 },   // 9,0909… arrondi à l'inférieur
      { ttc: 33.33, ht: 30.30, tva: 3.03 },
      { ttc: 99.99, ht: 90.90, tva: 9.09 },
      { ttc: 120.50, ht: 109.55, tva: 10.95 },
      { ttc: 12.34, ht: 11.22, tva: 1.12 },   // 11,2181… arrondi au supérieur
      { ttc: 7.77,  ht: 7.06,  tva: 0.71 },
      { ttc: 55.55, ht: 50.50, tva: 5.05 },
      { ttc: 1.05,  ht: 0.95,  tva: 0.10 },   // TVA sous le centime au départ
      { ttc: 0.10,  ht: 0.09,  tva: 0.01 },
      { ttc: 0.01,  ht: 0.01,  tva: 0.00 },   // TVA nulle après arrondi
    ];

    test.each(cas)('$ttc € TTC = $ht € HT + $tva € de TVA', ({ ttc, ht, tva }) => {
      expect(splitVat(ttc)).toEqual({ ht, tva, ttc });
    });
  });

  test('garantit HT + TVA === TTC au centime sur toute la plage tarifaire', () => {
    // Balaie 0,01 € à 500,00 € par pas d'un centime : aucun arrondi ne doit
    // jamais faire diverger le total du montant accepté par le client.
    const ecarts = [];
    for (let centimes = 1; centimes <= 50000; centimes += 1) {
      const attendu = centimes / 100;
      const { ht, tva, ttc } = splitVat(attendu);
      if (Math.round((ht + tva) * 100) !== centimes || ttc !== Math.round(attendu * 100) / 100) {
        ecarts.push(attendu);
      }
    }
    expect(ecarts).toEqual([]);
  });

  test('ne renvoie jamais de montant négatif ni de TVA supérieure au TTC', () => {
    for (const ttc of [0.01, 0.99, 1, 19.99, 250, 999.99]) {
      const { ht, tva } = splitVat(ttc);
      expect(ht).toBeGreaterThanOrEqual(0);
      expect(tva).toBeGreaterThanOrEqual(0);
      expect(tva).toBeLessThan(ttc);
    }
  });

  test('arrondit une valeur au-delà du centime avant de ventiler', () => {
    // Un prix stocké avec plus de deux décimales ne doit pas produire une
    // facture dont les lignes ne s'additionnent pas.
    const { ht, tva, ttc } = splitVat(44.004);
    expect(ttc).toBe(44.00);
    expect(Math.round((ht + tva) * 100) / 100).toBe(44.00);
  });

  test('accepte un prix fourni sous forme de chaîne', () => {
    // Sequelize renvoie les DECIMAL en chaîne selon le dialecte.
    expect(splitVat('44.00')).toEqual({ ht: 40, tva: 4, ttc: 44 });
  });
});

const {
  splitVat, vatRateFor, vatLegalMention, TVA_RATES,
} = require('../src/services/pdfService');

/**
 * La ventilation HT/TVA d'une facture n'est vérifiable qu'ici : les suites qui
 * touchent aux réservations remplacent pdfService par un bouchon (jest.mock),
 * et ne contrôlent donc jamais les montants réellement imprimés.
 */
describe('pdfService — ventilation de la TVA', () => {
  describe('taux applicable selon la nature de la prestation', () => {
    // Le taux dépend de la prestation, pas de l'activité de l'entreprise : un
    // transfert est un transport de voyageurs (10 %), une mise à disposition
    // est assimilée à une location de véhicule avec chauffeur (20 %).
    test('un transfert relève du taux réduit de 10 %', () => {
      expect(TVA_RATES.transfert).toBe(0.10);
      expect(vatRateFor('transfert')).toBe(0.10);
    });

    test('une mise à disposition relève du taux normal de 20 %', () => {
      expect(TVA_RATES.mise_a_disposition).toBe(0.20);
      expect(vatRateFor('mise_a_disposition')).toBe(0.20);
    });

    test('un mode absent ou inconnu retombe sur le transfert', () => {
      // Les réservations antérieures à serviceType avaient toutes une adresse
      // d'arrivée : la migration les a qualifiées de transferts.
      for (const value of [undefined, null, '', 'inconnu']) {
        expect(vatRateFor(value)).toBe(0.10);
      }
    });

    test('la mention légale portée sur la facture suit le mode', () => {
      expect(vatLegalMention('transfert')).toContain('279 b quater');
      expect(vatLegalMention('transfert')).toContain('10 %');
      expect(vatLegalMention('mise_a_disposition')).toContain('278 du CGI');
      expect(vatLegalMention('mise_a_disposition')).toContain('20 %');
      // La mention d'une mise à disposition ne doit jamais invoquer le
      // transport de voyageurs, base légale du seul taux réduit.
      expect(vatLegalMention('mise_a_disposition')).not.toContain('279 b quater');
    });
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
      expect(splitVat(ttc, 'transfert')).toEqual({ ht, tva, ttc, rate: 0.10 });
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
    expect(splitVat('44.00')).toEqual({ ht: 40, tva: 4, ttc: 44, rate: 0.10 });
  });

  describe('ventile une mise à disposition au taux normal de 20 %', () => {
    const cas = [
      { ttc: 60.00, ht: 50.00, tva: 10.00 },   // division exacte
      { ttc: 57.54, ht: 47.95, tva: 9.59 },    // 2 h à 28,772 €/h
      { ttc: 10.00, ht: 8.33,  tva: 1.67 },
      { ttc: 33.33, ht: 27.78, tva: 5.55 },
      { ttc: 99.99, ht: 83.33, tva: 16.66 },
      { ttc: 120.50, ht: 100.42, tva: 20.08 },
      { ttc: 12.34, ht: 10.28, tva: 2.06 },
      { ttc: 1.05,  ht: 0.88,  tva: 0.17 },
      { ttc: 0.01,  ht: 0.01,  tva: 0.00 },
    ];

    test.each(cas)('$ttc € TTC = $ht € HT + $tva € de TVA', ({ ttc, ht, tva }) => {
      expect(splitVat(ttc, 'mise_a_disposition')).toEqual({ ht, tva, ttc, rate: 0.20 });
    });

    test('produit bien une TVA supérieure à celle d\'un transfert de même montant', () => {
      const transfert = splitVat(120, 'transfert');
      const mad = splitVat(120, 'mise_a_disposition');
      expect(mad.tva).toBeGreaterThan(transfert.tva);
      // Le montant réclamé au client reste identique : c'est la répartition
      // entre base et taxe qui change, pas le total.
      expect(mad.ttc).toBe(transfert.ttc);
    });
  });

  test('garantit HT + TVA === TTC au centime aux deux taux', () => {
    // Balaie 0,01 € à 500,00 € par pas d'un centime, pour chaque mode : aucun
    // arrondi ne doit faire diverger le total du montant accepté par le client.
    const ecarts = [];
    for (const serviceType of ['transfert', 'mise_a_disposition']) {
      for (let centimes = 1; centimes <= 50000; centimes += 1) {
        const attendu = centimes / 100;
        const { ht, tva, ttc } = splitVat(attendu, serviceType);
        if (Math.round((ht + tva) * 100) !== centimes || ttc !== Math.round(attendu * 100) / 100) {
          ecarts.push(`${serviceType}:${attendu}`);
        }
      }
    }
    expect(ecarts).toEqual([]);
  });
});

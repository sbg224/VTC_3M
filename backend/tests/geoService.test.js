const { EventEmitter } = require('events');

jest.mock('https');
jest.mock('../src/middleware/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const https = require('https');
const { calculateRoute } = require('../src/services/geoService');

const GEOCODE_OK = { features: [{ geometry: { coordinates: [1.44, 43.6] } }] };
const OSRM_OK = { code: 'Ok', routes: [{ distance: 18400, duration: 1620 }] };

/** File des réponses simulées, consommée dans l'ordre des appels HTTP. */
let scripted;
let requests;

function install() {
  requests = [];
  https.get.mockImplementation((url, options, cb) => {
    const req = { on: jest.fn(), destroy: jest.fn() };
    requests.push({ url, req });
    const res = new EventEmitter();
    res.setEncoding = jest.fn();
    cb(res);
    const next = scripted.shift();
    if (next && !next.hang) {
      res.emit('data', JSON.stringify(next.body));
      res.emit('end');
    }
    return req;
  });
}

describe('geoService — robustesse du timeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    scripted = [];
    install();
  });
  afterEach(() => jest.useRealTimers());

  test('un service qui répond puis cesse d\'émettre ne bloque pas indéfiniment', async () => {
    // Cas que l'ancienne implémentation ne couvrait pas : le minuteur était
    // annulé dès l'arrivée des en-têtes, donc un corps jamais terminé laissait
    // la promesse pendante pour toujours.
    scripted = [{ hang: true }];
    const promise = calculateRoute('Gare Matabiau, Toulouse', 'Aéroport Blagnac');
    const assertion = expect(promise).rejects.toThrow(/Délai dépassé/);
    jest.advanceTimersByTime(8000);
    await assertion;
  });

  test('la requête est réellement avortée à l\'expiration du délai', async () => {
    scripted = [{ hang: true }];
    const promise = calculateRoute('A', 'B').catch(() => {});
    jest.advanceTimersByTime(8000);
    await promise;
    expect(requests[0].req.destroy).toHaveBeenCalled();
  });

  test('un échange complet dans les temps aboutit normalement', async () => {
    scripted = [{ body: GEOCODE_OK }, { body: GEOCODE_OK }, { body: OSRM_OK }];
    await expect(calculateRoute('A', 'B')).resolves.toEqual({ distance_km: 18.4, duration_min: 27 });
  });

  test('OSRM_BASE_URL redirige l\'appel sans changer le calcul', async () => {
    process.env.OSRM_BASE_URL = 'https://osrm.interne.example/';
    try {
      scripted = [{ body: GEOCODE_OK }, { body: GEOCODE_OK }, { body: OSRM_OK }];
      const result = await calculateRoute('A', 'B');
      expect(requests[2].url.startsWith('https://osrm.interne.example/route/v1/driving/')).toBe(true);
      expect(result).toEqual({ distance_km: 18.4, duration_min: 27 });
    } finally {
      delete process.env.OSRM_BASE_URL;
    }
  });

  test('sans OSRM_BASE_URL, le serveur public reste la cible par défaut', async () => {
    scripted = [{ body: GEOCODE_OK }, { body: GEOCODE_OK }, { body: OSRM_OK }];
    await calculateRoute('A', 'B');
    expect(requests[2].url.startsWith('https://router.project-osrm.org/route/v1/driving/')).toBe(true);
  });
});

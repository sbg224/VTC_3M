const jwt = require('jsonwebtoken');
const { normalizeFrenchPhone, isValidFrenchPhone } = require('../src/utils/phone');
const { JWT_ALGORITHM, signSessionToken, verifySessionToken, isStrongPassword } = require('../src/utils/security');
const { escapeLikePattern, likeContains } = require('../src/utils/search');

describe('utilitaires de sécurité et de validation', () => {
  test('normalise 0033 et valide les trois formats français pris en charge', () => {
    expect(normalizeFrenchPhone('0033 6 12 34 56 78')).toBe('+33612345678');
    expect(isValidFrenchPhone('0612345678')).toBe(true);
    expect(isValidFrenchPhone('+33612345678')).toBe(true);
    expect(isValidFrenchPhone('0033612345678')).toBe(true);
    expect(isValidFrenchPhone('003312345678')).toBe(false);
  });

  test('restreint les JWT de session à HS256', () => {
    const secret = 'test-secret';
    const token = signSessionToken({ id: 'driver-id' }, secret, '1h');
    expect(jwt.decode(token, { complete: true }).header.alg).toBe(JWT_ALGORITHM);
    expect(verifySessionToken(token, secret).id).toBe('driver-id');

    const hs384Token = jwt.sign({ id: 'driver-id' }, secret, { algorithm: 'HS384' });
    expect(() => verifySessionToken(hs384Token, secret)).toThrow(/invalid algorithm/i);
  });

  test('applique la même politique de mot de passe à l’inscription et au changement', () => {
    expect(isStrongPassword('Test1234')).toBe(true);
    expect(isStrongPassword('test1234')).toBe(false);
    expect(isStrongPassword('Testtest')).toBe(false);
    expect(isStrongPassword('T1short')).toBe(false);
  });

  test('échappe les jokers LIKE et le caractère d’échappement', () => {
    expect(escapeLikePattern('100%_\\ok')).toBe('100\\%\\_\\\\ok');
    expect(likeContains('email', '100%_\\ok').val).toContain("ESCAPE '\\'");
    expect(() => likeContains('email; DROP TABLE drivers', 'x')).toThrow('Colonne de recherche invalide.');
  });
});

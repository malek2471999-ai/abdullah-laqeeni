import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../src/common/crypto.service';

function makeCrypto(overrides: Record<string, string> = {}): CryptoService {
  const values: Record<string, string> = {
    TOKEN_PEPPER: 'test-pepper-with-more-than-32-characters-0123456789',
    LOCATION_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
    NODE_ENV: 'test',
    ...overrides,
  };
  const config = {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
  return new CryptoService(config);
}

describe('CryptoService', () => {
  it('round-trips text and produces a versioned ciphertext', () => {
    const crypto = makeCrypto();
    const encrypted = crypto.encryptText('هاتف مفقود — 42');
    expect(encrypted.startsWith('v1.')).toBe(true);
    expect(encrypted).not.toContain('هاتف');
    expect(crypto.decryptText(encrypted)).toBe('هاتف مفقود — 42');
  });

  it('uses a fresh IV for every encryption', () => {
    const crypto = makeCrypto();
    expect(crypto.encryptText('same')).not.toBe(crypto.encryptText('same'));
  });

  it('rejects tampered ciphertext (GCM authentication)', () => {
    const crypto = makeCrypto();
    const encrypted = crypto.encryptText('25.2048,55.2708');
    const parts = encrypted.split('.');
    const data = Buffer.from(parts[3], 'base64url');
    data[0] ^= 0xff;
    parts[3] = data.toString('base64url');
    expect(() => crypto.decryptText(parts.join('.'))).toThrow();
  });

  it('round-trips coordinates and rejects non-finite values', () => {
    const crypto = makeCrypto();
    const encrypted = crypto.encryptCoordinate(25.2048493);
    expect(crypto.decryptCoordinate(encrypted)).toBeCloseTo(25.2048493, 6);
    expect(() => crypto.encryptCoordinate(Number.NaN)).toThrow('Invalid coordinate');
  });

  it('hashes tokens deterministically and compares in constant time', () => {
    const crypto = makeCrypto();
    const token = 'device-id.secret';
    const hash = crypto.hashToken(token);
    expect(hash).toHaveLength(64);
    expect(crypto.hashToken(token)).toBe(hash);
    expect(crypto.safeEqualHashed(token, hash)).toBe(true);
    expect(crypto.safeEqualHashed('other', hash)).toBe(false);
    expect(crypto.safeEqualHashed(token, 'not-hex')).toBe(false);
  });

  it('changing the pepper invalidates previously hashed tokens', () => {
    const token = 'device-token';
    const first = makeCrypto().hashToken(token);
    const second = makeCrypto({ TOKEN_PEPPER: 'another-pepper-with-32-characters-abcdefgh' });
    expect(second.safeEqualHashed(token, first)).toBe(false);
  });

  it('creates eight-character pairing codes from an unambiguous alphabet', () => {
    const crypto = makeCrypto();
    const codes = new Set<string>();
    for (let index = 0; index < 100; index += 1) {
      const code = crypto.newPairingCode();
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
      codes.add(code);
    }
    expect(codes.size).toBeGreaterThan(90);
  });

  it('normalises user-entered pairing codes', () => {
    const crypto = makeCrypto();
    expect(crypto.normalizePairingCode(' abcd-efgh ')).toBe('ABCDEFGH');
    expect(crypto.normalizePairingCode('a b c d e f g h')).toBe('ABCDEFGH');
  });
});

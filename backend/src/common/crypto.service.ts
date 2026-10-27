import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'crypto';

const PAIRING_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Central cryptographic helpers.
 * - Location coordinates are encrypted with AES-256-GCM (authenticated encryption).
 * - Device tokens and pairing codes are stored only as keyed hashes (HMAC-SHA256).
 */
@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly key: Buffer;
  private readonly pepper: string;

  constructor(private readonly config: ConfigService) {
    this.pepper = this.config.get<string>('TOKEN_PEPPER') ?? 'dev-only-token-pepper-0123456789';
    this.key = this.resolveKey();
  }

  private resolveKey(): Buffer {
    const raw = this.config.get<string>('LOCATION_ENCRYPTION_KEY') ?? '';
    if (raw) {
      const decoded = Buffer.from(raw, 'base64');
      if (decoded.length === 32) return decoded;
      const hex = Buffer.from(raw, 'hex');
      if (hex.length === 32) return hex;
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new Error('LOCATION_ENCRYPTION_KEY must be a 32-byte base64 or hex value');
      }
      this.logger.warn('LOCATION_ENCRYPTION_KEY is not 32 bytes; deriving a development key');
    } else if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new Error('LOCATION_ENCRYPTION_KEY is required in production');
    } else {
      this.logger.warn('LOCATION_ENCRYPTION_KEY not set; using an insecure development key');
    }
    const seed = raw || this.config.get<string>('JWT_ACCESS_SECRET') || 'laqeeni-development';
    return createHash('sha256').update(`laqeeni-location:${seed}`).digest();
  }

  encryptText(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
  }

  decryptText(value: string): string {
    const [version, ivPart, tagPart, dataPart] = value.split('.');
    if (version !== 'v1' || !ivPart || !tagPart || !dataPart) {
      throw new Error('Unsupported encrypted payload');
    }
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  encryptCoordinate(value: number): string {
    if (!Number.isFinite(value)) throw new Error('Invalid coordinate');
    return this.encryptText(value.toFixed(7));
  }

  decryptCoordinate(value: string): number {
    return Number(this.decryptText(value));
  }

  hashToken(raw: string): string {
    return createHmac('sha256', this.pepper).update(raw).digest('hex');
  }

  safeEqualHashed(raw: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hashToken(raw), 'hex');
    let expected: Buffer;
    try {
      expected = Buffer.from(expectedHash, 'hex');
    } catch {
      return false;
    }
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  randomToken(bytes = 32): string {
    return randomBytes(bytes).toString('base64url');
  }

  randomUuid(): string {
    return randomUUID();
  }

  newPairingCode(): string {
    let code = '';
    for (let index = 0; index < 8; index += 1) {
      code += PAIRING_ALPHABET[randomInt(PAIRING_ALPHABET.length)];
    }
    return code;
  }

  normalizePairingCode(code: string): string {
    return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
}

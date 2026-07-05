import { createHash, randomBytes } from 'node:crypto';

/**
 * Fast one-way hash for high-entropy random tokens (refresh / verification /
 * reset). We store only the hash, so a database leak never exposes usable
 * tokens. Argon2 is reserved for user passwords (low-entropy secrets).
 */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Cryptographically-random, URL-safe token string. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

// ─── Token encryption (AES-256-GCM) ─────────────────────────────────────────────
// Broker OAuth tokens are stored encrypted at rest. The key comes from
// BROKER_TOKEN_ENCRYPTION_KEY (hashed to 32 bytes so any length works).

function getKey(): Buffer {
  const raw = process.env.BROKER_TOKEN_ENCRYPTION_KEY ?? '';
  if (!raw) throw new Error('BROKER_TOKEN_ENCRYPTION_KEY is not set');
  return createHash('sha256').update(raw).digest(); // always 32 bytes
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store as iv.tag.ciphertext (all base64)
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.');
}

export function decryptToken(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted token');
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

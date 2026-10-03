import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { env } from '../config/env.js';

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = 'up_tamha_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function normalizeUsername(value) {
  return String(value || '').trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [algorithm, salt, encoded] = String(stored || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !encoded) return false;
  const expected = Buffer.from(encoded, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSessionToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashSessionToken(token) };
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function parseCookies(header = '') {
  return Object.fromEntries(String(header).split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf('=');
    return separator < 0 ? [part, ''] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
  }));
}

export function sessionCookie(token, maxAge = SESSION_MAX_AGE_SECONDS) {
  const production = env.nodeEnv === 'production' || env.webOrigin.split(',').some((origin) => !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin.trim()));
  const sameSite = production ? 'None' : 'Lax';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAge}${production ? '; Secure' : ''}`;
}

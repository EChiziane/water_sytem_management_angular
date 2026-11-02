import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { assert } from '../shared/errors.mjs';

export function hashPassword(password) {
  assert(
    typeof password === 'string' && password.length >= 6 && password.length <= 128,
    'Credencial inválida.',
  );
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPassword(password, hash) {
  if (typeof password !== 'string' || password.length > 128 || typeof hash !== 'string')
    return false;
  const [kind, salt, key] = hash.split(':');
  if (kind !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(key || ''))
    return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(key, 'hex'));
}

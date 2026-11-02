import { createHmac, timingSafeEqual } from 'node:crypto';
import { assert } from '../shared/errors.mjs';

export function issueToken(user, secret, now = Date.now()) {
  assert(
    typeof secret === 'string' && secret.length >= 32,
    'A chave de sessão do servidor não está configurada.',
    503,
  );
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      sv: user.sessionVersion || 0,
      iss: 'wsm-vercel',
      aud: 'wsm',
      exp: Math.floor(now / 1000) + 8 * 3600,
    }),
  ).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function authenticate(token, users, secret, now = Date.now()) {
  assert(
    typeof secret === 'string' && secret.length >= 32,
    'A chave de sessão do servidor não está configurada.',
    503,
  );
  assert(typeof token === 'string' && token.length < 4096, 'Sessão inválida.', 401);
  const parts = token.split('.');
  assert(parts.length === 3, 'Sessão inválida.', 401);
  const signature = createHmac('sha256', secret).update(parts.slice(0, 2).join('.')).digest();
  let received;
  try {
    received = Buffer.from(parts[2], 'base64url');
  } catch {
    throw new AppError(401, 'Sessão inválida.');
  }
  assert(
    received.length === signature.length && timingSafeEqual(received, signature),
    'Sessão inválida.',
    401,
  );
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  } catch {
    throw new AppError(401, 'Sessão inválida.');
  }
  const user = users.find((user) => user.id === payload.sub);
  assert(
    payload.iss === 'wsm-vercel' &&
      payload.aud === 'wsm' &&
      Number.isFinite(payload.exp) &&
      payload.exp > Math.floor(now / 1000) &&
      user?.status === 'ACTIVE' &&
      (user.sessionVersion || 0) === payload.sv,
    'Sessão expirada ou conta desativada.',
    401,
  );
  return user;
}

export const safeUser = (user) =>
  Object.fromEntries(
    ['id', 'name', 'email', 'phone', 'login', 'role', 'status', 'createdAt'].map((key) => [
      key,
      user[key],
    ]),
  );

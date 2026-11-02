import { createHash } from 'node:crypto';
import { assert, authenticate } from '../domain.mjs';
export const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function actorFor(req, state, secret) {
  const header = req.headers?.authorization || '';
  assert(header.startsWith('Bearer '), 'Inicie sessão para continuar.', 401);
  return authenticate(header.slice(7), state.users, secret);
}
export function item(items, idValue) {
  const value = items.find((x) => x.id === idValue);
  assert(value, 'Registo não encontrado.', 404);
  return value;
}

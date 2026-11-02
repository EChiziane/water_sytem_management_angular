import { randomUUID } from 'node:crypto';
import { assert } from '../shared/errors.mjs';

export const id = () => randomUUID();

export function cents(value) {
  assert(
    typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= 0 &&
      Number.isSafeInteger(Math.round(value * 100)) &&
      Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
    'Montante inválido.',
  );
  return Math.round(value * 100);
}

export function audit(state, actor, action, target, now = new Date()) {
  state.audit.push({ id: id(), actorId: actor.id, action, target, at: now.toISOString() });
}

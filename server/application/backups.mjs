import { createHash } from 'node:crypto';
import { assert, requirePermission, anonymize, audit, AppError } from '../domain.mjs';
import { transact } from '../infrastructure/blob-store.mjs';
import { actorFor } from './request-context.mjs';
export async function handleBackup({ method, arg, body, state, store, actor, env, req, secret }) {
  requirePermission(actor, 'users.manage');
  if (method === 'POST' && arg === 'snapshot') return store.snapshot(state);
  if (method === 'POST' && arg === 'test-source') {
    assert(body.confirm === true, 'Confirme a substituição da base de testes.');
    const copy = anonymize(state);
    await store.saveTestSource(copy);
    return copy;
  }
  if (method === 'POST' && arg === 'spring') {
    assert(
      env.SPRING_BACKUP_URL && env.SPRING_BACKUP_TOKEN?.length >= 32,
      'Backup Spring não configurado.',
      503,
    );
    const target = new URL(env.SPRING_BACKUP_URL);
    assert(
      target.protocol === 'https:' ||
        (env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(target.hostname)),
      'URL de backup insegura.',
      503,
    );
    const snapshot = JSON.stringify(state);
    const checksum = createHash('sha256').update(snapshot).digest('hex');
    const response = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Backup-Token': env.SPRING_BACKUP_TOKEN },
      body: JSON.stringify({ snapshot, checksum, actorId: actor.id }),
      signal: AbortSignal.timeout(20000),
      redirect: 'error',
    });
    assert(
      response.ok,
      'O Spring não confirmou o backup. Os dados na Vercel continuam guardados.',
      502,
    );
    const saved = await response.json();
    assert(saved.checksum === checksum, 'O Spring não confirmou a integridade do backup.', 502);
    const backup = { at: new Date().toISOString(), revision: state.revision, checksum };
    await transact(store, (current) => {
      const user = actorFor(req, current, secret);
      requirePermission(user, 'users.manage');
      current.lastSpringBackup = backup;
      audit(current, user, 'backup.spring', checksum);
    });
    return backup;
  }
  throw new AppError(405, 'Operação não permitida.');
}

import { assert, hashPassword, id, audit } from '../domain.mjs';

/** Explicit, one-time provisioning/recovery for the owner; never reset on every startup. */
export function provisionInitialAdmin(state, body, env, now) {
  if (
    env.WSM_ENABLE_INITIAL_ADMIN !== 'true' ||
    state.initialAdminProvisionedAt ||
    body.login?.toLowerCase() !== 'admin' ||
    body.password !== '123456'
  )
    return;

  let admin = state.users.find((u) => u.login.toLowerCase() === 'admin');
  assert(
    !admin || (admin.role === 'ADMIN' && admin.status === 'ACTIVE'),
    'A conta admin existente não pode ser reativada ou promovida pelo primeiro acesso.',
    409,
  );
  if (!admin) {
    admin = {
      id: id(),
      name: 'Administrador',
      login: 'admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: now.toISOString(),
    };
    state.users.push(admin);
  }
  admin.passwordHash = hashPassword('123456');
  admin.sessionVersion = (admin.sessionVersion || 0) + 1;
  state.initialAdminProvisionedAt = now.toISOString();
  audit(state, admin, 'auth.initial-admin.provisioned', admin.id);
}

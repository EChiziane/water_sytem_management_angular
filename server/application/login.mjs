import { assert, verifyPassword, refreshDebt, issueToken, safeUser } from '../domain.mjs';
import { transact } from '../infrastructure/blob-store.mjs';
import { digest } from './request-context.mjs';
import { provisionInitialAdmin } from './initial-admin.mjs';
export async function login({ body, store, secret, now, env = {} }) {
  const { login, password } = body;
  assert(
    typeof login === 'string' &&
      login.length <= 120 &&
      typeof password === 'string' &&
      password.length <= 128,
    'Credenciais inválidas.',
    401,
  );
  const bucket = digest(login.toLowerCase());
  const response = await transact(store, (state) => {
    state.loginAttempts = (state.loginAttempts || []).filter((a) => a.until > Date.now());
    let attempts = state.loginAttempts.find((a) => a.key === bucket);
    assert(!attempts || attempts.count < 5, 'Muitas tentativas. Aguarde 15 minutos.', 429);
    provisionInitialAdmin(state, body, env, now);
    const user = state.users.find((u) => u.login.toLowerCase() === login.toLowerCase());
    const valid = user?.status === 'ACTIVE' && verifyPassword(password, user.passwordHash);
    if (!valid) {
      if (attempts) attempts.count++;
      else {
        assert(state.loginAttempts.length < 1000, 'Tente novamente mais tarde.', 429);
        state.loginAttempts.push({ key: bucket, count: 1, until: Date.now() + 900000 });
      }
      return null;
    }
    state.loginAttempts = state.loginAttempts.filter((a) => a.key !== bucket);
    refreshDebt(state, now);
    return { token: issueToken(user, secret), user: safeUser(user) };
  });
  assert(response, 'Credenciais inválidas.', 401);
  return response;
}

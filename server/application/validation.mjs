import { assert, hashPassword, PERMISSIONS, cents } from '../domain.mjs';
export function userInput(input, old = {}) {
  const user = { ...old };
  for (const k of ['name', 'email', 'phone', 'login', 'role', 'status'])
    if (input[k] !== undefined) user[k] = input[k];
  assert(
    typeof user.name === 'string' && user.name.trim().length > 0 && user.name.length <= 100,
    'Nome inválido.',
  );
  assert(
    typeof user.login === 'string' && /^[A-Za-z0-9_.@-]{1,60}$/.test(user.login),
    'Login inválido.',
  );
  assert(
    PERMISSIONS[user.role] && ['ACTIVE', 'INACTIVE', 'CREATED'].includes(user.status),
    'Perfil ou estado inválido.',
  );
  if (input.password) {
    assert(
      typeof input.password === 'string' && input.password.length >= 12,
      'Use uma credencial de pelo menos 12 caracteres em produção.',
    );
    user.passwordHash = hashPassword(input.password);
    user.sessionVersion = (old.sessionVersion || 0) + 1;
  }
  assert(user.passwordHash, 'Defina uma credencial.');
  return user;
}
export function customerInput(input, old = {}) {
  const c = { ...old };
  for (const k of ['name', 'contact', 'address', 'status', 'valve', 'monthlyFee'])
    if (input[k] !== undefined) c[k] = input[k];
  assert(
    typeof c.name === 'string' && c.name.trim().length > 0 && c.name.length <= 120,
    'Nome inválido.',
  );
  assert(
    typeof c.contact === 'string' &&
      c.contact.length <= 40 &&
      typeof c.address === 'string' &&
      c.address.length <= 240,
    'Contacto ou endereço inválido.',
  );
  assert(
    ['ATIVO', 'INATIVO', 'ACTIVE', 'CANCELLED', 'AWAITING_INSTALLATION'].includes(c.status),
    'Estado inválido.',
  );
  assert(Number.isInteger(c.valve) && c.valve >= 0 && c.valve <= 99999, 'Válvula inválida.');
  cents(c.monthlyFee);
  return c;
}

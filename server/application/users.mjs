import { assert, requirePermission, id, audit, safeUser, AppError } from '../domain.mjs';
import { item } from './request-context.mjs';
import { userInput } from './validation.mjs';
export function saveUser({ current, body, user, method, arg, now }) {
  let result;
  requirePermission(user, 'users.manage');
  if (method === 'POST' && arg === 'register') {
    const login =
      body.login ||
      (body.name || '')
        .trim()
        .split(/\s+/)[0]
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase() + 'AC';
    result = userInput({ ...body, login, status: body.status || 'ACTIVE' });
    assert(
      !current.users.some((u) => u.login.toLowerCase() === result.login.toLowerCase()),
      'Login já utilizado.',
      409,
    );
    result = { ...result, id: id(), createdAt: now.toISOString() };
    current.users.push(result);
  } else if (method === 'PUT' || method === 'DELETE') {
    const target = item(current.users, arg);
    const input = method === 'DELETE' ? { status: 'INACTIVE' } : body;
    result = userInput(input, target);
    assert(
      target.id !== user.id || (result.role === user.role && result.status === 'ACTIVE'),
      'Não pode desativar ou alterar o seu próprio perfil de acesso.',
      409,
    );
    assert(
      !current.users.some(
        (u) => u.id !== target.id && u.login.toLowerCase() === result.login.toLowerCase(),
      ),
      'Login já utilizado.',
      409,
    );
    assert(
      target.role !== 'ADMIN' ||
        target.status !== 'ACTIVE' ||
        (result.role === 'ADMIN' && result.status === 'ACTIVE') ||
        current.users.filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE').length > 1,
      'É necessário manter um administrador ativo.',
      409,
    );
    if (result.role !== target.role || result.status !== target.status)
      result.sessionVersion = (target.sessionVersion || 0) + 1;
    Object.assign(target, result);
  } else throw new AppError(405, 'Operação não permitida.');
  audit(current, user, 'user.saved', result.id);
  return safeUser(result);
}

import { assert, requirePermission, audit } from '../domain.mjs';
export function saveCompany({ current, body, user, now }) {
  requirePermission(user, 'company.manage');
  assert(
    (body.version ?? null) === (current.company.version ?? null),
    'A empresa foi alterada por outro utilizador. Recarregue.',
    409,
  );
  const limits = { name: 100, address: 240, contact: 30, email: 120, nuit: 9, tagline: 160 };
  const profile = {};
  for (const [key, max] of Object.entries(limits)) {
    assert(
      typeof body[key] === 'string' &&
        body[key].length <= max &&
        (key === 'tagline' || body[key].trim()),
      'Dados da empresa inválidos.',
    );
    profile[key] = body[key].trim();
  }
  assert(
    /^\d{9}$/.test(profile.nuit) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email),
    'NUIT ou email inválidos.',
  );
  current.company = {
    ...profile,
    version: (current.company.version ?? -1) + 1,
    updatedAt: now.toISOString(),
    updatedBy: user.id,
  };
  audit(current, user, 'company.saved', 'company');
  return current.company;
}

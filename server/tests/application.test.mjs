import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { dispatch } from '../application.mjs';
import {
  AppError,
  hashPassword,
  issueToken,
  authenticate,
  validateState,
  chargeFor,
  anonymize,
  createPayment,
} from '../domain.mjs';
import { migrateBackup } from '../application/import-backup.mjs';
import { transact, storageConfig } from '../infrastructure/blob-store.mjs';
const env = { WSM_SESSION_SECRET: 'a-very-long-test-only-session-secret-0123456789' };
const users = ['ADMIN', 'MANAGER', 'OPERATOR', 'TECHNICIAN'].map((role, i) => ({
  id: 'u' + i,
  name: role,
  login: role.toLowerCase() + 'AC',
  role,
  status: 'ACTIVE',
  passwordHash: hashPassword('test-password-12345'),
  createdAt: '2026-01-01T00:00:00Z',
}));
function fixture() {
  const c = {
    id: 'c1',
    code: 'WSM-001',
    name: 'Nome pessoal',
    contact: '841234567',
    address: 'Morada privada',
    status: 'ATIVO',
    valve: 1,
    monthlyFee: 500,
    unpaidMonths: ['2026-09', '2026-10'],
    monthsInDebt: 2,
    createdAt: '2026-01-01T00:00:00Z',
  };
  return {
    schemaVersion: 1,
    revision: 0,
    customers: [c],
    users: structuredClone(users),
    payments: [],
    receipts: [],
    charges: c.unpaidMonths.map((m) => chargeFor(c, m)),
    audit: [],
    requests: [],
    company: {
      name: 'Empresa',
      address: 'Rua',
      contact: '840000000',
      email: 'a@example.test',
      nuit: '123456789',
      tagline: 'Teste',
      version: null,
    },
  };
}
class MemoryStore {
  constructor(state = fixture()) {
    this.state = structuredClone(state);
    this.etag = 0;
    this.backups = [];
    this.failSnapshot = false;
    this.failWrite = false;
    this.loseResponse = false;
  }
  async read() {
    return { state: structuredClone(this.state), etag: String(this.etag) };
  }
  async initialize(state) {
    assert.equal(this.state, null);
    this.state = structuredClone(state);
  }
  async snapshot(state) {
    if (this.failSnapshot) throw new AppError(503, 'backup failed');
    this.backups.push(structuredClone(state));
    return { name: 'snapshot.txt' };
  }
  async write(state, etag) {
    if (this.failWrite) throw new AppError(503, 'write failed');
    if (etag !== String(this.etag)) throw new AppError(409, 'conflict');
    validateState(state);
    this.state = structuredClone(state);
    this.etag++;
    if (this.loseResponse) {
      this.loseResponse = false;
      throw new AppError(503, 'response lost');
    }
  }
  async saveTestSource(value) {
    this.testSource = structuredClone(value);
  }
  async readTestSource() {
    return this.testSource;
  }
  async listBackups() {
    return this.backups.map((_, i) => ({ name: String(i) }));
  }
}
const now = new Date('2026-10-30T10:00:00Z');
function req(path, method = 'GET', body = {}, role = 'ADMIN', key = randomUUID()) {
  return {
    url: '/api/' + path,
    method,
    body,
    headers: {
      authorization:
        'Bearer ' +
        issueToken(
          users.find((u) => u.role === role),
          env.WSM_SESSION_SECRET,
        ),
      'idempotency-key': key,
    },
  };
}
const pay = { customerId: 'c1', numMonths: 1, amount: 500, paymentMethod: 'CASH' };
test('server authenticates real credentials, returns no secrets, throttles invalid logins', async () => {
  const store = new MemoryStore();
  const response = await dispatch(
    {
      url: '/api/auth/login',
      method: 'POST',
      headers: {},
      body: { login: 'adminAC', password: 'test-password-12345' },
    },
    store,
    env,
    now,
  );
  assert.ok(response.token);
  assert.equal(response.user.passwordHash, undefined);
  assert.equal(authenticate(response.token, store.state.users, env.WSM_SESSION_SECRET).id, 'u0');
  const list = await dispatch(req('auth/users'), store, env, now);
  assert.ok(list.every((u) => !u.passwordHash && !u.password));
  for (let i = 0; i < 5; i++)
    await assert.rejects(
      dispatch(
        {
          url: '/api/auth/login',
          method: 'POST',
          headers: {},
          body: { login: 'adminAC', password: 'wrong' },
        },
        store,
        env,
        now,
      ),
      (e) => e.status === 401,
    );
  await assert.rejects(
    dispatch(
      {
        url: '/api/auth/login',
        method: 'POST',
        headers: {},
        body: { login: 'adminAC', password: 'wrong' },
      },
      store,
      env,
      now,
    ),
    (e) => e.status === 429,
  );
});
test('permissions are enforced on server, including direct URLs', async () => {
  const store = new MemoryStore();
  for (const path of ['customers', 'payments', 'receipts', 'company', 'backups', 'auth/users'])
    await assert.rejects(
      dispatch(req(path, 'GET', {}, 'TECHNICIAN'), store, env, now),
      (e) => e.status === 403,
    );
  for (const role of ['MANAGER', 'OPERATOR'])
    await assert.rejects(
      dispatch(req('company', 'PUT', {}, role), store, env, now),
      (e) => e.status === 403,
    );
  assert.equal(store.state.revision, 0);
});
test('payment settles oldest obligation, snapshots values and creates one receipt atomically', async () => {
  const store = new MemoryStore();
  const p = await dispatch(req('payments', 'POST', pay, 'OPERATOR'), store, env, now);
  assert.equal(p.referenceMonth, '2026-09');
  assert.equal(p.createdBy, 'u2');
  assert.equal(p.periodAmounts['2026-09'], 500);
  assert.equal(store.state.receipts.length, 1);
  assert.equal(store.state.charges.find((c) => c.referenceMonth === '2026-09').paymentId, p.id);
  assert.equal(store.backups[0].payments.length, 0);
  const receipt = await dispatch(req('receipts/' + store.state.receipts[0].id), store, env, now);
  assert.equal(receipt.payment.id, p.id);
});
test('bad totals, unknown methods, zero count and unsupported advances never commit', async () => {
  for (const body of [
    { ...pay, amount: 499 },
    { ...pay, amount: NaN },
    { ...pay, paymentMethod: 'OTHER' },
    { ...pay, numMonths: 0 },
    { ...pay, numMonths: 3, amount: 1500 },
  ]) {
    const store = new MemoryStore();
    await assert.rejects(
      dispatch(req('payments', 'POST', body), store, env, now),
      (e) => e.status === 422,
    );
    assert.equal(store.state.payments.length, 0);
    assert.equal(store.state.revision, 0);
  }
});
test('same idempotency key replays after response loss without a second payment', async () => {
  const store = new MemoryStore();
  store.loseResponse = true;
  const request = req('payments', 'POST', pay);
  await assert.rejects(dispatch(request, store, env, now), (e) => e.status === 503);
  const id = store.state.payments[0].id;
  const replay = await dispatch(request, store, env, now);
  assert.equal(replay.id, id);
  assert.equal(store.state.payments.length, 1);
  await assert.rejects(
    dispatch({ ...request, body: { ...pay, numMonths: 2, amount: 1000 } }, store, env, now),
    (e) => e.status === 409,
  );
});
test('concurrent writes re-read state; distinct payments cannot overwrite one another', async () => {
  const store = new MemoryStore();
  const [a, b] = await Promise.all([
    dispatch(req('payments', 'POST', pay), store, env, now),
    dispatch(req('payments', 'POST', pay), store, env, now),
  ]);
  assert.notEqual(a.referenceCode, b.referenceCode);
  assert.notEqual(a.referenceMonth, b.referenceMonth);
  assert.equal(store.state.payments.length, 2);
  assert.equal(store.state.receipts.length, 2);
  assert.equal(store.state.charges.filter((c) => c.paid).length, 2);
});
test('concurrent identical requests create one payment', async () => {
  const store = new MemoryStore(),
    request = req('payments', 'POST', pay);
  const [a, b] = await Promise.all([
    dispatch(request, store, env, now),
    dispatch(request, store, env, now),
  ]);
  assert.equal(a.id, b.id);
  assert.equal(store.state.payments.length, 1);
});
test('backup failure or write failure preserves the original state and rejects success', async () => {
  for (const field of ['failSnapshot', 'failWrite']) {
    const store = new MemoryStore(),
      original = structuredClone(store.state);
    store[field] = true;
    await assert.rejects(
      dispatch(req('payments', 'POST', pay), store, env, now),
      (e) => e.status === 503,
    );
    assert.deepEqual(store.state, original);
  }
});
test('annulment/deletion cannot silently remove financial history', async () => {
  const store = new MemoryStore();
  const p = await dispatch(req('payments', 'POST', pay), store, env, now);
  for (const path of ['payments/' + p.id, 'customers/c1', 'receipts/' + store.state.receipts[0].id])
    await assert.rejects(dispatch(req(path, 'DELETE'), store, env, now), (e) => e.status === 403);
  assert.equal(store.state.payments.length, 1);
});
test('company writes detect stale versions and users cannot self-demote', async () => {
  const store = new MemoryStore();
  const body = { ...store.state.company };
  await dispatch(req('company', 'PUT', body), store, env, now);
  await assert.rejects(
    dispatch(req('company', 'PUT', body), store, env, now),
    (e) => e.status === 409,
  );
  await assert.rejects(
    dispatch(req('auth/u0', 'PUT', { role: 'OPERATOR' }), store, env, now),
    (e) => e.status === 409,
  );
});
test('deactivation is preserved and immediately invalidates an old token', async () => {
  const store = new MemoryStore();
  await dispatch(req('auth/u2', 'DELETE'), store, env, now);
  await assert.rejects(
    dispatch(req('payments', 'GET', {}, 'OPERATOR'), store, env, now),
    (e) => e.status === 401,
  );
  assert.equal(store.state.users.length, 4);
});
test('anonymized test export changes neither production nor real financial/person identifiers', async () => {
  const store = new MemoryStore();
  await dispatch(req('payments', 'POST', pay), store, env, now);
  const before = structuredClone(store.state);
  const copy = await dispatch(
    req('backups/test-source', 'POST', { confirm: true }),
    store,
    env,
    now,
  );
  assert.deepEqual(store.state, before);
  const raw = JSON.stringify(copy);
  for (const value of ['Nome pessoal', '841234567', 'Morada privada', users[0].passwordHash])
    assert.ok(!raw.includes(value));
  assert.ok(copy.anonymized);
  assert.equal(copy.state.users[0].login, 'adminAC');
});
test('calendar crosses December without erasing paid history', async () => {
  const store = new MemoryStore();
  await dispatch(req('payments', 'POST', pay), store, env, now);
  await dispatch(req('billing/sync', 'POST'), store, env, new Date('2027-01-11T08:00:00Z'));
  assert.ok(store.state.charges.some((c) => c.referenceMonth === '2027-01'));
  assert.equal(store.state.payments.length, 1);
  assert.ok(store.state.charges.find((c) => c.referenceMonth === '2026-09').paid);
});
test('import preserves IDs and references, never overwrites existing users with demo accounts', () => {
  const source = fixture();
  delete source.charges;
  const input = { state: source, company: source.company };
  const result = migrateBackup(input);
  assert.equal(result.customers[0].id, 'c1');
  assert.equal(result.users.length, 4);
  assert.equal(result.users[0].id, 'u0');
  assert.equal(result.charges.length, 2);
  const weak = fixture();
  weak.users[0].password = '123456';
  delete weak.users[0].passwordHash;
  assert.throws(() => migrateBackup({ state: weak, company: weak.company }), /PIN fraco/);
  assert.ok(
    migrateBackup({ state: weak, company: weak.company }, { adminAC: 'strong-new-password-123' }),
  );
});
test('namespace misconfiguration cannot point a preview at production', () => {
  assert.throws(
    () =>
      storageConfig({
        BLOB_READ_WRITE_TOKEN: 'test',
        WSM_DATA_NAMESPACE: 'production',
        VERCEL_ENV: 'preview',
      }),
    /Preview/,
  );
  assert.throws(
    () =>
      storageConfig({
        BLOB_READ_WRITE_TOKEN: 'test',
        WSM_DATA_NAMESPACE: 'preview',
        VERCEL_ENV: 'production',
      }),
    /Produção/,
  );
});
test('routing supports Vercel rewrite paths and Spring is optional with explicit failure', async () => {
  const store = new MemoryStore();
  const response = await dispatch(
    { ...req('customers'), url: '/api/index?path=customers' },
    store,
    env,
    now,
  );
  assert.equal(response.length, 1);
  await assert.rejects(
    dispatch(req('backups/spring', 'POST'), store, env, now),
    (e) => e.status === 503,
  );
  assert.equal(store.state.payments.length, 0);
});

test('initial admin is opt-in, provisioned once and never restores a changed password', async () => {
  const store = new MemoryStore();
  const request = {
    url: '/api/auth/login',
    method: 'POST',
    headers: {},
    body: { login: 'admin', password: '123456' },
  };
  await assert.rejects(dispatch(request, store, env, now), (e) => e.status === 401);
  assert.equal(
    store.state.users.some((u) => u.login === 'admin'),
    false,
  );
  const enabled = { ...env, WSM_ENABLE_INITIAL_ADMIN: 'true' };
  const result = await dispatch(request, store, enabled, now);
  assert.equal(result.user.login, 'admin');
  assert.equal(result.user.role, 'ADMIN');
  assert.ok(result.token);
  assert.ok(store.state.initialAdminProvisionedAt);
  assert.equal(
    store.state.audit.filter((a) => a.action === 'auth.initial-admin.provisioned').length,
    1,
  );
  const admin = store.state.users.find((u) => u.login === 'admin');
  await dispatch(
    {
      url: '/api/auth/' + admin.id,
      method: 'PUT',
      headers: { authorization: 'Bearer ' + result.token },
      body: { password: 'owner-changed-password-123' },
    },
    store,
    enabled,
    now,
  );
  await assert.rejects(
    dispatch(
      { url: '/api/auth/me', method: 'GET', headers: { authorization: 'Bearer ' + result.token } },
      store,
      enabled,
      now,
    ),
    (e) => e.status === 401,
  );
  await assert.rejects(dispatch(request, store, enabled, now), (e) => e.status === 401);
  assert.equal(store.state.customers.length, 1);
  assert.equal(store.state.users.length, 5);
  const changed = await dispatch(
    { ...request, body: { login: 'admin', password: 'owner-changed-password-123' } },
    store,
    enabled,
    now,
  );
  assert.ok(changed.token);
});
test('explicit initial admin recovery preserves existing ID and cannot promote or reactivate accounts', async () => {
  const store = new MemoryStore();
  store.state.users[0].login = 'admin';
  const request = {
    url: '/api/auth/login',
    method: 'POST',
    headers: {},
    body: { login: 'admin', password: '123456' },
  };
  const enabled = { ...env, WSM_ENABLE_INITIAL_ADMIN: 'true' };
  const result = await dispatch(request, store, enabled, now);
  assert.equal(result.user.id, 'u0');
  assert.equal(store.state.users.length, 4);
  const restricted = new MemoryStore();
  restricted.state.users[1].login = 'admin';
  await assert.rejects(dispatch(request, restricted, enabled, now), (e) => e.status === 409);
  assert.equal(restricted.state.users[1].role, 'MANAGER');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { BlobPreconditionFailedError } from '@vercel/blob';
import { blobStore, transact } from '../infrastructure/blob-store.mjs';
import { hashPassword } from '../domain.mjs';
const state = () => ({
  schemaVersion: 1,
  revision: 0,
  customers: [],
  payments: [],
  charges: [],
  receipts: [],
  audit: [],
  requests: [],
  company: { name: 'Teste' },
  users: [
    {
      id: 'u1',
      login: 'adminAC',
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash: hashPassword('testing-password-123'),
    },
  ],
});
test('private Blob adapter reads fresh data, backs up first and writes only with the observed ETag', async () => {
  const value = state(),
    calls = [];
  const sdk = {
    get: async (path, options) => {
      calls.push({ op: 'get', path, options });
      return {
        statusCode: 200,
        stream: new Response(JSON.stringify(value)).body,
        blob: { etag: 'version-1' },
      };
    },
    put: async (path, body, options) => {
      calls.push({ op: 'put', path, body, options });
      return {};
    },
  };
  const store = blobStore({ prefix: 'water/preview', token: 'server-only-token' }, sdk);
  await transact(store, (next) => {
    next.company.name = 'Alterada';
  });
  assert.equal(calls[0].options.access, 'private');
  assert.equal(calls[0].options.useCache, false);
  assert.match(calls[1].path, /\/backups\//);
  assert.equal(calls[1].options.allowOverwrite, false);
  assert.equal(JSON.parse(calls[1].body).company.name, 'Teste');
  assert.equal(calls[2].path, 'water/preview/state.txt');
  assert.equal(calls[2].options.ifMatch, 'version-1');
  assert.equal(calls[2].options.access, 'private');
  assert.equal(JSON.parse(calls[2].body).revision, 1);
});
test('Blob initialization refuses overwriting and missing data does not create an empty store', async () => {
  const calls = [];
  const store = blobStore(
    { prefix: 'water/production', token: 'private' },
    { get: async () => null, put: async (...args) => calls.push(args) },
  );
  await assert.rejects(store.read(), (e) => e.status === 503);
  assert.equal(calls.length, 0);
  await store.initialize(state());
  assert.equal(calls[0][2].allowOverwrite, false);
  assert.equal(calls[0][2].access, 'private');
});
test('SDK precondition failure is surfaced as a conflict rather than an unconditional overwrite', async () => {
  const value = state();
  const store = blobStore(
    { prefix: 'water/production', token: 'private' },
    {
      put: async () => {
        throw new BlobPreconditionFailedError();
      },
    },
  );
  await assert.rejects(store.write(value, 'old-version'), (e) => e.status === 409);
  await assert.rejects(store.write(value, undefined), (e) => e.status === 503);
});

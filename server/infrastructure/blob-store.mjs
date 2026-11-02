import { get, put, list, BlobPreconditionFailedError } from '@vercel/blob';
import { createHash, randomUUID } from 'node:crypto';
import { AppError, assert, validateState } from '../domain.mjs';
export function storageConfig(env = process.env) {
  const namespace = env.WSM_DATA_NAMESPACE;
  assert(
    ['production', 'preview', 'development'].includes(namespace),
    'Configure WSM_DATA_NAMESPACE para um armazenamento separado.',
    503,
  );
  assert(
    env.VERCEL_ENV !== 'production' || namespace === 'production',
    'Produção não pode usar dados de teste.',
    503,
  );
  assert(
    env.VERCEL_ENV !== 'preview' || namespace === 'preview',
    'Preview não pode usar dados de produção.',
    503,
  );
  assert(!!env.BLOB_READ_WRITE_TOKEN, 'O armazenamento privado ainda não está configurado.', 503);
  return { prefix: `water/${namespace}`, token: env.BLOB_READ_WRITE_TOKEN };
}
export function blobStore(config, sdk = { get, put, list }) {
  const options = { access: 'private', token: config.token };
  const path = `${config.prefix}/state.txt`;
  async function readFile(pathname) {
    const item = await sdk.get(pathname, { ...options, useCache: false });
    assert(
      item && item.statusCode === 200,
      'Dados ainda não inicializados. Importe uma cópia validada antes de utilizar.',
      503,
    );
    const text = await new Response(item.stream).text();
    assert(Buffer.byteLength(text) < 3_500_000, 'Ficheiro excede o limite desta arquitetura.', 507);
    return { state: JSON.parse(text), etag: item.blob.etag };
  }
  return {
    async read() {
      const loaded = await readFile(path);
      validateState(loaded.state);
      return loaded;
    },
    async initialize(state) {
      validateState(state);
      assert(
        Buffer.byteLength(JSON.stringify(state)) < 3_500_000,
        'Ficheiro excede o limite desta arquitetura.',
        507,
      );
      await sdk.put(path, JSON.stringify(state), {
        ...options,
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: false,
      });
    },
    async snapshot(state) {
      const content = JSON.stringify(state);
      const checksum = createHash('sha256').update(content).digest('hex');
      const name = `${config.prefix}/backups/${state.revision}-${Date.now()}-${randomUUID()}.txt`;
      await sdk.put(name, content, {
        ...options,
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: false,
      });
      return { name: name.split('/').at(-1), checksum, revision: state.revision };
    },
    async write(state, etag) {
      assert(
        typeof etag === 'string' && etag.length > 0,
        'O armazenamento não forneceu a versão para uma gravação segura.',
        503,
      );
      validateState(state);
      assert(
        Buffer.byteLength(JSON.stringify(state)) < 3_500_000,
        'Ficheiro excede o limite desta arquitetura.',
        507,
      );
      try {
        await sdk.put(path, JSON.stringify(state), {
          ...options,
          contentType: 'application/json',
          addRandomSuffix: false,
          allowOverwrite: true,
          ifMatch: etag,
        });
      } catch (error) {
        if (error instanceof BlobPreconditionFailedError)
          throw new AppError(409, 'Os dados mudaram entretanto. Tente novamente.');
        throw error;
      }
    },
    async listBackups() {
      const result = await sdk.list({
        token: config.token,
        prefix: `${config.prefix}/backups/`,
        limit: 1000,
      });
      return result.blobs
        .map((b) => ({ name: b.pathname.split('/').at(-1), size: b.size, createdAt: b.uploadedAt }))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    },
    async readBackup(name) {
      assert(/^[0-9]+-[0-9]+-[a-f0-9-]+\.txt$/.test(name), 'Nome de backup inválido.');
      return (await readFile(`${config.prefix}/backups/${name}`)).state;
    },
    async saveTestSource(source) {
      await sdk.put(`${config.prefix}/testing/source.txt`, JSON.stringify(source), {
        ...options,
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },
    async readTestSource() {
      return (await readFile(`${config.prefix}/testing/source.txt`)).state;
    },
  };
}
export async function transact(store, operation, { attempts = 5 } = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const { state, etag } = await store.read();
    const next = structuredClone(state);
    const result = await operation(next);
    next.revision = state.revision + 1;
    next.updatedAt = new Date().toISOString();
    validateState(next);
    // The previous committed version must be recoverable BEFORE overwriting the current version.
    await store.snapshot(state);
    try {
      await store.write(next, etag);
      return result;
    } catch (error) {
      if (error.status !== 409 || attempt === attempts - 1) throw error;
    }
  }
  throw new AppError(409, 'Não foi possível confirmar a gravação.');
}

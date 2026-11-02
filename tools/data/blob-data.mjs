import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { blobStore, storageConfig } from '../../server/infrastructure/blob-store.mjs';
import { migrateBackup } from '../../server/application/import-backup.mjs';
import { summaries } from '../../server/domain.mjs';
const [command, source] = process.argv.slice(2);
try {
  if (!['validate', 'initialize'].includes(command) || !source)
    throw new Error(
      'Uso: node --env-file=.env.local tools/blob-data.mjs validate|initialize CAMINHO_DA_COPIA',
    );
  const raw = await readFile(resolve(source), 'utf8');
  const passwords = JSON.parse(process.env.WSM_INITIAL_PASSWORDS_JSON || '{}');
  const state = migrateBackup(JSON.parse(raw), passwords);
  console.log('Cópia validada:', summaries(state));
  if (command === 'initialize') {
    if (!process.env.WSM_SESSION_SECRET || process.env.WSM_SESSION_SECRET.length < 32)
      throw new Error('Configure WSM_SESSION_SECRET.');
    // Retain exact source bytes locally BEFORE any cloud write. Never overwrite existing initialization.
    await mkdir('private-data', { recursive: true });
    await writeFile(resolve('private-data', `before-initialize-${Date.now()}.txt`), raw, {
      flag: 'wx',
    });
    const store = blobStore(storageConfig());
    await store.snapshot(state);
    await store.initialize(state);
    console.log('Dados inicializados sem substituir um ficheiro existente.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

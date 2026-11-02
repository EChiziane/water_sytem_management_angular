import { dispatch } from '../application.mjs';
import { blobStore, storageConfig } from '../infrastructure/blob-store.mjs';
export async function handle(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (req.headers.origin) {
      const own = `https://${req.headers.host}`;
      if (
        req.headers.origin !== own &&
        !(
          process.env.NODE_ENV !== 'production' &&
          req.headers.origin === `http://${req.headers.host}`
        )
      ) {
        res.status(403).json({ message: 'Origem não autorizada.' });
        return;
      }
    }
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        res.status(400).json({ message: 'JSON inválido.' });
        return;
      }
    }
    const result = await dispatch(req, blobStore(storageConfig()));
    res.status(200);
    if (typeof result === 'string') res.send(result);
    else res.json(result);
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 503;
    res.status(status).json({
      message:
        status === 503 && !error.status
          ? 'Não foi possível confirmar o armazenamento. Nenhuma gravação foi confirmada.'
          : error.message && error.status
            ? error.message
            : 'Não foi possível concluir a operação.',
    });
  }
}

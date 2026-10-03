import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, dataMode } from './config/env.js';
import profileRoutes from './routes/profileRoutes.js';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = env.webOrigin.split(',').map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'origin_not_allowed', message: 'ต้นทางของคำขอไม่ได้รับอนุญาต' });
  return next();
});
app.use(express.json({ limit: '256kb' }));

app.get('/', (_req, res) => res.json({ ok: true, service: 'up-tamha-api', dataMode }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'up-tamha-api', dataMode }));
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;


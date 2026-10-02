import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, dataMode } from './config/env.js';
import profileRoutes from './routes/profileRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.webOrigin.split(',').map((origin) => origin.trim()), credentials: false }));
app.use(express.json({ limit: '256kb' }));

app.get('/', (_req, res) => res.json({ ok: true, service: 'up-tamha-api', dataMode }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'up-tamha-api', dataMode }));
app.use('/api/profiles', profileRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;


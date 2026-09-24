/**
 * ExamGuard AI - Master Server Entrypoint
 * Institutional Examination Platform & Behavioral Intelligence
 * Detect Behavior, Not the Person
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initMongo } from './server/db/mongo';
import authRoutes from './server/routes/auth';
import examRoutes from './server/routes/exams';
import sessionRoutes from './server/routes/sessions';
import behaviorRoutes from './server/routes/behavior';
import codingRoutes from './server/routes/coding';
import analyticsRoutes from './server/routes/analytics';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount Modular API Routers
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/behavior', behaviorRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api', analyticsRoutes);

// Server startup with MongoDB initialization
async function startServer() {
  console.log('[ExamGuard AI] Initializing persistent data store...');
  await initMongo();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ExamGuard AI] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ExamGuard AI] Fatal server error during bootstrap:', err);
});

export default app;

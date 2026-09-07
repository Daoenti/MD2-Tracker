import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db/pool.js';
import { authRouter } from './routes/auth.routes.js';
import { encountersRouter } from './routes/encounters.routes.js';
import { unitsRouter } from './routes/units.routes.js';
import { minionsRouter } from './routes/minions.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { enemyTemplatesRouter } from './routes/enemyTemplates.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PGStore = connectPgSimple(session);

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json());

  app.use(
    session({
      store: new PGStore({ pool, tableName: 'session', createTableIfMissing: true }),
      name: 'md2.sid',
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.COOKIE_SECURE === 'true',
      },
    }),
  );

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/encounters', encountersRouter);
  app.use('/api/units', unitsRouter);
  app.use('/api/minions', minionsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/enemy-templates', enemyTemplatesRouter);

  // Combined production image: Express also serves the built Vue SPA.
  const staticDir = path.join(__dirname, '../public');
  if (fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}

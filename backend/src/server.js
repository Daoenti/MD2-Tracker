import 'dotenv/config';
import { createApp } from './app.js';
import { runMigrations } from './db/migrate.js';

const PORT = process.env.PORT || 3000;

async function main() {
  await runMigrations();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`MD2 Tracker backend listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});

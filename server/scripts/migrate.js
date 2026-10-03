import { readFile, readdir } from 'node:fs/promises';
import { getSqlPool } from '../src/db/pool.js';

const migrationsDirectory = new URL('../../db/migrations/', import.meta.url);
let pool;

try {
  const files = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (!files.length) {
    console.log('No SQL migrations found.');
    process.exitCode = 0;
  } else {
    pool = await getSqlPool();
    for (const file of files) {
      const sqlText = await readFile(new URL(file, migrationsDirectory), 'utf8');
      await pool.request().batch(sqlText);
      console.log(`Applied ${file}`);
    }
    console.log('Database migrations completed.');
  }
} catch (error) {
  console.error('Database migration failed:', error.message);
  process.exitCode = 1;
} finally {
  if (pool) await pool.close();
}

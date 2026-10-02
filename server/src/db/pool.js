import sql from 'mssql';
import { env } from '../config/env.js';

let poolPromise;

export function getSqlPool() {
  if (!env.sqlConnectionString) {
    throw new Error('AZURE_SQL_CONNECTION_STRING is not configured');
  }
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(env.sqlConnectionString)
      .connect()
      .then((pool) => {
        pool.on('close', () => { poolPromise = undefined; });
        return pool;
      })
      .catch((error) => {
        poolPromise = undefined;
        throw error;
      });
  }
  return poolPromise;
}

export { sql };


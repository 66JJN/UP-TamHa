import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 8080),
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:5173',
  sqlConnectionString: process.env.AZURE_SQL_CONNECTION_STRING || '',
  storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
  storageContainer: process.env.AZURE_STORAGE_CONTAINER || 'up-tamha-items',
};

export const dataMode = env.sqlConnectionString ? 'azure-sql' : 'memory';


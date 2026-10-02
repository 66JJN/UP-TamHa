import app from './app.js';
import { env, dataMode } from './config/env.js';

app.listen(env.port, () => {
  console.log(`UP TamHa API listening on :${env.port} (${dataMode})`);
});


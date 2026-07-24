import app from './app.js';
import { connectMongo } from './config/mongo.js';
import { validateConfig, config } from './config/index.js';

validateConfig();

connectMongo();

app.listen(config.port, () => {
  console.log(`🚀 Server listening on port ${config.port}`);
});

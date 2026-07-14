const app = require('./src/app');
const { env, validateEnv } = require('./src/config/env');
const { checkConnection } = require('./src/config/db');

async function startServer() {
  try {
    validateEnv();

    // Verify the database is reachable before accepting traffic.
    await checkConnection();
     
    console.log('✅ PostgreSQL connected successfully');

    const server = app.listen(env.PORT, () => {
       
      console.log(`🚀 CloudVault API running on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    const shutdown = (signal) => {
       
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
         
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
     
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();

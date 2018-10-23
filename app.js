const config = require('./config/default');

const HApi = require('hapi');
const logger = require('./lib/common/logger');
const redisManagerPlugin = require('./lib');

// Create a server with a host and port
const server = HApi.server({port: config.PORT});

// Start the server
async function start() {
  try {
    await server.register(redisManagerPlugin);
    await server.start();
  }
  catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

start().then(() => {
  logger.info('Server running at: ' + server.info.uri);
});

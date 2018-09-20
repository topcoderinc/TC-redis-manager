const config = require('config');
const _ = require('lodash');

const HApi = require('hapi');
const routes = require('./lib/route');
const logger = require('./lib/common/logger');

// Create a server with a host and port
const server = HApi.server({
  port: config.PORT,
});


/**
 * inject cors headers
 */
const injectHeader = (h) => {
  h.header("Access-Control-Allow-Origin", "*");
  h.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  h.header("Access-Control-Allow-Headers", "If-Modified-Since, Origin, X-Requested-With, Content-Type, Accept, Authorization");
  return h;
};

/**
 * inject routes
 */
_.each(routes, (route, path) => {
  const newPath = '/backend/' + config.API_VERSION + path;
  server.route({method: 'options', path: newPath, handler: (req, h) => injectHeader(h.response('ok'))});
  _.each(route, (handler, method) => {

    logger.info(`endpoint added, [${method.toUpperCase()}] ${newPath}`);
    server.route({
      method,
      path: newPath,
      handler: async (req, h) => {
        let result = {};
        let status = 200;
        try {
          result = await handler.method(req, h);
        } catch (e) {
          result = {code: e.status, message: e.message}
          status = e.status || 500;
        }
        return injectHeader(h.response(result).code(status));
      }
    });
  });
});


// Start the server
async function start() {
  try {
    await server.register(require('inert'));

    // add static folder
    server.route({
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: 'dist',
        }
      }
    });
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

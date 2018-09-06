/**
 * Copyright (C) 2017 TopCoder Inc., All Rights Reserved.
 */
/**
 * The application entry point
 *
 * @author      TCSCODER
 * @version     1.0
 */




const express = require('express');
const cross = require('cors');
const bodyParser = require('body-parser');
const _ = require('lodash');
const config = require('config');
const http = require('http');
const path = require('path');
const logger = require('./lib/common/logger');
const errorMiddleware = require('./lib/common/error.middleware');
const routes = require('./lib/route');

const app = express();
const httpServer = http.Server(app);


app.set('port', config.PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cross());
const apiRouter = express.Router({});

// load all routes
_.each(routes, (verbs, url) => {
  _.each(verbs, (def, verb) => {
    let actions = [];

    const {method} = def;
    if (!method) {
      throw new Error(`${verb.toUpperCase()} ${url} method is undefined`);
    }
    if (def.middleware && def.middleware.length > 0) {
      actions = actions.concat(def.middleware);
    }

    actions.push(async (req, res, next) => {
      try {
        await method(req, res, next);
      } catch (e) {
        next(e);
      }
    });

    const middlewares = [];
    for (let i = 0; i < actions.length - 1; i += 1) {
      if (actions[i].name.length !== 0) {
        middlewares.push(actions[i].name);
      }
    }

    logger.info(`Endpoint discovered : [${middlewares.join(',')}] ${verb.toLocaleUpperCase()} /${config.API_VERSION}${url}`);
    apiRouter[verb](`/${config.API_VERSION}${url}`, actions);
  });
});
app.use('/backend/', apiRouter);
app.use(errorMiddleware());

// Serve static assets
app.use(express.static(path.resolve(__dirname, 'dist')));
// Always return the main index.html
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});


(async () => {
  if (!module.parent) { // this code will never run in unit test mode
    httpServer.listen(app.get('port'), () => {
      logger.info(`Express server listening on port ${app.get('port')}`);
    });
  } else {
    module.exports = app;
  }
})();

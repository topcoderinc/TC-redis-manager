/**
 * Copyright (C) 2018 TopCoder Inc., All Rights Reserved.
 */

/**
 * the redis routes
 *
 * @author      TCSCODER
 * @version     1.0
 */


const redis = require('./redis');
const git = require('./common/git');
const externalConfig = require('./common/external-config');

const logger = require('./common/logger');

logger.buildService("RedisService", redis);

module.exports = {
  '/redis/connect': {
    post: {
      method: async req => await redis.connect(req.payload),
    },
  },
  '/redis/fetch': {
    get: {
      method: async req => await redis.fetchTree(req.query),
    }
  },
  '/redis/export': {
    get: {
      method: async req => await redis.dump(req.query),
    }
  },
  '/redis/call': {
    post: {
      method: async req => await redis.call(req.query, req.payload),
    }
  },
  '/healthCheck': {
    get: {
      method: async () => await git.getLastCommitFromFile(),
    }
  },
  '/refreshConfig': {
    post: {
      method: async req => await externalConfig.refreshConfig(req.payload.externalFile),
    }
  },
};

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

module.exports = {
  '/redis/connect': {
    post: {
      method: async (req, res) => res.json(await redis.connect(req.body)),
    },
  },
  '/redis/fetch': {
    get: {
      method: async (req, res) => res.json(await redis.fetchTree(req.query)),
    }
  },
  '/redis/call': {
    post: {
      method: async (req, res) => res.json(await redis.call(req.query, req.body)),
    }
  }
};

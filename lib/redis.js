const Redis = require('ioredis');
const errors = require('./common/errors');
const _ = require('lodash');
const redisDump = require('./tools/redis-dump');

/**
 * cached redis instance
 */
const redisInstanceCache = {};
const CONNECTED = 'connected';
const DISCONNECTED = 'disconnected';

/**
 * connect redis and save the connection instance
 * @param body
 * @return {Promise<any>}
 */
async function connect(body) {
  // already exist
  if (redisInstanceCache[body.id]) {
    return Promise.resolve(body);
  }

  return new Promise((resolve, reject) => {
    const redis = new Redis({
      host: body.serverModel.ip, port: body.serverModel.port, db: body.serverModel.db,
      password: body.serverModel.password,
      showFriendlyErrorStack: true,
    });
    const timeoutHandler = setTimeout(() => {
      redis.disconnect();
      reject(errors.newConnectTimeoutError);
    }, 3 * 1000);

    redis.on('error', (e) => {
      console.error(e);
      body.status = DISCONNECTED;
      redisInstanceCache[body.id] = null;

    });

    redis.on('ready', () => {
      redisInstanceCache[body.id] = redis;
      body.status = CONNECTED;
      resolve(body);
      clearTimeout(timeoutHandler);
    });
  });
}

/**
 * Get redis connection
 * 
 * @param query the query params
 */
function getRedis(query) {
  const redis = redisInstanceCache[query.id];
  if (!redis && redis.status !== CONNECTED) {
    throw errors.newConnectFailedError;
  }
  return redis;
}

/**
 * fetch the redis tree
 * @param query the query params
 */
async function fetchTree(query) {
  const redis = getRedis(query);

  const root = {};
  const lencommands = {
    list: 'llen',
    set: 'scard',
    zset: 'zcard',
    hash: 'hlen',
  };

  let keys;
  try {
    keys = query.keys || (await redis.keys('*'));
    
    for (let i = 0; i < keys.length; i++) { // process types
      const key = keys[i];
      const type = await redis.type(key);
      root[key] = {type};
      if (type !== 'string') {
        root[key].len = await redis[lencommands[type]](key);
      } else {
        root[key].value = await redis.get(key);
      }
    }
  } catch (e) {
    throw errors.newReplyError(e.message);
  }

  const tree = {};

  const buildTree = (node, parts) => {

    const key = parts[0] + (parts.length === 1 ? '' : ':');
    node.children[key] = node.children[key] || {
      key: node.key + key,
      name: key + (parts.length === 1 ? '' : '*'),
      children: {},
    };
    if (parts.length > 1) {
      buildTree(node.children[key], parts.slice(1));
    }
  };

  const parseTreeToArray = (node, depth) => {

    if (_.keys(node.children).length <= 0) {
      return {key: node.key, ...root[node.key], name: node.name, depth}
    }
    const result = {
      type: 'folder',
      key: node.key,
      name: node.name,
      depth,
      children: []
    };

    _.each(node.children, (n) => {
      result.children.push(parseTreeToArray(n));
    });
    return result;
  };

  const newRoot = [];
  keys.sort();
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    const parts = keys[i].split(':');
    if (parts.length <= 1) {
      newRoot.push({key, ...root[key], depth: 1, name: key})
    } else {
      if (!tree[parts[0]]) {
        tree[parts[0]] = {key: parts[0] + ':', children: {}, name: parts[0] + ':*'};
        newRoot.push(tree[parts[0]]);
      }
      buildTree(tree[parts[0]], parts.slice(1))
    }
  }


  for (let i = 0; i < newRoot.length; i++) {
    const v = newRoot[i];
    if (v.children) {
      newRoot[i] = parseTreeToArray(v, 1);
    }
  }

  return newRoot;
}

/**
 * run redis query and return the raw result
 * @param query the query list
 * @param body the returned body
 */
async function call(query, body) {
  const lines = body.lines;
  if (!lines || lines.length <= 0) {
    return [];
  }
  const redis = getRedis(query);

  const results = [];
  for (let i = 0; i < lines.length; i++) {
    try {
      results.push(await redis.call(...lines[i]));
    } catch (e) {
      throw errors.newReplyError(e.message, i + 1);
    }
  }
  return results;
}

/**
 * dump redis instance
 * @param query the query
 * @return {Promise<*>}
 */
async function dump(query) {
  const redis = getRedis(query);

  try {
    return await redisDump(query.exportType, redis);
  } catch (e) {
    throw errors.newReplyError(e.message);
  }
}

module.exports = {
  connect, fetchTree, call, dump
};

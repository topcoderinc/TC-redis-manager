const Redis = require('ioredis');
const errors = require('./common/errors');
const _ = require('lodash');
const redisDump = require('./tools/redis-dump');
const {
  IDLE_TIMEOUT_IN_MINS,
  IDLE_CONNECTION_POLL_INTERVAL,
  MAX_RETRIES
 } = require('config');

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
  let redisInstance = redisInstanceCache[body.id];
  if (redisInstance) {
    redisInstance.retries = 0;
    redisInstance.lastAccessed = Date.now();
  }

  const newProps = getRedisInstanceProperties(body);
  // already exist
  if (redisInstance && _.isEqual(redisInstance.props, newProps)) {
    if (redisInstance.status === DISCONNECTED) {
      throw errors.newConnectFailedError(body.id);
    }
    return Promise.resolve(body);
  }

  // properties changed
  if (redisInstance) {
    redisInstanceCache[body.id] = null;
    redisInstance.connection.disconnect();
  } else {
    redisInstance = {
      props: getRedisInstanceProperties(body),
      retries: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const redis = new Redis({
      host: body.serverModel.ip, 
      port: body.serverModel.port, 
      db: body.serverModel.db,
      password: body.serverModel.password,
      showFriendlyErrorStack: true,
      autoResendUnfulfilledCommands: false,
      maxRetriesPerRequest: MAX_RETRIES,
    });

    const timeoutHandler = setTimeout(() => {
      redis.disconnect();
      reject(errors.newConnectTimeoutError(body.id));
    }, 3 * 1000);

    redis.on('error', (e) => {
      console.error(e);
      redisInstance.status = DISCONNECTED;
    });

    redis.on('end', () => {
      console.log('end');
      redisInstanceCache[body.id] = null;
    });

    redis.on('reconnecting', () => {
      console.log('reconnecting');
      redisInstance.retries++;
      if(redisInstance.retries >= MAX_RETRIES) {
        redisInstanceCache[body.id] = null;
        redis.disconnect();
      }
    })

    redis.on('ready', () => {
      console.log('ready');
      redisInstance.connection = redis;
      redisInstance.status = CONNECTED;
      redisInstance.lastAccessed = Date.now();
      redisInstance.retries = 0;

      redisInstanceCache[body.id] = redisInstance;

      resolve(body);
      clearTimeout(timeoutHandler);
    });
  });
}


/**
 * disconnect redis
 * @param body
 * @return {Promise<any>}
 */
async function disconnect(body) {
  const redisInstance = redisInstanceCache[body.id];

  if (redisInstance) {
    redisInstanceCache[body.id] = null;
    redisInstance.connection.disconnect();
  }
}

/**
 * Get the properties of redis instance
 * @param body
 * @return {Object} - the properties used to identify modifications in instance config
 */
function getRedisInstanceProperties(body) {
  return _.pick(
    body,
    'serverModel.ip',
    'serverModel.port',
    'serverModel.db',
    'serverModel.password'
  );
}

/**
 * Poll for idle instances. If found, disconnect and remove them from cache
 */
function pollIdleConnections() {
  const idleTimeoutInMS = IDLE_TIMEOUT_IN_MINS * 60 * 1000;
  setInterval(() => {
    const idleThreshold = Date.now() - idleTimeoutInMS;
    for (let id in redisInstanceCache) {
      const redisInstance = redisInstanceCache[id];
      if (redisInstance && redisInstance.lastAccessed < idleThreshold) {
        redisInstanceCache[id] = null;
        redisInstance.connection.disconnect();
      }
    }
  }, IDLE_CONNECTION_POLL_INTERVAL * 60 * 1000);
}

/**
 * Get redis connection
 *
 * @param query the query params
 */
function getRedisConnection(query) {
  const redisInstance = redisInstanceCache[query.id];
  if (!redisInstance || redisInstance.status !== CONNECTED) {
    throw errors.newConnectFailedError(query.id);
  }

  redisInstance.lastAccessed = Date.now();
  return redisInstance.connection;
}

/**
 * fetch the redis tree
 * @param query the query params
 */
async function fetchTree(query) {
  const redis = getRedisConnection(query);

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
    throw errors.newReplyError(query.id, e.message);
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
  const redis = getRedisConnection(query);

  const results = [];
  for (let i = 0; i < lines.length; i++) {
    try {
      results.push(await redis.call(...lines[i]));
    } catch (e) {
      throw errors.newReplyError(query.id, e.message, i + 1);
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
  const redis = getRedisConnection(query);

  try {
    return await redisDump(query.exportType, redis);
  } catch (e) {
    throw errors.newReplyError(query.id, e.message);
  }
}

// trigger the poller on start
pollIdleConnections();

module.exports = {
  connect, fetchTree, call, dump, disconnect
};

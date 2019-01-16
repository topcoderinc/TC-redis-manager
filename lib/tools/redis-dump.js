const _ = require('lodash');

/**
 * dump redis
 * @param format the format
 * @param redis the redis instance
 */
async function redisExport(format, redis) {
  const keys = await redis.keys('*');
  const isRaw = format === 'redis';
  const root = format === 'redis' ? [] : {};

  const processValue = (v) => {
    if (v.indexOf(" ") > 0) {
      return `"${v}"`;
    }
    if (v.indexOf('"') > 0) {
      return `"${v.replace(/"/g, '\\"')}"`;
    }
    return v;
  };

  for (let i = 0; i < keys.length; i++) { // process types
    const key = keys[i];
    const type = await redis.type(key);
    switch (type) {
      case 'list':
      {
        let values = _.reverse(_.map(await redis.lrange(key, 0, -1), v => processValue(v)));
        isRaw ? root.push(`lpush ${processValue(key)} ${values.join(' ')}`) : (root[key] = values);
        break;
      }
      case 'string':
      {
        let value = processValue(await redis.get(key));
        isRaw ? root.push(`set ${processValue(key)} ${value}`) : (root[key] = value);
        break;
      }
      case 'set':
      {
        const values = _.reverse(_.map(await redis.smembers(key), v => processValue(v)));
        isRaw ? root.push(`sadd ${processValue(key)} ${values.join(' ')}`) : (root[key] = values);
        break;
      }
      case 'zset':
      {
        const values = _.map(await redis.zrange(key, 0, -1, 'withscores'), v => processValue(v));
        const newValues = [];
        for (let i = 0; i < values.length;) {
          newValues.push(values[i + 1]);
          newValues.push(values[i]);
          i += 2;
        }
        isRaw ? root.push(`zadd ${processValue(key)} ${newValues.join(' ')}`) : (root[key] = newValues);
        break;
      }
      case 'hash':
      {
        const values = _.map(await redis.call(...["HGETALL", key]), v => processValue(v));

        const obj = {};
        for (let i = 0; i < values.length;) {
          isRaw ? root.push(`hmset ${processValue(key)} ${values[i]} ${values[i + 1]}`) : (obj[values[i]] = values[i + 1]);
          i += 2;
        }
        isRaw ? _.noop() : (root[key] = obj);
      }
    }
  }

  return isRaw ? root.join('\n') : JSON.stringify(root, null, 2);
}


module.exports = redisExport;

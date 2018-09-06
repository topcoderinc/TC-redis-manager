/**
 * Copyright (C) 2018 TopCoder Inc., All Rights Reserved.
 */

/**
 * This module contains the winston logger configuration.
 *
 * @author      TCSCODER
 * @version     1.0
 */
/* eslint-disable no-param-reassign, func-names */

const _ = require('lodash');
const Joi = require('joi');
const winston = require('winston');
const util = require('util');
const config = require('config');
const getParams = require('get-parameter-names');

const {
  combine, timestamp, colorize, align, printf,
} = winston.format;

const basicFormat = printf(info => `${info.timestamp} ${info.level}: ${info.message}`);

const transports = [];
if (!config.DISABLE_LOGGING) {
  transports.push(new (winston.transports.Console)({ level: config.LOG_LEVEL }));
}

const logger = winston.createLogger({
  transports,
  format: combine(
    colorize(),
    align(),
    timestamp(),
    basicFormat,
  ),
});

/**
 * Log error details with signature
 * @param err the error
 */
logger.logFullError = function (err) {
  if (!err) {
    return;
  }
  logger.error((err.signature ? (`${err.signature} : `) : '') + util.inspect(err));
  err.logged = true;
};

/**
 * Remove invalid properties from the object and hide long arrays
 * @param {Object} obj the object
 * @returns {Object} the new object with removed properties
 * @private
 */
function sanitizeObject(obj) {
  try {
    return JSON.parse(JSON.stringify(obj, (k, v) => {
      const removeFields = ['password', 'token', 'tokenExpired'];
      if (_.findIndex(removeFields, f => f === k) > 0) {
        return '<removed>';
      }
      if (_.isArray(v) && v.length > 30) {
        return `Array(${v.length})`;
      }
      return v;
    }));
  } catch (e) {
    return obj;
  }
}

/**
 * Convert array with arguments to object
 * @param {Array} params the name of parameters
 * @param {Array} arr the array with values
 * @private
 */
function combineObject(params, arr) {
  const ret = {};
  _.each(arr, (arg, i) => {
    ret[params[i]] = arg;
  });
  return ret;
}

/**
 * Decorate all functions of a service and log debug information if DEBUG is enabled
 * @param {string} serviceName the service name
 * @param {Object} service the service
 */
logger.decorateWithLogging = (serviceName, service) => {
  if (config.LOG_LEVEL !== 'debug') {
    return;
  }
  _.each(service, (method, name) => {
    const params = method.params || getParams(method);

    service[name] = async (...args) => {
      if (name.indexOf('export') === 0) {
        return method(...args);
      }
      logger.debug(`ENTER Method '${serviceName}.${name}'`);
      logger.debug(`##input arguments, ${util.inspect(sanitizeObject(combineObject(params, args)))}`);
      try {
        const result = await method(...args);
        if (result !== null && result !== undefined) {
          logger.debug(`##output arguments, ${util.inspect(sanitizeObject(result))}`);
        } else {
          logger.debug('##output arguments, No any result returned');
        }
        logger.debug(`EXIT Method '${serviceName}.${name}'`);
        return result;
      } catch (e) {
        e.signature = `${serviceName}.${name}`;
        throw e;
      }
    };
  });
};

/**
 * Decorate all functions of a service and validate input values
 * and replace input arguments with sanitized result form Joi
 * Service method must have a `schema` property with Joi schema
 * @param {string} serviceName the service name
 * @param {Object} service the service
 */
logger.decorateWithValidators = (serviceName, service) => {
  _.each(service, (method, name) => {
    if (!method.schema) {
      return;
    }
    const params = getParams(method);

    service[name] = async function (...args) {
      const value = combineObject(params, args);
      const normalized = Joi.attempt(value, method.schema);
      const newArgs = [];
      // Joi will normalize values
      // for example string number '1' to 1
      // if schema type is number
      _.each(params, (param) => {
        newArgs.push(normalized[param]);
      });
      return method(...newArgs);
    };
    service[name].params = params;
  });
};

/**
 * Apply logger and validation decorators
 * @param {string} serviceName the service name
 * @param {Object} service the service to wrap
 */
logger.buildService = (serviceName, service) => {
  logger.decorateWithValidators(serviceName, service);
  logger.decorateWithLogging(serviceName, service);
};

module.exports = logger;

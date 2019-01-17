/**
 * Copyright (C) 2018 TopCoder Inc., All Rights Reserved.
 */


/**
 * errors defined
 *
 * @author      TCSCODER
 * @version     1.0
 */


/**
 * the base error class
 */
class AppError extends Error {
  constructor(redis, status, message) {
    super();
    this.redis = redis || {};
    delete this.redis.password;

    this.status = status;
    this.message = message || 'unknown exception';
    this.lineNo = -1;
  }
}

module.exports = {
  newConnectTimeoutError: (redis, msg) => new AppError(redis, 500, msg || 'ConnectTimeout'),
  newConnectFailedError: (redis, msg) => new AppError(redis, 500, msg || 'ConnectFailed'),
  newReplyError: (redis, msg, lineNo = -1) => new AppError(redis, 400, msg, lineNo),
};

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
  constructor(instanceId, status, message, lineNo) {
    super();

    this.instanceId = instanceId;
    this.status = status;
    this.message = message || 'unknown exception';
    this.lineNo = lineNo || -1;
  }
}

module.exports = {
  newConnectTimeoutError: (instanceId, msg) => new AppError(instanceId, 500, msg || 'ConnectTimeout'),
  newConnectFailedError: (instanceId, msg) => new AppError(instanceId, 500, msg || 'ConnectFailed'),
  newReplyError: (instanceId, msg, lineNo = -1) => new AppError(instanceId, 400, msg, lineNo),
};

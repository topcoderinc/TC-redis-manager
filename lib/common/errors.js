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
  constructor(status, message) {
    super();
    this.status = status;
    this.message = message || 'unknown exception';
    this.lineNo = -1;
  }
}

module.exports = {
  newConnectTimeoutError: msg => new AppError(500, msg || 'ConnectTimeout'),
  newConnectFailedError: msg => new AppError(500, msg || 'ConnectFailed'),
  newReplyError: (msg, lineNo = -1) => new AppError(400, msg, lineNo),
};

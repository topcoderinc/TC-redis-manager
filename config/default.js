/**
 * Copyright (C) 2017 TopCoder Inc., All Rights Reserved.
 */
/**
 * the default config
 *
 * @author      TCSCODER
 * @version     1.0
 */

const path = require('path');
const fs = require('fs');
const _ = require('lodash');

let config = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3003,
  API_VERSION: 'api/1.0',
  WORK_ROOT: path.join(__dirname, '..'),
  defaultExternalConfigLink: 'https://raw.githubusercontent.com/jiangliwu/static-files/master/config.json',
  defaultExternalConfigFileName: 'defaultExternalCache.json',
  externalConfigFileName: 'externalCache.json',
};


/**
 * merge json config to config object
 * @param fileName the config json file
 */
function mergeConfig(fileName) {
  console.log('start check ' + fileName); // eslint-disable-line  here use console.log
  if (fs.existsSync(path.join(__dirname, fileName))) {
    const content = fs.readFileSync(path.join(__dirname, fileName));
    config = _.extend({}, config, JSON.parse(content.toString()));
  }
}

mergeConfig(config.defaultExternalConfigFileName);
mergeConfig(config.externalConfigFileName);

module.exports = config;

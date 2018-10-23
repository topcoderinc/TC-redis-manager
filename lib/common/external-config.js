const request = require('request');
const logger = require('../common/logger');
const fs = require('fs');
const config = require('config');
const path = require('path');
const pm2 = require('pm2');

/**
 * download config file from link
 * @param url the config url link
 * @param isDefault is it the default external config
 * @return {Promise<void>}
 */
async function downloadExternalConfigFile(url, isDefault) {
  logger.info('downloadExternalConfigFile ' + url);
  return new Promise((resolve, reject) => {
    request(url, function (error, response, body) {
      if (error) {
        logger.error(error);
        return reject(error);
      }
      if (response && response.statusCode === 200) {
        const filePath = path.join(config.WORK_ROOT, 'config',
          isDefault ? config.defaultExternalConfigFileName : config.externalConfigFileName);
        try {
          fs.writeFileSync(filePath, JSON.stringify(JSON.parse(body), null, 2));
        } catch (e) {
          fs.writeFileSync(filePath, JSON.stringify({error: JSON.stringify(e)}));
        }
        logger.info('downloadExternalConfigFile succeed');
        resolve();
      } else {
        logger.error('empty response from url or wrong status code');
      }
    });
  });
}


/**
 * refresh config
 * @param url the config file link
 * @return {Promise<void>}
 */
async function refreshConfig(url) {
  await downloadExternalConfigFile(url, false);
  return new Promise(((resolve, reject) => {
    pm2.connect(function (err) {
      if (err) {
        return reject(err);
      }
      resolve({message: 'OK'});
      pm2.reload('app', function (err) {
        pm2.disconnect();
        if (err) {
          reject(err);
        }
      })
    });
  }));
}

module.exports = {
  refreshConfig, downloadExternalConfigFile
};

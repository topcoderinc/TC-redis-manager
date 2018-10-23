const config = require('config');
const externalConfig = require('../common/external-config');
(async () => {
  await externalConfig.downloadExternalConfigFile(config.defaultExternalConfigLink, true);
})();

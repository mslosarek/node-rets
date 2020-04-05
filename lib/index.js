const RETSClient = require('./client');
const log = require('./logger');

function initialize(configuration) {
  if (!configuration) {
    throw new Error('No Configuration');
  }

  if (configuration.logLevel) {
    log.level = configuration.logLevel;
  }
  return new RETSClient(configuration, log);
}

module.exports = {
  initialize,
};

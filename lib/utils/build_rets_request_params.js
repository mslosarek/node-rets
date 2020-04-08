const { DEFAULTS } = require('../constants.js');

const { md5 } = require('./common.js');

function BuildRetsRequestParams(configuration, cookies = {}, sessionId = '') {
  const retsVersion = configuration.version || DEFAULTS.RETS_VERSION;
  const userAgent = configuration.userAgent || DEFAULTS.USER_AGENT;

  const params = {
    headers: {
      'User-Agent': userAgent,
      'RETS-Version': retsVersion,
    },
    username: configuration.username,
    password: configuration.password,
    auth: 'digest',
    cookies: { ...cookies },
    parse_response: false,
  };

  if (configuration.userAgentPassword) {
    const a1 = md5([
      userAgent,
      configuration.userAgentPassword,
    ].join(':'));
    const retsUaAuth = md5([
      a1,
      '',
      sessionId || '',
      retsVersion,
    ].join(':'));
    params.headers['RETS-UA-Authorization'] = `Digest ${retsUaAuth}`;
  }

  return params;
}
module.exports = BuildRetsRequestParams;

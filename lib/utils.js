const { parse } = require('fast-xml-parser');
const { createHash } = require('crypto');
const { isObject } = require('underscore');

const { DEFAULTS, URL_KEY_MAPPING } = require('./constants');

function md5(str) {
  return createHash('md5').update(str).digest('hex');
}

function KeyValueStringToObject(keyValueString = '') {
  if (!keyValueString) {
    return {};
  }
  const [key, value] = `${keyValueString}`.trim().split('=');
  return {
    [key]: value,
  };
}

function KeyValueStringsToObject(keyValueStrings = '') {
  if (!keyValueStrings) {
    return {};
  }
  return `${keyValueStrings}`.split(/\n/g)
  .reduce((returnObject, singleLine) => ({
    ...returnObject,
    ...KeyValueStringToObject(singleLine),
  }), {});
}

function GetRetsResponseFromBody(body) {
  const parseResponse = parse(body);
  if (!parseResponse) {
    throw new Error('Unable to parse XML');
  }
  try {
    return parseResponse.RETS['RETS-RESPONSE'];
  } catch (err) {
    throw new Error('Unable to find RETS-RESPONSE');
  }
}

function GetRetsSessionIdFromCookies(cookies) {
  if (!isObject(cookies)) {
    return null;
  }

  let retsSessionID = null;
  Object.entries(cookies).some(([key, value]) => {
    if (key.match(/RETS-Session-ID/)) {
      [retsSessionID] = value.split(';');
      return true;
    }
    return null;
  });
  return retsSessionID;
}

function GetRetsMethodURLsFromBody(bodyObject) {
  return Object.entries(URL_KEY_MAPPING).reduce((returnObject, [key, bodyKey]) => ({
    ...returnObject,
    [key]: bodyObject[bodyKey],
  }), {});
}

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

module.exports = {
  md5,
  KeyValueStringToObject,
  KeyValueStringsToObject,
  GetRetsResponseFromBody,
  GetRetsSessionIdFromCookies,
  GetRetsMethodURLsFromBody,
  BuildRetsRequestParams,
};

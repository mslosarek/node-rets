const http = require('./http.js');

const {
  KeyValueStringsToObject,
  GetRetsResponseFromBody,
  GetRetsSessionIdFromCookies,
  GetRetsMethodURLsFromBody,
  BuildRetsRequestParams,
} = require('./utils');

class RETSClient {
  configuration = null;

  sessionId = '';

  methodUrls = {};

  log = null;

  cookies = {};

  isLoggedIn = false;

  constructor(retsConfiguration, log) {
    this.configuration = retsConfiguration;
    this.log = log;
    this.cookies = {};
  }

  getParams() {
    return BuildRetsRequestParams(this.configuration, this.cookies, this.sessionId);
  }

  async login() {
    let loginResult;

    try {
      loginResult = await http.request(
        this.configuration.method || 'get',
        this.configuration.loginUrl,
        {}, // POST Body
        this.getParams(),
      );
    } catch (err) {
      this.log.error(err);
      throw err;
    }

    this.cookies = { ...loginResult.cookies };
    this.sessionId = GetRetsSessionIdFromCookies(this.cookies);

    const body = KeyValueStringsToObject(GetRetsResponseFromBody(loginResult.raw.toString()));

    this.methodUrls = GetRetsMethodURLsFromBody(body);

    this.isLoggedIn = true;

    return true;
  }

  async logout() {
    if (!this.isLoggedIn) {
      return false;
    }

    const logoutUrl = this.methodUrls.LOGOUT;
    if (!logoutUrl) {
      return false;
    }
    const params = this.getParams();

    let logoutResponse;

    try {
      logoutResponse = await http.request(
        this.configuration.method || 'get',
        logoutUrl,
        {},
        params,
      );
      const body = KeyValueStringsToObject(GetRetsResponseFromBody(logoutResponse.raw.toString()));
      this.log.info(`Connected Time: ${body.ConnectTime}`);
      this.log.info(`Sign Off Message: ${body.SignOffMessage}`);
    } catch (err) {
      this.log.error(err);
      throw err;
    }
    this.sessionId = '';
    this.cookies = {};

    return true;
  }
}

module.exports = RETSClient;

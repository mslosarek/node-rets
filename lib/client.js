const { URL } = require('url');

const http = require('./http.js');
const { RETS_TYPES } = require('./constants.js');
const {
  KeyValueStringsToObject,
  ClassifyQueryParams,
  GetRetsSessionIdFromCookies,
  GetRetsMethodURLsFromBody,
  BuildRetsRequestParams,
  ParseRetsMetadata,
  ParseRetsQuery,
  ParseRetsObjectResponse,
  ParseRetsResponseXML,
} = require('./utils.js');
const log = require('./logger.js');
const errorCodes = require('./error_codes.js');

class RETSClient {
  configuration = null;

  sessionId = '';

  methodUrls = {};

  log = null;

  cookies = {};

  isLoggedIn = false;

  constructor(retsConfiguration) {
    this.configuration = retsConfiguration;
    this.cookies = {};
  }

  getParams() {
    return BuildRetsRequestParams(this.configuration, this.cookies, this.sessionId);
  }

  async login() {
    let loginResult;
    let loginBody;

    try {
      loginResult = await http.request(
        'get',
        this.configuration.loginUrl,
        {},
        this.getParams(),
      );
      if (loginResult.statusCode >= 400) {
        const statusMessage = loginResult.statusMessage || errorCodes.find(ec => ec.code === `${loginResult.statusCode}`).message;
        throw new Error(`${loginResult.statusCode}: ${statusMessage}`);
      }
      loginBody = await ParseRetsResponseXML(loginResult.raw.toString());
    } catch (err) {
      log.error(err.message);
      throw err;
    }

    this.cookies = { ...loginResult.cookies };
    this.sessionId = GetRetsSessionIdFromCookies(this.cookies);

    const body = KeyValueStringsToObject(loginBody['RETS-RESPONSE']);
    log.info(`Logged In As: ${body.MemberName}`);

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
        'get',
        logoutUrl,
        {},
        params,
      );
      const logoutBody = await ParseRetsResponseXML(logoutResponse.raw.toString());
      const content = KeyValueStringsToObject(logoutBody['RETS-RESPONSE']);
      log.info(`Connected Time: ${content.ConnectTime}`);
      log.info(`Sign Off Message: ${content.SignOffMessage}`);
    } catch (err) {
      log.error(err);
      throw err;
    }
    this.sessionId = '';
    this.cookies = {};

    return true;
  }

  async metadata(type = 'RESOURCE', id = '0') {
    const format = 'STANDARD-XML';
    if (!RETS_TYPES.includes(type.toUpperCase())) {
      throw new Error(`Invalid Resource Type: ${type}`);
    }
    if (!this.isLoggedIn) {
      await this.login();
    }
    const url = new URL(this.methodUrls.GET_METADATA, this.configuration.loginUrl);
    const queryParams = {
      Type: `METADATA-${type.toUpperCase()}`,
      ID: id,
      Format: format.toUpperCase(),
    };

    const params = this.getParams();
    const response = await http.request(
      'get',
      url.href,
      queryParams,
      params,
    );

    return ParseRetsMetadata(response.raw.toString());
  }

  /*
   * resourceType: from client.metadata('CLASS');
   * classType: from client.metadata('CLASS', resourceType).objects[x].ClassName
   * queryString: DMWL2 string
   * options:
   *  - Count (1 default, 2 count only)
   *  - Format currently only support STANDARD-XML
   *  - Limit
   *  - Offset
   *  - Select
   *  - RestrictedIndicator
   *  - StandardNames
   */
  async search(resourceType, classType, queryString, options, flattenResults = false, matcherElement = null) {
    const format = 'STANDARD-XML';
    if (!this.isLoggedIn) {
      await this.login();
    }
    const url = new URL(this.methodUrls.SEARCH, this.configuration.loginUrl);
    const queryParams = ClassifyQueryParams({
      StandardNames: 0,
      Limit: 'NONE',
      ...options,
      Format: format.toUpperCase(),
      Query: queryString,
      QueryType: 'DMQL2',
      SearchType: resourceType,
      Class: classType,
    });
    queryParams.Count = queryParams.Count || 1;

    const params = this.getParams();
    const response = await http.request(
      'get',
      url.href,
      queryParams,
      params,
    );
    return ParseRetsQuery(response.raw.toString(), matcherElement || resourceType, flattenResults);
  }

  async getObject(resourceType, classType, id, location = 0, objectData = '*') {
    if (!this.isLoggedIn) {
      await this.login();
    }
    const url = new URL(this.methodUrls.GET_OBJECT, this.configuration.loginUrl);
    const queryParams = ClassifyQueryParams({
      Resource: resourceType,
      Type: classType,
      location,
      objectData,
      id,
    });

    const params = this.getParams();
    const response = await http.request(
      'get',
      url.href,
      queryParams,
      params,
    );
    return ParseRetsObjectResponse(response);
  }
}

module.exports = RETSClient;

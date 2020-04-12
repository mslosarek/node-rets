const { URL } = require('url');

const http = require('./http.js');
const { RETS_TYPES } = require('./constants.js');
const {
  KeyValueStringsToObject,
  ClassifyQueryParams,
  GetRetsResponseFromBody,
  GetRetsSessionIdFromCookies,
  GetRetsMethodURLsFromBody,
  BuildRetsRequestParams,
  ParseRetsMetadata,
  ParseRetsQuery,
  ParseRetsObjectResponse,
} = require('./utils.js');
const log = require('./logger.js');

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

    try {
      loginResult = await http.request(
        'get',
        this.configuration.loginUrl,
        {}, // POST Body
        this.getParams(),
      );
    } catch (err) {
      log.error(err);
      throw err;
    }

    this.cookies = { ...loginResult.cookies };
    this.sessionId = GetRetsSessionIdFromCookies(this.cookies);

    const body = KeyValueStringsToObject(GetRetsResponseFromBody(loginResult.raw.toString()));
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
      const body = KeyValueStringsToObject(GetRetsResponseFromBody(logoutResponse.raw.toString()));
      log.info(`Connected Time: ${body.ConnectTime}`);
      log.info(`Sign Off Message: ${body.SignOffMessage}`);
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
      RestrictedIndicator: '***',
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

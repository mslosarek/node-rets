// abstraction to allow for future library changes and easier mocking
const needle = require('needle');
const { URL } = require('url');
const { isEmpty } = require('underscore');

const { UrlSearchParamsToObject } = require('./utils.js');
const log = require('./logger.js');

module.exports = {
  request: (method, uri, queryParams, opts) => {
    const url = new URL(uri);
    const params = {
      ...queryParams,
      ...UrlSearchParamsToObject(url.searchParams),
    };
    url.search = new URLSearchParams(params).toString();
    log.debug(`Request URL: ${url.href}`);

    return needle(method, url.href, (isEmpty(params) ? undefined : params), opts);
  },
};

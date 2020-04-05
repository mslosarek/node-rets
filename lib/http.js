// abstraction to allow for future library changes and easier mocking
const needle = require('needle');
const { URL } = require('url');
const { isEmpty } = require('underscore');

const { urlSearchParamsToObject } = require('./utils.js');

module.exports = {
  request: (method, uri, data, opts) => {
    const u = new URL(uri);

    const params = {
      ...data,
      ...urlSearchParamsToObject(u.searchParams),
    };

    return needle(method, u.href, isEmpty(params) ? undefined : params, opts);
  },
};

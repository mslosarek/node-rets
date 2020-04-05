// abstraction to allow for future library changes and easier mocking
const needle = require('needle');

module.exports = {
  request: (method, uri, data, opts) => needle(method, uri, data, opts),
};

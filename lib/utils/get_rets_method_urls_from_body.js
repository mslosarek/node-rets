const { URL_KEY_MAPPING } = require('../constants.js');

function GetRetsMethodURLsFromBody(bodyObject) {
  return Object.entries(URL_KEY_MAPPING).reduce((returnObject, [key, bodyKey]) => ({
    ...returnObject,
    [key]: bodyObject[bodyKey],
  }), {});
}
module.exports = GetRetsMethodURLsFromBody;

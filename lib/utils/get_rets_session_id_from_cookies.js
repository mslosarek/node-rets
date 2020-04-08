const { isObject } = require('underscore');

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
module.exports = GetRetsSessionIdFromCookies;

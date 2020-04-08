const { parse } = require('fast-xml-parser');

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
module.exports = GetRetsResponseFromBody;

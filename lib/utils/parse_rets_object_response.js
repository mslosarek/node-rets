const ContentType = require('content-type');

const ParseMultipartRetsResponse = require('./parse_multipart_rets_response.js');
const ParseRetsResponseXML = require('./parse_rets_response_xml.js');

async function ParseRetsObjectResponse(response) {
  const contentType = ContentType.parse(response.headers['content-type']);

  if (contentType.type === 'multipart/parallel') {
    return ParseMultipartRetsResponse(response.raw, contentType.parameters.boundary);
  } else if (response.raw) {
    return ParseRetsResponseXML(response.raw.toString());
  }
  return response;
}
module.exports = ParseRetsObjectResponse;

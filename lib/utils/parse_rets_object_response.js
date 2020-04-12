const ParseMultipartRetsResponse = require('./parse_multipart_rets_response.js');

async function ParseRetsObjectResponse(response) {
  if (response.headers['content-type'].includes('multipart/parallel')) {
    const boundary = response.headers['content-type'].match(/boundary="(.*?)"/)[1];
    return ParseMultipartRetsResponse(response.raw, boundary);
  }
  return response;
}
module.exports = ParseRetsObjectResponse;

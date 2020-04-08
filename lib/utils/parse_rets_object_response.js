const ParseMultipartRetsResponse = require('./parse_multipart_rets_response.js');
const { NormalizeHeaders } = require('./common.js');

async function ParseRetsObjectResponse(response) {
  if (response.headers['content-type'].includes('multipart/parallel')) {
    const boundary = response.headers['content-type'].match(/boundary="(.*?)"/)[1];
    const parts = await ParseMultipartRetsResponse(response.raw, boundary);
    return parts.map(part => ({
      ...part,
      headers: NormalizeHeaders(part.headers),
    }));
  }
  return response;
}
module.exports = ParseRetsObjectResponse;

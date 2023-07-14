const { MultipartParser } = require('formidable');
const { NormalizeHeaders } = require('./common.js');

function ParseMultipartRetsResponse(buff, boundary) {
  return new Promise((resolve, reject) => {
    const multipartParser = new MultipartParser();

    let inPart = false;
    let currentHeaders = {};
    let currentField = null;
    let currentData = [];
    const parts = [];

    multipartParser.on('data', ({
      name,
      buffer,
      start,
      end,
    }) => {
      let bufferSlice;
      if (buffer) {
        bufferSlice = buffer.slice(start, end);
      }

      if (name === 'partBegin') {
        inPart = true;
        currentHeaders = {};
        currentField = null;
        currentData = [];
      } else if (name === 'partEnd') {
        const headers = NormalizeHeaders(currentHeaders);
        let data = Buffer.concat(currentData);
        if (headers.ContentType === 'text/xml') {
          data = data.toString();
        }
        parts.push({
          headers,
          data,
        });
        inPart = false;
      } else if (name === 'end') {
        resolve(parts);
      }
      if (inPart) {
        if (name === 'headerField') {
          currentField = String(bufferSlice);
        } else if (name === 'headerValue') {
          currentHeaders[currentField] = currentHeaders[currentField] || [];
          currentHeaders[currentField].push(String(bufferSlice));
        } else if (name === 'partData' && bufferSlice) {
          currentData.push(bufferSlice);
        }
      }
    });
    multipartParser.on('error', (error) => {
      console.log('Error Processing Multipart Response');
      // new Error('Error Processing Multipart Response')
      console.error(error);
      reject(error);
    });

    multipartParser.initWithBoundary(boundary);
    multipartParser.write(buff);
    multipartParser.end();
  });
}
module.exports = ParseMultipartRetsResponse;

const xml2js = require('xml2js');

const errorCodes = require('../error_codes.js');
const log = require('../logger.js');

async function ParseRetsResponseXML(xmlContent) {
  const parser = new xml2js.Parser({
    explicitArray: false,
    // mergeAttrs: true,
  });

  const jsonContent = await parser.parseStringPromise(xmlContent);

  if (!jsonContent) {
    throw new Error('Unable to parse the content');
  }

  if (jsonContent.RETS && jsonContent.RETS.$ && jsonContent.RETS.$.ReplyCode && jsonContent.RETS.$.ReplyCode !== '0') {
    const errorCode = errorCodes.find(ec => ec.code === jsonContent.RETS.$.ReplyCode);
    const err = new Error(
      errorCode
        ? `${errorCode.code}: ${errorCode.message}`
        : 'An error occurred',
    );
    log.error(err);
    log.debug(`${jsonContent.RETS.$.ReplyCode}: ${jsonContent.RETS.$.ReplyText}`);

    throw err;
  }
  return jsonContent.RETS ? jsonContent.RETS : jsonContent;
}
module.exports = ParseRetsResponseXML;

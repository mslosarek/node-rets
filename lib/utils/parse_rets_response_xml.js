const xml2js = require('xml2js');
const objectPath = require('object-path');
const { isArray, isObject, object } = require('underscore');

const log = require('../logger.js');
const { GenerateErrorCode, KeyValueStringsToObject } = require('./common.js');

async function ParseRetsResponseXML(xmlContent) {
  if (!xmlContent) {
    return null;
  }

  const parser = new xml2js.Parser({
    explicitArray: false,
  });

  let jsonContent;
  try {
    jsonContent = await parser.parseStringPromise(xmlContent);
  } catch (err) {
    throw new Error('Unable to parse the content');
  }

  if (jsonContent.RETS && jsonContent.RETS.$ && jsonContent.RETS.$.ReplyCode && jsonContent.RETS.$.ReplyCode !== '0') {
    const err = GenerateErrorCode(jsonContent.RETS.$.ReplyCode, jsonContent.RETS.$.ReplyText);
    log.error(err);
    throw err;
  }
  const delimiterString = objectPath.get(jsonContent, 'RETS.DELIMITER.$.value');
  const retsResponse = objectPath.get(jsonContent, 'RETS.RETS-RESPONSE');

  if (!retsResponse && delimiterString) { // process compact format
    try {
      const delimiter = String.fromCharCode(parseInt(delimiterString, 16));
      const columns = jsonContent.RETS.COLUMNS.split(delimiter);
      if (!isArray(jsonContent.RETS.DATA)) {
        jsonContent.RETS.DATA = [jsonContent.RETS.DATA];
      }
      jsonContent.RETS.DATA = jsonContent.RETS.DATA
      .map(data => data.split(delimiter))
      .map(dataArray => {
        const dataObject = object(columns, dataArray);
        delete dataObject[''];
        return dataObject;
      });
      jsonContent.RETS.COLUMNS = columns.filter(c => c);
    } catch (err) {
      // unable to process a deliminated file
    }
  } else if (retsResponse && !isObject(retsResponse)) { // process rets-response key value string
    jsonContent.RETS['RETS-RESPONSE'] = KeyValueStringsToObject(retsResponse);
    delete jsonContent.RETS['RETS-RESPONSE'][''];
  }

  return jsonContent.RETS ? jsonContent.RETS : jsonContent;
}
module.exports = ParseRetsResponseXML;

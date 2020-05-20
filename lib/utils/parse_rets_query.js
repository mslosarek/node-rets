const { isArray, chain } = require('underscore');

const ParseRetsResponseXML = require('./parse_rets_response_xml.js');
const { FlattenObject } = require('./common.js');

async function ParseRetsQuery(xmlContent, defaultFlatten = true) {
  let knownResponse = false;
  let flatten = defaultFlatten;

  const queryJSON = await ParseRetsResponseXML(xmlContent);

  const queryResponse = {};
  if (queryJSON.COUNT && queryJSON.COUNT.$.Records) {
    queryResponse.TotalCount = Number(queryJSON.COUNT.$.Records);
  }

  if (queryJSON.DATA) {
    knownResponse = true;
    queryResponse.Objects = queryJSON.DATA;
  } else if (queryJSON['RETS-RESPONSE'] && queryJSON['RETS-RESPONSE'].PropertyDetails) {
    // handle CREA Standard XML
    knownResponse = true;
    flatten = false;

    let data = queryJSON['RETS-RESPONSE'].PropertyDetails;

    if (!isArray(data)) {
      data = [data];
    }

    queryResponse.Objects = data;
  } else if (queryJSON.REData) {
    knownResponse = true;
    let data = chain(queryJSON.REData)
    .values()
    .first()
    .values()
    .first()
    .value();

    if (!isArray(data)) {
      data = [data];
    }
    queryResponse.Objects = data;
  } else {
    queryResponse.Response = queryJSON;
  }

  if (knownResponse) {
    if (flatten && knownResponse) {
      queryResponse.Objects = queryResponse.Objects.map(obj => FlattenObject(obj));
    }
    queryResponse.Count = queryResponse.Objects.length;
  }

  return queryResponse;
}
module.exports = ParseRetsQuery;

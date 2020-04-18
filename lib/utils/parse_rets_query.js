const { isArray, chain } = require('underscore');

const ParseRetsResponseXML = require('./parse_rets_response_xml.js');
const { FlattenObject } = require('./common.js');

async function ParseRetsQuery(xmlContent) {
  const queryJSON = await ParseRetsResponseXML(xmlContent);

  const queryResponse = {};
  if (queryJSON.COUNT && queryJSON.COUNT.$.Records) {
    queryResponse.TotalCount = Number(queryJSON.COUNT.$.Records);
  }
  queryResponse.Count = 0;
  queryResponse.Objects = [];

  if (queryJSON.DATA) {
    queryResponse.Objects = queryJSON.DATA;
  } else if (queryJSON.REData) {
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
  }
  queryResponse.Objects = queryResponse.Objects.map(obj => FlattenObject(obj));

  queryResponse.Count = queryResponse.Objects.length;

  return queryResponse;
}
module.exports = ParseRetsQuery;

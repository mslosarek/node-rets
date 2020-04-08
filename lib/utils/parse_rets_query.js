const { isArray } = require('underscore');

const ParseRetsResponseXML = require('./parse_rets_response_xml.js');
const { FlattenObject } = require('./common.js');

async function ParseRetsQuery(xmlContent, flattenResults = false) {
  const queryJSON = await ParseRetsResponseXML(xmlContent);

  const queryResponse = {};
  if (queryJSON.COUNT && queryJSON.COUNT.$.Records) {
    queryResponse.TotalCount = Number(queryJSON.COUNT.$.Records);
  }
  queryResponse.Count = 0;
  queryResponse.Objects = [];

  if (queryJSON.REData && queryJSON.REData.MRISProperties && queryJSON.REData.MRISProperties.AllProperty) {
    let properties = queryJSON.REData.MRISProperties.AllProperty;
    if (!isArray(properties)) {
      properties = [properties];
    }
    queryResponse.Objects = properties;
  }
  if (flattenResults) {
    queryResponse.Objects.map(obj => FlattenObject(obj));
  }

  queryResponse.Count = queryResponse.Objects.length;

  return queryResponse;
}
module.exports = ParseRetsQuery;

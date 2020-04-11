const { isArray } = require('underscore');

const ParseRetsResponseXML = require('./parse_rets_response_xml.js');
const { FlattenObject, FindNested, NormalizeMatcher } = require('./common.js');

async function ParseRetsQuery(xmlContent, matcherElement, flattenResults = false) {
  const matcherFunction = NormalizeMatcher(matcherElement);
  const queryJSON = await ParseRetsResponseXML(xmlContent);

  const queryResponse = {};
  if (queryJSON.COUNT && queryJSON.COUNT.$.Records) {
    queryResponse.TotalCount = Number(queryJSON.COUNT.$.Records);
  }
  queryResponse.Count = 0;
  queryResponse.Objects = [];

  if (queryJSON.REData) {
    let properties = FindNested(queryJSON.REData, matcherFunction) || queryJSON.REData;

    if (!isArray(properties)) {
      properties = [properties];
    }
    queryResponse.Objects = properties;
  }
  if (flattenResults) {
    queryResponse.Objects = queryResponse.Objects.map(obj => FlattenObject(obj));
  }

  queryResponse.Count = queryResponse.Objects.length;

  return queryResponse;
}
module.exports = ParseRetsQuery;

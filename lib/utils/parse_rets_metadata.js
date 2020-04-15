const { isArray, omit } = require('underscore');
const { classify } = require('underscore.string');

const ParseRetsResponseXML = require('./parse_rets_response_xml.js');

async function ParseRetsMetadata(xmlContent) {
  const metadataJSON = await ParseRetsResponseXML(xmlContent);

  const rootElement = metadataJSON.METADATA;
  const rootKey = Object.keys(rootElement).find(k => k.startsWith('METADATA-'));

  if (!rootKey) {
    throw new Error('Unable to process the content');
  }

  const elementKey = classify(rootKey.replace('METADATA-', '').toLowerCase());
  const rootElements = !isArray(rootElement[rootKey]) ? [rootElement[rootKey]] : rootElement[rootKey];

  const parsedElements = rootElements.map(re => {
    const element = omit(re.$, 'System');
    element.Objects = re[elementKey];

    if (!isArray(element.Objects)) {
      element.Objects = [element.Objects];
    }
    return element;
  });

  if (parsedElements.length === 1) {
    return parsedElements[0];
  }
  return parsedElements;
}
module.exports = ParseRetsMetadata;

const { parse } = require('fast-xml-parser');
const xml2js = require('xml2js');
const { createHash } = require('crypto');
const {
  isObject,
  isArray,
  object,
  omit,
} = require('underscore');
const { classify } = require('underscore.string');
const { MultipartParser } = require('formidable');

const errorCodes = require('./error_codes.js');
const { DEFAULTS, URL_KEY_MAPPING } = require('./constants.js');
const log = require('./logger.js');

function md5(str) {
  return createHash('md5').update(str).digest('hex');
}

function UrlSearchParamsToObject(rawParams) {
  const urlSearchParams = new URLSearchParams(rawParams);
  return object(Array.from(urlSearchParams.entries()));
}

function ClassifyQueryParams(params) {
  return Object.keys(params).reduce((p, k) => ({
    ...p,
    [(k.toLowerCase() === 'id' ? 'ID' : classify(k))]: params[k],
  }), {});
}

function FlattenObject(nestedObject) {
  return Object.entries(nestedObject).reduce((f, [k, v]) => {
    if (isObject(v)) {
      return {
        ...f,
        ...FlattenObject(v),
      };
    }
    return {
      ...f,
      [k]: v,
    };
  }, {});
}

function KeyValueStringToObject(keyValueString = '') {
  if (!keyValueString) {
    return {};
  }
  const [key, value] = `${keyValueString}`.trim().split('=');
  return {
    [key]: value,
  };
}

function KeyValueStringsToObject(keyValueStrings = '') {
  if (!keyValueStrings) {
    return {};
  }
  return `${keyValueStrings}`.split(/\n/g)
  .reduce((returnObject, singleLine) => ({
    ...returnObject,
    ...KeyValueStringToObject(singleLine),
  }), {});
}

function NormalizeHeaders(headers) {
  return Object.entries(headers).reduce((h, [k, v]) => {
    const key = classify(k);
    let val = (v.length > 1 ? v : v[0]);
    if (key === 'ObjectData') {
      val = val.reduce((od, singleLine) => ({
        ...od,
        ...KeyValueStringToObject(singleLine),
      }), {});
    }
    return {
      ...h,
      [key]: val,
    };
  }, {});
}

function GetRetsResponseFromBody(body) {
  const parseResponse = parse(body);
  if (!parseResponse) {
    throw new Error('Unable to parse XML');
  }
  try {
    return parseResponse.RETS['RETS-RESPONSE'];
  } catch (err) {
    throw new Error('Unable to find RETS-RESPONSE');
  }
}

function GetRetsSessionIdFromCookies(cookies) {
  if (!isObject(cookies)) {
    return null;
  }

  let retsSessionID = null;
  Object.entries(cookies).some(([key, value]) => {
    if (key.match(/RETS-Session-ID/)) {
      [retsSessionID] = value.split(';');
      return true;
    }
    return null;
  });
  return retsSessionID;
}

function GetRetsMethodURLsFromBody(bodyObject) {
  return Object.entries(URL_KEY_MAPPING).reduce((returnObject, [key, bodyKey]) => ({
    ...returnObject,
    [key]: bodyObject[bodyKey],
  }), {});
}

function BuildRetsRequestParams(configuration, cookies = {}, sessionId = '') {
  const retsVersion = configuration.version || DEFAULTS.RETS_VERSION;
  const userAgent = configuration.userAgent || DEFAULTS.USER_AGENT;

  const params = {
    headers: {
      'User-Agent': userAgent,
      'RETS-Version': retsVersion,
    },
    username: configuration.username,
    password: configuration.password,
    auth: 'digest',
    cookies: { ...cookies },
    parse_response: false,
  };

  if (configuration.userAgentPassword) {
    const a1 = md5([
      userAgent,
      configuration.userAgentPassword,
    ].join(':'));
    const retsUaAuth = md5([
      a1,
      '',
      sessionId || '',
      retsVersion,
    ].join(':'));
    params.headers['RETS-UA-Authorization'] = `Digest ${retsUaAuth}`;
  }

  return params;
}

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

    return element;
  });

  if (parsedElements.length === 1) {
    return parsedElements[0];
  }
  return parsedElements;
}

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
        if (inPart) {
          parts.push({
            headers: currentHeaders,
            data: Buffer.concat(currentData),
          });
        }
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
    multipartParser.on('error', error => {
      reject(error);
    });

    multipartParser.initWithBoundary(boundary);
    multipartParser.write(buff);
    multipartParser.end();
  });
}

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

module.exports = {
  md5,
  UrlSearchParamsToObject,
  ClassifyQueryParams,
  FlattenObject,
  KeyValueStringToObject,
  KeyValueStringsToObject,
  GetRetsResponseFromBody,
  GetRetsSessionIdFromCookies,
  GetRetsMethodURLsFromBody,
  BuildRetsRequestParams,
  ParseRetsResponseXML,
  ParseRetsMetadata,
  ParseRetsQuery,
  ParseMultipartRetsResponse,
  ParseRetsObjectResponse,
};

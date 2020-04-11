const { createHash } = require('crypto');
const {
  isObject,
  isFunction,
  isString,
  isRegExp,
  object,
} = require('underscore');
const { classify } = require('underscore.string');

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

function FindNested(topElement, keyMatcherFunction) {
  let nestedElement = null;
  Object.keys(topElement).some(topKey => {
    const childElement = topElement[topKey];
    if (keyMatcherFunction(topKey, childElement)) {
      nestedElement = childElement;
      return true;
    } if (isObject(childElement)) {
      nestedElement = FindNested(childElement, keyMatcherFunction);
      return !!nestedElement;
    }
    return false;
  });

  return nestedElement;
}

function NormalizeMatcher(matcherElement) {
  if (isString(matcherElement)) {
    return key => new RegExp(`${matcherElement}$`, 'i').test(key);
  } if (isRegExp(matcherElement)) {
    return key => matcherElement.test(key);
  } if (isFunction(matcherElement)) {
    return matcherElement;
  }
  return key => matcherElement === key;
}

module.exports = {
  md5,
  UrlSearchParamsToObject,
  ClassifyQueryParams,
  FlattenObject,
  KeyValueStringToObject,
  KeyValueStringsToObject,
  NormalizeHeaders,
  FindNested,
  NormalizeMatcher,
};

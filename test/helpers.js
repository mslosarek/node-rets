const { readFileSync } = require('fs');
const { dirname, join } = require('path');
const { URL } = require('url');
const nock = require('nock');

function readDataFile(filename, encoding, json = false) {
  const content = readFileSync(join(dirname(__filename), './data', filename), encoding);
  if (json) {
    return JSON.parse(content);
  }
  return content;
}

function buildLoginResponse(baseUrl = 'https://mockrets.com', memberName = 'Treutel Group') {
  return [
    '<?xml version="1.0" ?>',
    '<RETS ReplyCode="0" ReplyText="V2.6.0 761: Success">',
    '<RETS-RESPONSE>',
    (memberName ? `MemberName=${memberName}` : ''),
    'User=username, User:Class:String, 90, 98765',
    'Broker=12345',
    'MetadataVersion=1.2.3456',
    'MetadataTimestamp=2020-04-04T18:45:19.324Z',
    'MinMetadataTimestamp=2000-04-04T18:45:19.324Z',
    'OfficeList=54321',
    'TimeoutSeconds=1800',
    'Info=MEMBERNAME;Treutel Group',
    'Info=USERID;username',
    'Info=USERLEVEL;90',
    'Info=USERCLASS;User:Class:String',
    'Info=AGENTCODE;98765',
    'Info=BROKERCODE;12345',
    'Info=MetadataVersion;1.2.3456',
    'Info=MetadataTimestamp;2020-04-04T18:45:19.324Z',
    'Info=MinMetadataTimestamp;2000-04-04T18:45:19.324Z',
    'Info=OfficeList;54321',
    'Info=TimeoutSeconds;1800',
    `Action=${baseUrl}/get?Command=Message`,
    `ChangePassword=${baseUrl}/changepassword`,
    `Search=${baseUrl}/search`,
    `GetMetadata=${baseUrl}/getmetadata`,
    `Logout=${baseUrl}/logout`,
    `GetObject=${baseUrl}/getobject`,
    `Login=${baseUrl}/login`,
    `LoginComplete=${baseUrl}/logincomplete`,
    `Get=${baseUrl}/get`,
    `Update=${baseUrl}/update`,
    '</RETS-RESPONSE>',
    '</RETS>',
  ].filter(l => l).join('\r\n');
}

function buildLogoutResponse(includeConnectedTime = true) {
  return [
    '<?xml version="1.0" ?>',
    '<RETS ReplyCode="0" ReplyText="V2.6.0 761: Success">',
    '<RETS-RESPONSE>',
    (includeConnectedTime ? 'ConnectTime=10' : null),
    'SignOffMessage=Goodbye Treutel Group',
    '</RETS-RESPONSE>',
    '</RETS>',
  ].filter(l => l).join('\r\n');
}

function retsLogin(loginUrl = 'https://mockrets.com/login', customLoginResponse = null, useQOP = true) {
  const url = new URL(loginUrl);
  const loginResponse = customLoginResponse || buildLoginResponse(url.origin);

  const qopHeader = [
    'Digest realm="testrealm@host.com",',
    'qop="auth,auth-int",',
    'nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093",',
    'opaque="5ccc069c403ebaf9f0171e9517f40e41"',
  ].join(' ');

  const nonQopHeader = [
    'Digest realm="testrealm@host.com",',
    'nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093",',
    'opaque="5ccc069c403ebaf9f0171e9517f40e41"',
  ].join(' ');

  return nock(url.origin)
  .get('/login')
  .reply(401, 'Unauthorized', {
    'www-authenticate': useQOP ? qopHeader : nonQopHeader,
  })
  .get('/login')
  .query(true)
  .reply(200, loginResponse, {
    'set-cookie': [
      'RETS-Session-ID=1234567890; Path=/',
    ],
    'content-type': 'text/xml',
  });
}

function addRetsLogout(nockedRequest, includeConnectedTime = true) {
  return nockedRequest
  .get('/logout')
  .reply(200, buildLogoutResponse(includeConnectedTime));
}

function addRetsMedataData(nockedRequest, params = {}, content = null) {
  const xmlContent = content || readDataFile('metadata_class_property.xml');

  return nockedRequest
  .get('/getmetadata')
  .query({
    ...{
      Type: 'METADATA-CLASS',
      ID: 'Property',
      Format: 'STANDARD-XML',
    },
    ...params,
  })
  .reply(
    200,
    xmlContent,
    {
      'Content-Type': 'text/xml',
    },
  );
}

function addRetsSearch(nockedRequest, query, options, format = 'STANDARD-XML', response = null) {
  const responseFile = format === 'STANDARD-XML' ? 'properties.xml' : 'properties_compact.xml';
  const contentType = format === 'STANDARD-XML' ? 'text/xml' : 'text/xml';

  const responseBody = response || readDataFile(responseFile);

  return nockedRequest
  .get('/search')
  .query({
    ...options,
    Query: query,
    SearchType: 'Property',
    Class: 'ALL',
    StandardNames: 0,
    Format: format,
    QueryType: 'DMQL2',
    Count: 1,
  })
  .reply(
    200,
    responseBody,
    {
      'Content-Type': contentType,
    },
  );
}

function addRetsGetObject(nockedRequest, propertyId) {
  return nockedRequest
  .get('/getobject')
  .query({
    Resource: 'Property',
    Type: 'Photo',
    Location: 0,
    ObjectData: '*',
    ID: propertyId,
  })
  .reply(
    200,
    Buffer.from(readDataFile('multipart.buf', 'binary'), 'hex'),
    {
      'Content-Type': 'multipart/parallel; boundary="simple boundary"',
    },
  );
}

module.exports = {
  buildLoginResponse,
  buildLogoutResponse,
  retsLogin,
  addRetsLogout,
  addRetsMedataData,
  addRetsSearch,
  addRetsGetObject,
  data: {
    metadataClassXML: readDataFile('metadata_class.xml', 'utf8'),
    metadataClassJSON: readDataFile('metadata_class.json', 'utf8', true),
    propertiesXML: readDataFile('properties.xml', 'utf8'),
    propertiesJSON: readDataFile('properties.json', 'utf8', true),
    propertyJSON: readDataFile('property.json', 'utf8', true),
    propertyFlatJSON: readDataFile('property_flat.json', 'utf8', true),
    multipartJSON: readDataFile('multipart.json', 'utf8', true),
    multipartXMLJSON: readDataFile('multipart_xml.json', 'utf8', true),
  },
  readDataFile,
};

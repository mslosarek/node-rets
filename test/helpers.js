const { readFileSync } = require('fs');
const { dirname, join } = require('path');
const { URL } = require('url');
const nock = require('nock');

function readDataFileDataFile(filename) {
  return readFileSync(join(dirname(__filename), './data', filename), 'utf8');
}

const metadataClassXML = readDataFileDataFile('metadata_class.xml');
const metadataClassJSON = JSON.parse(readDataFileDataFile('metadata_class.json'));

function buildLoginResponse(baseUrl = 'https://mockrets.com') {
  return [
    '<?xml version="1.0" ?>',
    '<RETS ReplyCode="0" ReplyText="V2.6.0 761: Success">',
    '<RETS-RESPONSE>',
    'MemberName=Treutel Group',
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
  ].join('\r\n');
}

function buildLogoutResponse() {
  return [
    '<?xml version="1.0" ?>',
    '<RETS ReplyCode="0" ReplyText="V2.6.0 761: Success">',
    '<RETS-RESPONSE>',
    'ConnectTime=10',
    'SignOffMessage=Goodbye Treutel Group',
    '</RETS-RESPONSE>',
    '</RETS>',
  ].join('\r\n');
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

function addRetsLogout(nockedRequest) {
  return nockedRequest
  .get('/logout')
  .reply(200, buildLogoutResponse());
}

module.exports = {
  buildLoginResponse,
  buildLogoutResponse,
  retsLogin,
  addRetsLogout,
  data: {
    metadataClassXML,
    metadataClassJSON,
  },
};

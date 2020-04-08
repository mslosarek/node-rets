const { expect } = require('chai');

const utils = require('../lib/utils.js');
const { DEFAULTS } = require('../lib/constants.js');
const helpers = require('./helpers.js');

const { md5 } = utils;

const uaHeader = function(userAgent, userAgentPassword, sessionId, retsVersion) {
  const a1 = md5([
    userAgent,
    userAgentPassword,
  ].join(':'));
  const retsUaAuth = md5([
    a1,
    '',
    sessionId,
    retsVersion,
  ].join(':'));
  return `Digest ${retsUaAuth}`;
};

const configuration = {
  username: 'username',
  password: 'password',
};
const cookies = {
  'sample-coolie': 'sample-value',
};
const sessionId = '1234567890';

const expectedResponse = {
  auth: 'digest',
  username: configuration.username,
  password: configuration.password,
  cookies,
  headers: {
    'RETS-Version': DEFAULTS.RETS_VERSION,
    'User-Agent': DEFAULTS.USER_AGENT,
  },
  parse_response: false,
};

describe('Utils', function() {
  describe('#md5', function() {
    it('should produce a valid md5 string', function() {
      const result = utils.md5('abc');
      expect(result).to.eq('900150983cd24fb0d6963f7d28e17f72');
    });
  });

  describe('#KeyValueStringToObject', function() {
    context('when nothing passed in', function() {
      it('returns empty object', function() {
        const result = utils.KeyValueStringToObject();
        expect(result).to.deep.eq({});
      });
    });

    context('when a simple string', function() {
      it('returns the correct object', function() {
        const result = utils.KeyValueStringToObject('a=b');
        expect(result).to.deep.eq({ a: 'b' });
      });
    });

    context('when no equal symbol', function() {
      it('returns the correct object', function() {
        const result = utils.KeyValueStringToObject('ab');
        expect(result).to.deep.eq({ ab: undefined });
      });
    });
  });

  describe('#KeyValueStringsToObject', function() {
    context('when nothing passed in', function() {
      it('returns empty object', function() {
        const result = utils.KeyValueStringsToObject();
        expect(result).to.deep.eq({});
      });
    });

    context('when a string with new lines', function() {
      it('returns the correct object', function() {
        const result = utils.KeyValueStringsToObject('a=b\nc=d');
        expect(result).to.deep.eq({ a: 'b', c: 'd' });
      });
    });
  });

  describe('#GetRetsResponseFromBody', function() {
    context('when a valid xml string', function() {
      it('returns the response text', function() {
        const result = utils.GetRetsResponseFromBody('<RETS><RETS-RESPONSE>Body Text</RETS-RESPONSE></RETS>');
        expect(result).to.eq('Body Text');
      });
    });

    context('when an invalid xml string', function() {
      it('throws an error', function() {
        const fn = () => {
          utils.GetRetsResponseFromBody('Invalid XML');
        };
        expect(fn).to.throw('Unable to parse XML');
      });
    });

    context('when an xml does not contain rets response', function() {
      it('throws an error', function() {
        const fn = () => {
          utils.GetRetsResponseFromBody('<html><body></body></html>');
        };
        expect(fn).to.throw('Unable to find RETS-RESPONSE');
      });
    });
  });

  describe('#GetRetsSessionIdFromCookies', function() {
    context('when not an object', function() {
      it('returns null', function() {
        const result = utils.GetRetsSessionIdFromCookies('not an object');
        expect(result).to.eq(null);
      });
    });

    context('when the RETS-Session-ID cookie does not exist', function() {
      it('returns null', function() {
        const result = utils.GetRetsSessionIdFromCookies({ 'Item 1': 'hello' });
        expect(result).to.eq(null);
      });
    });

    context('when the RETS-Session-ID cookie does exist', function() {
      it('returns the session id', function() {
        const result = utils.GetRetsSessionIdFromCookies({ 'RETS-Session-ID': '1234567890; Path=/' });
        expect(result).to.eq('1234567890');
      });
    });
  });

  describe('#GetRetsMethodURLsFromBody', function() {
    it('build the correct object', function() {
      const body = {
        Action: 'ActionURL',
        ChangePassword: 'ChangePasswordURL',
        GetObject: 'GetObjectURL',
        Login: 'LoginURL',
        LoginComplete: 'LoginCompleteURL',
        Logout: 'LogoutURL',
        Search: 'SearchURL',
        GetMetadata: 'GetMetadataURL',
        Update: 'UpdateURL',
      };
      const expected = {
        ACTION: 'ActionURL',
        CHANGE_PASSWORD: 'ChangePasswordURL',
        GET_OBJECT: 'GetObjectURL',
        LOGIN: 'LoginURL',
        LOGIN_COMPLETE: 'LoginCompleteURL',
        LOGOUT: 'LogoutURL',
        SEARCH: 'SearchURL',
        GET_METADATA: 'GetMetadataURL',
        UPDATE: 'UpdateURL',
      };
      const result = utils.GetRetsMethodURLsFromBody(body);
      expect(result).to.deep.eq(expected);
    });
  });

  describe('#BuildRetsRequestParams', function() {
    context('when no cookies and no sessionId', function() {
      it('should build the correct params', function() {
        const result = utils.BuildRetsRequestParams(configuration);
        expect(result).to.deep.eq({
          ...expectedResponse,
          headers: {
            'RETS-Version': DEFAULTS.RETS_VERSION,
            'User-Agent': DEFAULTS.USER_AGENT,
          },
          cookies: {},
        });
      });
    });

    context('when passing in cookies and sessionId', function() {
      it('should build a thing', function() {
        const result = utils.BuildRetsRequestParams(
          configuration,
          cookies,
          sessionId,
        );
        expect(result).to.deep.eq(expectedResponse);
      });
    });

    context('when userAgentPassword', function() {
      it('should build a thing', function() {
        const userAgentPassword = '123456';
        const result = utils.BuildRetsRequestParams(
          {
            ...configuration,
            userAgentPassword,
          },
          cookies,
        );
        expect(result).to.deep.eq({
          ...expectedResponse,
          headers: {
            ...expectedResponse.headers,
            'RETS-UA-Authorization': uaHeader(DEFAULTS.USER_AGENT, userAgentPassword, undefined, DEFAULTS.RETS_VERSION),
          },
        });
      });
    });
  });

  describe('#ParseRetsMetadata', function() {
    context('when an array of elements', function() {
      it('returns a parsed JSON', async function() {
        const result = await utils.ParseRetsMetadata(helpers.data.metadataClassXML);
        expect(result).to.deep.eq(helpers.data.metadataClassJSON);
      });
    });

    context('when no metadata root element', function() {
      it('throws an error', async function() {
        const metadataContent = '<?xml version="1.0" ?><RETS ReplyCode="0" ReplyText="V2.6.0 761: Success"><METADATA></METADATA></RETS>';
        const result = await utils.ParseRetsMetadata(metadataContent).catch(e => e);
        expect(result).to.be.an('error');
      });
    });

    context('when multiple root elements', function() {
      it('return an array of elements', async function() {
        const metadataContent = `<?xml version="1.0" ?>
        <RETS ReplyCode="0" ReplyText="V2.6.0 761: Success">
          <METADATA>
            <METADATA-CLASS Resource="Property">
              <Class>
                <ClassName>ALL</ClassName>
              </Class>
            </METADATA-CLASS>
            <METADATA-CLASS Resource="Fake">
              <Class>
                <ClassName>ALL</ClassName>
              </Class>
            </METADATA-CLASS>
          </METADATA>
        </RETS>`;
        const result = await utils.ParseRetsMetadata(metadataContent);
        expect(result).to.have.lengthOf(2);
      });
    });
  });
});

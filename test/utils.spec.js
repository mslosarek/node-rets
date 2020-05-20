const { expect } = require('chai');
const sinon = require('sinon');
const { omit } = require('underscore');

const utils = require('../lib/utils.js');
const { DEFAULTS } = require('../lib/constants.js');
const log = require('../lib/logger.js');
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

const buff = Buffer.from(helpers.readDataFile('multipart.buf', 'binary'), 'hex');
const buffXML = Buffer.from(helpers.readDataFile('multipart_xml.buf', 'binary'), 'hex');

describe('Utils', function() {
  afterEach(function() {
    sinon.restore();
  });

  beforeEach(function() {
    sinon.stub(log);
  });

  describe('#md5', function() {
    it('should produce a valid md5 string', function() {
      const result = utils.md5('abc');
      expect(result).to.eq('900150983cd24fb0d6963f7d28e17f72');
    });
  });

  describe('#UrlSearchParamsToObject', function() {
    context('when passed a URLSearchParams', function() {
      it('returns an object', function() {
        const params = new URLSearchParams();
        params.append('name', 'Bob Smith');
        params.append('job', 'Realtor');

        const result = utils.UrlSearchParamsToObject(params);
        expect(result).to.deep.eq({
          name: 'Bob Smith',
          job: 'Realtor',
        });
      });
    });
  });

  describe('#ClassifyQueryParams', function() {
    context('when passed an object', function() {
      it('returns a classified object', function() {
        const result = utils.ClassifyQueryParams({
          id: 12345,
          first_name: 'Bob',
          last_name: 'Smith',
          jobTitle: 'Realtor',
          'start-date': '2000-01-01',
        });
        expect(result).to.deep.eq({
          ID: 12345,
          FirstName: 'Bob',
          LastName: 'Smith',
          JobTitle: 'Realtor',
          StartDate: '2000-01-01',
        });
      });
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

  describe('#NormalizeHeaders', function() {
    context('when passed an object with an ObjectData array', function() {
      it('produces the correct object', function() {
        const headers = {
          'Content-Type': ['image/jpeg'],
          'Content-Length': ['34565443'],
          'Content-ID': ['123456789012'],
          'Object-ID': ['1'],
          ObjectData: [
            'ListingID=9876543',
            'ListingStatus=Active',
            'PropItemNumber=1',
          ],
        };
        const result = utils.NormalizeHeaders(headers);
        expect(result).to.deep.eq({
          ContentType: 'image/jpeg',
          ContentLength: '34565443',
          ContentID: '123456789012',
          ObjectID: '1',
          ObjectData: {
            ListingID: '9876543',
            ListingStatus: 'Active',
            PropItemNumber: '1',
          },
        });
      });
    });
  });

  describe('#GenerateErrorCode', function() {
    context('when an error code with a message', function() {
      it('returns an error with that message', function() {
        const result = utils.GenerateErrorCode('20500', 'Random Error Message');
        expect(result).to.be.an('error');
        expect(result.message).to.eq('20500: Random Error Message');
      });
    });
    context('when an error code without a message', function() {
      it('returns an error with that message', function() {
        const result = utils.GenerateErrorCode('20500');
        expect(result).to.be.an('error');
        expect(result.message).to.eq('20500: Invalid Resource');
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

    context('when alternate metadata', function() {
      it('returns a parsed JSON', async function() {
        const metadataContent = helpers.readDataFile('metadata_resource_alternate.xml', 'utf8');
        const result = await utils.ParseRetsMetadata(metadataContent);
        expect(result.Objects.length).to.eq(8);
      });
    });
  });

  describe('#ParseRetsQuery', function() {
    const queryContentSimplified = `<?xml version="1.0" ?>
    <RETS ReplyCode="0" ReplyText="V2.6.0 761: Success">
      <REData>
        <Properties>
          <AllProperty>
            <Property>
              <Address>
                <DisplayStreetNumber>410</DisplayStreetNumber>
              </Address>
              <Lot>
                <Description>
                  <LotAcreage>1.36</LotAcreage>
                </Description>
              </Lot>
            </Property>
          </AllProperty>
        </Properties>
      </REData>
    </RETS>`;

    context('when processing query xml', function() {
      it('generates a json object', async function() {
        const result = await utils.ParseRetsQuery(helpers.data.propertiesXML, 'Property');
        expect(result).to.deep.eq(helpers.readDataFile('properties_flat.json', 'utf8', true));
      });
    });

    context('when a single object', function() {
      it('generates an array', async function() {
        const result = await utils.ParseRetsQuery(queryContentSimplified, 'Property');
        expect(result.Objects).to.be.an('array');
        expect(result.Objects).to.have.lengthOf(1);
        expect(result).not.to.have.property('TotalCount');
      });
    });

    context('when it the nested property can not be found', function() {
      it('returns the REData element', async function() {
        const result = await utils.ParseRetsQuery(queryContentSimplified, 'UnknownType');
        expect(result.Objects[0]).to.deep.eq({
          DisplayStreetNumber: '410',
          LotAcreage: '1.36',
        });
      });
    });

    context('when pass in flatten', function() {
      it('returns a flatten object', async function() {
        const result = await utils.ParseRetsQuery(queryContentSimplified, 'Property', true);
        expect(result.Objects[0]).to.deep.eq({
          DisplayStreetNumber: '410',
          LotAcreage: '1.36',
        });
      });
    });

    context('when not a REData xml', function() {
      it('returns an empty array', async function() {
        const result = await utils.ParseRetsQuery(helpers.data.metadataClassXML, 'Property');
        expect(result).to.deep.eq({
          Count: 0,
          Objects: [],
        });
      });
    });
  });

  describe('#ParseRetsResponseXML', function() {
    context('when valid XML content', function() {
      it('returns an valid object', async function() {
        const xmlContent = `<?xml version="1.0" ?>
        <RETS ReplyCode="0" ReplyText="V2.6.0 761: Success">
          <REData>
            <Properties>
              <AllProperty>
                <Property>
                  <Address>
                    <DisplayStreetNumber>410</DisplayStreetNumber>
                  </Address>
                  <Lot>
                    <Description>
                      <LotAcreage>1.36</LotAcreage>
                    </Description>
                  </Lot>
                </Property>
              </AllProperty>
            </Properties>
          </REData>
        </RETS>`;
        const result = await utils.ParseRetsResponseXML(xmlContent);
        expect(result).to.deep.eq({
          $: {
            ReplyCode: '0',
            ReplyText: 'V2.6.0 761: Success',
          },
          REData: {
            Properties: {
              AllProperty: {
                Property: {
                  Address: {
                    DisplayStreetNumber: '410',
                  },
                  Lot: {
                    Description: {
                      LotAcreage: '1.36',
                    },
                  },
                },
              },
            },
          },
        });
      });
    });

    context('when RETS-RESPONSE is in body', function() {
      it('processes the body as key value objects', async function() {
        const xmlContent = helpers.buildLoginResponse();
        const result = await utils.ParseRetsResponseXML(xmlContent);
        expect(result).to.deep.eq({
          $: {
            ReplyCode: '0',
            ReplyText: 'V2.6.0 761: Success',
          },
          'RETS-RESPONSE': {
            MemberName: 'Treutel Group',
            User: 'username, User:Class:String, 90, 98765',
            Broker: '12345',
            MetadataVersion: '1.2.3456',
            MetadataTimestamp: '2020-04-04T18:45:19.324Z',
            MinMetadataTimestamp: '2000-04-04T18:45:19.324Z',
            OfficeList: '54321',
            TimeoutSeconds: '1800',
            Info: 'TimeoutSeconds;1800',
            Action: 'https://mockrets.com/get?Command',
            ChangePassword: 'https://mockrets.com/changepassword',
            Search: 'https://mockrets.com/search',
            GetMetadata: 'https://mockrets.com/getmetadata',
            Logout: 'https://mockrets.com/logout',
            GetObject: 'https://mockrets.com/getobject',
            Login: 'https://mockrets.com/login',
            LoginComplete: 'https://mockrets.com/logincomplete',
            Get: 'https://mockrets.com/get',
            Update: 'https://mockrets.com/update',
          },
        });
      });
    });

    context('when multiple rows of compact format', function() {
      it('should return an array of objects', async function() {
        const xmlContent = `<?xml version="1.0" ?>
        <RETS ReplyCode="0" ReplyText="V2.6.0 761: Success">
          <COUNT Records="1"/>
          <DELIMITER value="2C" />
          <COLUMNS>,Col1,Col2</COLUMNS>
          <DATA>,R1V1,R1V2</DATA>
          <DATA>,R2V1,R2V2</DATA>
          <MAXROWS />
        </RETS>`;
        const result = await utils.ParseRetsResponseXML(xmlContent);
        expect(result.DATA).to.deep.eq([
          { Col1: 'R1V1', Col2: 'R1V2' },
          { Col1: 'R2V1', Col2: 'R2V2' },
        ]);
      });
    });

    context('when single row of compact format', function() {
      it('should return an array of objects', async function() {
        const xmlContent = `<?xml version="1.0" ?>
        <RETS ReplyCode="0" ReplyText="V2.6.0 761: Success">
          <COUNT Records="1"/>
          <DELIMITER value="2C" />
          <COLUMNS>,Col1,Col2</COLUMNS>
          <DATA>,R1V1,R1V2</DATA>
          <MAXROWS />
        </RETS>`;
        const result = await utils.ParseRetsResponseXML(xmlContent);
        expect(result.DATA).to.deep.eq([
          { Col1: 'R1V1', Col2: 'R1V2' },
        ]);
      });
    });

    context('when no RETS element exist', function() {
      it('returns the root element', async function() {
        const xmlContentSimple = `<?xml version="1.0" ?>
        <TopLevel><Name>Sample Name</Name></TopLevel>`;

        const result = await utils.ParseRetsResponseXML(xmlContentSimple);
        expect(result).to.deep.eq({
          TopLevel: {
            Name: 'Sample Name',
          },
        });
      });
    });

    context('when no content passed in', function() {
      it('returns null', async function() {
        const result = await utils.ParseRetsResponseXML('').catch(e => e);
        expect(result).to.eq(null);
      });
    });

    context('when not XML content', function() {
      it('throws an error', async function() {
        const result = await utils.ParseRetsResponseXML('Invalid XML Content').catch(e => e);
        expect(result).to.be.an('error');
      });
    });

    context('when XML is a known error', function() {
      it('throws an known error', async function() {
        const errorXML = `<?xml version="1.0" ?>
        <RETS ReplyCode="20502" ReplyText="V2.6.0 761: Unknown id for METADATA-CLASS: PropertySample">
        </RETS>`;
        const result = await utils.ParseRetsResponseXML(errorXML).catch(e => e);
        expect(result).to.be.an('error');
        expect(result.message).to.match(/20502/);
        expect(result.message).to.match(/Unknown id for METADATA-CLASS: PropertySample/);
      });
    });

    context('when XML is an unknown error', function() {
      it('throws an known error', async function() {
        const errorXML = `<?xml version="1.0" ?>
        <RETS ReplyCode="3333" ReplyText="Unknown error code">
        </RETS>`;
        const result = await utils.ParseRetsResponseXML(errorXML).catch(e => e);
        expect(result).to.be.an('error');
        expect(result.message).to.match(/An error occurred/);
      });
    });
  });

  describe('#ParseMultipartRetsResponse', function() {
    context('when receiving a multipart buffer', function() {
      it('generates the correct response', async function() {
        const result = await utils.ParseMultipartRetsResponse(buff, 'simple boundary');
        const resultImages = result.map(r => r.data);
        const resultWithoutImage = result.map(r => omit(r, 'data'));

        expect(resultWithoutImage).to.deep.eq(helpers.data.multipartJSON);
        expect(resultImages[0].length).to.eq(helpers.readDataFile('image_1.jpg', 'binary').length);
        expect(resultImages[1].length).to.eq(helpers.readDataFile('image_2.jpg', 'binary').length);
      });
    });

    context('when receiving a multipart buffer with xml content', function() {
      it('generates the correct response', async function() {
        const result = await utils.ParseMultipartRetsResponse(buffXML, 'simple boundary');
        expect(result).to.deep.eq(helpers.data.multipartXMLJSON);
      });
    });

    context('when an error while processing a multipart buffer', function() {
      it('throws an error', async function() {
        const result = await utils.ParseMultipartRetsResponse(buff, 'incorrect boundary').catch(e => e);

        expect(result).to.be.an('error');
        expect(result.message).to.eq('Error Processing Multipart Response');
      });
    });
  });

  describe('#ParseRetsObjectResponse', function() {
    const response = {
      headers: {
        'content-type': 'multipart/parallel; boundary="simple boundary"',
      },
      raw: buff,
    };

    context('when a multipart parallel response', function() {
      it('returns the correct response', async function() {
        const result = await utils.ParseRetsObjectResponse(response);
        const resultImages = result.map(r => r.data);
        const resultWithoutImage = result.map(r => omit(r, 'data'));

        expect(resultWithoutImage).to.deep.eq(helpers.data.multipartJSON);
        expect(resultImages[0].length).to.eq(helpers.readDataFile('image_1.jpg', 'binary').length);
        expect(resultImages[1].length).to.eq(helpers.readDataFile('image_2.jpg', 'binary').length);
      });
    });

    context('when a different RETS response', function() {
      it('processes it anyway', async function() {
        const xmlResponse = {
          headers: {
            'content-type': 'text/xml',
          },
          raw: helpers.readDataFile('properties_compact.xml'),
        };
        const result = await utils.ParseRetsObjectResponse(xmlResponse);
        expect(result).to.deep.eq(helpers.readDataFile('properties_compact.json', 'utf8', true));
      });
    });

    context('when not a multipart parallel response', function() {
      it('returns original response', async function() {
        const nonResponse = {
          headers: {
            'content-type': 'text/plain',
          },
          body: 'Hello World',
        };

        const result = await utils.ParseRetsObjectResponse(nonResponse);
        expect(result).to.deep.eq(nonResponse);
      });
    });
  });
});

const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const { omit } = require('underscore');

const helpers = require('./helpers.js');

const http = require('../lib/http.js');
const log = require('../lib/logger.js');
const utils = require('../lib/utils.js');

const { md5 } = utils;

const RETSClient = require('../lib/client.js');

const parseDigestHeader = header => Object.fromEntries(
  header.replace(/digest/i, '').trim().split(', ').map(x => x.trim().split('=').map(v => v.replace(/"/g, '').trim())),
);

const generateResponseKeyFromHeader = (digestHeaders, username, password, useQOP = true, method = 'GET') => {
  const ha1 = md5(`${username}:${digestHeaders.realm}:${password}`);
  const ha2 = md5(`${method.toUpperCase()}:${digestHeaders.uri}`);

  if (useQOP) {
    return md5([
      ha1,
      digestHeaders.nonce,
      digestHeaders.nc,
      digestHeaders.cnonce,
      digestHeaders.qop,
      ha2,
    ].join(':'));
  }
  return md5([
    ha1,
    digestHeaders.nonce,
    ha2,
  ].join(':'));
};

const configuration = {
  loginUrl: 'https://mockrets.com/login',
  username: 'username',
  password: 'password',
  userAgent: 'RETS-Connector/1.2',
  userAgentPassword: '123456',
};

const baseUrl = 'https://mockrets.com';

describe('RETSClient', function() {
  afterEach(function() {
    nock.cleanAll();
    nock.restore();
    sinon.restore();
  });

  beforeEach(function() {
    if (!nock.isActive()) {
      nock.activate();
    }
    sinon.stub(log);
  });

  describe('#login', function() {
    context('when using digest RFC-2069', function() {
      it('authenticates correctly', async function() {
        nock.disableNetConnect();

        let requestNo = 0;
        const nockedRequest = helpers.retsLogin(configuration.loginUrl, undefined, false);
        nockedRequest.on('request', (req, interceptor) => {
          if (requestNo === 0) {
            requestNo += 1;
            expect(interceptor.headers['www-authenticate']).to.be.a('string');
          } else if (requestNo === 1) {
            requestNo += 1;
            expect(interceptor.req.headers.authorization).to.be.a('string');
            const headers = parseDigestHeader(interceptor.req.headers.authorization);
            const expectedResponse = generateResponseKeyFromHeader(headers, configuration.username, configuration.password, false);
            expect(headers.response).to.eq(expectedResponse);
          }
        });
        const client = new RETSClient(configuration);
        return client.login();
      });
    });

    context('when using digest RFC-2617', function() {
      it('authenticates correctly', async function() {
        nock.disableNetConnect();

        let requestNo = 0;
        const nockedRequest = helpers.retsLogin(configuration.loginUrl, undefined, true);
        nockedRequest.on('request', (req, interceptor) => {
          if (requestNo === 0) {
            requestNo += 1;
            expect(interceptor.headers['www-authenticate']).to.be.a('string');
          } else if (requestNo === 1) {
            requestNo += 1;
            expect(interceptor.req.headers.authorization).to.be.a('string');
            const headers = parseDigestHeader(interceptor.req.headers.authorization);
            const expectedResponse = generateResponseKeyFromHeader(headers, configuration.username, configuration.password, true);
            expect(headers.response).to.eq(expectedResponse);
          }
        });
        const client = new RETSClient(configuration);
        return client.login();
      });
    });

    context('logged in member name not included', function() {
      it('only logs logged in', async function() {
        nock.disableNetConnect();
        helpers.retsLogin(configuration.loginUrl, helpers.buildLoginResponse(undefined, null), true);

        const client = new RETSClient(configuration);
        await client.login();
        expect(log.info.firstCall.args[0]).to.match(/Logged In/);
        expect(log.info.firstCall.args[0]).to.not.match(/As/);
      });
    });

    context('when a 401 error is return', function() {
      it('throws an error with the code', async function() {
        nock.disableNetConnect();
        nock(baseUrl)
        .get('/login')
        .reply(401, 'Unauthorized');

        const client = new RETSClient(configuration);
        const result = await client.login().catch(e => e);
        expect(result).to.be.an('error');
      });
    });


    context('when a RETS-Session-ID is returned in set-cookie', function() {
      it('sets the sessionId on the client', async function() {
        nock.disableNetConnect();
        nock(baseUrl)
        .get('/login')
        .reply(200, helpers.buildLoginResponse(baseUrl), {
          'set-cookie': [
            'RETS-Session-ID=987654321; Path=/',
          ],
        });

        const client = new RETSClient(configuration);
        await client.login();
        expect(client.sessionId).to.eq('987654321');
      });
    });

    context('when a RETS-Session-ID is not returned in set-cookie', function() {
      it('sets the sessionId on the client', async function() {
        nock.disableNetConnect();
        nock(baseUrl)
        .get('/login')
        .reply(200, helpers.buildLoginResponse(baseUrl));

        const client = new RETSClient(configuration);
        await client.login();
        expect(client.sessionId).to.eq(null);
      });
    });

    context('when http.request throws an error', function() {
      it('throws an error', async function() {
        sinon.stub(http, 'request').throws(new Error('Unknown Error'));
        const client = new RETSClient(configuration, log);
        const result = await client.login().catch(e => e);
        expect(result).to.be.an('error').and.matches(/Unknown Error/);
      });
    });
  });

  describe('#logout', function() {
    context('when not logged in', function() {
      it('does not make an http request', async function() {
        const stub = sinon.stub(http, 'request');

        const client = new RETSClient(configuration);
        const result = await client.logout();
        expect(result).to.eq(false);
        expect(stub.called).to.eq(false);
      });
    });

    context('when no logout methodUrl', function() {
      it('does not make an http request', async function() {
        nock.disableNetConnect();
        helpers.retsLogin(configuration.loginUrl);

        const client = new RETSClient(configuration);

        await client.login();

        delete client.methodUrls.LOGOUT;
        const stub = sinon.stub(http, 'request');

        const result = await client.logout();
        expect(result).to.eq(false);
        expect(stub.called).to.eq(false);
      });
    });

    context('when logout is successful', function() {
      it('return true', async function() {
        nock.disableNetConnect();
        const nockedRequest = helpers.retsLogin(configuration.loginUrl);
        helpers.addRetsLogout(nockedRequest);

        const client = new RETSClient(configuration);

        await client.login();

        const result = await client.logout();
        expect(result).to.eq(true);
      });
    });

    context('when http.request throws an error', function() {
      it('throws an error', async function() {
        nock.disableNetConnect();
        const nockedRequest = helpers.retsLogin(configuration.loginUrl);
        helpers.addRetsLogout(nockedRequest);

        const client = new RETSClient(configuration);

        await client.login();
        sinon.stub(http, 'request').throws(new Error('Unknown Error'));

        const result = await client.logout().catch(e => e);
        expect(result).to.be.an('error').and.matches(/Unknown Error/);
      });
    });

    context('when logout includes connection time', function() {
      it('loggs the time', async function() {
        nock.disableNetConnect();
        const nockedRequest = helpers.retsLogin(configuration.loginUrl);
        helpers.addRetsLogout(nockedRequest);

        const infoStub = log.info;

        const client = new RETSClient(configuration);

        await client.login();
        await client.logout();
        expect(infoStub.getCall(1).args[0]).to.match(/Connected Time/);
      });
    });

    context('when logout does not include connection time', function() {
      it('does not log a connected time message', async function() {
        nock.disableNetConnect();
        const nockedRequest = helpers.retsLogin(configuration.loginUrl);
        helpers.addRetsLogout(nockedRequest, false);

        const infoStub = log.info;

        const client = new RETSClient(configuration);

        await client.login();
        await client.logout();
        expect(infoStub.getCall(1).args[0]).to.match(/Logged Out/);
      });
    });
  });

  describe('#metadata', function() {
    afterEach(function() {
      sinon.restore();
    });

    context('when no arguments are passed', function() {
      it('returns RESOURCE metadata', async function() {
        nock.disableNetConnect();
        const nockedRequest = helpers.retsLogin(configuration.loginUrl);
        nockedRequest.get('/getmetadata')
        .query({
          Type: 'METADATA-RESOURCE',
          ID: 0,
          Format: 'STANDARD-XML',
        })
        .reply(
          200,
          helpers.readDataFile('metadata_resource.xml'),
          {
            'Content-Type': 'text/xml',
          },
        );

        const client = new RETSClient(configuration);
        const result = await client.metadata();
        expect(result).to.deep.eq(helpers.readDataFile('metadata_resource.json', 'utf8', true));
      });
    });

    context('when a resource and id passwd in', function() {
      it('returns the correct metadata', async function() {
        nock.disableNetConnect();
        const nockedRequest = helpers.retsLogin(configuration.loginUrl);
        helpers.addRetsMedataData(nockedRequest);

        const client = new RETSClient(configuration);
        const result = await client.metadata('CLASS', 'Property');
        expect(result).to.deep.eq(helpers.readDataFile('metadata_class_property.json', 'utf8', true));
      });
    });

    context('when already logged in', function() {
      it('does not log in again', async function() {
        nock.disableNetConnect();
        const nockedRequest = helpers.retsLogin(configuration.loginUrl);
        helpers.addRetsMedataData(nockedRequest);

        const client = new RETSClient(configuration);
        const spy = sinon.spy(client, 'login');

        await client.login();
        await client.metadata('CLASS', 'Property');

        expect(spy.callCount).to.eq(1);
      });
    });

    context('when an unknown metadata type', function() {
      it('throws an error', async function() {
        const client = new RETSClient(configuration);
        const result = await client.metadata('Unknown_Resource_Type').catch(e => e);
        expect(result).to.be.an('error');
        expect(result.message).to.eq('Invalid Resource Type: Unknown_Resource_Type');
      });
    });
  });

  describe('#search', function() {
    context('when valid search criteria', function() {
      it('returns the search results', async function() {
        const query = '(ModificationTimestamp=2020-03-17T01:19:11+)';
        const options = {
          Limit: 2,
          Offset: 1,
        };

        nock.disableNetConnect();
        const nockedRequest = helpers.retsLogin(configuration.loginUrl);
        helpers.addRetsSearch(nockedRequest, query, options, 'COMPACT');

        const client = new RETSClient(configuration);
        const result = await client.search('Property', 'ALL', query, options);
        expect(result).to.deep.eq(helpers.readDataFile('properties_flat.json', 'utf8', true));
      });
    });

    context('when already logged in', function() {
      it('does not log in again', async function() {
        const query = '(ModificationTimestamp=2020-03-17T01:19:11+)';
        const options = {
          Limit: 2,
          Offset: 1,
        };

        nock.disableNetConnect();
        const nockedRequest = helpers.retsLogin(configuration.loginUrl);
        helpers.addRetsSearch(nockedRequest, query, options, 'COMPACT');

        const client = new RETSClient(configuration);
        const spy = sinon.spy(client, 'login');

        await client.login();
        await client.search('Property', 'ALL', query, options);

        expect(spy.callCount).to.eq(1);
      });
    });
  });

  describe('#getObject', function() {
    context('when parameters', function() {
      it('returns proper results', async function() {
        const propertyId = '123456789012:1:2';

        nock.disableNetConnect();
        const nockedRequest = helpers.retsLogin(configuration.loginUrl);
        helpers.addRetsGetObject(nockedRequest, propertyId);

        const client = new RETSClient(configuration);
        const result = await client.getObject('Property', 'Photo', propertyId);

        const resultImages = result.map(r => r.data);
        const resultWithoutImage = result.map(r => omit(r, 'data'));

        expect(resultWithoutImage).to.deep.eq(helpers.data.multipartJSON);
        expect(resultImages[0].length).to.eq(helpers.readDataFile('image_1.jpg', 'binary').length);
        expect(resultImages[1].length).to.eq(helpers.readDataFile('image_2.jpg', 'binary').length);
      });
    });

    context('when already logged in', function() {
      it('does not log in again', async function() {
        const propertyId = '123456789012:1:2';

        nock.disableNetConnect();
        const nockedRequest = helpers.retsLogin(configuration.loginUrl);
        helpers.addRetsGetObject(nockedRequest, propertyId);

        const client = new RETSClient(configuration);
        const spy = sinon.spy(client, 'login');

        await client.login();
        await client.getObject('Property', 'Photo', propertyId);

        expect(spy.callCount).to.eq(1);
      });
    });
  });
});

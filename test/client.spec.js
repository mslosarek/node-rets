const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

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
        const client = new RETSClient(configuration, log);
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
        const client = new RETSClient(configuration, log);
        return client.login();
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

        const client = new RETSClient(configuration, log);
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

        const client = new RETSClient(configuration, log);
        await client.login();
        expect(client.sessionId).to.eq(null);
      });
    });

    context('when http.request throws an error', function() {
      it('throws an error', async function() {
        sinon.stub(http, 'request').throws(new Error('Unknown Error'));
        sinon.stub(log, 'error');
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

        const client = new RETSClient(configuration, log);
        const result = await client.logout();
        expect(result).to.eq(false);
        expect(stub.called).to.eq(false);
      });
    });

    context('when no logout methodUrl', function() {
      it('does not make an http request', async function() {
        nock.disableNetConnect();
        helpers.retsLogin(configuration.loginUrl);

        const client = new RETSClient(configuration, log);

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
        sinon.stub(log, 'info');

        const client = new RETSClient(configuration, log);

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
        sinon.stub(log, 'info');

        const client = new RETSClient(configuration, log);

        await client.login();
        sinon.stub(http, 'request').throws(new Error('Unknown Error'));
        sinon.stub(log, 'error');

        const result = await client.logout().catch(e => e);
        expect(result).to.be.an('error').and.matches(/Unknown Error/);
      });
    });
  });
});

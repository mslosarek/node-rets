const { expect } = require('chai');
const sinon = require('sinon');

const RETS = require('../lib');
const log = require('../lib/logger');

describe('NodeRETS', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('#initialize', function() {
    context('when initialized with out any configuration', function() {
      it('throws an error', function() {
        expect(RETS.initialize).to.throw('No Configuration');
      });
    });

    context('when initialized with configuration', function() {
      it('returns a client instance', function() {
        const configuration = {
          loginUrl: 'https://login.url/',
          username: 'username',
          password: 'password',
        };

        const result = RETS.initialize(configuration);

        expect(typeof result.login).to.eq('function');
        expect(typeof result.logout).to.eq('function');
      });
    });

    context('when logLevel is passed in', function() {
      it('changes the level in the logger', function() {
        expect(log.level).to.eq('info');
        const configuration = {
          loginUrl: 'https://login.url/',
          username: 'username',
          password: 'password',
          logLevel: 'error',
        };
        RETS.initialize(configuration);
        expect(log.level).to.eq('error');
      });
    });
  });
});

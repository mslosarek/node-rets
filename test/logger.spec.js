const { expect } = require('chai');
const sinon = require('sinon');

const log = require('../lib/logger');

describe('Logger', function() {
  context('when log level is debug', function() {
    it('should write to the console for messages', function() {
      const logs = [];

      sinon.replace(process.stdout, 'write', msg => {
        logs.push(msg);
        return true;
      });

      log.level = 'debug';
      const srcObject = { object: true };
      log.info(srcObject);
      log.debug('debug message 1');
      log.info('info message 1');
      log.warn('warn message 1');
      log.error('error message 1');

      log.level = 'error';

      log.debug('debug message 2');
      log.info('info message 2');
      log.warn('warn message 2');
      log.error('error message 2');

      sinon.restore();

      expect(logs.length).to.eq(6);
      expect(logs[0]).to.have.string('object: true');
      expect(logs[1]).to.have.string('debug message 1');
      expect(logs[2]).to.have.string('info message 1');
      expect(logs[3]).to.have.string('warn message 1');
      expect(logs[4]).to.have.string('error message 1');
      expect(logs[5]).to.have.string('error message 2');
    });
  });
});

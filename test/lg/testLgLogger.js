const assert = require('assert');
const LgLogger = require('../../src/lg/lg_logger');

describe('lg_logger', function () {
  it('exposes singleton instance', function () {
    assert.strictEqual(LgLogger.instance.lg, 'loupgarou');
  });

  it('methods do not throw', function () {
    const info = { serverName: 'srv', gameNb: '1' };
    assert.doesNotThrow(() => LgLogger.info('a', info));
    assert.doesNotThrow(() => LgLogger.warn('b', info));
    assert.doesNotThrow(() => LgLogger.debug('c', info));
    assert.doesNotThrow(() => LgLogger.error('d', info));
  });
});

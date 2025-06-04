const assert = require('assert');
const timeToString = require('../../src/functions/time');

describe('timeToString', function () {
  it('formats minutes less than one', function () {
    assert.strictEqual(timeToString(0.5), '0m30s');
  });

  it('formats minutes and seconds', function () {
    assert.strictEqual(timeToString(5), '5m0s');
  });

  it('formats hours when greater than 60 minutes', function () {
    assert.strictEqual(timeToString(90), '2h30m0s');
  });
});

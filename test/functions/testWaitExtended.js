const sinon = require('sinon');
const assert = require('assert');
const {Wait} = require('../../src/functions/wait');

describe('Wait extended', function () {
  let clock;
  beforeEach(function () { clock = sinon.useFakeTimers(); });
  afterEach(function () { clock.restore(); });

  const cases = [
    ['hours', 3600 * 1000],
    ['days', 24 * 3600 * 1000],
    ['weeks', 7 * 24 * 3600 * 1000],
    ['months', 30 * 24 * 3600 * 1000],
    ['years', 365 * 24 * 3600 * 1000]
  ];

  cases.forEach(([method, ms]) => {
    it(`resolves after ${method}`, async function () {
      const p = Wait[method](1);
      clock.tick(ms);
      const res = await p;
      assert.strictEqual(res, true);
    });
  });
});

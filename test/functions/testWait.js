const sinon = require('sinon');
const assert = require('assert');
const {Wait} = require('../../src/functions/wait');

describe('Wait', function () {
  let clock;
  beforeEach(function () {
    clock = sinon.useFakeTimers();
  });
  afterEach(function () {
    clock.restore();
  });

  it('resolves after given seconds', async function () {
    const p = Wait.seconds(2);
    clock.tick(2000);
    const res = await p;
    assert.strictEqual(res, true);
  });

  it('resolves after given minutes', async function () {
    const p = Wait.minutes(1);
    clock.tick(60000);
    const res = await p;
    assert.strictEqual(res, true);
  });
});

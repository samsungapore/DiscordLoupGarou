const assert = require('assert');
const BotData = require('../../src/BotData');

describe('BotData', function () {
  it('exports expected properties', function () {
    assert.ok(BotData.BotValues);
    assert.ok(BotData.GoogleSheet);
    assert.ok(BotData.LG);
    assert.ok(BotData.Settings);
  });
});

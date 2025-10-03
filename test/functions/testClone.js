const assert = require('assert');
const clone = require('../../src/functions/clone');

describe('clone', function () {
  it('should deeply clone objects', function () {
    const obj = {a: 1, b: {c: 2}};
    const copy = clone(obj);
    assert.deepStrictEqual(copy, obj);
    assert.notStrictEqual(copy, obj);
    assert.notStrictEqual(copy.b, obj.b);
  });

  it('should clone arrays', function () {
    const arr = [1, {a: 2}];
    const copy = clone(arr);
    assert.deepStrictEqual(copy, arr);
    assert.notStrictEqual(copy, arr);
    assert.notStrictEqual(copy[1], arr[1]);
  });

  it('should clone dates', function () {
    const date = new Date();
    const copy = clone(date);
    assert.deepStrictEqual(copy.getTime(), date.getTime());
    assert.notStrictEqual(copy, date);
  });
});

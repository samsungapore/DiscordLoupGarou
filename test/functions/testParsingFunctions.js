const assert = require('assert');
const sinon = require('sinon');
const {shuffle_array, get_random_index, get_random_in_array} = require('../../src/functions/parsing_functions');

describe('parsing_functions', function () {
  describe('shuffle_array', function () {
    it('shuffles array using Math.random', function () {
      const stub = sinon.stub(Math, 'random').returns(0.5);
      const arr = [1, 2, 3, 4];
      const result = shuffle_array(arr.slice());
      assert.deepStrictEqual(result.sort(), arr);
      stub.restore();
    });
  });

  describe('get_random_index', function () {
    it('returns index based on Math.random', function () {
      const stub = sinon.stub(Math, 'random').returns(0.75);
      const idx = get_random_index([1,2,3,4]);
      assert.strictEqual(idx, Math.floor(0.75 * 4));
      stub.restore();
    });
  });

  describe('get_random_in_array', function () {
    it('returns element based on Math.random', function () {
      const stub = sinon.stub(Math, 'random').returns(0.3);
      const arr = ['a', 'b', 'c'];
      const val = get_random_in_array(arr);
      assert.strictEqual(val, arr[Math.floor(0.3 * arr.length)]);
      stub.restore();
    });
  });
});

const assert = require('assert');
const lgFunctions = require('../../src/lg/lg_functions');

describe('lg_functions', function () {
  describe('find_user', function () {
    it('finds user by nickname or username', function () {
      const member1 = { nickname: 'Foo', user: { username: 'fooUser' } };
      const member2 = { nickname: null, user: { username: 'bar' } };
      const guild = { members: { cache: { array: () => [member1, member2] } } };
      const res1 = lgFunctions.find_user('foo', guild);
      assert.strictEqual(res1, member1);
      const res2 = lgFunctions.find_user('bar', guild);
      assert.strictEqual(res2, member2);
    });

    it('returns null when user not found', function () {
      const guild = { members: { cache: { array: () => [] } } };
      const res = lgFunctions.find_user('none', guild);
      assert.strictEqual(res, null);
    });
  });

  describe('get_random_index', function () {
    it('returns 0 for single element array', function () {
      assert.strictEqual(lgFunctions.get_random_index([42]), 0);
    });

    it('returns index within array length', function () {
      const arr = [1, 2, 3];
      const idx = lgFunctions.get_random_index(arr);
      assert.ok(idx >= 0 && idx < arr.length);
    });
  });
});

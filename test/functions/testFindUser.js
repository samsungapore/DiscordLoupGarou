const assert = require('assert');
const {find_user} = require('../../src/functions/find_user');

describe('find_user', function () {
  const member1 = { nickname: 'Alpha', user: { username: 'userA' } };
  const member2 = { nickname: null, user: { username: 'BetaUser' } };
  const guild = { members: { cache: { array: () => [member1, member2] } } };
  const client = { guilds: { cache: { array: () => [guild] } } };

  it('finds by nickname case-insensitively', function () {
    const result = find_user(client, 'alpha');
    assert.strictEqual(result, member1);
  });

  it('finds by username if no nickname', function () {
    const result = find_user(client, 'BetaUser');
    assert.strictEqual(result, member2);
  });

  it('trims and lowers search string', function () {
    const result = find_user(client, '  ALPHA  ');
    assert.strictEqual(result, member1);
  });
});

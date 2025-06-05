const assert = require('assert');
const referendum = require('../../src/functions/cmds/referendum');

class FakeSondage {
  post() { return Promise.resolve([[1]]); }
}
referendum.SondageInfiniteChoice = FakeSondage;

delete require.cache[require.resolve('../../src/lg/lg_vote')];
const { LoupGarouVote } = require('../../src/lg/lg_vote');

describe('lg_vote', function () {
  it('runVote excludes ids and returns vote result', async function () {
    const config = {
      _players: new Map([
        ['1', { member: { id: '1', displayName: 'A' }, alive: true }],
        ['2', { member: { id: '2', displayName: 'B' }, alive: true }],
        ['3', { member: { id: '3', displayName: 'C' }, alive: false }]
      ]),
      getPlayersIdName() {
        const m = new Map();
        for (const [id, p] of this._players) {
          m.set(id, p.member.displayName);
        }
        return m;
      },
      getLG() { return [1, 2]; }
    };

    const vote = new LoupGarouVote('q', config, 0, {});
    vote.excludeDeadPlayers();
    const result = await vote.runVote(['1']);
    assert.deepStrictEqual(result, ['2']);
  });
});

const assert = require('assert');
const GameRepository = require('../../src/services/GameRepository');

class FakeDB {
    constructor() {
        this.lastRun = null;
    }

    async get(sql, params) {
        const id = Array.isArray(params) ? params[0] : params;
        if (id === 999) return null;
        return {
            id,
            running: 1,
            game: 'test-game',
            canRun: '["a","b"]',
            stemming: 'stem'
        };
    }

    async run(sql, params) {
        this.lastRun = {sql, params};
        if (/INSERT OR REPLACE/i.test(sql)) return {changes: 1};
        if (/UPDATE/i.test(sql)) return {changes: 2};
        if (/DELETE/i.test(sql)) return {changes: 1};
        return {changes: 0};
    }

    async all(/* sql */) {
        return [
            {id: 1, running: 0, game: null, canRun: '[]', stemming: null, created_at: 'c1', updated_at: 'u1'},
            {id: 2, running: 1, game: 'g2', canRun: '[1,2]', stemming: 's2', created_at: 'c2', updated_at: 'u2'},
        ];
    }
}

describe('GameRepository', () => {
    it('findById returns transformed object', async () => {
        const repo = new GameRepository(new FakeDB());
        const data = await repo.findById(1);
        assert.deepStrictEqual(data, {running: true, game: 'test-game', canRun: ['a', 'b'], stemming: 'stem'});
    });

    it('findById returns null when not found', async () => {
        const repo = new GameRepository(new FakeDB());
        const data = await repo.findById(999);
        assert.strictEqual(data, null);
    });

    it('save returns affected rows and serializes canRun', async () => {
        const db = new FakeDB();
        const repo = new GameRepository(db);
        const changes = await repo.save({running: false, game: 'abc', canRun: [1, 2], stemming: 'st'});
        assert.strictEqual(changes, 1);
        assert.ok(db.lastRun);
        assert.strictEqual(db.lastRun.params[0], 1);
        assert.strictEqual(db.lastRun.params[3], JSON.stringify([1, 2]));
    });

    it('update returns changes count and serializes canRun', async () => {
        const db = new FakeDB();
        const repo = new GameRepository(db);
        const changes = await repo.update(5, {running: true, game: 'z', canRun: ['x'], stemming: 'st2'});
        assert.strictEqual(changes, 2);
        assert.ok(db.lastRun);
        assert.strictEqual(db.lastRun.params[4], 5);
        assert.strictEqual(db.lastRun.params[1], 'z');
        assert.strictEqual(db.lastRun.params[2], JSON.stringify(['x']));
        assert.strictEqual(db.lastRun.params[3], 'st2');
    });

    it('delete returns true/false based on changes', async () => {
        const db = new FakeDB();
        const repo = new GameRepository(db);
        const ok = await repo.delete(1);
        assert.strictEqual(ok, true);
    });

    it('findGame delegates to id=1', async () => {
        const repo = new GameRepository(new FakeDB());
        const data = await repo.findGame();
        assert.strictEqual(data.game, 'test-game');
    });

    it('findAll returns transformed list', async () => {
        const repo = new GameRepository(new FakeDB());
        const list = await repo.findAll();
        assert.strictEqual(list.length, 2);
        assert.deepStrictEqual(list[0], {
            id: 1,
            running: false,
            game: null,
            canRun: [],
            stemming: null,
            created_at: 'c1',
            updated_at: 'u1'
        });
        assert.deepStrictEqual(list[1], {
            id: 2,
            running: true,
            game: 'g2',
            canRun: [1, 2],
            stemming: 's2',
            created_at: 'c2',
            updated_at: 'u2'
        });
    });
});

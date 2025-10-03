const assert = require('assert');
const clone = require('../../src/functions/clone');

describe('clone', function () {
    it('returns primitives unchanged', function () {
        assert.strictEqual(clone(null), null);
        assert.strictEqual(clone(undefined), undefined);
        assert.strictEqual(clone(42), 42);
        assert.strictEqual(clone('x'), 'x');
        assert.strictEqual(clone(true), true);
    });

    it('clones Date correctly', function () {
        const d = new Date('2020-01-01T00:00:00Z');
        const c = clone(d);
        assert.notStrictEqual(c, d);
        assert.strictEqual(c.getTime(), d.getTime());
    });

    it('deep clones arrays and nested objects', function () {
        const obj = {a: 1, b: {c: [1, {d: 4}]}};
        const c = clone(obj);
        assert.deepStrictEqual(c, obj);
        assert.notStrictEqual(c, obj);
        assert.notStrictEqual(c.b, obj.b);
        assert.notStrictEqual(c.b.c, obj.b.c);
        c.b.c[1].d = 5;
        assert.strictEqual(obj.b.c[1].d, 4);
    });
});

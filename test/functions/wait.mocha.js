const assert = require('assert');
const {Wait} = require('../../src/functions/wait');

describe('Wait', function () {
    this.timeout(3000);

    it('resolves seconds(0) immediately', async function () {
        const ok = await Wait.seconds(0);
        assert.strictEqual(ok, true);
    });

    it('resolves minutes/hours/days(0) immediately', async function () {
        const [m, h, d] = await Promise.all([
            Wait.minutes(0),
            Wait.hours(0),
            Wait.days(0)
        ]);
        assert.strictEqual(m, true);
        assert.strictEqual(h, true);
        assert.strictEqual(d, true);
    });

    it('resolves weeks/months/years(0) immediately', async function () {
        const [w, mo, y] = await Promise.all([
            Wait.weeks(0),
            Wait.months(0),
            Wait.years(0)
        ]);
        assert.strictEqual(w, true);
        assert.strictEqual(mo, true);
        assert.strictEqual(y, true);
    });
});

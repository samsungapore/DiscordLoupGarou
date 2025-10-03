const assert = require('assert');
const parsing = require('../../src/functions/parsing_functions');

describe('parsing_functions', function () {
    describe('shuffle_array', function () {
        it('keeps same elements after shuffle', function () {
            const arr = [1, 2, 3, 4, 5];
            const copy = arr.slice();
            const shuffled = parsing.shuffle_array(copy);
            assert.strictEqual(shuffled.length, arr.length);
            // Compare sorted to avoid order dependency
            assert.deepStrictEqual(shuffled.slice().sort(), arr.slice().sort());
        });
    });

    describe('get_random_index', function () {
        it('returns 0 for single-element array', function () {
            assert.strictEqual(parsing.get_random_index([7]), 0);
        });

        it('returns an index within bounds', function () {
            const arr = new Array(10).fill(0);
            for (let i = 0; i < 100; i++) {
                const idx = parsing.get_random_index(arr);
                assert(idx >= 0 && idx < arr.length);
            }
        });
    });

    describe('get_random_in_array', function () {
        it('returns the sole element for length 1', function () {
            assert.strictEqual(parsing.get_random_in_array(['x']), 'x');
        });

        it('returns a value from the array', function () {
            const arr = ['a', 'b', 'c'];
            for (let i = 0; i < 50; i++) {
                const v = parsing.get_random_in_array(arr);
                assert(arr.includes(v));
            }
        });
    });
});

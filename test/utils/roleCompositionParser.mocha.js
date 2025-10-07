const assert = require('assert');

describe('roleCompositionParser', () => {
    const {parseRoleComposition} = require('../../src/utils/roleCompositionParser');

    it('parses comma separated role specifications', () => {
        const composition = parseRoleComposition('Villageois:5,LoupGarou:2,Voyante:1');
        assert.deepStrictEqual(composition, {
            Villageois: 5,
            LoupGarou: 2,
            Voyante: 1,
        });
    });

    it('trims whitespace and merges duplicate role entries', () => {
        const composition = parseRoleComposition('Villageois:3, LoupGarou:1, Villageois:2');
        assert.deepStrictEqual(composition, {
            Villageois: 5,
            LoupGarou: 1,
        });
    });

    it('supports semicolon separated specifications', () => {
        const composition = parseRoleComposition('Villageois:4;LoupGarou:1');
        assert.deepStrictEqual(composition, {
            Villageois: 4,
            LoupGarou: 1,
        });
    });

    it('throws when specification is empty or invalid', () => {
        assert.throws(() => parseRoleComposition(''), /role composition/i);
        assert.throws(() => parseRoleComposition('Villageois'), /role composition/i);
        assert.throws(() => parseRoleComposition('Villageois:-1'), /role composition/i);
        assert.throws(() => parseRoleComposition('Villageois:abc'), /role composition/i);
    });
});

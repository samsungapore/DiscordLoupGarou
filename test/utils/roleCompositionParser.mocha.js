const assert = require('assert');

describe('roleCompositionParser', () => {
    const {parseRoleComposition, ROLE_COMPOSITION_USAGE} = require('../../src/utils/roleCompositionParser');

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

    it('throws when specification is empty or invalid with helpful guidance', () => {
        const expectHelpfulError = (input) => {
            assert.throws(() => parseRoleComposition(input), (err) => {
                assert.match(err.message, /Composition de rôles invalide/);
                assert.ok(err.message.includes(ROLE_COMPOSITION_USAGE));
                return true;
            });
        };

        expectHelpfulError('');
        expectHelpfulError('Villageois');
        expectHelpfulError('Villageois:-1');
        expectHelpfulError('Villageois:abc');
    });
});

const assert = require('assert');

describe('Role composition strategies', () => {
    const {
        CustomRoleComposition,
        RandomRoleComposition,
        createRoleCompositionStrategy,
    } = require('../../../src/lg/roles/compositions/roleCompositionStrategy');

    it('createRoleCompositionStrategy returns custom strategy when composition provided', () => {
        const strategy = createRoleCompositionStrategy({Villageois: 2});
        assert.ok(strategy instanceof CustomRoleComposition);
    });

    it('createRoleCompositionStrategy returns random strategy when composition is null', () => {
        const strategy = createRoleCompositionStrategy(null);
        assert.ok(strategy instanceof RandomRoleComposition);
    });

    it('CustomRoleComposition applies configuration to handler', () => {
        const handler = {};
        const strategy = new CustomRoleComposition({Villageois: 3, LoupGarou: 1});
        strategy.apply(handler);

        assert.deepStrictEqual(handler.gameType, [{Villageois: 3, LoupGarou: 1}]);
        assert.deepStrictEqual(handler.gameTypeCopy, [{Villageois: 3, LoupGarou: 1}]);
        assert.strictEqual(handler.allExtension, handler.gameType);
        assert.strictEqual(handler.thiercelieux, handler.gameType);
        assert.strictEqual(handler.nouvelleLune, handler.gameType);
    });

    it('CustomRoleComposition clones data to avoid shared references', () => {
        const handler = {};
        const strategy = new CustomRoleComposition({Villageois: 2});
        strategy.apply(handler);

        assert.notStrictEqual(handler.gameType[0], handler.gameTypeCopy[0]);
    });
});

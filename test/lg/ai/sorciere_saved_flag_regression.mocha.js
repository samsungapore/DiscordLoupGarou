const assert = require('assert');

describe('Regression: Sorcière savedLgTarget should prevent death (pre-fix would fail)', function () {
    it('killPlayers should ignore target when sorciere.savedLgTarget === true', async function () {
        const {GameFlow} = require('../../../src/lg/lg_flow');
        const {Create} = require('../../../src/lg/roles/roleFactory');
        const {VirtualMember} = require('../../../src/services/ai/virtual_member');

        const vm = new VirtualMember({id: 'S1', displayName: 'Witch'});
        const sorciere = Create.sorciere(vm);

        // Simulate pre-fix save state
        sorciere.savedLgTarget = true; // pre-fix flag used by Sorcière
        sorciere.alive = true;
        // Avoid heavy side effects in die()
        sorciere.die = async () => false;

        const configuration = {
            channelsHandler: {
                channels: {paradis_lg: 'p', village_lg: 'v', loups_garou_lg: 'l'},
                switchPermissions: async () => {
                },
                _channels: new Map(),
            },
            rolesHandler: {
                removePlayerRole: async () => {
                },
                addDeadRole: async () => {
                },
            }
        };

        const gf = new GameFlow({}, {}, {});
        gf.GameConfiguration = configuration;
        gf.listenDeaths();

        await gf.killPlayers([sorciere]);

        assert.strictEqual(sorciere.alive, true);
    });
});

const assert = require('assert');

describe('Night flow – Sorcière self-save prevents death', function () {
    it('killPlayers should ignore LG target when Sorcière saved herself', async function () {
        const {GameFlow} = require('../../../src/lg/lg_flow');
        const {Create} = require('../../../src/lg/roles/roleFactory');
        const {VirtualMember} = require('../../../src/services/ai/virtual_member');
        const AIController = require('../../../src/services/ai/ai_controller');

        // Setup players
        const vmSorciere = new VirtualMember({id: 'S1', displayName: 'Witch'});
        const vmWolf = new VirtualMember({id: 'W1', displayName: 'Wolf'});
        const sorciere = Create.sorciere(vmSorciere);
        const loup = Create.loupGarou(vmWolf);

        // Minimal configuration stub
        const configuration = {
            ai: new AIController({seed: 1}),
            channelsHandler: {
                sendMessageToVillage: async () => {
                }, switchPermissions: async () => {
                }
            },
            getAlivePlayers: () => [sorciere, loup],
            getDeadPlayers: () => [],
            getPlayers: () => new Map([[vmSorciere.id, sorciere], [vmWolf.id, loup]]),
            getPlayerById: (id) => id === vmSorciere.id ? sorciere : loup,
        };

        // Sorcière targeted by wolves
        const lgTarget = sorciere;

        // AI Sorcière will save herself
        await sorciere.processRole(configuration, lgTarget);

        // Prepare kill list containing the Sorcière (as if wolves had chosen her)
        const gf = new GameFlow({}, {}, {});
        gf.GameConfiguration = configuration;

        await gf.killPlayers([sorciere]);

        // She must still be alive after filters
        assert.strictEqual(sorciere.alive, true);
    });
});

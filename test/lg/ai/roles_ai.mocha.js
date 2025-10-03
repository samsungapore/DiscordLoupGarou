const assert = require('assert');

describe('AI roles behavior (Voleur, Sorciere)', function () {
    it('Voleur keeps role unless both options are LoupGarou', async function () {
        const {Create} = require('../../../src/lg/roles/roleFactory');
        const AIController = require('../../../src/services/ai/ai_controller');
        const {VirtualMember} = require('../../../src/services/ai/virtual_member');

        const vm = new VirtualMember({id: 'V1', displayName: 'Bot Voleur'});
        const voleur = Create.voleur(vm);

        const confKeep = {
            ai: new AIController({seed: 1}),
            rolesHandler: {getAdditionnalRoles: async () => ['Villageois', 'LoupGarou']}
        };
        await voleur.proposeRoleChoice(confKeep);
        assert.strictEqual(voleur.roleChosen, undefined);

        const voleur2 = Create.voleur(new VirtualMember({id: 'V2', displayName: 'Bot Voleur 2'}));
        const confForce = {
            ai: new AIController({seed: 1}),
            rolesHandler: {getAdditionnalRoles: async () => ['LoupGarou', 'LoupGarou']}
        };
        await voleur2.proposeRoleChoice(confForce);
        assert.strictEqual(voleur2.roleChosen, 'LoupGarou');
    });

    it('Sorciere saves herself when targeted', async function () {
        const {Create} = require('../../../src/lg/roles/roleFactory');
        const AIController = require('../../../src/services/ai/ai_controller');
        const {VirtualMember} = require('../../../src/services/ai/virtual_member');

        const vm = new VirtualMember({id: 'S1', displayName: 'Bot Sorciere'});
        const sorciere = Create.sorciere(vm);
        const conf = {ai: new AIController({seed: 2})};
        const lgTarget = {member: {id: 'S1'}};
        await sorciere.processRole(conf, lgTarget);
        assert.strictEqual(sorciere.savedLgTarget, true);
        assert.strictEqual(sorciere.potions.vie, 0);
    });
});

const assert = require('assert');
const {Voleur} = require('../../../src/lg/roles/thiercelieux/voleur');

class FakeCollector {
    constructor(nextInteraction) {
        this.nextInteraction = nextInteraction;
        this.handlers = new Map();
        this.interaction = null;
    }

    on(event, handler) {
        this.handlers.set(event, handler);
    }

    start() {
        if (this.nextInteraction && this.nextInteraction.interaction) {
            const interactionData = this.nextInteraction.interaction;
            this.interaction = {
                ...interactionData,
                user: interactionData.user || {id: 'player'},
                deferUpdate: async () => {}
            };
            const collectHandler = this.handlers.get('collect');
            if (collectHandler) {
                collectHandler(this.interaction);
            }
        }
        if (this.nextInteraction && this.nextInteraction.timeout) {
            const endHandler = this.handlers.get('end');
            if (endHandler) {
                endHandler(new Map(), 'time');
            }
        }
    }

    stop(reason) {
        const endHandler = this.handlers.get('end');
        if (endHandler) {
            endHandler(this.interaction ? new Map([[this.interaction.user.id, this.interaction]]) : new Map(), reason);
        }
    }
}

    class FakeMessage {
        constructor(channel, payload, nextInteraction) {
            this.channel = channel;
            this.payload = payload;
            this.nextInteraction = nextInteraction;
            this.edits = [];
            this.deleted = false;
            this.initialComponents = payload.components ? Array.from(payload.components) : [];
        }

    async edit(update) {
        this.edits.push(update);
        this.payload = {...this.payload, ...update};
        if (update.components && this.initialComponents.length === 0) {
            this.initialComponents = Array.from(update.components);
        }
        return this;
    }

    async delete() {
        this.deleted = true;
        return true;
    }

    createMessageComponentCollector() {
        const collector = new FakeCollector(this.nextInteraction);
        setImmediate(() => collector.start());
        return collector;
    }
}

class FakeDMChannel {
    constructor(interactions) {
        this.interactions = Array.from(interactions);
        this.sentMessages = [];
    }

    isDMBased() {
        return true;
    }

    async send(payload) {
        const nextInteraction = this.interactions.shift() || {};
        const message = new FakeMessage(this, payload, nextInteraction);
        this.sentMessages.push(message);
        return message;
    }
}

describe('Voleur DM choice buttons', function () {
    function createGameConfig(additionalRoles) {
        return {
            rolesHandler: {
                async getAdditionnalRoles() {
                    return additionalRoles;
                }
            }
        };
    }

    function createMember(channel) {
        return {
            id: 'player',
            displayName: 'Le Voleur',
            user: {avatarURL: () => 'https://example.com/avatar.png'},
            createDM: async () => channel
        };
    }

    it('allows the Voleur to pick a replacement role via buttons', async function () {
        const dmChannel = new FakeDMChannel([
            {interaction: {customId: 'voleur_pick_0', user: {id: 'player'}}}
        ]);
        const voleur = new Voleur(createMember(dmChannel));
        const configuration = createGameConfig(['Villageois', 'Chasseur']);

        await voleur.proposeRoleChoice(configuration);

        assert.strictEqual(voleur.roleChosen, 'Villageois');
        const firstMessage = dmChannel.sentMessages[0];
        const rowJson = firstMessage.initialComponents[0].toJSON();
        assert.strictEqual(rowJson.components.length, 3);
        assert.strictEqual(rowJson.components[0].custom_id.includes('voleur_pick'), true);
        assert.strictEqual(rowJson.components[2].custom_id, 'voleur_keep');
    });

    it('supports keeping the original role when allowed', async function () {
        const dmChannel = new FakeDMChannel([
            {interaction: {customId: 'voleur_keep', user: {id: 'player'}}}
        ]);
        const voleur = new Voleur(createMember(dmChannel));
        const configuration = createGameConfig(['Villageois', 'Chasseur']);

        await voleur.proposeRoleChoice(configuration);

        assert.strictEqual(voleur.roleChosen, undefined);
        const firstMessage = dmChannel.sentMessages[0];
        const rowJson = firstMessage.initialComponents[0].toJSON();
        assert.strictEqual(rowJson.components[2].custom_id, 'voleur_keep');
    });

    it('omits the keep button when two werewolves are drawn', async function () {
        const dmChannel = new FakeDMChannel([
            {interaction: {customId: 'voleur_pick_1', user: {id: 'player'}}}
        ]);
        const voleur = new Voleur(createMember(dmChannel));
        const configuration = createGameConfig(['LoupGarou', 'LoupGarou']);

        await voleur.proposeRoleChoice(configuration);

        const firstMessage = dmChannel.sentMessages[0];
        const rowJson = firstMessage.initialComponents[0].toJSON();
        assert.strictEqual(rowJson.components.length, 2);
        assert.strictEqual(voleur.roleChosen, 'LoupGarou');
    });
});

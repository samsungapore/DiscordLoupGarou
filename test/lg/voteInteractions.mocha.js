const assert = require('assert');
const referendum = require('../../src/functions/cmds/referendum');

const originalSondage = referendum.SondageInfiniteChoice;

class NeverCalledSondage {
    constructor() {
        throw new Error('Legacy sondage should not be instantiated for DM interactions');
    }
}

referendum.SondageInfiniteChoice = NeverCalledSondage;

delete require.cache[require.resolve('../../src/lg/lg_vote')];
const {EveryOneVote} = require('../../src/lg/lg_vote');

describe('EveryOneVote DM interactions', function () {
    after(function () {
        referendum.SondageInfiniteChoice = originalSondage;
        delete require.cache[require.resolve('../../src/lg/lg_vote')];
    });

    function createConfiguration() {
        const players = new Map([
            ['p1', {member: {id: 'p1', displayName: 'Joueur 1'}}],
            ['p2', {member: {id: 'p2', displayName: 'Joueur 2'}}],
            ['p3', {member: {id: 'p3', displayName: 'Joueur 3'}}],
        ]);
        return {
            _players: players,
            getPlayersIdName() {
                const map = new Map();
                for (const [id, player] of players.entries()) {
                    map.set(id, player.member.displayName);
                }
                return map;
            }
        };
    }

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
                    user: interactionData.user || {id: 'user1'},
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
            this.edits = [];
            this.deleted = false;
            this.nextInteraction = nextInteraction;
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
            if (this.nextInteraction && this.nextInteraction.interaction && !this.nextInteraction.interaction.customId) {
                try {
                    const rowJson = this.payload.components[0].toJSON();
                    if (rowJson.components && rowJson.components[0] && rowJson.components[0].custom_id) {
                        this.nextInteraction.interaction.customId = rowJson.components[0].custom_id;
                    }
                } catch (err) {
                    // ignore extraction errors for mocks
                }
            }
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

    it('uses select menus in DM channels and resolves selected player ids', async function () {
        const configuration = createConfiguration();
        const dmChannel = new FakeDMChannel([
            {interaction: {values: ['p2']}}
        ]);

        const vote = new EveryOneVote('Choisissez une cible', configuration, 1000, dmChannel, 1);
        const result = await vote.runVote(['p1']);

        assert.deepStrictEqual(result, ['p2']);
        assert.strictEqual(dmChannel.sentMessages.length, 1);
        const firstMessage = dmChannel.sentMessages[0];
        assert.ok(firstMessage.initialComponents.length > 0, 'components should be defined');
        const rowJson = firstMessage.initialComponents[0].toJSON();
        assert.strictEqual(rowJson.components[0].type, 3);
        assert.strictEqual(rowJson.components[0].options.length, 2);
        assert.match(firstMessage.payload.content, /Choisissez une cible/);
    });

    it('resolves with an empty array when no interaction occurs before timeout', async function () {
        const configuration = createConfiguration();
        const dmChannel = new FakeDMChannel([
            {timeout: true}
        ]);

        const vote = new EveryOneVote('Choisissez une cible', configuration, 1000, dmChannel, 1);
        const result = await vote.runVote();

        assert.deepStrictEqual(result, []);
        const message = dmChannel.sentMessages[0];
        assert.ok(message.edits.some(update => update.components && update.components.length === 0));
    });
});

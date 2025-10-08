const assert = require('assert');
const {PermissionsBitField, Collection} = require('discord.js');

function resetModule(path) {
    delete require.cache[require.resolve(path)];
}

describe('slash commands', function () {
    describe('add-admins', function () {
        const modulePath = '../../src/slashCommands/add-admins.js';

        afterEach(function () {
            resetModule(modulePath);
        });

        it('denies users without ban permission', async function () {
            const command = require(modulePath);
            const replies = [];
            const interaction = {
                member: {permissions: {has: () => false}},
                options: {getUser: () => ({id: 'target'})},
                client: {Settings: new Map()},
                guild: {id: 'guild'},
                reply: (payload) => { replies.push(payload); return Promise.resolve(payload); }
            };
            await command.execute(interaction);
            assert.deepStrictEqual(replies[0], {content: "Tu n'as pas la permission", ephemeral: true});
        });

        it('adds admins and deduplicates entries', async function () {
            const command = require(modulePath);
            const replies = [];
            const settings = new Map([[ 'guild', {Admins: ['existing']} ]]);
            const interaction = {
                member: {permissions: {has: (flag) => flag === PermissionsBitField.Flags.BanMembers}},
                options: {getUser: () => ({id: 'target'})},
                client: {Settings: settings},
                guild: {id: 'guild'},
                reply: (payload) => { replies.push(payload); return Promise.resolve(payload); }
            };
            await command.execute(interaction);
            const stored = settings.get('guild');
            assert.deepStrictEqual(stored.Admins.sort(), ['existing', 'target']);
            assert.strictEqual(replies[0].content.includes('Ajouté aux admins'), true);
        });

        it('initializes settings when none exist', async function () {
            resetModule('../../src/BotData');
            const command = require(modulePath);
            const interaction = {
                member: {permissions: {has: () => true}},
                options: {getUser: () => ({id: 'target'})},
                client: {Settings: new Map()},
                guild: {id: 'guild'},
                reply: (payload) => Promise.resolve(payload)
            };
            const result = await command.execute(interaction);
            const stored = interaction.client.Settings.get('guild');
            assert.ok(stored.Admins.includes('target'));
            assert.ok(result.content.includes('Ajouté'));
        });
    });

    describe('admin-broadcast', function () {
        const modulePath = '../../src/slashCommands/admin-broadcast.js';
        afterEach(function () {
            resetModule(modulePath);
        });

        it('rejects non-owner', async function () {
            const command = require(modulePath);
            const replies = [];
            const interaction = {
                user: {id: 'not-owner'},
                reply: (payload) => { replies.push(payload); return Promise.resolve(payload); }
            };
            await command.execute(interaction);
            assert.strictEqual(replies[0].content.includes('not allowed'), true);
            assert.strictEqual(replies[0].ephemeral, true);
        });

        it('collects admins across guilds and reports results', async function () {
            const command = require(modulePath);
            const guildMember = (id, perms = []) => ({
                id,
                user: {id, bot: false},
                permissions: {has: (flag) => perms.includes(flag)},
                send: async () => {}
            });

            const owner = guildMember('owner', [PermissionsBitField.Flags.Administrator]);
            const admin = guildMember('admin', [PermissionsBitField.Flags.Administrator]);
            const guild = {
                ownerId: 'owner',
                members: {
                    cache: new Map([
                        ['owner', owner],
                        ['admin', admin],
                        ['bot', {id: 'bot', user: {bot: true}}],
                    ]),
                    fetch: async () => {}
                }
            };

            const replies = [];
            const interaction = {
                user: {id: '140033402681163776'},
                client: {guilds: {cache: new Map([[ 'guild', guild ]])}},
                options: {getString: () => 'Hello admins'},
                deferReply: async () => {interaction.deferred = true;},
                editReply: async (msg) => { replies.push(msg); },
                reply: async () => {},
                deferred: false,
            };

            await command.execute(interaction);
            assert.strictEqual(replies.length, 1);
            assert.ok(/Broadcast complete/.test(replies[0]));
        }).timeout(5000);
    });

    describe('help command', function () {
        const modulePath = '../../src/slashCommands/help.js';
        afterEach(function () { resetModule(modulePath); resetModule('../../src/BotData'); });

        it('returns details for a specific command', async function () {
            const command = require(modulePath);
            const replies = [];
            const sample = { name: 'foo', description: 'Test', options: [{name: 'arg', description: 'Arg', required: true}], category: 'other' };
            const interaction = {
                client: {slashCommands: new Map([[ 'foo', sample ]])},
                options: {
                    getString: (name) => name === 'commande' ? 'foo' : null
                },
                reply: (payload) => { replies.push(payload); return Promise.resolve(payload); }
            };
            await command.execute(interaction);
            assert.strictEqual(replies.length, 1);
            assert.strictEqual(Array.isArray(replies[0].embeds), true);
        });

        it('lists grouped commands when no query', async function () {
            const command = require(modulePath);
            const replies = [];
            const interaction = {
                client: {slashCommands: new Map([
                    ['a', {name: 'a', description: 'desc', options: [], category: 'game'}],
                    ['b', {name: 'b', description: 'desc', options: [], category: 'admin'}],
                ])},
                options: {
                    getString: () => null
                },
                reply: (payload) => { replies.push(payload); return Promise.resolve(payload); }
            };
            await command.execute(interaction);
            assert.strictEqual(replies.length, 1);
            assert.strictEqual(Array.isArray(replies[0].embeds), true);
        });

        it('handles unknown command queries gracefully', async function () {
            const command = require(modulePath);
            const replies = [];
            const interaction = {
                client: {slashCommands: new Map([[ 'foo', {name: 'foo', description: 'desc', options: [], category: 'game'} ]])},
                options: {
                    getString: (name) => name === 'commande' ? 'unknown' : null
                },
                reply: (payload) => { replies.push(payload); return Promise.resolve(payload); }
            };
            await command.execute(interaction);
            assert.strictEqual(replies[0].content, 'Commande inconnue: unknown');
            assert.strictEqual(replies[0].ephemeral, true);
        });

        it('filters commands by category option', async function () {
            const command = require(modulePath);
            const replies = [];
            const interaction = {
                client: {slashCommands: new Map([
                    ['game', {name: 'game', description: 'desc', options: [], category: 'game'}],
                    ['meta', {name: 'meta', description: 'desc', options: [], category: 'other'}],
                ])},
                options: {
                    getString: (name) => name === 'categorie' ? 'game' : null
                },
                reply: (payload) => { replies.push(payload); return Promise.resolve(payload); }
            };
            await command.execute(interaction);
            const fields = replies[0].embeds[0].data.fields;
            assert.strictEqual(fields.length, 1);
            assert.ok(fields[0].value.includes('/game'));
        });
    });

    describe('invite command', function () {
        const modulePath = '../../src/slashCommands/invite.js';
        afterEach(function () { resetModule(modulePath); resetModule('../../src/BotData'); });

        it('returns configured invite link or fallback', async function () {
            resetModule('../../src/BotData');
            const BotData = require('../../src/BotData');
            BotData.BotValues.botInviteLink = '';
            BotData.BotValues.botId = '123456';
            const command = require(modulePath);
            const replies = [];
            const interaction = {
                client: {user: {id: '123456'}},
                options: {getString: () => null},
                reply: (payload) => { replies.push(payload); return Promise.resolve(payload); }
            };
            await command.execute(interaction);
            assert.ok(replies[0].content.includes('https://discord.com/api/oauth2/authorize'));
            assert.strictEqual(replies[0].ephemeral, true);
        });

        it('uses configured invite link when available', async function () {
            resetModule('../../src/BotData');
            const BotData = require('../../src/BotData');
            BotData.BotValues.botInviteLink = 'https://example.com/invite';
            const command = require(modulePath);
            const interaction = {
                client: {user: {id: '123456'}},
                options: {getString: () => null},
                reply: (payload) => Promise.resolve(payload)
            };
            const response = await command.execute(interaction);
            assert.strictEqual(response.content, 'https://example.com/invite');
        });
    });

    describe('new/restart/stop commands', function () {
        afterEach(function () {
            resetModule('../../src/slashCommands/new.js');
            resetModule('../../src/slashCommands/restart.js');
            resetModule('../../src/slashCommands/stop.js');
            resetModule('../../src/commands/new.js');
            resetModule('../../src/commands/restart.js');
            resetModule('../../src/commands/stop.js');
            resetModule('../../src/BotData');
        });

        function stubLegacy(path, impl) {
            require.cache[require.resolve(path)] = {exports: {execute: impl}};
        }

        function buildInteraction(overrides = {}) {
            const replies = [];
            const base = {
                member: {},
                guild: {id: 'guild'},
                channel: {},
                user: {id: 'owner'},
                client: {},
                deferred: false,
                replied: false,
                options: {
                    getInteger: () => null,
                    getBoolean: () => null,
                    getString: () => null,
                },
                reply: (payload) => { replies.push(payload); return Promise.resolve(payload); },
                followUp: (payload) => { replies.push(payload); return Promise.resolve(payload); },
            };
            Object.assign(base, overrides);
            base._replies = replies;
            return base;
        }

        it('forwards arguments to legacy new command', async function () {
            const calls = [];
            stubLegacy('../../src/commands/new.js', async (client, msg, args) => { calls.push({client, msg, args}); await msg.reply('ok'); });
            const command = require('../../src/slashCommands/new.js');
            const interaction = buildInteraction({
                client: {},
                member: {displayName: 'user'},
                options: {
                    getInteger: (name) => name === 'bots' ? 2 : name === 'seed' ? 42 : null,
                    getBoolean: () => true,
                    getString: (name) => name === 'roles' ? 'LoupGarou' : null,
                }
            });
            await command.execute(interaction);
            assert.strictEqual(interaction._replies[0].content.includes('Démarrage'), true);
            assert.deepStrictEqual(calls[0].args.sort(), ['--bots=2', '--fast', '--roles=LoupGarou', '--seed=42']);
        });

        it('restart command enforces owner check and executes legacy', async function () {
            const calls = [];
            stubLegacy('../../src/commands/restart.js', async (client, msg, args) => { calls.push(args); await msg.reply('done'); });
            const BotData = require('../../src/BotData');
            BotData.BotValues.botOwners = ['owner'];
            const command = require('../../src/slashCommands/restart.js');
            const interaction = buildInteraction({
                options: {getString: () => 'Maintenance'},
                client: {},
                user: {id: 'not-owner'}
            });
            const denied = await command.execute(interaction);
            assert.strictEqual(denied.content.includes("n'avez pas la permission"), true);

            interaction.user.id = 'owner';
            await command.execute(interaction);
            assert.strictEqual(calls.length, 1);
            assert.deepStrictEqual(calls[0], ['Maintenance']);
        });

        it('stop command proxies to legacy implementation', async function () {
            const calls = [];
            stubLegacy('../../src/commands/stop.js', async (client, msg, args) => { calls.push(args); await msg.reply('ok'); });
            const command = require('../../src/slashCommands/stop.js');
            const interaction = buildInteraction({});
            await command.execute(interaction);
            assert.strictEqual(calls.length, 1);
            assert.deepStrictEqual(calls[0], []);
        });

        it('swallows reply errors while still invoking legacy stop command', async function () {
            const calls = [];
            stubLegacy('../../src/commands/stop.js', async (client, msg, args) => { calls.push(args); await msg.reply('again'); });
            const command = require('../../src/slashCommands/stop.js');
            const interaction = buildInteraction({
                reply: async () => { throw new Error('already replied'); },
                followUp: (payload) => Promise.resolve(payload),
                deferred: true,
                replied: true
            });
            await command.execute(interaction);
            assert.strictEqual(calls.length, 1);
        });

        it('handles reply failures for restart command', async function () {
            const calls = [];
            stubLegacy('../../src/commands/restart.js', async (client, msg, args) => { calls.push(args); await msg.reply('again'); });
            const BotData = require('../../src/BotData');
            BotData.BotValues.botOwners = ['owner'];
            const command = require('../../src/slashCommands/restart.js');
            const interaction = buildInteraction({
                options: {getString: () => ''},
                reply: async () => { throw new Error('already acknowledged'); },
                deferred: true,
                replied: true
            });
            await command.execute(interaction);
            assert.strictEqual(calls.length, 1);
        });

        it('handles reply failures for new command prompt', async function () {
            const calls = [];
            stubLegacy('../../src/commands/new.js', async (client, msg, args) => { calls.push(args); await msg.reply('again'); });
            const command = require('../../src/slashCommands/new.js');
            const interaction = buildInteraction({
                reply: async () => { throw new Error('already replied'); },
                followUp: (payload) => Promise.resolve(payload),
                deferred: true,
                replied: true
            });
            await command.execute(interaction);
            assert.strictEqual(calls.length, 1);
        });
    });

    describe('reload command', function () {
        const modulePath = '../../src/slashCommands/reload.js';
        afterEach(function () { resetModule(modulePath); resetModule('../../src/BotData'); });

        it('denies non owners', async function () {
            resetModule('../../src/BotData');
            const BotData = require('../../src/BotData');
            BotData.BotValues.botOwners = ['owner'];
            const command = require(modulePath);
            const interaction = {
                user: {id: 'other'},
                options: {getString: () => 'ping'},
                client: {commands: new Map()},
                reply: (payload) => Promise.resolve(payload)
            };
            const denied = await command.execute(interaction);
            assert.strictEqual(denied.content, 'Réservé au développeur du bot');
        });

        it('acknowledges reload request for known commands', async function () {
            resetModule('../../src/BotData');
            const BotData = require('../../src/BotData');
            BotData.BotValues.botOwners = ['owner'];
            const command = require(modulePath);
            const interaction = {
                user: {id: 'owner'},
                options: {getString: () => 'ping'},
                client: {commands: new Map([['ping', {name: 'ping', aliases: []}]])},
                reply: (payload) => Promise.resolve(payload)
            };
            const response = await command.execute(interaction);
            assert.strictEqual(response.content, 'Reload not implemented for legacy commands.');
        });

        it('informs owner when command is not found', async function () {
            resetModule('../../src/BotData');
            const BotData = require('../../src/BotData');
            BotData.BotValues.botOwners = ['owner'];
            const command = require(modulePath);
            const interaction = {
                user: {id: 'owner'},
                options: {getString: () => 'missing'},
                client: {commands: new Map([['ping', {name: 'ping', aliases: []}]])},
                reply: (payload) => Promise.resolve(payload)
            };
            const response = await command.execute(interaction);
            assert.ok(response.content.includes('There is no command'));
        });
    });

    describe('set-log-level command', function () {
        const modulePath = '../../src/slashCommands/set-log-level.js';
        afterEach(function () { resetModule(modulePath); resetModule('../../src/BotData'); });

        it('denies non owners', async function () {
            const BotData = require('../../src/BotData');
            BotData.BotValues.botOwners = ['owner'];
            const command = require(modulePath);
            const interaction = {
                user: {id: 'other'},
                options: {getString: () => 'debug'},
                reply: (payload) => Promise.resolve(payload)
            };
            const denied = await command.execute(interaction);
            assert.strictEqual(denied.content, "Vous n'avez pas la permission de changer le niveau de log");
        });

        it('changes level for owner', async function () {
            const BotData = require('../../src/BotData');
            BotData.BotValues.botOwners = ['owner'];
            const command = require(modulePath);
            const interaction = {
                user: {id: 'owner'},
                options: {getString: () => 'debug'},
                reply: (payload) => Promise.resolve(payload)
            };
            const response = await command.execute(interaction);
            assert.strictEqual(response.content, 'Niveau de log changé à debug');
        });
    });

    describe('slash command loader', function () {
        afterEach(function () {
            resetModule('../../src/slashCommands/index.js');
        });

        it('loads commands from directory into collection', function () {
            const fs = require('graceful-fs');
            const original = fs.readdirSync;
            try {
                fs.readdirSync = () => ['add-admins.js', 'index.js'];
                const loader = require('../../src/slashCommands/index.js');
                const client = {slashCommands: null};
                loader.loadSlashCommands(client);
                assert.ok(client.slashCommands instanceof Collection);
                assert.ok(client.slashCommands.has('add-admins'));
            } finally {
                fs.readdirSync = original;
            }
        });

        it('registers commands by creating missing ones', async function () {
            const loader = require('../../src/slashCommands/index.js');
            const created = [];
            const existing = new Map();
            const client = {
                slashCommands: new Collection([
                    ['help', {name: 'help', description: 'help', options: [], dm_permission: true}]
                ]),
                application: {
                    commands: {
                        fetch: async () => existing,
                        create: async (def) => { created.push(def); }
                    }
                }
            };
            await loader.registerSlashCommands(client);
            assert.strictEqual(created.length, 1);
            assert.strictEqual(created[0].name, 'help');
        });
    });
});

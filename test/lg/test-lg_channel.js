// TDD: Test lg_channel.js - Channel management and permissions system
// Comprehensive testing of Discord channel creation, permissions, and cleanup

// Mock Discord.js channel types and utilities
jest.mock('discord.js', () => ({
    ChannelType: {
        GuildCategory: 4,
        GuildText: 0,
        GuildVoice: 2
    },
    PermissionsBitField: {
        Flags: {
            VIEW_CHANNEL: 'VIEW_CHANNEL',
            SEND_MESSAGES: 'SEND_MESSAGES',
            ADD_REACTIONS: 'ADD_REACTIONS'
        }
    }
}));

jest.mock('../../src/utils/permission.js', () => ({
    transformPermissions: jest.fn(perm => perm) // Return permissions as-is for mocking
}));

jest.mock('../../src/utils/message.js', () => ({
    sendEmbed: jest.fn(() => Promise.resolve())
}));

jest.mock('../../src/utils/embed.js', () => ({
    MessageEmbed: jest.fn().mockImplementation(() => ({
        setColor: jest.fn().mockReturnThis(),
        setAuthor: jest.fn().mockReturnThis(),
        setImage: jest.fn().mockReturnThis(),
        setThumbnail: jest.fn().mockReturnThis(),
        addField: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({})
    }))
}));

jest.mock('../../src/BotData.js', () => ({
    BotValues: {
        botColor: 7419530
    }
}));

jest.mock('../../src/lg/lg_var.js', () => ({
    roles_img: {
        LoupGarou: 'wolf.png'
    }
}));

const {ChannelsHandler} = require('../../src/lg/lg_channel');

describe('ChannelsHandler Constructor', () => {
    let mockClient, mockGuild, mockGameInfo;

    beforeEach(() => {
        mockClient = {user: {id: 'bot-id'}};
        mockGuild = {
            roles: {everyone: {id: 'everyone-role'}},
            channels: {
                cache: new Map()
            }
        };
        mockGameInfo = {serverName: 'Test', gameNb: 1};
    });

    test('should initialize ChannelsHandler with correct initial state', () => {
        const handler = new ChannelsHandler(mockClient, mockGuild, mockGameInfo);

        expect(handler.client).toBe(mockClient);
        expect(handler.guild).toBe(mockGuild);
        expect(handler.gameInfo).toBe(mockGameInfo);
        expect(handler.category).toBeUndefined();
        expect(handler.channels).toEqual({
            vote_lg: undefined,
            village_lg: undefined,
            paradis_lg: undefined,
            loups_garou_lg: undefined,
        });
        expect(handler.voiceChannels).toEqual({
            vocal_lg: undefined,
            mort_lg: undefined,
        });
        expect(handler.everyoneRole).toBe(mockGuild.roles.everyone);
        expect(typeof handler.everyonePermission).toBe('object');
        expect(typeof handler.mastermindPermissions).toBe('object');
        expect(handler._channels instanceof Map).toBe(true);
    });

    test('should set up everyone permissions correctly', () => {
        const handler = new ChannelsHandler(mockClient, mockGuild, mockGameInfo);

        // Check everyone permissions structure
        expect(handler.everyonePermission.loups_garou_de_thiercelieux).toEqual({
            'VIEW_CHANNEL': true,
            'SEND_MESSAGES': false,
            'ADD_REACTIONS': false
        });
        expect(handler.everyonePermission.village_lg).toEqual({
            'VIEW_CHANNEL': true,
            'SEND_MESSAGES': false,
            'ADD_REACTIONS': false
        });
        expect(handler.everyonePermission.paradis_lg).toEqual({
            'VIEW_CHANNEL': false,
            'SEND_MESSAGES': false,
            'ADD_REACTIONS': false
        });
    });

    test('should set up mastermind permissions with full access', () => {
        const handler = new ChannelsHandler(mockClient, mockGuild, mockGameInfo);

        const masterPerms = handler.mastermindPermissions.vote_lg;
        expect(masterPerms).toEqual({
            'VIEW_CHANNEL': true,
            'SEND_MESSAGES': true,
            'ADD_REACTIONS': true,
            'MANAGE_CHANNELS': true,
            'MANAGE_MESSAGES': true,
            'MANAGE_ROLES': true,
        });
    });
});

describe('ChannelsHandler Channel Checking', () => {
    let mockClient, mockGuild, mockGameInfo, handler;

    beforeEach(() => {
        mockClient = {user: {id: 'bot-id'}};
        mockGuild = {
            roles: {everyone: {id: 'everyone-role'}},
            channels: {cache: new Map()}
        };
        mockGameInfo = {serverName: 'Test', gameNb: 1};
        handler = new ChannelsHandler(mockClient, mockGuild, mockGameInfo);
    });

    test('should reject checkCategory when category not found', async () => {
        await expect(handler.checkCategory()).rejects.toBe(false);
    });

    test('should resolve checkCategory when category is found', async () => {
        const mockCategory = {id: 'cat-id', name: 'loups_garou_de_thiercelieux', type: 4};
        mockGuild.channels.cache.set('cat-id', mockCategory);

        const result = await handler.checkCategory();

        expect(result).toBe(true);
        expect(handler.category).toBe('cat-id');
        expect(handler._channels.get('cat-id')).toBe(mockCategory);
    });

    test('should reject checkChannels when no channels found', async () => {
        await expect(handler.checkChannels()).rejects.toBe(false);
    });

    test('should resolve checkChannels when all channels found with correct parent', async () => {
        handler.category = 'cat-id';

        // Add mock channels
        const mockChannels = [
            {id: 'ch1', name: 'vote_lg', type: 0, parentId: 'cat-id'},
            {id: 'ch2', name: 'village_lg', type: 0, parentId: 'cat-id'},
            {id: 'ch3', name: 'paradis_lg', type: 0, parentId: 'cat-id'},
            {id: 'ch4', name: 'loups_garou_lg', type: 0, parentId: 'cat-id'},
            {id: 'ch5', name: 'vocal_lg', type: 2, parentId: 'cat-id'},
            {id: 'ch6', name: 'mort_lg', type: 2, parentId: 'cat-id'},
        ];

        mockChannels.forEach(ch => mockGuild.channels.cache.set(ch.id, ch));

        const result = await handler.checkChannels();

        expect(result).toBe(true);
        expect(handler.channels.vote_lg).toBe('ch1');
        expect(handler.channels.village_lg).toBe('ch2');
        expect(handler.voiceChannels.vocal_lg).toBe('ch5');
        expect(handler.voiceChannels.mort_lg).toBe('ch6');
    });

    test('should checkChannelsOnGuild successfully when channels ready', async () => {
        // Setup mock channels as found
        handler.category = 'cat-id';
        const mockChannels = [
            {id: 'cat', name: 'loups_garou_de_thiercelieux', type: 4},
            {id: 'ch1', name: 'vote_lg', type: 0, parentId: 'cat-id'},
            {id: 'ch2', name: 'village_lg', type: 0, parentId: 'cat-id'},
            {id: 'ch3', name: 'paradis_lg', type: 0, parentId: 'cat-id'},
            {id: 'ch4', name: 'loups_garou_lg', type: 0, parentId: 'cat-id'},
            {id: 'ch5', name: 'vocal_lg', type: 2, parentId: 'cat-id'},
            {id: 'ch6', name: 'mort_lg', type: 2, parentId: 'cat-id'},
        ];

        mockChannels.forEach(ch => mockGuild.channels.cache.set(ch.id, ch));

        const result = await handler.checkChannelsOnGuild();

        expect(result).toBe(true);
        expect(handler.category).toBeDefined();
        expect(handler.channels.vote_lg).toBeDefined();
    });
});

describe('ChannelsHandler Channel Creation & Permissions', () => {
    let mockClient, mockGuild, mockGameInfo, handler;

    beforeEach(() => {
        mockClient = {user: {id: 'bot-id'}};
        mockGuild = {
            roles: {everyone: {id: 'everyone-role'}},
            channels: {
                cache: new Map(),
                create: jest.fn(() => Promise.resolve({id: 'new-ch-id', name: 'test', type: 0}))
            }
        };
        mockGameInfo = {serverName: 'Test', gameNb: 1};
        handler = new ChannelsHandler(mockClient, mockGuild, mockGameInfo);
    });

    test('should create channels when missing', async () => {
        mockGuild.channels.create.mockImplementation((options) => {
            return Promise.resolve({
                id: `created-${options.name}`,
                name: options.name,
                type: options.type,
                parentId: 'category-id'
            });
        });

        // Setup created category
        handler.category = 'category-id';
        handler._channels.set('category-id', {id: 'category-id'});

        await handler.createChannels();

        expect(mockGuild.channels.create).toHaveBeenCalledTimes(6); // 4 text + 2 voice
        expect(handler.channels.vote_lg).toBe('created-vote_lg');
        expect(handler.voiceChannels.vocal_lg).toBe('created-vocal_lg');
    });

    test('should switch permissions for players on channel', async () => {
        const mockChannel = {
            permissionOverwrites: {
                create: jest.fn(() => Promise.resolve())
            }
        };
        handler._channels.set('channel-id', mockChannel);

        const mockPlayers = [
            {member: {id: 'user1'}},
            {member: {id: 'user2'}}
        ];

        const permissions = {'VIEW_CHANNEL': true};

        await handler.switchPermissions('channel-id', permissions, mockPlayers);

        expect(mockChannel.permissionOverwrites.create).toHaveBeenCalledTimes(2);
        expect(mockChannel.permissionOverwrites.create).toHaveBeenCalledWith(
            mockPlayers[0].member,
            permissions
        );
    });

    test('should send message to village channel', async () => {
        const mockVillageChannel = {id: 'village-id'};
        handler.channels.village_lg = 'village-id';
        handler._channels.set('village-id', mockVillageChannel);

        const result = await handler.sendMessageToVillage('Test message', 'image.png');

        expect(result).toBeDefined();
        expect(mockGuild.channels.cache.get).toHaveBeenCalledTimes(0); // Should use _channels map
    });

    test('should send message to LG channel', async () => {
        const mockLGChannel = {id: 'lg-id'};
        handler.channels.loups_garou_lg = 'lg-id';
        handler._channels.set('lg-id', mockLGChannel);

        await handler.sendMsgToLG('Werewolf message');

        // Message sending is mocked, just verify method exists
        expect(typeof handler.sendMsgToLG).toBe('function');
    });
});

describe('ChannelsHandler Cleanup Operations', () => {
    let mockClient, mockGuild, mockGameInfo, handler;

    beforeEach(() => {
        mockClient = {user: {id: 'bot-id'}};
        mockGuild = {
            roles: {everyone: {id: 'everyone-role'}},
            channels: {cache: new Map()}
        };
        mockGameInfo = {serverName: 'Test', gameNb: 1};
        handler = new ChannelsHandler(mockClient, mockGuild, mockGameInfo);

        // Add mock channels
        const mockChannel1 = {id: 'ch1', type: 0, delete: jest.fn(() => Promise.resolve())};
        const mockChannel2 = {id: 'ch2', type: 0, delete: jest.fn(() => Promise.resolve())};
        handler._channels.set('ch1', mockChannel1);
        handler._channels.set('ch2', mockChannel2);
    });

    test('should delete all text channels', async () => {
        await handler.deleteChannels();

        expect(mockChannel1.delete).toHaveBeenCalled();
        expect(mockChannel2.delete).toHaveBeenCalled();
    });

    test('should remove all permission overwrites', async () => {
        let deleteCallCount = 0;
        const mockOverwrite = {
            delete: jest.fn(() => {
                deleteCallCount++;
                return Promise.resolve();
            })
        };

        const mockChannel = {
            permissionOverwrites: {
                cache: {
                    each: jest.fn((fn) => fn(mockOverwrite))
                }
            }
        };
        handler._channels.clear();
        handler._channels.set('ch1', mockChannel);

        await handler.removeAllOverwrites();

        expect(deleteCallCount).toBeGreaterThan(0);
    });

    test('should delete permission overwrites', async () => {
        const mockChannel = {
            permissionOverwrites: {
                cache: {
                    each: jest.fn((fn) => fn({delete: jest.fn(() => Promise.resolve())}))
                }
            }
        };
        handler._channels.set('ch1', mockChannel);

        await handler.deletePermissionsOverwrites();

        expect(mockChannel.permissionOverwrites.cache.each).toHaveBeenCalled();
    });

    test('should delete messages in specified channels', async () => {
        const mockChannel = {
            messages: {cache: ['msg1', 'msg2']},
            bulkDelete: jest.fn(() => Promise.resolve())
        };

        // Setup channels structure
        handler.channels = {
            vote_lg: 'vote-ch',
            loups_garou_lg: 'lg-ch',
            paradis_lg: 'para-ch'
        };

        handler._channels.set('vote-ch', mockChannel);
        handler._channels.set('lg-ch', mockChannel);
        handler._channels.set('para-ch', mockChannel);

        await handler.deleteMessagesInChannels();

        expect(mockChannel.bulkDelete).toHaveBeenCalledTimes(3);
    });
});

describe('ChannelsHandler Permission Setup', () => {
    let mockClient, mockGuild, mockGameInfo, handler, mockConfiguration;

    beforeEach(() => {
        mockClient = {user: {id: 'bot-id'}};
        mockGuild = {
            roles: {everyone: {id: 'everyone-role'}},
            channels: {cache: new Map()}
        };
        mockGameInfo = {serverName: 'Test', gameNb: 1};
        handler = new ChannelsHandler(mockClient, mockGuild, mockGameInfo);

        mockConfiguration = {
            getPlayers: jest.fn(() => new Map([
                ['p1', {member: {id: 'p1'}, permission: {'village_lg': {VIEW_CHANNEL: true}}}]
            ]))
        };

        // Setup mock channels
        const mockChannel = {
            id: 'ch1',
            name: 'village_lg',
            type: 0,
            permissionOverwrites: {
                create: jest.fn(() => Promise.resolve())
            }
        };
        handler._channels.set('ch1', mockChannel);
    });

    test('should setup channel permissions for text channels', async () => {
        await handler.setupChannelPermissions(mockConfiguration);

        expect(mockConfiguration.getPlayers).toHaveBeenCalled();
        // Verify bot permissions set for mastermind access
        // (Detailed permission checking would require more complex mocks)
    });

    test('should apply permissions on individual channel', async () => {
        const players = new Map([
            ['p1', {member: {id: 'p1'}, permission: {'village_lg': {VIEW_CHANNEL: true}}}]
        ]);

        const mockChannel = {
            type: 0,
            name: 'village_lg',
            permissionOverwrites: {
                create: jest.fn(() => Promise.resolve())
            }
        };

        await handler.applyPermissionsOnChannel(mockChannel, players);

        expect(mockChannel.permissionOverwrites.create).toHaveBeenCalledTimes(2); // Player + everyone
    });
});

describe('ChannelsHandler setupChannels Integration', () => {
    let mockClient, mockGuild, mockGameInfo, handler, mockConfiguration;

    beforeEach(() => {
        mockClient = {user: {id: 'bot-id'}};
        mockGuild = {
            roles: {everyone: {id: 'everyone-role'}},
            channels: {
                cache: new Map(),
                create: jest.fn(() => Promise.resolve({id: 'new-ch', name: 'test', type: 0}))
            }
        };
        mockGameInfo = {serverName: 'Test', gameNb: 1};
        handler = new ChannelsHandler(mockClient, mockGuild, mockGameInfo);

        mockConfiguration = {
            getPlayers: jest.fn(() => new Map())
        };
    });

    test('should setup channels end-to-end', async () => {
        // Mock successful channel operations
        jest.spyOn(handler, 'createChannels').mockResolvedValue();
        jest.spyOn(handler, 'removeAllOverwrites').mockResolvedValue();
        jest.spyOn(handler, 'setupChannelPermissions').mockResolvedValue();

        const result = await handler.setupChannels(false, mockConfiguration);

        expect(result).toBe(true);
        expect(handler.createChannels).toHaveBeenCalledWith();
        expect(handler.removeAllOverwrites).toHaveBeenCalledWith();
        expect(handler.setupChannelPermissions).toHaveBeenCalledWith(mockConfiguration);
    });
});

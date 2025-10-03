// TDD: Test lg_game.js - Game orchestration, configuration, and preparation
// Comprehensive testing of game lifecycle and player management

// Mock all external dependencies first
jest.mock('../../src/lg/lg_logger.js', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

jest.mock('../../src/BotData.js', () => ({
    BotValues: {
        botColor: 7419530
    }
}));

jest.mock('../../src/lg/lg_flow.js', () => ({
    GameFlow: jest.fn().mockImplementation(() => ({
        GameConfiguration: {},
        run: jest.fn(() => Promise.resolve(new Map())),
        killer: {on: jest.fn(), emit: jest.fn()}
    }))
}));

jest.mock('../../src/lg/lg_channel.js', () => ({
    ChannelsHandler: jest.fn().mockImplementation(() => ({
        checkChannelsOnGuild: jest.fn(() => Promise.resolve(true)),
        setupChannels: jest.fn(() => Promise.resolve(true)),
        deleteChannels: jest.fn(() => Promise.resolve()),
        deletePermissionsOverwrites: jest.fn(() => Promise.resolve()),
        deleteMessagesInChannels: jest.fn(() => Promise.resolve()),
        _channels: new Map(),
        channels: {},
        voiceChannels: {}
    }))
}));

jest.mock('../../src/roles/lg_role.js', () => ({
    RolesHandler: jest.fn().mockImplementation(() => ({
        createRoles: jest.fn(() => Promise.resolve()),
        addPlayerRole: jest.fn(() => Promise.resolve()),
        removeRoles: jest.fn(() => Promise.resolve()),
        assignRoles: jest.fn(() => Promise.resolve({})),
        deleteRoles: jest.fn(() => Promise.resolve()),
        removePlayerRole: jest.fn(() => Promise.resolve()),
        addDeadRole: jest.fn(() => Promise.resolve())
    }))
}));

jest.mock('../../src/lg/lg_voice.js', () => ({
    VoiceHandler: jest.fn()
}));

jest.mock('../../src/lg/message_sending.js', () => ({
    CommunicationHandler: {
        getLGSampleMsg: jest.fn(() => ({
            setColor: jest.fn().mockReturnThis(),
            setAuthor: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
            addField: jest.fn().mockReturnThis(),
            updateParticipationField: jest.fn().mockReturnThis(),
            setFooter: jest.fn().mockReturnThis()
        }))
    }
}));

jest.mock('../../src/utils/embed.js', () => ({
    MessageEmbed: jest.fn().mockImplementation(() => ({
        setColor: jest.fn().mockReturnThis(),
        setAuthor: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setThumbnail: jest.fn().mockReturnThis(),
        addField: jest.fn().mockReturnThis(),
        setFooter: jest.fn().mockReturnThis(),
        setTitle: jest.fn().mockReturnThis(),
        fields: [],
        build: jest.fn().mockReturnValue({})
    }))
}));

jest.mock('../../src/utils/message.js', () => ({
    sendEmbed: jest.fn(() => Promise.resolve({
        delete: jest.fn(() => Promise.resolve()),
        react: jest.fn(() => Promise.resolve())
    })),
    editMessage: jest.fn(() => Promise.resolve())
}));

jest.mock('../../src/utils/permission.js', () => ({
    checkPermissions: jest.fn(() => true),
    transformPermissions: jest.fn(perm => perm)
}));

jest.mock('../../src/functions/reactionHandler.js', () => ({
    ReactionHandler: jest.fn().mockImplementation(() => ({
        addReactions: jest.fn(() => Promise.resolve()),
        initCollector: jest.fn((collect, end) => {
            // Simulate ending immediately for testing
            setImmediate(() => end && end());
        }),
        stop: jest.fn(),
        removeReactionList: jest.fn(() => Promise.resolve()),
        message: {delete: jest.fn(() => Promise.resolve())}
    }))
}));

jest.mock('../../src/functions/wait.js', () => ({
    Wait: {
        seconds: jest.fn(() => Promise.resolve())
    }
}));

jest.mock('discord.js', () => ({
    PermissionsBitField: {
        Flags: {
            BanMembers: 'BAN_MEMBERS'
        }
    }
}));

const {Game, GameInfo, GameConfiguration, GamePreparation} = require('../../src/lg/lg_game');

describe('GameInfo', () => {
    let mockMessage;

    beforeEach(() => {
        mockMessage = {
            guild: {
                name: 'Test Guild',
                id: 'guild-123'
            }
        };
    });

    test('should initialize GameInfo with correct properties', () => {
        // TDD: Define expected GameInfo initialization
        const playTime = new Date();
        const gameInfo = new GameInfo(mockMessage, playTime);

        expect(gameInfo.guild).toBe(mockMessage.guild);
        expect(gameInfo.playTime).toBe(playTime);
        expect(gameInfo._history).toEqual([]);
        expect(gameInfo.serverName).toBe('Test Guild');
        expect(gameInfo.stemmingTime).toBe(playTime);
        expect(typeof gameInfo.gameNb).toBe('string');
    });

    test('should add messages to history', () => {
        // TDD: Red - define expected history functionality
        const gameInfo = new GameInfo(mockMessage, new Date());

        gameInfo.addToHistory('Player 1 joined');
        gameInfo.addToHistory('Game started');

        expect(gameInfo.history).toEqual(['Player 1 joined', 'Game started']);
    });

    test('should calculate play time correctly', () => {
        // TDD: Red - define expected play time calculation
        const startTime = new Date(Date.now() - (65 * 60 * 1000)); // 65 minutes ago
        const gameInfo = new GameInfo(mockMessage, startTime);

        const playTime = gameInfo.getPlayTime();

        expect(playTime).toMatch(/1h5m/); // Should be approximately 1h5m
    });
});

describe('GameConfiguration', () => {
    let gameInfo, gameConfiguration;

    beforeEach(() => {
        gameInfo = {serverName: 'Test'};
        gameConfiguration = new GameConfiguration(gameInfo);
    });

    test('should initialize GameConfiguration with correct structure', () => {
        // TDD: Define expected GameConfiguration initialization
        expect(gameConfiguration.gameInfo).toBe(gameInfo);
        expect(gameConfiguration.globalTimer).toBeNull();
        expect(gameConfiguration._table).toEqual([]);
        expect(gameConfiguration._players instanceof Map).toBe(true);
        expect(gameConfiguration._participants instanceof Map).toBe(true);
    });

    test('should manage participants correctly', () => {
        // TDD: Red - define expected participant management behavior
        const mockMember = {id: 'user1', displayName: 'Player 1'};

        gameConfiguration.addParticipant(mockMember);

        expect(gameConfiguration.getParticipants().get('user1')).toBe(mockMember);
        expect(gameConfiguration.getParticipantsNames()).toEqual(['Player 1']);

        gameConfiguration.removeParticipant('user1');
        expect(gameConfiguration.getParticipantsNames()).toEqual([]);
    });

    test('should return table of participants', () => {
        // TDD: Red - define expected table functionality
        const mockMember1 = {id: 'user1', displayName: 'Player 1'};
        const mockMember2 = {id: 'user2', displayName: 'Player 2'};

        gameConfiguration.addParticipant(mockMember1);
        gameConfiguration.addParticipant(mockMember2);

        const table = gameConfiguration.getTable();

        expect(table).toEqual([mockMember1, mockMember2]);
        expect(gameConfiguration.getPlayerNames()).toEqual(['Player 1', 'Player 2']);
    });

    test('should manage players correctly', () => {
        // TDD: Red - define expected player management
        const mockLGPlayer = {
            member: {id: 'wolf', displayName: 'Werewolf'},
            alive: true,
            team: 'LG',
            role: 'LoupGarou'
        };

        const mockVillager = {
            member: {id: 'vil1', displayName: 'Villager'},
            alive: false,
            team: 'VILLAGEOIS',
            role: 'Villageois'
        };

        gameConfiguration.addPlayer(mockLGPlayer);
        gameConfiguration.addPlayer(mockVillager);

        expect(gameConfiguration.getPlayerById('wolf')).toBe(mockLGPlayer);
        expect(gameConfiguration.getAlivePlayers()).toEqual([mockLGPlayer]);
        expect(gameConfiguration.getDeadPlayers()).toEqual([mockVillager]);
        expect(gameConfiguration.getLG(true)).toEqual([mockLGPlayer]);
        expect(gameConfiguration.getLGIds(true)).toEqual(['wolf']);
        expect(gameConfiguration.getVillageois(true)).toEqual([mockVillager]);
    });

    test('should return members by team correctly', () => {
        // TDD: Red - define expected team filtering
        const mockLG1 = {member: {displayName: 'Wolf1'}, team: 'LG', role: 'LoupGarou'};
        const mockLG2 = {member: {displayName: 'Wolf2'}, team: 'LG', role: 'LoupBlanc'};
        const mockVillager = {member: {displayName: 'Villager'}, team: 'VILLAGEOIS', role: 'Villageois'};

        gameConfiguration.addPlayer(mockLG1);
        gameConfiguration.addPlayer(mockLG2);
        gameConfiguration.addPlayer(mockVillager);

        const lgMembers = gameConfiguration.getMemberteams('LG');
        const villagerMembers = gameConfiguration.getMemberteams('VILLAGEOIS');

        expect(lgMembers).toEqual([
            '**LoupGarou** : Wolf1',
            '**LoupBlanc** : Wolf2'
        ]);
        expect(villagerMembers).toEqual(['**Villageois** : Villager']);
    });

    test('should find capitaine correctly', () => {
        // TDD: Red - define expected capitaine finding
        const mockPlayer1 = {member: {id: 'p1'}, capitaine: false};
        const mockPlayer2 = {member: {id: 'p2'}, capitaine: true};
        const mockPlayer3 = {member: {id: 'p3'}, capitaine: false};

        gameConfiguration.addPlayer(mockPlayer1);
        gameConfiguration.addPlayer(mockPlayer2);
        gameConfiguration.addPlayer(mockPlayer3);

        expect(gameConfiguration.Capitaine).toBe(mockPlayer2);
    });

    test('should return correct role map', () => {
        // TDD: Red - define expected role mapping functionality
        const mockPlayer1 = {role: 'LoupGarou', alive: true};
        const mockPlayer2 = {role: 'LoupGarou', alive: false};
        const mockPlayer3 = {role: 'Villageois', alive: true};

        gameConfiguration.addPlayer(mockPlayer1);
        gameConfiguration.addPlayer(mockPlayer2);
        gameConfiguration.addPlayer(mockPlayer3);

        const aliveRoleMap = gameConfiguration.getRoleMap({alive: true, dead: false});
        const allRoleMap = gameConfiguration.getRoleMap({alive: true, dead: true});

        expect(aliveRoleMap.get('LoupGarou')).toEqual([mockPlayer1]);
        expect(aliveRoleMap.get('Villageois')).toEqual([mockPlayer3]);
        expect(allRoleMap.get('LoupGarou')).toEqual([mockPlayer1, mockPlayer2]);
    });

    test('should return players ID name map', () => {
        // TDD: Red - define expected ID mapping
        const mockPlayer1 = {member: {id: 'p1', displayName: 'Player 1'}};
        const mockPlayer2 = {member: {id: 'p2', displayName: 'Player 2'}};

        gameConfiguration.addPlayer(mockPlayer1);
        gameConfiguration.addPlayer(mockPlayer2);

        const playersIdName = gameConfiguration.getPlayersIdName();

        expect(playersIdName.get('p1')).toBe('Player 1');
        expect(playersIdName.get('p2')).toBe('Player 2');
    });
});

describe('GamePreparation', () => {
    let mockClient, mockChannel, mockPlayer, mockGuild, mockGameInfo, mockGameOptions;

    beforeEach(() => {
        mockClient = {user: {id: 'bot-id'}};
        mockChannel = {
            send: jest.fn(() => Promise.resolve({
                delete: jest.fn(() => Promise.resolve())
            }))
        };
        mockPlayer = {
            id: 'player-id',
            displayName: 'Test Player',
            permissions: {has: jest.fn(() => false)}
        };
        mockGuild = {id: 'guild-id'};
        mockGameInfo = {serverName: 'Test'};
        mockGameOptions = {};
    });

    test('should initialize GamePreparation correctly', () => {
        // TDD: Define expected GamePreparation initialization
        const preparation = new GamePreparation(mockClient, mockChannel, mockPlayer, mockGuild, mockGameInfo, mockGameOptions);

        expect(preparation.client).toBe(mockClient);
        expect(preparation.preparationChannel).toBe(mockChannel);
        expect(preparation.stemmingPlayer).toBe(mockPlayer);
        expect(preparation.guild).toBe(mockGuild);
        expect(preparation.gameInfo).toBe(mockGameInfo);
        expect(preparation.gameOptions).toBe(mockGameOptions);
        expect(preparation.MAX_PLAYERS).toBe(29);
        expect(preparation.keepChannels).toBe(true);
    });

    test('should initialize game preparation with embedded message', async () => {
        // TDD: Red - define expected init() behavior
        const preparation = new GamePreparation(mockClient, mockChannel, mockPlayer, mockGuild, mockGameInfo, mockGameOptions);

        const result = await preparation.init();

        expect(mockChannel.send).toHaveBeenCalled();
        expect(preparation.msg).toBeDefined();
        expect(result).toBe(true);
    });

    test('should create roles in preparation', async () => {
        // TDD: Red - define expected role creation
        const preparation = new GamePreparation(mockClient, mockChannel, mockPlayer, mockGuild, mockGameInfo, mockGameOptions);

        const result = await preparation.createRoles();

        expect(preparation.rolesHandler.createRoles).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    test('should display preparation guide correctly', async () => {
        // TDD: Red - define expected guide display
        const preparation = new GamePreparation(mockClient, mockChannel, mockPlayer, mockGuild, mockGameInfo, mockGameOptions);

        const result = await preparation.displayGuide();

        expect(editMessage).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    test('should check channels availability', async () => {
        // TDD: Red - define expected channel checking
        const preparation = new GamePreparation(mockClient, mockChannel, mockPlayer, mockGuild, mockGameInfo, mockGameOptions);

        // Mock successful channel check
        preparation.channelsHandler.checkChannelsOnGuild.mockResolvedValue();

        const result = await preparation.checkChannels();

        expect(preparation.channelsHandler.checkChannelsOnGuild).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    test('should setup channels with configuration', async () => {
        // TDD: Red - define expected channel setup
        const preparation = new GamePreparation(mockClient, mockChannel, mockPlayer, mockGuild, mockGameInfo, mockGameOptions);

        preparation.channelsHandler.setupChannels.mockResolvedValue();

        const result = await preparation.setupChannels();

        expect(preparation.channelsHandler.setupChannels).toHaveBeenCalledWith(true, preparation.configuration);
        expect(result).toBe(true);
    });

    test('should update participants display correctly', () => {
        // TDD: Red - define expected participant display update
        const preparation = new GamePreparation(mockClient, mockChannel, mockPlayer, mockGuild, mockGameInfo, mockGameOptions);

        // Add participants
        preparation.configuration.addParticipant({displayName: 'Player 1', id: 'p1'});
        preparation.configuration.addParticipant({displayName: 'Player 2', id: 'p2'});

        preparation.updateParticipantsDisplay();

        expect(editMessage).toHaveBeenCalled();
        expect(preparation.MessageEmbed.setFooter).toHaveBeenCalledWith('Nombre de joueurs : 2');
    });
});

describe('CommunicationHandler', () => {
    test('should return sample LG message embed', () => {
        // TDD: Red - define expected embed creation
        const {CommunicationHandler} = require('../../src/lg/lg_game');

        const embed = CommunicationHandler.getLGSampleMsg();

        expect(embed.setDescription).toHaveBeenCalledWith('Loup-Garou de Thiercelieux');
        expect(embed.setColor).toHaveBeenCalledWith(7419530);
        expect(embed.setAuthor).toHaveBeenCalledWith('Loup-Garou de Thiercelieux', undefined);
    });

    test('should reconstruct embed with all fields copied', () => {
        // TDD: Red - define expected embed reconstruction
        const {CommunicationHandler} = require('../../src/lg/lg_game');

        const originalEmbed = {
            author: {name: 'Test Author'},
            color: 12345,
            description: 'Test Description',
            footer: {text: 'Test Footer'},
            image: {url: 'test.png'},
            thumbnail: 'thumb.png',
            title: 'Test Title',
            url: 'http://test.com',
            fields: [
                {name: 'Field1', value: 'Value1', inline: true},
                {name: 'Field2', value: 'Value2', inline: false}
            ]
        };

        const reconstructed = CommunicationHandler.reconstructEmbed(originalEmbed);

        expect(reconstructed.setAuthor).toHaveBeenCalledWith(originalEmbed.author);
        expect(reconstructed.setColor).toHaveBeenCalledWith(originalEmbed.color);
        expect(reconstructed.setDescription).toHaveBeenCalledWith(originalEmbed.description);
        expect(reconstructed.setFooter).toHaveBeenCalledWith(originalEmbed.footer);
        expect(reconstructed.setImage).toHaveBeenCalledWith(originalEmbed.image);
        expect(reconstructed.setThumbnail).toHaveBeenCalledWith(originalEmbed.thumbnail);
        expect(reconstructed.setTitle).toHaveBeenCalledWith(originalEmbed.title);
        expect(reconstructed.setURL).toHaveBeenCalledWith(originalEmbed.url);
        expect(reconstructed.addField).toHaveBeenCalledTimes(2);
    });
});

describe('Game Integration', () => {
    let mockClient, mockMessage;

    beforeEach(() => {
        mockClient = {
            user: {id: 'bot-id'},
            LG: new Map(),
            on: jest.fn()
        };

        mockMessage = {
            guild: {
                id: 'guild-id',
                roles: {everyone: {}},
                channels: {cache: new Map()},
                members: {cache: new Map()}
            },
            channel: {
                send: jest.fn(() => Promise.resolve({
                    delete: jest.fn(() => Promise.resolve())
                }))
            },
            member: {
                id: 'player-id',
                displayName: 'Test Player'
            }
        };
    });

    test('should initialize Game with correct structure', () => {
        // TDD: Define expected Game initialization
        const game = new Game(mockClient, mockMessage, {});

        expect(game.client).toBe(mockClient);
        expect(game.guild).toBe(mockMessage.guild);
        expect(game.stemmingChannel).toBe(mockMessage.channel);
        expect(game.stemmingPlayer).toBe(mockMessage.member);
        expect(game.gameInfo instanceof GameInfo).toBe(true);
        expect(typeof game.playTime).toBe('object'); // Date
        expect(game.preparation instanceof GamePreparation).toBe(true);
    });

    test('should quit game and cleanup resources', async () => {
        // TDD: Red - define expected quit behavior
        const game = new Game(mockClient, mockMessage, {});
        game.preparation = {rolesHandler: {deleteRoles: jest.fn(() => Promise.resolve())}};
        game.flow = {onPause: 0};

        mockClient.LG.set('guild-id', {running: true});

        const result = await game.quit();

        expect(mockClient.LG.get('guild-id').running).toBe(false);
        expect(result).toBe(game);
    });
});

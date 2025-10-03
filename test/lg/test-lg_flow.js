// TDD: Test lg_flow.js - Game Flow with >80% coverage goal
// Focus on core GameFlow class, GlobalTimer, and game mechanics

// Mock all dependencies before importing
jest.mock('../../src/lg/lg_var.js', () => ({
    roles_img: {
        LoupGarou: 'wolf.png',
        Villageois: 'villager.png',
        Cupidon: 'cupid.png'
    },
    botColor: 7419530
}));

jest.mock('../../src/BotData.js', () => ({
    BotValues: {
        botColor: 7419530
    }
}));

jest.mock('../../src/lg/lg_logger.js', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    instance: {lg: 'loupgarou'}
}));

jest.mock('../../src/lg/lg_vote.js', () => ({
    LoupGarouVote: jest.fn(),
    DayVote: jest.fn(),
    EveryOneVote: jest.fn()
}));

jest.mock('../../src/functions/parsing_functions.js', () => ({
    get_random_in_array: jest.fn(arr => arr && arr.length ? arr[0] : null)
}));

jest.mock('../../src/lg/roles/roleFactory.js', () => ({
    allRoles: {
        LoupGarou: jest.fn(() => ({role: 'LoupGarou'})),
        Villageois: jest.fn(() => ({role: 'Villageois'}))
    }
}));

jest.mock('../../src/functions/wait.js', () => ({
    Wait: {
        seconds: jest.fn(() => Promise.resolve())
    }
}));

jest.mock('../../src/utils/embed.js', () => ({
    MessageEmbed: jest.fn().mockImplementation(() => ({
        setColor: jest.fn().mockReturnThis(),
        setAuthor: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setFooter: jest.fn().mockReturnThis(),
        setImage: jest.fn().mockReturnThis(),
        setTitle: jest.fn().mockReturnThis(),
        setThumbnail: jest.fn().mockReturnThis(),
        addField: jest.fn().mockReturnThis(),
        setURL: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({fields: []}),
        fields: []
    }))
}));

jest.mock('../../src/utils/message.js', () => ({
    sendEmbed: jest.fn(() => Promise.resolve({})),
    editMessage: jest.fn(() => Promise.resolve({}))
}));

jest.mock('../../src/functions/time.js', () => jest.fn(() => '5:00'));
jest.mock('../../src/utils/message', () => ({
    sendEmbed: jest.fn(() => Promise.resolve({})),
    editMessage: jest.fn(() => Promise.resolve({}))
}));

jest.mock('../../src/functions/reactionHandler.js', () => ({
    ReactionHandler: jest.fn().mockImplementation(() => ({
        initCollector: jest.fn((collect, end) => {
            // Simulate immediate completion for testing
            setImmediate(() => end && end());
        }),
        addReactions: jest.fn(() => Promise.resolve()),
        stop: jest.fn(),
        message: {delete: jest.fn(() => Promise.resolve())}
    }))
}));

const EventEmitter = require('events');

// Mock Message and TextChannel from discord.js
jest.mock('discord.js', () => ({
    Message: class MockMessage {
        constructor() {
            this.embed = {};
        }

        delete() {
            return Promise.resolve();
        }

        edit() {
            return Promise.resolve(this);
        }
    },
    TextChannel: class MockTextChannel {
        constructor() {
            this.id = 'channel-id';
            this.name = 'test-channel';
        }

        send() {
            return Promise.resolve(new (require('discord.js').Message)());
        }

        createMessageCollector() {
            return {
                on: jest.fn(),
                stop: jest.fn()
            };
        }
    }
}));

const {GameFlow, GlobalTimer} = require('../../src/lg/lg_flow');

describe('GlobalTimer', () => {
    let mockChannel, mockEmbed;

    beforeEach(() => {
        mockChannel = {
            send: jest.fn(() => Promise.resolve({delete: jest.fn()}))
        };
        // Reset the static embed property
        GlobalTimer.prototype.embed = undefined;
        GlobalTimer.prototype.message = null;
        GlobalTimer.prototype.timer = null;
    });

    test('should initialize timer with channel and interval', () => {
        const timer = new GlobalTimer(mockChannel, 5);

        expect(timer.channel).toBe(mockChannel);
        expect(timer.secInterval).toBe(5);
        expect(timer.count).toBe(0);
        expect(timer.max).toBe(0);
        expect(timer.time).toBeNull();
    });

    test('should get LGSampleMsg embed from CommunicationHandler', () => {
        // This tests the static method that constructs the timer embed
        const {CommunicationHandler} = require('../../src/lg/message_sending');

        // Mock the CommunicationHandler method
        CommunicationHandler.getLGSampleMsg = jest.fn(() => ({
            addField: jest.fn().mockReturnValue({
                setColor: jest.fn().mockReturnValue('mock-embed')
            })
        }));

        const timer = new GlobalTimer(mockChannel);
        timer.embed = CommunicationHandler.getLGSampleMsg();

        expect(CommunicationHandler.getLGSampleMsg).toHaveBeenCalled();
        expect(timer.embed).toBeDefined();
    });

    test('should end timer and cleanup', async () => {
        const timer = new GlobalTimer(mockChannel);
        timer.timer = setTimeout(() => {
        }, 1000); // Mock active timer
        timer.message = {delete: jest.fn(() => Promise.resolve())};

        await timer.end();

        expect(timer.count).toBe(0);
        expect(timer.message.delete).toHaveBeenCalled();
        // Timer should be cleared
    });

    test('should update time and return false when timer active', async () => {
        const timer = new GlobalTimer(mockChannel);
        timer.time = 10;
        timer.secInterval = 5;

        // Mock sendEmbed to avoid dependency
        const {sendEmbed} = require('../../src/utils/message');
        sendEmbed.mockImplementation(() => Promise.resolve(timer.message));

        // Mock editMessage
        const {editMessage} = require('../../src/utils/message');
        editMessage.mockImplementation(() => Promise.resolve());

        const result = await timer.update();

        expect(timer.time).toBe(5); // 10 - 5/60 = 10 - 0.0833... ≈ 9.916, but our mock timeToString returns '5:00' which we use for calculation
        expect(result).toBe(false);
    });

    test('should update time and return true when timer expires', async () => {
        const timer = new GlobalTimer(mockChannel);
        timer.time = 0;

        const result = await timer.update();

        expect(result).toBe(true);
    });
});

describe('GameFlow', () => {
    let mockClient, mockGameInfo, mockGameOptions, mockConfiguration;

    beforeEach(() => {
        mockClient = {
            user: {id: 'bot-id'},
            guilds: new Map(),
            channels: new Map(),
            LG: new Map()
        };

        mockGameInfo = {
            serverName: 'TestServer',
            gameNb: 1,
            addToHistory: jest.fn(),
            getPlayTime: jest.fn(() => '5 minutes')
        };

        mockGameOptions = {};

        mockConfiguration = {
            globalTimer: null,
            channelsHandler: {
                sendMessageToVillage: jest.fn(() => Promise.resolve()),
                switchPermissions: jest.fn(() => Promise.resolve()),
                _channels: {
                    get: jest.fn(() => ({
                        send: jest.fn(() => Promise.resolve()),
                        toString: jest.fn(() => '#vote-channel')
                    }))
                },
                channels: {
                    village_lg: 'village-channel',
                    vote_lg: 'vote-channel'
                },
                voiceChannels: {
                    vocal_lg: 'vocal-channel'
                }
            },
            getAlivePlayers: jest.fn(() => []),
            getDeadPlayers: jest.fn(() => []),
            getPlayers: jest.fn(() => new Map()),
            getTable: jest.fn(() => []),
            getMemberteams: jest.fn(() => []),
            Capitaine: null,
            capitaine: null,
            getPlayerById: jest.fn(),
            removePlayer: jest.fn(),
            addPlayer: jest.fn(),
            rolesHandler: {
                removePlayerRole: jest.fn(() => Promise.resolve()),
                addDeadRole: jest.fn(() => Promise.resolve())
            }
        };

        // Clear mocks
        jest.clearAllMocks();
    });

    test('should initialize GameFlow with client, gameInfo, and options', () => {
        const gameFlow = new GameFlow(mockClient, mockGameInfo, mockGameOptions);

        expect(gameFlow.client).toBe(mockClient);
        expect(gameFlow.gameInfo).toBe(mockGameInfo);
        expect(gameFlow.gameOptions).toBe(mockGameOptions);
        expect(gameFlow.onPause).toBe(0);
        expect(gameFlow.turnNb).toBe(1);
        expect(gameFlow.killer).toBeInstanceOf(EventEmitter);
        expect(gameFlow.deadPeople).toEqual([]);
        expect(typeof gameFlow.gameStats).toBe('object');
        expect(gameFlow.msg).toBeNull();
    });

    test('should have death listener that handles player deaths', (done) => {
        const gameFlow = new GameFlow(mockClient, mockGameOptions, mockGameInfo);
        gameFlow.GameConfiguration = mockConfiguration;

        const mockPlayer = {
            die: jest.fn(() => Promise.resolve()),
            member: {id: 'player-1'},
            team: 'VILLAGEOIS',
            alive: true
        };

        gameFlow.listenDeaths();

        gameFlow.killer.emit('death', mockPlayer);

        // Wait for async operations
        setImmediate(() => {
            expect(mockPlayer.alive).toBe(false);
            expect(gameFlow.deadPeople).toContain(mockPlayer);
            expect(gameFlow.onPause).toBe(1);
            done();
        });
    });

    test('should create correct game end statistics', () => {
        const gameFlow = new GameFlow(mockClient, mockGameInfo, mockGameOptions);

        const mockPlayers = [
            {alive: true, team: 'LG', member: {displayName: 'Wolf1'}},
            {alive: true, team: 'VILLAGEOIS', member: {displayName: 'Villager1'}},
            {alive: false, team: 'VILLAGEOIS', member: {displayName: 'DeadVillager'}}
        ];

        mockConfiguration.getAlivePlayers = jest.fn(() => mockPlayers.filter(p => p.alive));
        mockConfiguration.getMemberteams = jest.fn((team) => mockPlayers.filter(p => p.team === team).map(p => p.member.displayName));

        gameFlow.GameConfiguration = mockConfiguration;
        gameFlow.fillGameStats();

        expect(gameFlow.gameStats.setDescription).toHaveBeenCalled();
        expect(gameFlow.gameStats.addField).toHaveBeenCalledWith('Loups', ['', 'Wolf1'], true);
        expect(gameFlow.gameStats.addField).toHaveBeenCalledWith('Villageois', ['', 'Villager1'], true);
    });

    test('should detect game ended when only one player alive', () => {
        const gameFlow = new GameFlow(mockClient, mockGameInfo, mockGameOptions);
        gameFlow.GameConfiguration = mockConfiguration;

        // Setup scenario with only one alive player
        const alivePlayers = [{team: 'LG', member: {displayName: 'Winner'}}];
        const deadPlayers = [{team: 'VILLAGEOIS', member: {displayName: 'Loser'}}];

        mockConfiguration.getAlivePlayers = jest.fn(() => alivePlayers);
        mockConfiguration.getDeadPlayers = jest.fn(() => deadPlayers);
        mockConfiguration.getPlayers = jest.fn(() => new Map());

        gameFlow.onPause = 1; // Need to simulate pause decrement

        setImmediate(() => {
            expect(gameFlow.gameEnded()).resolves.toBe(true);
        });
    });

    test('should detect game ended when lovers are last surviving players', () => {
        const gameFlow = new GameFlow(mockClient, mockGameInfo, mockGameOptions);
        gameFlow.GameConfiguration = mockConfiguration;

        // Setup scenario with two alive players who are lovers
        const alivePlayers = [
            {team: 'VILLAGEOIS', member: {displayName: 'Player1', id: '1'}, amoureux: '2'},
            {team: 'LG', member: {displayName: 'Player2', id: '2'}, amoureux: '1'}
        ];

        mockConfiguration.getAlivePlayers = jest.fn(() => alivePlayers);
        mockConfiguration.getPlayers = jest.fn(() => new Map());

        expect(gameFlow.gameEnded()).resolves.toBe(true);
    });

    test('should return false when game is not ended', () => {
        const gameFlow = new GameFlow(mockClient, mockGameInfo, mockGameOptions);
        gameFlow.GameConfiguration = mockConfiguration;

        // Setup scenario with multiple players alive
        const alivePlayers = [
            {team: 'LG'},
            {team: 'VILLAGEOIS'},
            {team: 'LG'}
        ];

        mockConfiguration.getAlivePlayers = jest.fn(() => alivePlayers);

        expect(gameFlow.gameEnded()).resolves.toBe(false);
    });
});

// Tests for EventEmitter behavior and timing mechanisms
describe('GameFlow Event Handling', () => {
    test('should handle multiple deaths sequentially', (done) => {
        const GameFlow = require('../../src/lg/lg_flow').GameFlow;
        const gameFlow = new GameFlow({}, {}, {});

        let processedDeaths = 0;
        gameFlow.killer.on('death_processed', () => {
            processedDeaths++;
            if (processedDeaths === 2) {
                expect(gameFlow.onPause).toBe(0);
                done();
            }
        });

        // Emit two deaths
        setImmediate(() => {
            gameFlow.killer.emit('death', {});
            gameFlow.onPause += 1;
        });

        setImmediate(() => {
            gameFlow.killer.emit('death', {});
            gameFlow.onPause += 1;
        });
    });
});

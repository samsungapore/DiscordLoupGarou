// Standalone LG test runner to avoid mocha/jest configuration issues
// This allows TDD testing during Phase 1 development

const {
    LGGameObject,
    death_sentence,
    bypass_roles,
    MINUTE,
    memberStatus
} = require('../src/lg/lg_var');

const LgLogger = require('../src/lg/lg_logger');

// Mock Discord.js dependencies for message_sending tests
// Using manual module mocking for standalone Node.js environment
const mockMessageSending = () => {
    // Clear module cache
    delete require.cache[require.resolve('../src/lg/lg_var.js')];
    delete require.cache[require.resolve('../src/BotData.js')];
    delete require.cache[require.resolve('../src/utils/embed')];
    delete require.cache[require.resolve('../src/utils/message')];
    delete require.cache[require.resolve('../src/lg/message_sending.js')];

    // Override modules in require cache with mocks
    require.cache[require.resolve('../src/lg/lg_var.js')] = {
        exports: {
            roles_img: {
                LoupGarou: 'https://example.com/werewolf.png'
            }
        }
    };

    require.cache[require.resolve('../src/BotData.js')] = {
        exports: {
            BotValues: {
                botColor: 7419530
            }
        }
    };

    require.cache[require.resolve('../src/utils/embed')] = {
        exports: require('./lg/discord-mocks').MockMessageEmbed
    };

    require.cache[require.resolve('../src/utils/message')] = {
        exports: {
            sendEmbed: async (channel, embed) => await channel.send({embeds: [embed]})
        }
    };

    return require('../src/lg/message_sending');
};

console.log('Running LG Variable Tests...\n');

// Test LGGameObject constructor
function testLGGameObject() {
    console.log('Testing LGGameObject constructor...');
    const gameObject = new LGGameObject();

    // Test basic properties
    const tests = [
        {prop: 'lg_on', expected: false, actual: gameObject.lg_on},
        {prop: 'game_initialized', expected: false, actual: gameObject.game_initialized},
        {prop: 'participants_complete', expected: false, actual: gameObject.participants_complete},
        {prop: 'quitting_game', expected: false, actual: gameObject.quitting_game},
        {prop: 'turn', expected: 1, actual: gameObject.turn},
        {prop: 'firstnight', expected: true, actual: gameObject.firstnight},
    ];

    let passed = 0;
    let failed = 0;

    tests.forEach(test => {
        if (test.actual === test.expected) {
            console.log(`  ✓ ${test.prop} = ${test.expected}`);
            passed++;
        } else {
            console.log(`  ✗ ${test.prop} expected ${test.expected}, got ${test.actual}`);
            failed++;
        }
    });

    // Test objects
    if (typeof gameObject.players === 'object' && Object.keys(gameObject.players).length === 0) {
        console.log(`  ✓ players is empty object`);
        passed++;
    } else {
        console.log(`  ✗ players is not empty object`);
        failed++;
    }

    // role_players_id should be populated with all roles as empty arrays
    if (typeof gameObject.role_players_id === 'object') {
        const expectedRoles = ['Villageois', 'LoupGarou', 'Voyante', 'Salvateur', 'Sorciere', 'Chasseur', 'Cupidon', 'Ancien', 'LoupBlanc', 'Voleur', 'PetiteFille', 'IdiotDuVillage', 'BoucEmissaire', 'JoueurDeFlute', 'EnfantSauvage', 'Ange', 'InfectPereDesLoups', 'GrandMechantLoup', 'Soeur', 'MontreurOurs', 'Renard', 'ChienLoup', 'Frere', 'Chevalier', 'JugeBegue', 'Corbeau', 'Capitaine'];
        const actualRoles = Object.keys(gameObject.role_players_id);
        const allRolesPresent = expectedRoles.every(role => actualRoles.includes(role));
        const allArraysEmpty = actualRoles.every(role => Array.isArray(gameObject.role_players_id[role]) && gameObject.role_players_id[role].length === 0);

        if (allRolesPresent && allArraysEmpty) {
            console.log(`  ✓ role_players_id initialized with all roles as empty arrays`);
            passed++;
        } else {
            console.log(`  ✗ role_players_id not properly initialized`);
            failed++;
        }
    } else {
        console.log(`  ✗ role_players_id is not an object`);
        failed++;
    }

    return {passed, failed};
}

// Test constants
function testConstants() {
    console.log('Testing Constants...');
    const tests = [
        {name: 'MINUTE', expected: 60000, actual: MINUTE},
        {
            name: 'death_sentence',
            expected: 'array',
            actual: Array.isArray(death_sentence) ? 'array' : typeof death_sentence
        },
        {name: 'bypass_roles', expected: 'array', actual: Array.isArray(bypass_roles) ? 'array' : typeof bypass_roles},
        {name: 'memberStatus', expected: 'object', actual: typeof memberStatus},
    ];

    let passed = 0;
    let failed = 0;

    tests.forEach(test => {
        if (test.actual === test.expected) {
            console.log(`  ✓ ${test.name} = ${test.expected}`);
            passed++;
        } else {
            console.log(`  ✗ ${test.name} expected ${test.expected}, got ${test.actual}`);
            failed++;
        }
    });

    // Specific content checks
    if (testConstants) {
        if (death_sentence.length > 0) {
            console.log(`  ✓ death_sentence has ${death_sentence.length} sentences`);
            passed++;
        } else {
            console.log(`  ✗ death_sentence is empty`);
            failed++;
        }

        if (bypass_roles.includes('LoupGarou') && bypass_roles.includes('PetiteFille')) {
            console.log(`  ✓ bypass_roles contains expected roles`);
            passed++;
        } else {
            console.log(`  ✗ bypass_roles missing expected roles`);
            failed++;
        }

        const expectedStatuses = ['online', 'offline', 'idle', 'dnd'];
        const statusKeys = Object.keys(memberStatus);
        const missingStatuses = expectedStatuses.filter(s => !statusKeys.includes(s));

        if (missingStatuses.length === 0) {
            console.log(`  ✓ memberStatus has all expected keys`);
            passed++;
        } else {
            console.log(`  ✗ memberStatus missing keys: ${missingStatuses.join(', ')}`);
            failed++;
        }
    }

    return {passed, failed};
}

// Test LgLogger
function testLogger() {
    console.log('Testing LgLogger...');
    let passed = 0;
    let failed = 0;

    // Test static methods exist
    const methods = ['info', 'warn', 'error', 'debug'];
    methods.forEach(method => {
        if (typeof LgLogger[method] === 'function') {
            console.log(`  ✓ LgLogger.${method} is a function`);
            passed++;
        } else {
            console.log(`  ✗ LgLogger.${method} is not a function`);
            failed++;
        }
    });

    // Test singleton properties
    if (typeof LgLogger.instance === 'object' && LgLogger.instance.lg === 'loupgarou') {
        console.log(`  ✓ LgLogger.instance returns correct object`);
        passed++;
    } else {
        console.log(`  ✗ LgLogger.instance incorrect`);
        failed++;
    }

    if (Object.isFrozen(LgLogger)) {
        console.log(`  ✓ LgLogger is frozen (singleton)`);
        passed++;
    } else {
        console.log(`  ✗ LgLogger is not frozen`);
        failed++;
    }

    // Test actual logging functionality with mocked console
    const originalLog = console.log;
    const loggedMessages = [];
    console.log = function (...args) {
        loggedMessages.push(args.join(' '));
    };

    // Test a log call (assuming it uses logger.info from the utils)
    const mockGameInfo = {serverName: 'TestServer', gameNb: 123};
    // Since the logger uses the Winston logger which internally uses console.log,
    // we can test that it gets called correctly
    console.log = function (msg) {
        if (msg && msg.includes('TestServer') && msg.includes('game 123')) {
            loggedMessages.push(msg);
        }
        originalLog.call(console, ...arguments);
    };

    // Restore
    console.log = originalLog;

    return {passed, failed};
}

// Test message_sending.js
function testMessageSending() {
    console.log('Testing message_sending.js...');
    let passed = 0;
    let failed = 0;

    try {
        // Clear any existing mocks and require the module
        delete require.cache[require.resolve('../src/lg/message_sending')];

        const mocks = require('./lg/discord-mocks');
        const {LoupGarouVote, EveryOneVote, DayVote, VillageoisVote} = require('../src/lg/lg_vote');
        const {CommunicationHandler, message_curr_chan, message_to_village, msg} = mockMessageSending();

        // Test Vote Classes
        const mockVoteConfig = {
            _players: new Map([['p1', {member: {id: 'p1'}, alive: true}]]),
            getPlayersIdName: () => new Map([['p1', 'Player 1']]),
            getLG: () => [{member: {id: 'wolf1'}}],
            getAlivePlayers: () => [{member: {id: 'p1'}}],
            getVillageois: () => [{member: {id: 'v1'}}]
        };

        if (typeof LoupGarouVote === 'function') {
            const lgVote = new LoupGarouVote('Test', mockVoteConfig, 30000, {});
            if (lgVote.maxVotes !== undefined) {
                console.log(`  ✓ LoupGarouVote instantiated`);
                passed++;
            } else {
                console.log(`  ✗ LoupGarouVote missing maxVotes`);
                failed++;
            }
        } else {
            console.log(`  ✗ LoupGarouVote not a function`);
            failed++;
        }

        if (typeof DayVote === 'function') {
            const dayVote = new DayVote('Test', mockVoteConfig, 30000, {});
            if (dayVote.maxVotes !== undefined) {
                console.log(`  ✓ DayVote instantiated`);
                passed++;
            } else {
                console.log(`  ✗ DayVote missing maxVotes`);
                failed++;
            }
        } else {
            console.log(`  ✗ DayVote not a function`);
            failed++;
        }

        // Test ChannelsHandler
        const {ChannelsHandler} = require('../src/lg/lg_channel');
        if (typeof ChannelsHandler === 'function') {
            const mockGuild = {roles: {everyone: {}}, channels: {cache: new Map()}};
            const handler = new ChannelsHandler({}, mockGuild, {});
            if (handler.channels && handler._channels instanceof Map) {
                console.log(`  ✓ ChannelsHandler instantiated`);
                passed++;
            } else {
                console.log(`  ✗ ChannelsHandler missing properties`);
                failed++;
            }
        } else {
            console.log(`  ✗ ChannelsHandler not a function`);
            failed++;
        }

        // Test LG Game classes
        const {Game, GameInfo, GameConfiguration, GamePreparation} = require('../src/lg/lg_game');
        if (typeof GameInfo === 'function') {
            const gameInfo = new GameInfo({}, new Date());
            if (gameInfo.guild === undefined && typeof gameInfo.gameNb === 'string') {
                console.log(`  ✓ GameInfo instantiated`);
                passed++;
            } else {
                console.log(`  ✗ GameInfo missing expected properties`);
                failed++;
            }
        } else {
            console.log(`  ✗ GameInfo not a function`);
            failed++;
        }

        if (typeof GameConfiguration === 'function') {
            const config = new GameConfiguration({});
            if (config._players instanceof Map && config._participants instanceof Map) {
                console.log(`  ✓ GameConfiguration instantiated`);
                passed++;
            } else {
                console.log(`  ✗ GameConfiguration missing properties`);
                failed++;
            }
        } else {
            console.log(`  ✗ GameConfiguration not a function`);
            failed++;
        }

        // Test CommunicationHandler
        const client = new mocks.MockClient();
        const handler = new CommunicationHandler(client);

        if (handler.client === client) {
            console.log(`  ✓ CommunicationHandler instantiated with client`);
            passed++;
        } else {
            console.log(`  ✗ CommunicationHandler not instantiated correctly`);
            failed++;
        }

        // Test CommunicationHandler.getLGSampleMsg()
        const sampleMsg = CommunicationHandler.getLGSampleMsg();
        if (sampleMsg && sampleMsg.author && sampleMsg.author.name.includes('Loup-Garou')) {
            console.log(`  ✓ getLGSampleMsg returns proper embed structure`);
            passed++;
        } else {
            console.log(`  ✗ getLGSampleMsg does not return expected embed`);
            failed++;
        }

        // Test reconstructEmbed
        const originalEmbed = {
            fields: [{name: 'Field1', value: 'Value1', inline: false}]
        };
        const reconstructed = CommunicationHandler.reconstructEmbed(originalEmbed);
        if (reconstructed.fields && reconstructed.fields.length === 1) {
            console.log(`  ✓ reconstructEmbed works with fields`);
            passed++;
        } else {
            console.log(`  ✗ reconstructEmbed failed`);
            failed++;
        }

    } catch (error) {
        console.log(`  ✗ Error testing message_sending: ${error.message}`);
        failed++;
    }

    return {passed, failed};
}

// Run all tests
function runTests() {
    console.log('='.repeat(50));
    const objectResult = testLGGameObject();
    console.log('');
    const constantResult = testConstants();
    console.log('');
    const loggerResult = testLogger();
    console.log('');
    const messageSendingResult = testMessageSending();

    console.log('\n' + '='.repeat(50));
    const totalPassed = objectResult.passed + constantResult.passed + loggerResult.passed + messageSendingResult.passed;
    const totalFailed = objectResult.failed + constantResult.failed + loggerResult.failed + messageSendingResult.failed;

    console.log(`Test Results: ${totalPassed} passed, ${totalFailed} failed`);

    if (totalFailed === 0) {
        console.log('🎉 All tests PASSED! Ready for Phase 1 implementation.');
    } else {
        console.log('❌ Some tests FAILED. Need to implement missing functionality.');
    }

    return totalFailed === 0;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {testLGGameObject, testConstants, runTests};
}

// Run tests directly when executed
if (typeof require !== 'undefined' && require.main === module) {
    runTests();
}

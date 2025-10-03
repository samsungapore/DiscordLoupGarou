// TDD: Test lg_vote.js - Voting system classes with comprehensive coverage
// Following TDD: Red -> Green -> Refactor approach

// Mock external dependencies
jest.mock('../../src/functions/cmds/referendum.js', () => ({
    SondageInfiniteChoice: jest.fn().mockImplementation(() => ({
        post: jest.fn(() => Promise.resolve([[1], [2]])) // Mock vote results
    }))
}));

jest.mock('../../src/lg/message_sending.js', () => ({
    CommunicationHandler: {
        getLGSampleMsg: jest.fn(() => ({
            setColor: jest.fn().mockReturnThis(),
            addField: jest.fn().mockReturnThis(),
            build: jest.fn().mockReturnValue({})
        }))
    }
}));

const {LoupGarouVote, EveryOneVote, DayVote, VillageoisVote} = require('../../src/lg/lg_vote');

describe('Vote Base Class', () => {
    let mockConfiguration, mockChannel;

    beforeEach(() => {
        mockConfiguration = {
            _players: new Map([
                ['user1', {member: {id: 'user1'}, alive: true}],
                ['user2', {member: {id: 'user2'}, alive: true}],
                ['user3', {member: {id: 'user3'}, alive: false}] // Dead player
            ]),
            getPlayersIdName: jest.fn(() => new Map([
                ['user1', 'Player 1'],
                ['user2', 'Player 2'],
                ['user3', 'Player 3']
            ]))
        };

        mockChannel = {
            id: 'channel-id',
            send: jest.fn(() => Promise.resolve())
        };
    });

    test('should initialize Vote with correct properties', () => {
        // TDD: Define expected Vote initialization behavior
        const Vote = require('../../src/lg/lg_vote').Vote;
        const vote = new Vote('Test Question', mockConfiguration, 30000, mockChannel, 2, true);

        expect(vote.question).toBe('Test Question');
        expect(vote.configuration).toBe(mockConfiguration);
        expect(vote.time).toBe(30000);
        expect(vote.channel).toBe(mockChannel);
        expect(vote.maxVotes).toBe(2);
        expect(vote.additionnalExceptions).toEqual([]);
        expect(vote.deleteAll).toBe(true); // default parameter
    });

    test('should exclude dead players when excludeDeadPlayers called', () => {
        // TDD: Red - define expected dead player exclusion
        const Vote = require('../../src/lg/lg_vote').Vote;
        const vote = new Vote('Test', mockConfiguration, 30000, mockChannel, 1);

        const result = vote.excludeDeadPlayers();

        expect(result).toBe(vote); // Should return this for chaining
        expect(vote.additionnalExceptions).toContain('user3');
        expect(vote.additionnalExceptions).not.toContain('user1');
        expect(vote.additionnalExceptions).not.toContain('user2');
    });

    test('should exclude alive players when excludeAlivePlayers called', () => {
        // TDD: Red - define expected alive player exclusion
        const Vote = require('../../src/lg/lg_vote').Vote;
        const vote = new Vote('Test', mockConfiguration, 30000, mockChannel, 1);

        const result = vote.excludeAlivePlayers();

        expect(result).toBe(vote);
        expect(vote.additionnalExceptions).toContain('user1');
        expect(vote.additionnalExceptions).toContain('user2');
        expect(vote.additionnalExceptions).not.toContain('user3'); // Dead player not excluded again
    });

    test('should run vote and return sorted player IDs', async () => {
        // TDD: Red - define expected vote execution behavior
        const Vote = require('../../src/lg/lg_vote').Vote;
        const {SondageInfiniteChoice} = require('../../src/functions/cmds/referendum.js');

        // Mock Sondage.post to return specific vote indices
        SondageInfiniteChoice.mockImplementation(() => ({
            post: jest.fn(() => Promise.resolve([[2], [1]])) // Vote choices 2,1 -> user2, user1
        }));

        const vote = new Vote('Test Question', mockConfiguration, 30000, mockChannel, 2);

        const result = await vote.runVote([]);

        // Verify Sondage was constructed correctly
        expect(SondageInfiniteChoice).toHaveBeenCalledWith(
            'Test Question',
            ['Player 1', 'Player 2'], // Names array
            mockChannel,
            30000, // time
            expect.any(Object), // CommunicationHandler.getLGSampleMsg()
            true, // bool parameter
            true, // deleteAll
            2 // maxVotes
        );

        expect(result).toEqual(['user2', 'user1']); // Indices 2,1 -> IDs user2, user1
    });

    test('should filter out exceptions from vote participants', async () => {
        // TDD: Red - define expected exception filtering behavior
        const Vote = require('../../src/lg/lg_vote').Vote;
        const {SondageInfiniteChoice} = require('../../src/functions/cmds/referendum.js');

        SondageInfiniteChoice.mockImplementation(() => ({
            post: jest.fn(() => Promise.resolve([[1]]))
        }));

        const vote = new Vote('Test', mockConfiguration, 30000, mockChannel, 1);
        const exceptions = ['user2']; // Exclude user2

        await vote.runVote(exceptions);

        // Should only pass ['Player 1', 'Player 3'] (user1, user3)
        expect(SondageInfiniteChoice).toHaveBeenCalledWith(
            'Test',
            ['Player 1', 'Player 3'], // Only non-excluded players
            mockChannel,
            30000,
            expect.any(Object),
            true,
            true,
            1
        );
    });
});

describe('LoupGarouVote', () => {
    let mockConfiguration, mockChannel;

    beforeEach(() => {
        mockConfiguration = {
            getLG: jest.fn(() => [
                {member: {id: 'wolf1'}},
                {member: {id: 'wolf2'}}
            ])
        };
        mockChannel = {};
    });

    test('should initialize LoupGarouVote with maxVotes equal to LG count', () => {
        // TDD: Red - define expected LoupGarouVote specialization
        const lgVote = new LoupGarouVote('Kill target?', mockConfiguration, 30000, mockChannel);

        expect(lgVote.question).toBe('Kill target?');
        expect(lgVote.maxVotes).toBe(2); // getLG().length
        expect(lgVote.deleteAll).toBe(false);
    });
});

describe('EveryoneVote (EveryOneVote)', () => {
    test('should initialize EveryOneVote with custom maxVotes', () => {
        // TDD: Red - define expected EveryOneVote flexibility
        const mockConfig = {};
        const mockChannel = {};
        const vote = new EveryOneVote('General vote', mockConfig, 60000, mockChannel, 5);

        expect(vote.question).toBe('General vote');
        expect(vote.maxVotes).toBe(5);
        expect(vote.deleteAll).toBe(true); // Default
    });
});

describe('DayVote', () => {
    let mockConfiguration, mockChannel;

    beforeEach(() => {
        mockConfiguration = {
            getAlivePlayers: jest.fn(() => [
                {member: {id: 'p1'}},
                {member: {id: 'p2'}},
                {member: {id: 'p3'}}
            ])
        };
        mockChannel = {};
    });

    test('should initialize DayVote with maxVotes equal to alive player count', () => {
        // TDD: Red - define expected DayVote daytime specialization
        const dayVote = new DayVote('Who dies?', mockConfiguration, 120000, mockChannel);

        expect(dayVote.question).toBe('Who dies?');
        expect(dayVote.maxVotes).toBe(3); // getAlivePlayers().length
        expect(dayVote.deleteAll).toBe(true);
    });
});

describe('VillageoisVote', () => {
    let mockConfiguration, mockChannel;

    beforeEach(() => {
        mockConfiguration = {
            getVillageois: jest.fn(() => [
                {member: {id: 'v1'}},
                {member: {id: 'v2'}},
                {member: {id: 'v3'}},
                {member: {id: 'v4'}}
            ])
        };
        mockChannel = {};
    });

    test('should initialize VillageoisVote with maxVotes equal to villageois count', () => {
        // TDD: Red - define expected VillageoisVote villager specialization
        const villagerVote = new VillageoisVote('Villager decision', mockConfiguration, 90000, mockChannel);

        expect(villagerVote.question).toBe('Villager decision');
        expect(villagerVote.maxVotes).toBe(4); // getVillageois().length
        expect(villagerVote.deleteAll).toBe(true);
    });
});

describe('Vote Integration', () => {
    test('should chain exclude methods correctly', () => {
        // TDD: Red - define expected fluent API behavior
        const Vote = require('../../src/lg/lg_vote').Vote;
        const mockConfig = {
            _players: new Map([
                ['p1', {member: {id: 'p1'}, alive: false}], // Dead
                ['p2', {member: {id: 'p2'}, alive: true}],  // Alive
                ['p3', {member: {id: 'p3'}, alive: false}]  // Dead
            ])
        };
        const vote = new Vote('Test', mockConfig, 30000, {}, 1);

        // Chain excludeDeadPlayers and verify it returns this for chaining
        const result = vote.excludeDeadPlayers();

        expect(result).toBe(vote);
        expect(vote.additionnalExceptions).toEqual(['p1', 'p3']);
    });
});

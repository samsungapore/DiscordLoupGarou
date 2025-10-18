const assert = require('assert');

describe('AI Narration', function () {
    const ORIGINAL_ENV = {...process.env};

    function fresh() {
        delete require.cache[require.resolve('../../../src/services/ai/ai_narration')];
        return require('../../../src/services/ai/ai_narration');
    }

    afterEach(() => {
        for (const k of Object.keys(process.env)) delete process.env[k];
        Object.assign(process.env, ORIGINAL_ENV);
    });

    it('shouldUseAi returns false by default', function () {
        const {shouldUseAi} = fresh();
        const gameInfo = {startedBy: 'user1', guild: {id: 'guild1'}};
        assert.strictEqual(shouldUseAi(gameInfo), false);
    });

    it('shouldUseAi true when enabled and starter is premium', function () {
        process.env.LG_AI_ANNOUNCEMENTS_ENABLED = '1';
        process.env.LG_PREMIUM_USER_IDS = 'user42';
        const {shouldUseAi} = fresh();
        const gameInfo = {startedBy: 'user42', guild: {id: 'guildX'}};
        assert.strictEqual(shouldUseAi(gameInfo), true);
    });

    it('generateMorningAnnouncement gracefully falls back without llamaindex', async function () {
        process.env.LG_AI_ANNOUNCEMENTS_ENABLED = '1';
        process.env.LG_PREMIUM_USER_IDS = 'user42';
        const {generateMorningAnnouncement} = fresh();
        const gameInfo = {startedBy: 'user42', guild: {id: 'guildX'}};
        const text = await generateMorningAnnouncement({gameInfo, deadPeople: [], turn: 1});
        assert.strictEqual(typeof text, 'string');
        assert.ok(text.toLowerCase().includes('le jour se lève') || text.includes('🌄'));
    });

    it('generateMorningAnnouncement uses AgentService output when available', async function () {
        process.env.LG_AI_ANNOUNCEMENTS_ENABLED = '1';
        process.env.LG_PREMIUM_USER_IDS = 'user42';

        // Stub AgentService used inside ai_narration
        const stubPath = require.resolve('../../../src/services/ai/llm/AgentService');
        const original = require.cache[stubPath];
        try {
            class StubAgentService {
                constructor() {
                }

                async ask() {
                    return 'ANNONCE IA: Bonjour village !';
                }
            }

            require.cache[stubPath] = {id: stubPath, filename: stubPath, loaded: true, exports: StubAgentService};

            // reload module to pick stub
            const {generateMorningAnnouncement} = fresh();
            const gameInfo = {startedBy: 'user42', guild: {id: 'guildX'}};
            const text = await generateMorningAnnouncement({gameInfo, deadPeople: [], turn: 2});
            assert.strictEqual(text, 'ANNONCE IA: Bonjour village !');
        } finally {
            // restore cache entry
            if (original) {
                require.cache[stubPath] = original;
            } else {
                delete require.cache[stubPath];
            }
        }
    });

    it('formats death line for single and multiple deaths', async function () {
        process.env.LG_AI_ANNOUNCEMENTS_ENABLED = '1';
        process.env.LG_PREMIUM_USER_IDS = 'user42';

        // Stub AgentService to echo back query recognizable (not necessary; we only ensure it returns something)
        const stubPath = require.resolve('../../../src/services/ai/llm/AgentService');
        const original = require.cache[stubPath];
        try {
            class StubAgentService {
                async ask(q) {
                    return String(q).includes('sont morts') ? 'PLURIEL' : 'SINGULIER';
                }
            }

            require.cache[stubPath] = {id: stubPath, filename: stubPath, loaded: true, exports: StubAgentService};
            const mod = fresh();
            const gameInfo = {startedBy: 'user42', guild: {id: 'guildX'}};
            const single = await mod.generateMorningAnnouncement({
                gameInfo,
                deadPeople: [{member: {displayName: 'Kazuhiro'}, role: 'Villageois'}],
                turn: 2
            });
            const multi = await mod.generateMorningAnnouncement({
                gameInfo, deadPeople: [
                    {member: {displayName: 'Kazuhiro'}, role: 'Villageois'},
                    {member: {displayName: 'Mion'}, role: 'Villageois'}
                ], turn: 2
            });
            assert.strictEqual(single, 'SINGULIER');
            assert.strictEqual(multi, 'PLURIEL');
        } finally {
            if (original) {
                require.cache[stubPath] = original;
            } else {
                delete require.cache[stubPath];
            }
        }
    });
});

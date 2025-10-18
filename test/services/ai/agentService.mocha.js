const assert = require('assert');

describe('AgentService (LLM wrapper)', function () {
    const ORIGINAL_ENV = {...process.env};

    function fresh() {
        delete require.cache[require.resolve('../../../src/services/ai/llm/AgentService')];
        return require('../../../src/services/ai/llm/AgentService');
    }

    afterEach(() => {
        for (const k of Object.keys(process.env)) delete process.env[k];
        Object.assign(process.env, ORIGINAL_ENV);
    });

    it('returns null when loader throws (import failure path)', async function () {
        const AgentService = fresh();
        const svc = new AgentService({
            systemPrompt: 'x', loader: async () => {
                throw new Error('boom');
            }
        });
        const res = await svc.ask('hello');
        assert.strictEqual(res, null);
    });

    it('normalizes response when ReActAgent returns object with response', async function () {
        const AgentService = fresh();

        class StubAgent {
            constructor() {
            }

            async chat() {
                return {response: 'Bonjour le monde'};
            }
        }

        class StubOpenAI {
            constructor() {
            }
        }

        const loader = async (id) => id === 'llamaindex' ? {ReActAgent: StubAgent} : {OpenAI: StubOpenAI};
        const svc = new AgentService({systemPrompt: 'sys', loader});
        const res = await svc.ask('msg');
        assert.strictEqual(res, 'Bonjour le monde');
    });

    it('normalizes response when ReActAgent returns string directly', async function () {
        const AgentService = fresh();

        class StubAgent {
            constructor() {
            }

            async chat() {
                return 'Texte direct';
            }
        }

        class StubOpenAI {
            constructor() {
            }
        }

        const loader = async (id) => id === 'llamaindex' ? {ReActAgent: StubAgent} : {OpenAI: StubOpenAI};
        const svc = new AgentService({loader});
        const res = await svc.ask('msg');
        assert.strictEqual(res, 'Texte direct');
    });
});

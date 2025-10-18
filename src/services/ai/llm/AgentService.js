class AgentService {
    constructor({systemPrompt = '', loader} = {}) {
        this.systemPrompt = systemPrompt || '';
        this._loader = typeof loader === 'function' ? loader : null;
    }

    async #import(id) {
        if (this._loader) return this._loader(id);
        return import(id);
    }

    async ask(query) {
        try {
            const timeoutMs = Number(process.env.LG_AI_AGENT_TIMEOUT_MS || (process.env.NODE_ENV === 'test' ? 500 : 1500));
            let timedOut = false;
            const t = setTimeout(() => {
                timedOut = true;
            }, Math.max(0, timeoutMs));
            const llama = await this.#import('llamaindex');
            const openai = await this.#import('@llamaindex/openai');

            const {ReActAgent} = llama;
            const {OpenAI} = openai;

            const llm = new OpenAI({
                model: process.env.OPENAI_MODEL || 'openai/gpt-oss-20b',
                baseURL: process.env.OPENAI_API_BASE || 'http://127.0.0.1:1234/v1',
                apiKey: process.env.OPENAI_API_KEY || 'lm-studio',
                temperature: 0.2,
            });

            const agent = new ReActAgent({llm, tools: [], verbose: false, systemPrompt: this.systemPrompt});
            if (timedOut) {
                clearTimeout(t);
                return null;
            }
            const res = await agent.chat({message: query});
            if (timedOut) {
                clearTimeout(t);
                return null;
            }
            const norm = (x) => {
                if (!x) return '';
                if (typeof x === 'string') return x;
                for (const k of ['response', 'message', 'text', 'content']) {
                    if (x && typeof x[k] === 'string') return x[k];
                }
                return String(x);
            };
            const out = norm(res).trim();
            clearTimeout(t);
            return out || null;
        } catch (_) {
            return null;
        }
    }
}

module.exports = AgentService;

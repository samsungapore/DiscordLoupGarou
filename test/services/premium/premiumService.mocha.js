const assert = require('assert');

describe('PremiumService', function () {
    const ORIGINAL_ENV = {...process.env};

    // Lazy require to ensure env vars are set before module load
    function fresh() {
        delete require.cache[require.resolve('../../../src/services/premium/PremiumService')];
        return require('../../../src/services/premium/PremiumService');
    }

    afterEach(() => {
        // restore env
        for (const k of Object.keys(process.env)) delete process.env[k];
        Object.assign(process.env, ORIGINAL_ENV);
    });

    it('returns false when allowlists are empty', function () {
        process.env.LG_PREMIUM_USER_IDS = '';
        process.env.LG_PREMIUM_GUILD_IDS = '';
        const Premium = fresh();
        assert.strictEqual(Premium.isUserPremium('u1'), false);
        assert.strictEqual(Premium.isGuildPremium('g1'), false);
        assert.strictEqual(Premium.hasPremium({userId: 'u1', guildId: 'g1'}), false);
    });

    it('matches premium users by ID', function () {
        process.env.LG_PREMIUM_USER_IDS = '123,  456 ';
        const Premium = fresh();
        assert.strictEqual(Premium.isUserPremium('123'), true);
        assert.strictEqual(Premium.hasPremium({userId: '456'}), true);
        assert.strictEqual(Premium.hasPremium({userId: '789'}), false);
    });

    it('matches premium guilds by ID', function () {
        process.env.LG_PREMIUM_GUILD_IDS = 'g1,g2';
        const Premium = fresh();
        assert.strictEqual(Premium.isGuildPremium('g1'), true);
        assert.strictEqual(Premium.hasPremium({guildId: 'g2'}), true);
        assert.strictEqual(Premium.hasPremium({guildId: 'g3'}), false);
    });
});

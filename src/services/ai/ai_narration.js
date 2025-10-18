const Premium = require('../premium/PremiumService');
const AgentService = require('./llm/AgentService');

function enabled() {
    return String(process.env.LG_AI_ANNOUNCEMENTS_ENABLED ?? '1') !== '0';
}

function shouldUseAi(gameInfo) {
    if (!enabled() || !gameInfo) return false;
    const userId = gameInfo.startedBy || gameInfo.startedById || '';
    const guildId = (gameInfo.guild && gameInfo.guild.id) || gameInfo.guildId || '';
    return Premium.hasPremium({userId, guildId});
}

async function generateMorningAnnouncement({gameInfo, deadPeople = [], turn}) {
    const fallback = turn === 1
        ? "🌄 Le jour se lève à Thiercelieux. Quand la neige éternelle ornera les montagnes, le capitaine devra être élu."
        : "Le jour se lève sur thiercelieux 🌄";

    if (!shouldUseAi(gameInfo)) return fallback;

    try {
        const theme = process.env.LG_AI_THEME || 'Higurashi: When They Cry à Hinamizawa';
        const style = process.env.LG_AI_STYLE || '';
        const deaths = (deadPeople || []).filter(Boolean).map(p => {
            const name = p?.member?.displayName || p?.name || 'Quelqu\u2019un';
            const role = p?.role ? String(p.role) : 'inconnu';
            return `${name} (était ${role})`;
        });
        const deathLine = deaths.length
            ? `soit dit en passant, ${deaths.join(', ')} ${deaths.length > 1 ? 'sont morts.' : 'est mort.'}`
            : "personne n'est mort cette nuit.";

        const system = `Tu es le maître du jeu d'une partie de loup garou, thème ${theme}. Réponds uniquement par l'annonce du matin en français, concise.`;
        const user = `${style}\nEffectue l'annonce du petit matin; ${deathLine} N'écris rien d'autre.`;

        const agent = new AgentService({systemPrompt: system});
        const out = await agent.ask(user);
        return (out && String(out).trim()) || fallback;
    } catch (_) {
        return fallback;
    }
}

module.exports = {shouldUseAi, generateMorningAnnouncement};

require('./utils/env');

const parseList = (v) => (v || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const parseColor = (v) => {
    const arr = (v || '').split(',').map(n => parseInt(n.trim(), 10)).filter(n => !Number.isNaN(n));
    return arr.length === 3 ? arr : [0, 210, 255];
};

module.exports = {
    BotValues: {
        botId: process.env.LG_BOT_ID || '',
        botOwners: parseList(process.env.LG_BOT_OWNERS),
        botToken: process.env.LG_BOT_TOKEN || '',
        botPrefix: process.env.LG_BOT_PREFIX || 'lg/',
        botColor: parseColor(process.env.LG_BOT_COLOR),
        botInviteLink: process.env.LG_BOT_INVITE_LINK || '',
    },

    GoogleSheet: {
        apiKey: process.env.GOOGLE_API_KEY || '',
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || ''
    },

    LG: {
        running: false,
        game: null,
        canRun: [],
        stemming: null
    },

    Settings: {
        Admins: []
    }
};

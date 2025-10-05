let logger = require('../utils/logger');
const Winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

// create a unique, global symbol name
// -----------------------------------

const LG_KEY = Symbol.for("My.App.Namespace.foo");

// check if the global object has this symbol
// add it if it does not have the symbol, yet
// ------------------------------------------

let globalSymbols = Object.getOwnPropertySymbols(global);
let hasFoo = (globalSymbols.indexOf(LG_KEY) > -1);

if (!hasFoo){
    global[LG_KEY] = {
        lg: "loupgarou"
    };
}

// define the singleton API
// ------------------------

class LgLogger {

    /**
     * @param {string} message - log message
     * @param {{serverName?: string, gameNb?: string|number}} [gameInfo]
     * @param {Object} [meta] - extra metadata
     */
    static info(message, gameInfo = {}, meta = {}) {
        const m = LgLogger.#toMeta(gameInfo, meta);
        logger.info(message, m);
        LgLogger.#logToGuildFile('info', message, m);
    }

    static warn(message, gameInfo = {}, meta = {}) {
        const m = LgLogger.#toMeta(gameInfo, meta);
        logger.warn(message, m);
        LgLogger.#logToGuildFile('warn', message, m);
    }

    static debug(message, gameInfo = {}, meta = {}) {
        const m = LgLogger.#toMeta(gameInfo, meta);
        logger.debug(message, m);
        LgLogger.#logToGuildFile('debug', message, m);
    }

    static error(message, gameInfo = {}, meta = {}) {
        const m = LgLogger.#toMeta(gameInfo, meta);
        logger.error(message, m);
        LgLogger.#logToGuildFile('error', message, m);
    }

    /**
     * Structured event logger.
     * @param {('debug'|'info'|'warn'|'error')} level
     * @param {string} event - event name (e.g., 'game.start')
     * @param {string} message
     * @param {Object} [data]
     * @param {{serverName?: string, gameNb?: string|number}} [gameInfo]
     */
    static event(level, event, message, data = {}, gameInfo = {}) {
        const meta = LgLogger.#toMeta(gameInfo, {event, data});
        logger.log(level, message, meta);
        LgLogger.#logToGuildFile(level, message, meta);
    }

    static #toMeta(gameInfo = {}, extra = {}) {
        const meta = {
            component: 'lg',
            guildName: gameInfo.serverName,
            guildId: (gameInfo.guild && gameInfo.guild.id) || gameInfo.guildId,
            gameId: gameInfo.gameNb,
            ...extra,
        };
        // Drop undefined keys for cleaner output
        Object.keys(meta).forEach(k => meta[k] === undefined && delete meta[k]);
        return meta;
    }

    static #guildLoggers = new Map();

    static #logToGuildFile(level, message, meta) {
        const guildId = meta && meta.guildId;
        if (!guildId) return;
        const dirBase = process.env.LOG_PATH || './logs';
        const guildDir = path.join(dirBase, 'guilds', String(guildId));
        if (!fs.existsSync(guildDir)) {
            try { fs.mkdirSync(guildDir, {recursive: true}); } catch (_) { return; }
        }
        let gLogger = this.#guildLoggers.get(guildId);
        if (!gLogger) {
            gLogger = Winston.createLogger({
                level: process.env.LOG_LEVEL || 'info',
                transports: [
                    new Winston.transports.DailyRotateFile({
                        filename: path.join(guildDir, '%DATE%.log'),
                        datePattern: 'YYYY_MM_DD',
                        zippedArchive: true,
                        maxSize: '20m',
                        maxFiles: '14d',
                        format: Winston.format.combine(
                            Winston.format.timestamp(),
                            Winston.format.uncolorize(),
                            Winston.format.json()
                        )
                    })
                ]
            });
            this.#guildLoggers.set(guildId, gLogger);
        }
        gLogger.log(level, message, meta);
    }
}

Object.defineProperty(LgLogger, "instance", {
    get: function(){
        return global[LG_KEY];
    }
});

// ensure the API is never changed
// -------------------------------

Object.freeze(LgLogger);

// export the singleton API only
// -----------------------------

module.exports = LgLogger;
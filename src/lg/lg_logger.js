let logger = require('../utils/logger');

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
    constructor() {

    }

    /**
     * @param message message to send
     * @param gameInfo gameinfo object
     */
    static info(message, gameInfo) {
        logger.info(`${gameInfo.serverName} | partie n°${gameInfo.gameNb} | ${message} | ${gameInfo.stemmingTime}`);
    }

    static warn(message, gameInfo) {
        logger.warn(`${gameInfo.serverName} | partie n°${gameInfo.gameNb} | ${message} | ${gameInfo.stemmingTime}`);
    }

    static error(message, gameInfo) {
        logger.error(`${gameInfo.serverName} | partie n°${gameInfo.gameNb} | ${message} | ${gameInfo.stemmingTime}`);
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
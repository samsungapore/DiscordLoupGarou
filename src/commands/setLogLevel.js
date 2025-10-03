const winston = require('../utils/logger');
const BotData = require('../BotData.js');

module.exports = {
    name: 'setLogLevel',
    description: 'Changer le niveau de log du bot',
    execute(LGBot, message, args) {
        if (BotData.BotValues.botOwners.includes(message.author.id)) {
            // Check if the user has the permission to change the log level
            if (!BotData.BotValues.botOwners.includes(message.author.id)) {
                return message.reply("Vous n'avez pas la permission de changer le niveau de log").catch(console.error);
            }

            if (!args.length) {
                return message.channel.send(`Vous n'avez pas spécifié de niveau de log, ${message.author}!`);
            }

            const logLevel = args[0].toLowerCase();
            const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];

            if (!validLevels.includes(logLevel)) {
                return message.channel.send(`Niveau de log invalide. Les niveaux valides sont: ${validLevels.join(', ')}`);
            }

            winston.level = logLevel;
            message.channel.send(`Niveau de log changé à ${logLevel}`);
        } else {
            message.reply("Vous n'avez pas la permission de changer le niveau de log").catch(console.error);
        }
    },
};
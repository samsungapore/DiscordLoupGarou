let botData = require("../BotData.js");
const LoupGarou = require("../lg/lg_game");
const getMusics = require('../functions/googleSheets');
const MessageEmbed = require("../utils/embed");
const messageUtils = require("../utils/message");
const LgLogger = require("../lg/lg_logger.js");
const get_random_in_array = require("../functions/parsing_functions").get_random_in_array;
const SondageInfiniteChoice = require("../functions/cmds/referendum").SondageInfiniteChoice;

class GameOptions {
    constructor() {
        this._voice = true;
        this._music = true;
        this._musics = null;

        this.musicMode = null;

        this.ai = {
            enabled: false,
            bots: 0,
            seed: 42,
            fast: false,
        };

        return this;
    }

    set voice(value) {
        this._voice = value;
    }

    get voice() {
        return this._voice;
    }

    set music(value) {
        this._music = value;
    }

    get music() {
        return this._music;
    }

}

let askMusicMode = async (message) => {

    let musicModes = await getMusics();
    let musicsData = musicModes.gameData;
    musicModes = Object.keys(musicsData);

    let embed = new MessageEmbed()
        .setTitle("Cliquez ici pour rajouter vos musiques")
        .setColor(botData.BotValues.botColor)
        .setURL("https://docs.google.com/spreadsheets/d/18-N7KfwYHyRIsKG06D_5tLIrpoLaeOm9WvS_RT79wfc/edit?usp=sharing");

    let choiceArray = await new SondageInfiniteChoice(
        "Quel set de musiques voulez-vous utiliser ?",
        musicModes, message.channel, 30000, embed, true, false
    ).post();

    let result = [];

    choiceArray.forEach(choice => {
        result.push(musicModes[choice[0] - 1]);
    });

    let finalChoice = null;

    if (result.length === 0) {
        finalChoice = get_random_in_array(musicModes);
    } else {
        finalChoice = get_random_in_array(result);
    }

    return musicsData[finalChoice];
};

let askOptions = async (message, args) => {

    let gameOptions = new GameOptions();

    gameOptions.musicMode = null;// await askMusicMode(message);

    //await message.channel.send(new MessageEmbed().setColor(botData.BotValues.botColor).setTitle(`Musiques utilisées : ${gameOptions.musicMode.name}`));

    // Parse AI args: --bots N --seed S --fast
    if (Array.isArray(args)) {
        const getNum = (v, d) => {
            const n = parseInt(v, 10);
            return isNaN(n) ? d : n;
        };
        for (const a of args) {
            if (a.startsWith('--bots')) {
                const parts = a.split('=');
                const v = parts[1] || args[args.indexOf(a) + 1];
                gameOptions.ai.bots = getNum(v, 0);
                gameOptions.ai.enabled = gameOptions.ai.bots > 0;
            } else if (a.startsWith('--seed')) {
                const parts = a.split('=');
                const v = parts[1] || args[args.indexOf(a) + 1];
                gameOptions.ai.seed = getNum(v, 42);
            } else if (a === '--fast') {
                gameOptions.ai.fast = true;
            }
        }
    }

    return gameOptions;

};

let launchNewGame = async (LGBot, message, LG, args) => {

    let gameOptions = await askOptions(message, args);

    LG.running = true;
    LG.stemming = message.author.id;
    LG.game = new LoupGarou.Game(LGBot, message, gameOptions);

    LGBot.LG.set(message.guild.id, LG);

    LgLogger.info(`GameOptions : ${JSON.stringify(gameOptions)}. Starting game.`, gameOptions);
    await LG.game.launch();

    LG = LGBot.LG.get(message.guild.id);
    LG.game = null;
    LG.running = false;
    LGBot.LG.set(message.guild.id, LG);

};

module.exports = {
    name: 'new',
    description: 'Lancer une nouvelle partie de Thiercelieux',
    execute(LGBot, message, args) {

        if (!message.member) {
            return;
        }

        let LG = LGBot.LG.get(message.guild.id);

        if (!LG) {
            LG = botData.LG;
            LGBot.LG.set(message.guild.id, LG);
        }

        if (!LG.running) {

            launchNewGame(LGBot, message, LG, args).catch(err => {
                if (err.name === "DiscordAPIError") {
                    let errMsg = new MessageEmbed()
                        .setTitle("Erreur rencontrée avec l'API Discord.")
                        .addField('Nom de l\'erreur', err.name)
                        .addField('Type', err.message)
                        .addField('Path', err.path)
                        .addField('Method', err.method)
                        .setDescription(err.stack);

                    if (err.message === "Missing Permissions") errMsg.setDescription("Assurez-vous d'avoir donné la permission 'Administrateur' au bot");


                    messageUtils.sendEmbed(message.channel, errMsg).catch(console.error);
                    const adminUser = LGBot.users.cache.find((user) => user.id === '140033402681163776');
                    if (adminUser) {
                        messageUtils.sendEmbed(adminUser, errMsg).catch(console.error);
                    }
                } else {
                    message.channel.send(err?.message || String(err)).catch(console.error);
                }
                console.error(err);
            });

        } else {
            message.channel.send("Partie de LG déjà en cours, pour stopper la partie de force, tapez lg/stop").catch(console.error);
        }
    },
};


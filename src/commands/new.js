let botData = require("../BotData.js");
const LoupGarou = require("../lg/lg_game");
const getMusics = require('../functions/googleSheets');
const get_random_in_array = require("../functions/parsing_functions").get_random_in_array;
const SondageInfiniteChoice = require("../functions/cmds/referendum").SondageInfiniteChoice;
const RichEmbed = require('discord.js').RichEmbed;

class GameOptions {
    constructor() {
        this._voice = true;
        this._music = true;
        this._musics = null;

        this.musicMode = null;

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

    static async get Musics() {
        return await getMusics();
    }

}

let askMusicMode = async (message) => {

    let musicModes = Object.keys(await GameOptions.Musics.games);

    let embed = new RichEmbed()
        .setTitle("Cliquez ici pour rajouter vos musiques")
        .setColor(botData.BotValues.botColor)
        .setURL("https://docs.google.com/spreadsheets/d/18-N7KfwYHyRIsKG06D_5tLIrpoLaeOm9WvS_RT79wfc/edit?usp=sharing");

    let choiceArray = await new SondageInfiniteChoice(
        "Quel set de musiques voulez-vous utiliser ?",
        musicModes, message.channel, 10000, embed, true, false
    ).post();

    let result = [];

    choiceArray.forEach(choice => {
        result.push(musicModes[choice[0] - 1]);
    });

    return get_random_in_array(result);
};

let askOptions = async (message) => {

    let gameOptions = new GameOptions();

    gameOptions.musicMode = await askMusicMode(message);

    await message.channel.send(new RichEmbed().setColor(botData.BotValues.botColor)
        .setTitle(`Musiques utilisées : ${gameOptions.musicMode.name}`));

    return gameOptions;

};

let launchNewGame = async (LGBot, message, LG) => {

    let gameOptions = await askOptions(message);

    LG.running = true;
    LG.stemming = message.author.id;
    LGBot.LG.set(message.guild.id, LG);

    LG.game = new LoupGarou.Game(LGBot, message, gameOptions);

    await LG.game.launch();

    LG.game = null;
    LG.running = false;
    LGBot.LG.set(message.guild.id, LG);

};

module.exports = {
    name: 'new',
    description: 'Lancer une nouvelle partie de Thiercelieux',
    execute(LGBot, message) {

        if (!message.member) {
            return;
        }

        let LG = LGBot.LG.get(message.guild.id);

        if (LG === undefined || LG === null) {
            LG = botData.LG;
            LGBot.LG.set(message.guild.id, LG);
            LG = LGBot.LG.get(message.guild.id);
        }

        console.log(LG.running);

        if (!LG.running) {

            launchNewGame(LGBot, message, LG).catch(console.error);

        } else {
            message.channel.send("Partie de LG déjà en cours, pour stopper la partie de force, tapez lg/stop").catch(console.error);
        }
    },
};


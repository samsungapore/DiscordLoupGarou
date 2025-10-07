let botData = require("../BotData.js");
const LoupGarou = require("../lg/lg_game");
const getMusics = require('../functions/googleSheets');
const MessageEmbed = require("../utils/embed");
const messageUtils = require("../utils/message");
const LgLogger = require("../lg/lg_logger.js");
const get_random_in_array = require("../functions/parsing_functions").get_random_in_array;
const SondageInfiniteChoice = require("../functions/cmds/referendum").SondageInfiniteChoice;
const {parseRoleComposition} = require("../utils/roleCompositionParser");

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

        this.roleComposition = null;

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

        for (let i = 0; i < args.length; i++) {
            const a = args[i];

            const extractValue = () => {
                const eqIndex = a.indexOf('=');
                if (eqIndex !== -1) {
                    const value = a.slice(eqIndex + 1).trim();
                    if (value) {
                        return value;
                    }
                }

                const next = args[i + 1];
                if (next && !next.startsWith('--')) {
                    i += 1;
                    return next;
                }

                return undefined;
            };

            if (a.startsWith('--bots')) {
                const v = extractValue();
                gameOptions.ai.bots = getNum(v, 0);
                gameOptions.ai.enabled = gameOptions.ai.bots > 0;
            } else if (a.startsWith('--seed')) {
                const v = extractValue();
                gameOptions.ai.seed = getNum(v, 42);
            } else if (a === '--fast') {
                gameOptions.ai.fast = true;
            } else if (a.startsWith('--roles')) {
                const value = extractValue();
                if (!value) {
                    throw new Error('Missing role composition specification for --roles');
                }

                try {
                    gameOptions.roleComposition = parseRoleComposition(value);
                } catch (err) {
                    throw new Error(`Invalid role composition: ${err.message}`);
                }
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
                const errName = String(err?.name || '');
                const isDiscordApiError = errName.startsWith('DiscordAPIError');
                const isMissingPerm = /Missing Permissions/i.test(String(err?.message || '')) || err?.code === 50013;

                if (isDiscordApiError) {
                    let errMsg = new MessageEmbed()
                        .setTitle("Erreur rencontrée avec l'API Discord.")
                        .addField('Nom de l\'erreur', err.name)
                        .addField('Type', err.message)
                        .addField('Path', err.path)
                        .addField('Method', err.method);

                    if (isMissingPerm) {
                        try {
                            const {PermissionsBitField} = require('discord.js');
                            const permUtils = require('../utils/permission');
                            const status = permUtils.getBotPermissionStatus(message.guild);
                            const neededForOp = permUtils.inferRequiredFromError(err);
                            const fmt = (flags) => flags.map(f => PermissionsBitField.Flags[f] ? f : Object.keys(PermissionsBitField.Flags).find(k => PermissionsBitField.Flags[k] === f) || String(f));
                            const present = fmt(status.present);
                            const missing = fmt(status.missing);
                            const opReq = fmt(neededForOp);

                            errMsg.setTitle('Permissions du bot sur ce serveur');
                            if (opReq.length) errMsg.addField('Opération bloquée', `Permissions requises: ${opReq.join(', ')}`);
                            if (!status.unknown) {
                                errMsg.addField('Déjà accordées', present.length ? present.join(', ') : 'Aucune');
                                errMsg.addField('Manquantes', missing.length ? missing.join(', ') : 'Aucune');
                            } else {
                                errMsg.addField('Diagnostic', 'Impossible de récupérer les permissions actuelles du bot.');
                            }

                            const inviteBits = permUtils.bitfieldOf(permUtils.REQUIRED_PERMISSIONS);
                            const invite = permUtils.buildInviteLink(inviteBits);
                            if (invite) errMsg.addField('Inviter avec permissions minimales', invite);
                        } catch (_) {
                            errMsg.setDescription("Permissions manquantes. Veuillez accorder les permissions nécessaires au bot.");
                        }
                    }
                    messageUtils.sendEmbed(message.channel, errMsg).catch(console.error);
                    const adminUser = LGBot.users.cache.find((user) => user.id === '140033402681163776');
                    if (adminUser) {
                        messageUtils.sendEmbed(adminUser, errMsg).catch(console.error);
                    }
                } else if (isMissingPerm) {
                    try {
                        const {PermissionsBitField} = require('discord.js');
                        const permUtils = require('../utils/permission');
                        const status = permUtils.getBotPermissionStatus(message.guild);
                        const neededForOp = permUtils.inferRequiredFromError(err);
                        const fmt = (flags) => flags.map(f => PermissionsBitField.Flags[f] ? f : Object.keys(PermissionsBitField.Flags).find(k => PermissionsBitField.Flags[k] === f) || String(f));
                        const present = fmt(status.present);
                        const missing = fmt(status.missing);
                        const opReq = fmt(neededForOp);

                        const errMsg = new MessageEmbed().setTitle('Permissions du bot sur ce serveur');
                        if (opReq.length) errMsg.addField('Opération bloquée', `Permissions requises: ${opReq.join(', ')}`);
                        if (!status.unknown) {
                            errMsg.addField('Déjà accordées', present.length ? present.join(', ') : 'Aucune');
                            errMsg.addField('Manquantes', missing.length ? missing.join(', ') : 'Aucune');
                        } else {
                            errMsg.addField('Diagnostic', 'Impossible de récupérer les permissions actuelles du bot.');
                        }
                        const inviteBits = permUtils.bitfieldOf(permUtils.REQUIRED_PERMISSIONS);
                        const invite = permUtils.buildInviteLink(inviteBits);
                        if (invite) errMsg.addField('Inviter avec permissions minimales', invite);
                        messageUtils.sendEmbed(message.channel, errMsg).catch(console.error);
                    } catch (_) {
                        message.channel.send("Permissions manquantes. Veuillez accorder les permissions nécessaires au bot.").catch(console.error);
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


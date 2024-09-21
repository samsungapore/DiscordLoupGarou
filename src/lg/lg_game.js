const BotData = require("../BotData.js");
const lg_var = require("./lg_var");
const LgLogger = require("./lg_logger");
const MessageEmbed = require("../utils/embed");
const {sendEmbed, editMessage} = require("../utils/message");
const VoiceHandler = require("./lg_voice").VoiceHandler;
const GameFlow = require("./lg_flow").GameFlow;
const ChannelsHandler = require("./lg_channel").ChannelsHandler;
const RolesHandler = require("./roles/lg_role").RolesHandler;
const ReactionHandler = require("../functions/reactionHandler").ReactionHandler;
const Wait = require('../functions/wait').Wait;
const {checkPermissions} = require("../utils/permission");


/**
 *
 * Yes, there are several compatibility issues in your code related to the updates in Node.js v20.17.0 and Discord.js v14.15.3. Discord.js v14 introduced significant breaking changes, and your code needs to be updated to accommodate these changes. Below, I'll detail the compatibility problems and provide solutions to update your code accordingly.
 *
 * ---
 *
 * ## **1. Updating Permissions Checks**
 *
 * ### **Problem**
 *
 * In Discord.js v14, the `hasPermission` method is deprecated. Instead, you should use `permissions.has()` with the appropriate permission flags from `PermissionsBitField`.
 *
 * #### **Your Code**
 *
 * ```javascript
 * if (guildMember.hasPermission('BAN_MEMBERS')) {
 *     // ...
 * }
 * ```
 *
 * ### **Solution**
 *
 * Import `PermissionsBitField` from `discord.js` and update the permissions checks.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * const { PermissionsBitField } = require('discord.js');
 *
 * // ...
 *
 * if (guildMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
 *     // ...
 * }
 * ```
 *
 * ### **Explanation**
 *
 * - **Importing `PermissionsBitField`**: This provides access to permission flags.
 * - **Using `permissions.has()`**: This method replaces `hasPermission` and checks if the member has the specified permission.
 *
 * ---
 *
 * ## **2. Updating `MessageEmbed` to `EmbedBuilder`**
 *
 * ### **Problem**
 *
 * In Discord.js v14, `MessageEmbed` has been replaced with `EmbedBuilder`. Additionally, the way you set properties like author, footer, and fields has changed.
 *
 * #### **Your Code**
 *
 * ```javascript
 * const MessageEmbed = require("../utils/embed");
 *
 * // ...
 *
 * return new MessageEmbed()
 *     .setDescription("Loup-Garou de Thiercelieux")
 *     .setColor(BotData.BotValues.botColor)
 *     .setAuthor("Loup-Garou de Thiercelieux", lg_var.roles_img.LoupGarou);
 * ```
 *
 * ### **Solution**
 *
 * Import `EmbedBuilder` from `discord.js` and update your embed creation code.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * const { EmbedBuilder } = require('discord.js');
 *
 * // ...
 *
 * return new EmbedBuilder()
 *     .setDescription("Loup-Garou de Thiercelieux")
 *     .setColor(BotData.BotValues.botColor)
 *     .setAuthor({ name: "Loup-Garou de Thiercelieux", iconURL: lg_var.roles_img.LoupGarou });
 * ```
 *
 * ### **Explanation**
 *
 * - **Importing `EmbedBuilder`**: This is the new class for creating embeds in Discord.js v14.
 * - **Setting Author**: Now requires an object with `name`, `iconURL`, and optionally `url`.
 * - **Using `addFields`**: Replaces `addField`.
 *
 * ---
 *
 * ## **3. Updating `addField` to `addFields`**
 *
 * ### **Problem**
 *
 * The `addField` method is deprecated and replaced by `addFields`, which accepts an array of field objects.
 *
 * #### **Your Code**
 *
 * ```javascript
 * this.MessageEmbed.addField("Rejoindre la partie", "Veuillez réagir avec la réaction 🐺", true);
 * ```
 *
 * ### **Solution**
 *
 * Use `addFields` and pass field objects.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * this.MessageEmbed.addFields(
 *     { name: "Rejoindre la partie", value: "Veuillez réagir avec la réaction 🐺", inline: true },
 *     // ... other fields
 * );
 * ```
 *
 * ### **Explanation**
 *
 * - **Using `addFields`**: Allows you to add one or multiple fields at once using an array of field objects.
 * - **Field Objects**: Each field is an object with `name`, `value`, and `inline` properties.
 *
 * ---
 *
 * ## **4. Updating Reaction Handling**
 *
 * ### **Problem**
 *
 * Some methods related to reactions have changed in Discord.js v14, especially concerning reaction users.
 *
 * #### **Your Code**
 *
 * ```javascript
 * let user = reaction.users.cache.last();
 * reaction.users.remove(user).catch(() => true);
 * ```
 *
 * ### **Solution**
 *
 * Ensure that you're correctly accessing the user who added the reaction and removing their reaction.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * const user = reaction.users.cache.get(reaction.users.cache.lastKey());
 * reaction.users.remove(user.id).catch(() => true);
 * ```
 *
 * ### **Explanation**
 *
 * - **Accessing Users**: `reaction.users.cache.lastKey()` gets the key (user ID) of the last user who reacted.
 * - **Removing Reaction**: Use the user ID when removing the reaction.
 *
 * ---
 *
 * ## **5. Updating Event Names**
 *
 * ### **Problem**
 *
 * The `message` event is now `messageCreate` in Discord.js v14.
 *
 * #### **Your Code**
 *
 * ```javascript
 * this.client.on('message', (message) => {
 *     // ...
 * });
 * ```
 *
 * ### **Solution**
 *
 * Update the event name to `messageCreate`.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * this.client.on('messageCreate', (message) => {
 *     // ...
 * });
 * ```
 *
 * ### **Explanation**
 *
 * - **Event Name Change**: Discord.js v14 renamed the `message` event to `messageCreate` for clarity.
 *
 * ---
 *
 * ## **6. Updating Message Editing and Sending**
 *
 * ### **Problem**
 *
 * When editing or sending messages with embeds, you need to pass an object with an `embeds` array.
 *
 * #### **Your Code**
 *
 * ```javascript
 * this.msg.edit(this.MessageEmbed).catch(() => true);
 * this.preparationChannel.send(this.MessageEmbed).then(msg => {
 *     this.msg = msg;
 *     resolve(true);
 * }).catch(err => reject(err));
 * ```
 *
 * ### **Solution**
 *
 * Wrap your embeds in an object with an `embeds` property.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * this.msg.editF({ embeds: [this.MessageEmbed] }).catch(() => true);
 * this.preparationChannel.send({ embeds: [this.MessageEmbed] }).then(msg => {
 *     this.msg = msg;
 *     resolve(true);
 * }).catch(err => reject(err));
 * ```
 *
 * ### **Explanation**
 *
 * - **Sending Embeds**: Discord.js v14 requires embeds to be sent within an object `{ embeds: [embed] }`.
 * - **Editing Messages**: Similarly, when editing a message to include an embed.
 *
 * ---
 *
 * ## **7. Updating Use of `setFooter`**
 *
 * ### **Problem**
 *
 * In Discord.js v14, `setFooter` now takes an object.
 *
 * #### **Your Code**
 *
 * ```javascript
 * this.MessageEmbed.setFooter(`Nombre de joueurs : ${this.configuration.getParticipantsNames().length}`);
 * ```
 *
 * ### **Solution**
 *
 * Update `setFooter` to pass an object with `text`.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * this.MessageEmbed.setFooter({ text: `Nombre de joueurs : ${this.configuration.getParticipantsNames().length}` });
 * ```
 *
 * ### **Explanation**
 *
 * - **`setFooter` Change**: Now requires an object with `text` and optionally `iconURL`.
 *
 * ---
 *
 * ## **8. Importing Necessary Classes from `discord.js`**
 *
 * ### **Problem**
 *
 * You're not importing required classes like `EmbedBuilder` and `PermissionsBitField` from `discord.js`.
 *
 * ### **Solution**
 *
 * Import the necessary classes at the top of your file.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * const { Client, PermissionsBitField, EmbedBuilder } = require('discord.js');
 * ```
 *
 * ### **Explanation**
 *
 * - **Importing Classes**: Ensures you have access to the updated classes and enums needed for Discord.js v14.
 *
 * ---
 *
 * ## **9. Ensuring Correct Use of `reaction.count` and `reaction.users`**
 *
 * ### **Problem**
 *
 * You need to confirm that `reaction.count` and `reaction.users.cache` are used correctly.
 *
 * #### **Your Code**
 *
 * ```javascript
 * if (reaction.count > 1 && reaction.users.cache.last().id !== this.client.user.id) {
 *     // ...
 * }
 * ```
 *
 * ### **Solution**
 *
 * Confirm that `reaction.count` and `reaction.users.cache` are still valid and adjust if necessary.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * if (reaction.count > 1 && reaction.users.cache.lastKey() !== this.client.user.id) {
 *     // ...
 * }
 * ```
 *
 * ### **Explanation**
 *
 * - **`reaction.users.cache.lastKey()`**: Gets the ID of the last user who reacted.
 * - **Consistency**: Ensures that your checks are accurate and consistent with the updated Discord.js v14 methods.
 *
 * ---
 *
 * ## **10. Updating Client Intents**
 *
 * ### **Problem**
 *
 * Discord.js v14 requires specifying intents when creating the client.
 *
 * ### **Solution**
 *
 * Ensure your client is initialized with the necessary intents.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * const { Client, GatewayIntentBits } = require('discord.js');
 *
 * const client = new Client({
 *     intents: [
 *         GatewayIntentBits.Guilds,
 *         GatewayIntentBits.GuildMembers,
 *         GatewayIntentBits.GuildMessages,
 *         GatewayIntentBits.MessageContent, // If you need to read message content
 *         GatewayIntentBits.GuildMessageReactions,
 *         GatewayIntentBits.DirectMessages, // If you need to send DMs
 *     ],
 * });
 * ```
 *
 * ### **Explanation**
 *
 * - **Specifying Intents**: Necessary for your bot to receive events related to messages, reactions, and other guild activities.
 *
 * ---
 *
 * ## **11. Updating `guildMember.user.send()`**
 *
 * ### **Problem**
 *
 * When sending direct messages to users, ensure you're using `guildMember.user.send()`.
 *
 * #### **Your Code**
 *
 * ```javascript
 * guildMember.send("Your message here");
 * ```
 *
 * ### **Solution**
 *
 * Update to send messages to the `User` object.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * guildMember.user.send("Your message here");
 * ```
 *
 * ### **Explanation**
 *
 * - **`GuildMember` vs `User`**: The `GuildMember` object doesn't have a `send()` method; you need to use `guildMember.user`.
 *
 * ---
 *
 * ## **12. Updating Role Creation**
 *
 * ### **Problem**
 *
 * Ensure that role creation doesn't use the deprecated `data` property.
 *
 * #### **Your Code**
 *
 * ```javascript
 * let role = await this.guild.roles.create({
 *     data: {
 *         name: role_name,
 *         color: this.roles[role_name].color,
 *         hoist: true,
 *     },
 * });
 * ```
 *
 * ### **Solution**
 *
 * Remove the `data` property and pass the options directly.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * let role = await this.guild.roles.create({
 *     name: role_name,
 *     color: this.roles[role_name].color,
 *     hoist: true,
 * });
 * ```
 *
 * ### **Explanation**
 *
 * - **Role Creation Update**: Discord.js v14 requires role options to be passed directly to `roles.create()`.
 *
 * ---
 *
 * ## **13. Updating Use of `MessageReaction` Methods**
 *
 * ### **Problem**
 *
 * Methods and properties of `MessageReaction` might have changed.
 *
 * #### **Your Code**
 *
 * ```javascript
 * reaction.users.remove(guildMember.user).catch(() => true);
 * ```
 *
 * ### **Solution**
 *
 * Ensure that the methods used are still valid in Discord.js v14.
 *
 * #### **Updated Code**
 *
 * ```javascript
 * reaction.users.remove(guildMember.id).catch(() => true);
 * ```
 *
 * ### **Explanation**
 *
 * - **Using User ID**: In some cases, you might need to use the user ID instead of the user object.
 *
 * ---
 *
 * ## **14. General Review of Code for Deprecated Methods**
 *
 * ### **Problem**
 *
 * There might be other methods that are deprecated or have changed.
 *
 * ### **Solution**
 *
 * - **Review the Discord.js v14 Documentation**: Check all methods and classes used in your code against the latest documentation.
 * - **Update Deprecated Methods**: Replace any deprecated methods with their updated equivalents.
 *
 * ### **Explanation**
 *
 * - **Staying Updated**: Ensures your bot remains compatible with the latest version of Discord.js.
 *
 * ---
 *
 * ## **15. Testing Your Updated Code**
 *
 * After making the above changes, it's crucial to test your bot thoroughly.
 *
 * - **Run Your Bot in a Test Environment**: Avoid running untested code in a production environment.
 * - **Check for Warnings and Errors**: Pay attention to any console warnings or errors and address them.
 * - **Test All Features**: Ensure that all commands, events, and features work as expected.
 * - **Update Dependencies**: Make sure all your npm packages are up to date.
 *
 * ---
 *
 * ## **Conclusion**
 *
 * By addressing these compatibility issues, your code should function correctly with Node.js v20.17.0 and Discord.js v14.15.3. Discord.js v14 introduced several breaking changes, so updating your code is essential to maintain your bot's functionality.
 *
 * If you encounter any further issues or need clarification on specific parts of the code, feel free to ask for additional assistance!
 *
 */




class IGame {

    constructor(client) {

        this.client = client;

        return this;

    }

}

class GameInfo {

    constructor(message, playTime) {
        this.guild = message.guild;
        this.playTime = playTime;
        this._history = [];
        this.gameNumber = new Date().toUTCString().split(' ')[4];
        if (this.gameNumber) {
            this.gameNumber.replace(/:+/g, "42");
        }
    }

    addToHistory(msg) {
        this._history.push(msg);
    }

    get history() {
        return this._history;
    }

    get serverName() {
        return this.guild.name;
    }

    get stemmingTime() {
        return this.playTime;
    }

    get gameNb() {
        return this.gameNumber;
    }

    getPlayTime() {
        let minutes = (new Date() - this.playTime) / 1000 / 60;
        let hours = minutes / 60;
        let playTime = `${(minutes % 60).toFixed()}m`;
        if (hours >= 1) {
            playTime = `${hours.toFixed()}h${playTime}`;
        }

        return playTime;
    }
}

class Game extends IGame {

    constructor(client, message, gameOptions) {

        super(client);

        this.playTime = new Date();
        this.gameInfo = new GameInfo(message, this.playTime);

        LgLogger.info('New lg game created', this.gameInfo);

        this.guild = message.guild;

        this.gameOptions = gameOptions;

        this.stemmingChannel = message.channel;
        this.stemmingPlayer = message.member;

        this.preparation = new GamePreparation(
            this.client, this.stemmingChannel, this.stemmingPlayer, this.guild, this.gameInfo, gameOptions
        );
        this.flow = new GameFlow(this.client, this.gameInfo, gameOptions);

        this.quitListener = undefined;

        this.client.on('guildMemberRemove', (member) => {
            if (member.guild.id === message.guild.id) {
                if (this.preparation && this.preparation.configuration) {
                    this.preparation.configuration._players.delete(member.id);
                }
                if (this.flow && this.flow.GameConfiguration && this.flow.GameConfiguration._players) {
                    this.flow.GameConfiguration._players.delete(member.id);
                }
            }
        });

        this.msgCollector = [];
        //this.listenMsgCollector();

        return this;

    }

    async launch() {
        LgLogger.info("Preparing game...", this.gameInfo);

        let status = await this.preparation.prepareGame();

        if (!status) {
            await this.quit();
            LgLogger.info("Quitting game", this.gameInfo);
            return this;
        }

        this.updateObjects(status);

        //await this.flow.GameConfiguration.voiceHandler.join();
        //await this.flow.GameConfiguration.voiceHandler.setupEvents();
        //await this.flow.GameConfiguration.voiceHandler.playFirstDayBGM();

        LgLogger.info("Game successfully prepared.", this.gameInfo);

        await this.msg.delete();

        this.msg = await this.stemmingChannel.send(CommunicationHandler.getLGSampleMsg()
            .addField(
                "Joueurs",
                this.preparation.configuration
                    .getPlayerNames()
                    .toString()
                    .replace(/,+/g, '\n')
            )
        );

        await this.listenQuitEvents();

        let msg = await this.stemmingChannel.send(CommunicationHandler.getLGSampleMsg()
            .addField(
                "Le jeu va bientôt commencer", "Début du jeu dans 5 secondes"
            )
        );

        LgLogger.info(`${this.flow.GameConfiguration.getGameConfString()}`, this.gameInfo);

        await Wait.seconds(5);
        await msg.delete();

        let endMsg = await this.flow.run();

        await this.stemmingChannel.send(endMsg);
        let msgSent = await this.stemmingChannel.send("Nettoyage des channels dans 5 secondes");
        await Wait.seconds(5);
        await msgSent.delete();
        await this.quit();

        return this;
    }

    updateObjects(status) {
        let configuration = status;

        configuration.channelsHandler = this.preparation.channelsHandler;
        configuration.rolesHandler = this.preparation.rolesHandler;
        //configuration.voiceHandler = this.preparation.voiceHandler;
        //configuration.voiceHandler.voiceChannel = configuration.channelsHandler._channels.get(
        //    configuration.channelsHandler.voiceChannels.vocal_lg
        //);

        this.msg = this.preparation.msg;
        this.flow.msg = this.preparation.msg;
        this.flow.GameConfiguration = configuration;
    }

    listenQuitEvents() {
        return new Promise((resolve, reject) => {

            this.quitListener = new ReactionHandler(this.msg, ["🔚"]);

            this.quitListener.addReactions().catch(console.error);

            this.quitListener.initCollector((reaction) => {

                if (reaction.emoji.name === "🚪") {

                    //todo: allow user to quit the game

                } else if (reaction.emoji.name === "🔚") {
                    const user = reaction.users.cache.get(reaction.users.cache.lastKey());

                    reaction.users.remove(user.id).catch(() => true);
                    if (user.id === this.stemmingPlayer || checkPermissions(this.guild.members.cache.get(user.id),"BAN_MEMBERS")){
                        this.quit().catch(console.error);
                    }
                }
                reaction.users.remove(reaction.users.cache.lastKey()).catch(() => true);

            }, () => {

            }, (reaction) => {
                return reaction.count > 1;
            });

            resolve(true);

        });
    }

    quit() {
        return new Promise((resolve, reject) => {
            let LG = this.client.LG.get(this.guild.id);

            if (LG) LG.running = false;

            this.client.LG.set(this.guild.id, LG);

            if (this.quitListener) this.quitListener.stop();

            let quitPromises = [];

            if (this.flow && this.flow.GameConfiguration) {

                if (this.flow.GameConfiguration.loupGarouMsgCollector) {
                    this.flow.GameConfiguration.loupGarouMsgCollector.stop();
                }

                //if (this.flow.GameConfiguration.voiceHandler) {
                //    quitPromises.push(this.flow.GameConfiguration.voiceHandler.destroy());
                //}

            }

            quitPromises.push(this.preparation.rolesHandler.deleteRoles());

            if (this.preparation.keepChannels === false) {
                quitPromises.push(this.preparation.channelsHandler.deleteChannels());
            } else {
                quitPromises.push(this.preparation.channelsHandler.deletePermissionsOverwrites());
                quitPromises.push(this.preparation.channelsHandler.deleteMessagesInChannels());
            }

            Promise.all(quitPromises).then(() => {
                resolve(this);
            }).catch((err) => {
                this.stemmingChannel.send("Jeu arrêté, des erreurs se sont produite : ```" + err + "```").catch(console.error);
                reject(err);
            });
        });
    }

    listenMsgCollector() {

        this.client.on('message', (message) => {

            if (message && message.channel.parent) {

                if (message.channel.parent.name.toLowerCase() === "loups_garou_de_thiercelieux") {
                    this.msgCollector.push(message);
                }

            }

        });

    }
}

class GamePreparation extends IGame {

    constructor(client, channel, player, guild, gameInfo, gameOptions) {

        super(client);

        this.MAX_PLAYERS = 29;

        this.status = false;

        this.gameInfo = gameInfo;
        this.gameOptions = gameOptions;

        this.guild = guild;
        this.stemmingPlayer = player;
        this.preparationChannel = channel;
        this.configuration = new GameConfiguration(this.gameInfo);
        this.rolesHandler = new RolesHandler(client, guild, this.gameInfo);
        this.channelsHandler = new ChannelsHandler(client, guild, this.gameInfo);
        //this.voiceHandler = new VoiceHandler(this.channelsHandler._channels.get(this.channelsHandler.voiceChannels.vocal_lg), gameOptions.musicMode);

        this.msg = undefined;
        this.MessageEmbed = undefined;

        this.keepChannels = false;

        return this;

    }

    prepareGame() {
        return new Promise((resolve, reject) => {
            console.log("Preparing game...");
            this.init()
                .then(() => this.createRoles())
                .then(() => this.displayGuide())
                .then(() => this.initEvents())
                .then(status => {
                    if (!status) return resolve(status);
                    return this.setupChannels()
                })
                .then(() => this.rolesHandler.sendRolesToPlayers(this.configuration))
                .then(() => resolve(this.configuration))
                .catch(err => reject(err));
        });
    }

    init() {
        return new Promise((resolve, reject) => {

            this.MessageEmbed = CommunicationHandler.getLGSampleMsg()
                .addField("LG - Initialisation", "Initialisation du jeu...");

            sendEmbed(this.preparationChannel, this.MessageEmbed).then(msg => {
                this.msg = msg;
                console.log("Game preparation message sent");
                resolve(true);
            }).catch(err => reject(err));
        });
    }

    createRoles() {
        return new Promise((resolve, reject) => {
            this.rolesHandler.createRoles().then(() => resolve(true)).catch(err => {
                editMessage(this.msg, this.MessageEmbed.setDescription("Erreur lors de la création des rôles.")).catch(() => true);
                reject(err);
            });
        });
    }

    displayGuide() {
        return new Promise((resolve, reject) => {
            this.MessageEmbed = CommunicationHandler.getLGSampleMsg()
                .setDescription("Préparation du jeu")
                .setThumbnail(lg_var.roles_img.LoupGarou)
                .addField("Rejoindre la partie", "Veuillez réagir avec la réaction 🐺", true)
                .addField("Quitter la partie", "Veuillez réagir avec la réaction 🚪", true)
                .addField("Lancer la partie", `Seul ${this.stemmingPlayer.displayName} peut lancer la partie avec ❇`, true)
                .addField("Stopper la partie", "Veuillez réagir avec la réaction 🔚", true)
                .addField("Joueurs participants au jeu", "Aucun participant pour le moment");

            editMessage(this.msg, this.MessageEmbed).then(() => resolve(true)).catch(err => reject(err));
        });
    }

    initEvents() {
        return new Promise((resolve, reject) => {

            let gamePreparationMsg = new ReactionHandler(this.msg, ["🐺", "🚪", "❇", "🔚"]);

            gamePreparationMsg.addReactions().catch(err => reject(err));

            gamePreparationMsg.initCollector((reaction) => {

                this.guild.members.fetch(reaction.users.cache.lastKey().id).then(guildMember => {

                    if (!guildMember) {
                        console.error(`${reaction.users.cache.last().username} non présent sur le serveur ${this.guild.name}`);
                        return;
                    }

                    if (reaction.emoji.name === "🐺") {
                        this.configuration.addParticipant(guildMember);
                        this.rolesHandler.addPlayerRole(guildMember).catch(console.error);
                        this.updateParticipantsDisplay();
                        reaction.users.remove(guildMember.id).catch(() => true);
                        if (this.configuration.getParticipantsNames().length === this.MAX_PLAYERS) {
                            this.status = true;
                            gamePreparationMsg.collector.stop();
                        }
                    } else if (reaction.emoji.name === "🚪") {
                        this.rolesHandler.removeRoles(guildMember);
                        this.configuration.removeParticipant(guildMember.id);
                        this.updateParticipantsDisplay();
                        reaction.users.remove(guildMember.id).catch(() => true);
                    } else if (reaction.emoji.name === "❇") {
                        reaction.users.remove(guildMember.id).catch(() => true);
                        if (guildMember.id === this.stemmingPlayer.id || guildMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                            if (this.configuration.getParticipantsNames().length > 1) {
                                this.status = true;
                                gamePreparationMsg.collector.stop();
                            }
                        }
                    } else if (reaction.emoji.name === "🔚") {
                        reaction.users.remove(guildMember.id).catch(() => true);
                        if (guildMember.id === this.stemmingPlayer.id || checkPermissions(guildMember,"BAN_MEMBERS")) {
                            this.status = false;
                            gamePreparationMsg.collector.stop();
                        }
                    }

                }).catch(() => true);

            }, () => {
                if (this.status === false) {
                    gamePreparationMsg.message.delete().catch(() => true);
                    LgLogger.info("User decided to end game", this.gameInfo);
                    resolve(false);
                } else {
                    gamePreparationMsg.removeReactionList(["🐺", "❇"]).catch(() => true);
                    this.rolesHandler.assignRoles(this.configuration)
                        .then((configuration) => {
                            this.configuration = configuration;
                            resolve(this.status);
                        })
                        .catch(err => reject(err));
                }
            }, (reaction) => reaction.count > 1 && reaction.users.cache.lastKey() !== this.client.user.id);
        });
    }

    setupChannels() {
        return new Promise((resolve, reject) => {
            this.checkChannels().then((areChannelsReady) => {
                return this.channelsHandler.setupChannels(areChannelsReady, this.configuration);
            }).then(() => resolve(true)).catch(err => reject(err));
        });
    }

    checkChannels() {
        return new Promise((resolve, reject) => {

            this.channelsHandler.checkChannelsOnGuild().then(() => {
                resolve(true);
            }).catch(() => {
                resolve(false);
            });

        });
    }

    updateParticipantsDisplay() {
        this.MessageEmbed.fields[this.MessageEmbed.fields.length - 1].value = this.configuration
            .getParticipantsNames()
            .toString()
            .replace(/,+/g, "\n");
        if (this.MessageEmbed.fields[this.MessageEmbed.fields.length - 1].value === "") {
            this.MessageEmbed.fields[this.MessageEmbed.fields.length - 1].value = "Aucun participant pour le moment";
        }
        this.MessageEmbed.setFooter(`Nombre de joueurs : ${this.configuration.getParticipantsNames().length}`);
        editMessage(this.msg, this.MessageEmbed).catch(() => true);
    }

    askForChannelGeneration() {
        return new Promise((resolve, reject) => {
            this.preparationChannel.send(CommunicationHandler.getLGSampleMsg()
                .setTitle("Voulez-vous garder les salons nécessaires au jeu sur le serveur discord une fois la partie terminée ?")
                .setDescription("Garder les salons sur le serveur discord permet de ne plus les générer par la suite")
                .addField("✅", "Garder les salons sur le serveur")
                .addField("❎", "Supprimer les salons du serveur une fois la partie terminée")
            ).then(msg => {

                let question = new ReactionHandler(msg, ["✅", "❎"]);

                question.addReactions().then(() => {

                    question.initCollector((reaction) => {
                        let r = reaction.emoji.name;

                        if (r === "✅") {
                            this.keepChannels = true;
                            question.stop();
                        } else if (r === "❎") {
                            this.keepChannels = false;
                            question.stop();
                        }

                    }, () => {
                        msg.delete().then(() => resolve(this.keepChannels)).catch(() => resolve(this.keepChannels));
                    }, (reaction) => {
                        let user = reaction.users.last();
                        return reaction.count > 1 && (user.id === this.stemmingPlayer ||  checkPermissions(this.guild.members.get(user.id), "BAN_MEMBERS"));
                    });

                }).catch(err => reject(err));

            }).catch(err => reject(err));

        })
    }

}

class GameConfiguration {

    constructor(gameInfo) {

        this.gameInfo = gameInfo;
        this.globalTimer = null;

        this._table = [];

        // players of the game, mapped by id, we store here LG game role objects like LoupBlanc()
        this._players = new Map();

        // participants mapped by their Id, we store here only GuildMember objects for game preparation
        this._participants = new Map();

        this.channelsHandler = undefined;
        this.rolesHandler = undefined;
        //this.voiceHandler = undefined;

    }

    getLGChannel() {
        return this.channelsHandler._channels.get(this.channelsHandler.channels.loups_garou_lg);
    }

    get villageChannel() {
        return this.channelsHandler._channels.get(this.channelsHandler.channels.village_lg);
    }

    get Capitaine() {

        for (let player of this._players.values()) {
            if (player.capitaine) return player;
        }

        return null;
    }

    getPlayerById(id) {
        return this._players.get(id);
    }

    getGameConfString() {

        let str = '';

        for (let player of this._players.values()) {
            str += `${player.member.displayName} : ${player.role}, `;
        }

        return str.slice(0, str.length - 2);

    }

    getParticipants() {
        return this._participants;
    }

    addParticipant(guildMember) {
        this._participants.set(guildMember.id, guildMember);
    }

    removeParticipant(id) {
        this._participants.delete(id);
    }

    getTable() {
        if (this._table.length === 0) {
            this._table = Array.from(this._participants.values());
        }
        return this._table;
    }

    getParticipantsNames() {
        let participantsNames = [];

        for (let participant of this._participants.values()) {
            participantsNames.push(participant.displayName);
        }

        return participantsNames;
    }

    getPlayerNames() {
        let playerNames = [];

        for (let player of this._players.values()) {
            playerNames.push(player.member.displayName);
        }

        return playerNames;
    }

    getMemberteams(team) {
        let lgNames = [];

        for (let player of this._players.values()) {
            if (player.team === team) lgNames.push(`**${player.role}** : ${player.member.displayName}`);
        }

        return lgNames;
    }

    getPlayersIdName() {

        let playersIdName = new Map();

        for (let [id, player] of this._players) {
            playersIdName.set(id, player.member.displayName);
        }

        return playersIdName;

    }

    getPlayers() {
        return this._players;
    }

    getDeadPlayers() {
        let players = [];

        for (let player of this._players.values()) {
            if (!player.alive) players.push(player);
        }

        return players;
    }

    getAlivePlayers() {
        let players = [];

        for (let player of this._players.values()) {
            if (player.alive) players.push(player);
        }

        return players;
    }

    addPlayer(player) {
        this._players.set(player.member.id, player);
    }

    removePlayer(id) {
        this._players.delete(id);
    }

    getRoleMap(options) {

        let roleMap = new Map();

        let array;
        for (let player of this._players.values()) {

            array = roleMap.get(player.role);

            if (!array) {
                if ((options.alive && options.dead) ||
                    (options.alive && !options.dead && player.alive) ||
                    (!options.alive && options.dead && !player.alive)) {
                    roleMap.set(player.role, [player]);
                }
            } else if ((options.alive && options.dead) ||
                (options.alive && !options.dead && player.alive) ||
                (!options.alive && options.dead && !player.alive)) {

                array.push(player);
                roleMap.set(player.role, array);

            }

        }

        return roleMap;

    }

    getLG(onlyAlive) {

        let lgs = [];

        for (let player of this._players.values()) {
            if (player.team === "LG") {
                if (onlyAlive) {
                    if (player.alive) lgs.push(player);
                } else {
                    lgs.push(player);
                }
            }
        }

        return lgs;
    }

    getLGIds(onlyAlive) {
        let lgIds = [];

        for (let [id, player] of this._players) {
            if (player.team === "LG") {
                if (onlyAlive) {
                    if (player.alive) lgIds.push(id);
                } else {
                    lgIds.push(id);
                }
            }
        }

        return lgIds;
    }

    /**
     *
     * @param includeDead specifies if you want to include dead villageois as well as alive villageois
     * @returns {Array}
     */
    getVillageois(includeDead) {

        if (includeDead === undefined) includeDead = true;

        let villageois = [];

        for (let player of this._players.values()) {
            if (player.team === "VILLAGEOIS") {
                if (!includeDead) {
                    if (player.alive) villageois.push(player);
                } else {
                    villageois.push(player);
                }
            }
        }

        return villageois;
    }

}

class CommunicationHandler extends IGame {

    constructor(client, message) {

        super(client);

        return this;

    }

    static getLGSampleMsg() {
        return new MessageEmbed()
            .setDescription("Loup-Garou de Thiercelieux")
            .setColor(BotData.BotValues.botColor)
            .setAuthor("Loup-Garou de Thiercelieux", lg_var.roles_img.LoupGarou);
    }

    static reconstructEmbed(messageEmbed) {

        let newEmbed = new MessageEmbed();

        if (messageEmbed.author) newEmbed.setAuthor(messageEmbed.author);
        if (messageEmbed.color) newEmbed.setColor(messageEmbed.color);
        if (messageEmbed.description) newEmbed.setDescription(messageEmbed.description);
        if (messageEmbed.footer) newEmbed.setFooter(messageEmbed.footer);
        if (messageEmbed.image) newEmbed.setImage(messageEmbed.image);
        if (messageEmbed.thumbnail) newEmbed.setThumbnail(messageEmbed.thumbnail);
        if (messageEmbed.title) newEmbed.setTitle(messageEmbed.title);
        if (messageEmbed.url) newEmbed.setURL(messageEmbed.url);

        messageEmbed.fields.forEach(field => {

            if (!(field.name === '\u200B' && field.value === '\u200B')) {
                newEmbed.addField(field.name, field.value, field.inline);
            }

        });

        return newEmbed;
    }

}

module.exports = {Game, IGame};

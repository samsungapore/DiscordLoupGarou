const RichEmbed = require("discord.js").RichEmbed;
const BotData = require("../BotData.js").bot_values;
const botData = require("../BotData.js");
const Wait = require("./wait").Wait;
const MemberUserXP = require("./parsing_functions.js").MemberUserXP;

let find_user = (client, name) => {
    let usersArray = client.users.array();

    for (let i = 0; i < usersArray.length; i++) {
        let user = usersArray[i];
        if (user.username.toLowerCase().trim().includes(name.toLowerCase().trim())) {
            return (user);
        }
    }
    return (null)
};


let updateXpWithMessages = (client, channel, args, messages) => {
    messages.forEach(function (msg_obj) {

        if (!msg_obj.member || msg_obj.author.bot) {
            return;
        }

        if (args.length !== 0) {

            let target = null;

            channel.guild.members.array().forEach(member => {

                if (member.nickname) {
                    if (member.nickname.toLowerCase().trim().includes(args.join(" ").toLowerCase().trim())) {
                        target = member;
                    }
                }
                if (member.user.username.toLowerCase().trim().includes(args.join(" ").toLowerCase().trim())) {
                    target = member;
                }
            });

            if (target === null) {
                return;
            } else {

                if (target.id !== msg_obj.author.id) {
                    return;
                }

            }

        }

        let memberXPData = client.memberXP.get(msg_obj.author.id);

        if (!memberXPData) {
            client.memberXP.set(msg_obj.author.id, new MemberUserXP(msg_obj.author.id));
            memberXPData = client.memberXP.get(msg_obj.author.id);
        }

        let palier_reached = memberXPData.level;

        memberXPData.xp += msg_obj.content.length / 10;

        Object.keys(botData.xp_table).forEach(palier => {

            if (memberXPData.xp > botData.xp_table[palier].xp)
                palier_reached = palier;

        });

        if (palier_reached > memberXPData.level) {
            memberXPData.level += 1;

            channel.send(new RichEmbed()
                .addField(
                    `**${msg_obj.member.displayName}** est passé à la **Division ${botData.xp_table[memberXPData.level].string}**`,
                    `*${botData.xp_table[memberXPData.level].description}*`)
                .setColor(channel.guild.me.displayColor)
            ).catch(console.error);

            channel.guild.roles.array().forEach(role => {

                if (role.name.split(' ')[1] === botData.xp_table[memberXPData.level].string) {
                    if (msg_obj.member) {
                        msg_obj.member.addRole(role).catch(err => {
                            console.error(err);
                            channel.send("Impossible d'ajouter le rôle correspondant.").catch(console.error);
                        });
                    } else {
                        channel.send("Impossible d'ajouter le rôle correspondant.").catch(console.error);
                    }
                }

            });

        }

        client.memberXP.set(msg_obj.author.id, memberXPData);

    });
};

/**
 *
 * @param client
 * @param channel
 * @param check_fct
 * @returns {Promise<any>}
 */
let getChannelMessages = (client, logChannel, channel, args, check_fct) => new Promise((resolve, reject) => {
    if (!channel) {
        reject("Channel not found");
    }

    if (channel.type !== 'text') {
        return resolve([]);
    }

    let runAnalyser = async () => {
        let channelSettings = client.gSettings.get(channel.id);

        let firstMessage;
        if (!channelSettings) {
            channelSettings = botData.channelSettings;
            firstMessage = await channel.fetchMessages({limit: 1});
        } else {

            if (!channelSettings.lastId) {
                firstMessage = await channel.fetchMessages({limit: 1});
            } else {
                firstMessage = await channel.fetchMessages({limit: 1, before: channelSettings.lastId});
            }
        }

        if (firstMessage.first()) {
            let msg = `Premier message analysé dans ${channel.name} : `;
            if (firstMessage.first().author) msg += `${firstMessage.first().author.username}|`;
            if (firstMessage.first().createdAt) msg += `${firstMessage.first().createdAt.toUTCString()}|`;
            msg += `[${firstMessage.first().id}] : ${firstMessage.first().cleanContent}`;
            logChannel.send(msg).catch(console.error);
        }

        let messages = [];

        let messagesFetched = await channel.fetchMessages({limit: 100, before: firstMessage.first().id});
        let count = 0;
        let time = new Date();

        messages = messages.concat(messagesFetched.array());

        while (messagesFetched.array().length > 0) {

            updateXpWithMessages(client, logChannel, args, messagesFetched.array());
            count += messagesFetched.array().length;
            if (count % 2000 === 0) {
                let timeToWait = ((new Date() - time) / 1000) * 17;
                if (count % 20000 === 0) {
                    //await logChannel.send(count + " messages analysés dans " + channel.name + ". Attente de 1h.");
                    //await Wait.hours(1);
                }
                await logChannel.send(count + " messages analysés dans " + channel.name);
                time = new Date();
            }

            if (check_fct && !check_fct(messagesFetched.array())) {
                break;
            }

            messagesFetched.array().forEach(msgFetched => {

                if (check_fct === undefined) {
                    messages = messages.concat(messagesFetched.array());
                }
                if (check_fct && check_fct([msgFetched])) {
                    messages = messages.concat(messagesFetched.array());
                }

            });

            channelSettings = client.gSettings.get(channel.id);

            if (!channelSettings) {
                channelSettings = botData.channelSettings;
            }

            channelSettings.lastId = messagesFetched.last().id;
            client.gSettings.set(channel.id, channelSettings);

            await Wait.seconds(1);
            messagesFetched = await channel.fetchMessages({limit: 100, before: messagesFetched.last().id});
        }

        channelSettings = client.gSettings.get(channel.id);

        if (!channelSettings) {
            channelSettings = botData.channelSettings;
        }

        channelSettings.lastId = undefined;
        client.gSettings.set(channel.id, channelSettings);

        logChannel.send(channel.name + " channel fully analysed. [" + count + " messages]").catch(console.error);
        return (messages);
    };

    runAnalyser().then(messages => resolve(messages)).catch(console.error);

});

let analyseLogChan = async (client, channel) => {
    const logTradChan = client.channels.find("id", "452118364161048576");
    let messageEmbed = new RichEmbed().setColor(BotData.botColor).setTitle("Statistiques");

    if (logTradChan) {

        let firstMessage = await logTradChan.fetchMessages({limit: 1});
        let messagesFetched = await logTradChan.fetchMessages({limit: 100, before: firstMessage.first().id});
        let stats = {};
        const now = new Date();

        let checkIfMsgIsToday = (msg) => {
            return true;
            /*return (msg.createdAt.getFullYear() === now.getFullYear() &&
                (msg.createdAt.getDate() === now.getDate() ||
                    (msg.createdAt.getDate() + 1 === now.getDate() && msg.createdAt.getHours() > now.getHours())) &&
                msg.createdAt.getMonth() === now.getMonth());*/
        };

        let unknownUsers = {};

        // check first message
        if (checkIfMsgIsToday(firstMessage.first())) {

            const username = firstMessage.first().content.split("modified")[0].trim();
            const messageContentArray = firstMessage.first().content.split("modified")[1].split(/ +/g);
            let user = find_user(client, username);

            if (!user) {
                let Kazuhiro = client.users.find('id', '140033402681163776');

                Kazuhiro.send(`L'utilisateur ${username} est introuvable`).catch(console.error);
                unknownUsers[username] = true;

            } else {

                if (!(user.id in stats)) {
                    stats[user.id] = 0;
                }

                if (firstMessage.first().content.split("modified")[1].indexOf("other") !== -1) {
                    stats[user.id] += 1 + parseInt(messageContentArray[messageContentArray.length - 3]);
                } else {
                    stats[user.id] += 1;
                }
            }
        }

        let checkIfArrayHasTodayTS = (msgArray) => {
            return true;
            /*for (let i = 0; i < msgArray.length; i++) {
                if (msgArray[i].createdAt.getFullYear() === now.getFullYear() &&
                    (msgArray[i].createdAt.getDate() === now.getDate() ||
                        (msgArray[i].createdAt.getDate() + 1 === now.getDate() && msgArray[i].createdAt.getHours() > now.getHours())) &&
                    msgArray[i].createdAt.getMonth() === now.getMonth()) {
                    return true;
                }
            }
            return false;*/
        };

        while (messagesFetched.array().length > 0) {

            if (!checkIfArrayHasTodayTS(messagesFetched.array())) {
                break;
            }

            console.log(messagesFetched.array().length);

            messagesFetched.array().forEach(msgFetched => {

                if (checkIfMsgIsToday(msgFetched)) {

                    let username = msgFetched.content.split("modified")[0].trim();

                    if (username === "AinnCali") username = 'Ainn Zoray';

                    const messageContentArray = msgFetched.content.split("modified")[1].split(/ +/g);
                    let user = find_user(client, username);

                    if (!user) {

                        if (!unknownUsers[username]) {

                            let Kazuhiro = client.users.find('id', '140033402681163776');

                            Kazuhiro.send(`L'utilisateur ${username} est introuvable`).catch(console.error);
                            unknownUsers[username] = true;

                        }

                    } else {

                        if (!(user.id in stats)) {
                            stats[user.id] = 0;
                        }

                        if (msgFetched.content.split("modified")[1].indexOf("other") !== -1) {
                            stats[user.id] += 1 + parseInt(messageContentArray[messageContentArray.length - 3]);
                        } else {
                            stats[user.id] += 1;
                        }
                    }
                }
            });

            messagesFetched = await logTradChan.fetchMessages({limit: 100, before: messagesFetched.last().id});
        }

        let findHighestTranslators = (statObj) => {

            if (Object.keys(statObj).length === 0) {
                return undefined;
            }

            let highest = Object.keys(statObj)[0];

            Object.keys(statObj).forEach(id => {
                if (statObj[id] > statObj[highest]) {
                    highest = id;
                }
            });
            return highest;
        };

        let rank = 1;
        let i = 1;
        while (Object.keys(stats).length > 0) {
            let bestTranslatorId = findHighestTranslators(stats);
            if (bestTranslatorId !== undefined) {
                let translator = client.users.find("id", bestTranslatorId);

                if (i === 25) {
                    channel.send(messageEmbed).catch(console.error);
                    messageEmbed = new RichEmbed().setColor(BotData.botColor);
                    i = 0;
                }
                messageEmbed
                    .addField(`${rank} - **${translator.username}**`, `${stats[bestTranslatorId]} répliques modfiées`);
                i += 1;
                rank += 1;
            }
            delete stats[bestTranslatorId];
        }
        channel.send(messageEmbed).catch(console.error);
    }
};

module.exports = {analyseLogChan, getChannelMessages};

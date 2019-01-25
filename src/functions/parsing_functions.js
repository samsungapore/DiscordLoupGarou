const BotData = require("../BotData");
const RichEmbed = require("discord.js").RichEmbed;

class MemberUserXP {
    constructor(id) {
        this.id = id;
        this.multiplicateur = 1;
        this.xp = 0;
        this.level = 0;
    }

}

const parsing = false;

let check_bad_words = (message) => new Promise((resolve, reject) => {

    let ctnt = message.content.toLowerCase().trim();

    while (ctnt.indexOf('*') !== -1) {
        ctnt = ctnt.replace('*', '');
    }

    const short_bad_words = ['tg', 'pd', "ntm", "fdp", "t'es conne", "pédé", "salope",
        "ta gueule", "salope", "pute", "connard", "connasse", "gros con", "sale con", "t'es trop con",
        "va te faire foutre", "t'es con", "fils de pute", "nique ta mère", "enculé", "t'es conne", "suce moi"
    ];

    let lol = false;

    short_bad_words.forEach(shortBadWord => {
        if (ctnt.endsWith(" " + shortBadWord) || ctnt.startsWith(shortBadWord + " ")) {

            ctnt = ctnt.replace(shortBadWord, "|".repeat(shortBadWord.length));
            lol = true;
        }
    });

    if (lol) {
        return resolve(ctnt);
    }

    if (short_bad_words.includes(ctnt)) {
        return resolve("|".repeat(short_bad_words[short_bad_words.indexOf(ctnt)].length));
    }

    let bad_words = short_bad_words.map(word => ` ${word} `);

    let yes = false;

    bad_words.forEach(bad_word => {
        while (ctnt.indexOf(bad_word) !== -1) {
            ctnt = ctnt.replace(bad_word, '|'.repeat(bad_word.length));
            yes = true;
        }
    });

    if (yes) {
        resolve(ctnt);
    } else {
        reject(true);
    }

});

let sendMsgToModerators = (client, msg) => {

    let miraiteam = client.guilds.find('id', "168673025460273152");

    miraiteam.members.array().forEach(member => {

        if (member.roles.find("id", "346226913423130625") && member.id !== "219390405718835200") {
            member.send(msg).catch(console.error);
        }

    });

};

let shuffle_array = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

let getUserDivision = (xp) => {

    let palier;
    let i;

    for (i = 10 ; i >= 0 ; i--) {

        palier = BotData.xp_table[i];

        if (xp > palier.xp) {
            return {palier: palier, level: i};
        }

    }
    return {palier: BotData.xp_table[0], level: 0};
};

class CleverBotDisscussion {

    constructor(msg, channel) {
        this.channel = channel;



    }

}

let findCorrectRole = (roleString, message) => new Promise((resolve, reject) => {
    message.guild.roles.array().forEach(role => {

        if (role.name.split(' ')[1] === roleString) {
            resolve(role);
        }

    });
});

module.exports = {

    MemberUserXP, check_bad_words, shuffle_array,

    check_message: function (client, message) {

        if (message.mentions) {
            if (message.mentions.users.get(BotData.bot_values.bot_id)) {

                let gSettings = client.gSettings.get(message.guild.id);

                if (!gSettings) {
                    gSettings = BotData.gSettings;
                }

                let cleverbotQuery;

                if (!gSettings.cs) {
                    cleverbotQuery = cleverbot.query(message.cleanContent.replace("@Mirai_Bot", "").trim())
                } else {
                    cleverbotQuery = cleverbot.query(message.cleanContent.replace("@Mirai_Bot", "").trim(), {
                        cs: gSettings.cs
                    });
                }

                message.channel.startTyping();
                cleverbotQuery.then((response) => {

                    gSettings.cs = response.cs;
                    client.gSettings.set(message.guild.id, gSettings);

                    message.channel.send(response.output).then(() => {
                        message.channel.stopTyping(true);
                    }).catch(err => {
                        message.channel.stopTyping(true);
                        console.error(err);
                    });
                }).catch(err => {
                    console.error(err);
                    message.channel.stopTyping(true);
                });
            }
        }

        function isUpperCase(str) {
            return str === str.toUpperCase();
        }

        /*if (isUpperCase(message.content)) {
            message.channel.send('Pas besoin de crier, ' + message.member.displayName).catch(console.error);
        }*/

        if (message.author.id !== BotData.bot_values.bot_id) {
            if (message.content.includes('<spoil>') || message.content.includes('</spoil>')) {

                if (!message.content.startsWith(BotData.bot_values.bot_prefix)) {
                    message.author.send(`Utilise la commande **/spoil** pour utiliser les balises **<spoil>** et **</spoil>**.\n` +
                        `\nVoici ton message qui a été supprimé, au cas où tu voudrais ne pas le perdre :\n` +
                        `\n${message.content}`).catch(console.error);
                    message.delete().catch(console.error);
                }

            }
        }

        const exceptChannels = ["danganronpa 1", "danganronpa 2", "discord sdse2", "danganronpa another episode"];
        if (parsing === true && message.channel.parentID !== "473236555088265266" && message.author.id !== BotData.bot_values.bot_id) {

            check_bad_words(message).then(ctnt => {
                message.delete().then(msg => {

                    msg.channel.send(new RichEmbed()
                        .setAuthor(msg.member.displayName, msg.author.avatarURL)
                        .setColor(msg.member.displayColor)
                        .setDescription(ctnt)
                    ).catch(console.error);

                    //sendMsgToModerators(client, `Insulte détectée\n${message.channel.name} | ${message.author.username} : ${message.content}`);

                }).catch(console.error);
            }).catch(() => {
                return;
            });
        }

        if (message.author.id === "160449085080338432" && message.cleanContent.toLowerCase().includes("hokuto")) {
            message.react('👍').catch(console.error);
        }

    },

    check_xp: async (client, message) => {

        if (message.author.id !== BotData.bot_values.bot_id && message.member && message.author.bot === false) {
            let memberXPData = client.memberXP.get(message.author.id);

            if (!memberXPData) {
                client.memberXP.set(message.author.id, new MemberUserXP(message.author.id));
                memberXPData = client.memberXP.get(message.author.id);
            }

            memberXPData.xp += message.content.length / 10;

            let palier_reached = getUserDivision(memberXPData.xp);

            if (palier_reached.level > memberXPData.level) {
                memberXPData.level += 1;

                message.channel.send(new RichEmbed()
                    .addField(
                        `**${message.author.username}** est passé à la **Division ${BotData.xp_table[memberXPData.level].string}**`,
                        `*${BotData.xp_table[memberXPData.level].description}*`)
                    .setColor(message.guild.me.displayColor)
                ).catch(console.error);

                message.guild.roles.array().forEach(role => {

                    if (role.name.split(' ')[1] === BotData.xp_table[memberXPData.level].string) {
                        if (message.member) {
                            message.member.addRole(role).catch(err => {
                                console.error(err);
                                message.channel.send("Impossible d'ajouter le rôle correspondant.").catch(console.error);
                            });
                        } else {
                            message.channel.send("Impossible d'ajouter le rôle correspondant.").catch(console.error);
                        }
                    }

                });

            } else if (palier_reached.level < memberXPData.level) {
                memberXPData.level = palier_reached.level;
                message.guild.roles.array().forEach(role => {

                    if (role.name.split(' ')[1] === BotData.xp_table[palier_reached.level].string) {
                        if (message.member) {
                            message.member.addRole(role).catch(err => {
                                console.error(err);
                                message.channel.send("Impossible d'ajouter le rôle correspondant.").catch(console.error);
                            });
                        } else {
                            message.channel.send("Impossible d'ajouter le rôle correspondant.").catch(console.error);
                        }
                    }

                });

                let divisionToRemove = [palier_reached.level + 1];
                let i = palier_reached.level + 2;

                while (i <= 10) {
                    divisionToRemove.push(i);
                    i += 1;
                }

                divisionToRemove.forEach(levelToRemove => {

                    message.guild.roles.array().forEach(role => {

                        if (role.name.split(' ')[1] === BotData.xp_table[levelToRemove].string) {
                            if (message.member) {
                                message.member.removeRole(role).catch(console.error);
                            }
                        }

                    });

                });
            } else {

                let xpTableArray = Object.keys(BotData.xp_table);

                for (let i = 0 ; i < xpTableArray.length && i < memberXPData.level ; i++) {
                    let correctRole = await findCorrectRole(BotData.xp_table[i + 1].string, message);

                    if (message.member) {
                        message.member.addRole(correctRole).catch(console.error);
                    } else {
                        console.error("Error while trying to add role. Member does not exist.");
                    }
                }

            }

            client.memberXP.set(message.author.id, memberXPData);
        }

    },



    get_random_index: function (array) {
        if (array.length === 1) return (0);
        return (Math.floor(Math.random() * array.length));
    },

    get_random_in_array: (array) => {
        if (array.length === 1) return (array[0]);
        return (array[Math.floor(Math.random() * array.length)]);
    }

};

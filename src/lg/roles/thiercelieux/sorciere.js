const send = require("../../message_sending");
const death = require("../../game_core/death");
const Villageois = require("../baseRole").Villageois;
let RichEmbed = require('discord.js').RichEmbed;

class Sorciere extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Sorciere";

        this.potions = {vie: 1, poison: 1};

        return this;
    }

}

/**
 * First Night
 - Vous devez lui envoyer un MP afin de l'avertir que c'est à son tour d'entrer en scène ; ici , deux cas sont possibles :
 -- Il n'y a pas eu de victime cette nuit, ( dans le cas où le salvateur a sauvé la victime prévue par les Loups) ; dans ce cas la sorcière ne sait PAS qui est la victime sauvée, et elle ne peut utiliser que sa potion de poison. Mais elle n'est bien sur pas obligée de l'utiliser immédiatement, et peut attendre afin de tuer plus efficacement.
 -- Les Loups-Garous ont réussi à tuer quelqu'un cette nuit ; dans ce cas vous annoncez son nom à la sorcière, qui décidera ou non de la soigner avec la potion de soin, et qui décidera ou non d'en achever une avec son poison

 - Elle possède deux potions : une de guérison et une d'empoisonnement. Elle ne peut utiliser chacune de ses potions
 qu'une seule fois au cours de la partie. Durant la nuit, lorsque les loups-garous se sont rendormis, le meneur de
 jeu va appeler la sorcière et va lui montrer la personne tuée par les loups-garous de cette nuit.

 - La sorcière a trois possibilités :

 -- ne rien faire
 -- ressusciter la personne tuée — et donc perdre sa potion de guérison ;
 -- tuer une autre personne en plus de la victime — et donc perdre sa potion d'empoisonnement.
 -- La sorcière peut utiliser ses deux potions durant la même nuit si elle le souhaite.

 - La sorcière peut se ressusciter elle-même, si elle a été la victime des loups-garous. La sorcière n'opère que durant
 la nuit, elle ne peut donc pas tuer ou ressusciter quelqu'un durant le jour. De plus, si la sorcière a utilisé sa
 potion de guérison auparavant, le meneur de jeu ne lui désigne plus la victime des loups-garous mais doit continuer
 à dire à haute voix la phrase "je montre à la sorcière la victime des loups-garous" afin d'entretenir le doute sur
 l'utilisation des potions. De cette manière, elle peut utiliser sa potion d'empoisonnement sur cette même personne
 (la potion sera sans effet, mais tout de même perdue)

 * @param client
 * @param message
 */
let sorciere = (client, message) => new Promise((resolve, reject) => {

    const lg_functions = require('../../lg_functions.js');
    const lg_var = require('../../lg_var.js');
    let g_set = client.guilds_settings.get(message.guild.id);
    let msgSorciere = new RichEmbed().setColor(lg_var.botColor).setAuthor("Sorcière", lg_var.roles_img.Sorciere);

    if (g_set.LG.role_players_id.Sorciere.length === 0) {
        console.log('No witch, moving forward');
        death.print_supposed_deaths(client, message);
        resolve(null);
        return;
    }

    send.message_to_village(client, message, "La **Sorcière** se réveille.").catch(err => reject(err));

    let sorciere_id = g_set.LG.role_players_id.Sorciere[lg_functions.get_random_index(g_set.LG.role_players_id.Sorciere)];
    let sorciere = g_set.LG.players[sorciere_id];

    sorciere.member_object.createDM().then(chan => {

        let lg_choice = g_set.LG.players[g_set.LG.vote_data.result];

        let emojis = [];

        if (sorciere.potions.poison === 0 && sorciere.potions.vie === 0) {

            chan.send(new RichEmbed().setAuthor("Sorcière", lg_var.roles_img.Sorciere).setColor(lg_var.botColor)
                .addField("Plus de potions", "Votre tour est terminé"))
                .catch(err => reject(err));
            resolve(null);
            return;
        }

        let sorciere_msg = new RichEmbed().setColor(lg_var.botColor).setAuthor("Sorcière", lg_var.roles_img.Sorciere);

        // Salvateur saved the victim
        if (lg_choice.immunity) {

            let description_msg = "La cible des loups garous a été sauvée par le salvateur.\n";

            // Poison or nothing
            if (sorciere.potions.poison === 1) {
                description_msg += "Tu as donc le choix de ne rien faire, ou bien d'utiliser ton poison sur une personne de ton choix.";
                sorciere_msg.addField(':atom:', "Utiliser le poison sur une personne");
                emojis.push("⚛");
            } else {
                description_msg += "Tu n'as plus de potion de poison, tu ne peux donc que passer ton tour.";
            }

            sorciere_msg.setDescription(description_msg);
            sorciere_msg.addField(':end:', "Passer son tour");
            emojis.push("🔚");

        } else {
            // Salvateur didn't save the victim

            sorciere_msg.setAuthor(lg_choice.display_name, lg_choice.member_object.user.avatarURL);
            let description_msg = "Les loups-garous ont ciblés une personne.\n";

            if (sorciere.potions.vie === 1) {
                description_msg += "Tu peux utiliser ta potion de vie pour sauver la victime.";
                sorciere_msg.addField(":sparkle:", "Utiliser la potion de vie");
                emojis.push("❇");
            }
            if (sorciere.potions.poison === 1) {
                description_msg += " Tu peux aussi utiliser ta potion de poison sur quelqu'un.";
                sorciere_msg.addField(":atom:", "Utiliser le poison sur une autre personne");
                emojis.push("⚛");
            }
            sorciere_msg.setDescription(description_msg);
            sorciere_msg.addField(':end:', "Passer son tour");
            emojis.push("🔚");

        }

        chan.send(sorciere_msg).then(msg => {

            async function add_reactions(message_content) {
                let i = 0;

                while (i < emojis.length) {
                    await message_content.react(emojis[i]);
                    i += 1;
                }
            }

            add_reactions(msg).catch(err => reject(err));

            const sorciereTurn = msg.createReactionCollector(m => m.author.id !== m.guild.me.id);

            let msgSave = undefined;
            let msgSave2 = undefined;
            sorciereTurn.on('collect', reaction => {

                if (reaction.emoji.name === 'end' && reaction.count === 2) {

                    sorciereTurn.stop();

                } else if (reaction.emoji.name === 'atom' && reaction.count === 2) {

                    if (msgSave2 === undefined) {
                        let playerList = lg_functions.get_player_list(client, message, [lg_choice.id]);

                        msgSave2 = chan.send(Object.assign({}, msgSorciere)
                            .addField("Exemple pour choisir une cible", "vote 1")
                            .addField("Joueurs", playerList.string))
                            .catch(console.error);

                        const sorciereChanMsgColl = chan.createMessageCollector(m => m.author.id !== m.guild.me.id);

                        let errorMsg = undefined;

                        const displayErrMsg = () => {
                            errorMsg = chan.send(Object.assign({}, msgSorciere)
                                .addField("Erreur", "Veuillez entrer une commande valide."))
                                .catch(console.error);
                            return errorMsg;
                        };

                        sorciereChanMsgColl.on('collect', msgCollected => {
                            const poisonTargetMsg = msgCollected.trim().toLowerCase().split("/ +/g");

                            if (poisonTargetMsg[0] === "vote" && poisonTargetMsg.length === 2) {
                                let choice = parseInt(poisonTargetMsg[1]);

                                if (isNaN(choice) && choice >= 1 && choice <= playerList.array.length) {

                                    let choiceId = playerList.array[choice - 1];
                                    g_set.LG.DEATHS_ID.push(choiceId);

                                    chan.send(Object.assign({}, msgSorciere)
                                        .setDescription(`Poison utilisé sur ${g_set.LG.players[choiceId].display_name}`))
                                        .catch(console.error);

                                    sorciere.potions.poison -= 1;

                                    if (sorciere.potions.vie === 0) {
                                        sorciereTurn.stop();
                                    }

                                } else {
                                    if (errorMsg === undefined) {
                                        displayErrMsg().catch(console.error);
                                    }
                                }
                            } else {
                                if (errorMsg === undefined) {
                                    displayErrMsg().catch(console.error);
                                }
                            }

                        });

                        sorciereChanMsgColl.on('end', () => {
                            if (sorciere.potions.vie === 0) {
                                sorciereTurn.stop();
                            }
                        });
                    }

                } else if (reaction.emoji.name === 'sparkle' && reaction.count === 2) {

                    if (sorciere.potions.vie > 0) {
                        g_set.LG.DEATHS_ID.splice(g_set.LG.DEATHS_ID.indexOf(lg_choice.id), 1);

                        chan.send(new RichEmbed().setColor(lg_var.botColor)
                            .setAuthor("Sorcière", lg_var.roles_img.Sorciere)
                            .addField("Victime sauvée", `Potion de vie utilisée sur ${lg_choice.display_name}.`))
                            .catch(console.error);

                        sorciere.potions.vie -= 1;

                        if (sorciere.potions.poison === 0) {
                            sorciereTurn.stop();
                        }

                    } else {
                        if (msgSave === undefined) {
                            msgSave = chan.send(Object.assign({}, msgSorciere)
                                .addField("Erreur", "Plus de potion de vie")).catch(console.error);
                        }
                    }

                }

            });

            sorciereTurn.on('end', () => {
                send.message_to_village(client, message, "La **Sorcière** se rendort.").catch(err => reject(err));
                resolve(null);
            })

        }).catch(err => reject(err));

    }).catch(err => reject(err));

});

module.exports = {Sorciere,

    sorciere

};

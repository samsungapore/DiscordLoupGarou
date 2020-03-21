const EveryOneVote = require("../../lg_vote").EveryOneVote;
const ReactionHandler = require("../../../functions/reactionHandler").ReactionHandler;
const Villageois = require("../baseRole").Villageois;
let MessageEmbed = require('discord.js').MessageEmbed;

/**
 * * First Night
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
 */
class Sorciere extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Sorciere";

        this.potions = {vie: 1, poison: 1};

        this.targetIsSavedBySalva = false;
        this.savedLgTarget = false;
        this.target = null;

        return this;
    }

    askIfWannaSave(lgTarget) {
        return new Promise((resolve, reject) => {

            this.dmChannel.send(new MessageEmbed()
                .setAuthor(lgTarget.member.displayName, lgTarget.member.user.avatarURL())
                .setTitle(`Voulez-vous sauver ${lgTarget.member.displayName} ?`)
                .addField(`✅ Oui`, "Réagissez avec ✅ pour utiliser votre potion de vie")
                .addField(`❌ Non`, "Réagissez avec ❌ pour ne rien faire face à cette situation")
            )
                .then((msgSent) => new ReactionHandler(msgSent, ["✅", "❌"]).addReactions())
                .then(question => {

                    question.initCollector((reaction) => {
                            if (reaction.emoji.name === "✅") {
                                this.potions.vie -= 1;
                                this.savedLgTarget = true;
                                question.stop();
                            } else if (reaction.emoji.name === "❌") {
                                question.stop();
                            }
                        }, () => {

                            resolve(this);

                        }, reaction => reaction.count > 1,
                        {time: 30000}
                    );

                }).catch(err => reject(err));

        });
    }

    askIfWannaKill(configuration) {
        return new Promise((resolve, reject) => {

            let promises = [];

            this.dmChannel.send(new MessageEmbed()
                .setAuthor(this.member.displayName, this.member.user.avatarURL())
                .setTitle(`Voulez-vous tuer une personne ?`)
                .addField(`✅ Oui`, "Réagissez avec ✅ pour utiliser votre potion de poison sur quelqu'un")
                .addField(`❌ Non`, "Réagissez avec ❌ pour ne rien faire")
            )
                .then((msgSent) => new ReactionHandler(msgSent, ["✅", "❌"]).addReactions())
                .then(question => {

                    question.initCollector((reaction) => {
                            if (reaction.emoji.name === "✅") {

                                this.potions.poison -= 1;
                                promises.push(this.askTargetToKill(configuration));

                                question.stop();
                            } else if (reaction.emoji.name === "❌") {
                                question.stop();
                            }
                        }, () => {

                            Promise.all(promises).then(() => resolve(this)).catch(err => reject(err));

                        }, reaction => reaction.count > 1,
                        {time: 30000}
                    );

                }).catch(err => reject(err));

        });
    }

    askTargetToKill(configuration) {
        return new Promise((resolve, reject) => {

            new EveryOneVote(
                "Qui voulez-vous tuer ?",
                configuration,
                30000,
                this.dmChannel,
                1
            ).excludeDeadPlayers().runVote([this.member.id])
                .then(outcome => {

                    if (!outcome || outcome.length === 0) {

                        resolve(this);

                    } else {

                        this.target = configuration.getPlayerById(outcome[0]);
                        resolve(this);

                    }

                })
                .catch(err => reject(err));

        });
    }

    processRole(configuration, lgTarget) {
        return new Promise((resolve, reject) => {
            this.target = null;
            this.getDMChannel()
                .then((dmChannel) => {

                    dmChannel.send(new MessageEmbed().setColor(this.member.displayColor)
                        .setAuthor("Voici ton inventaire de potions", this.member.user.avatarURL())
                        .addField("Poison", this.potions.poison, true)
                        .addField("Vie", this.potions.vie, true)
                    ).catch(() => true);

                    let promise = [];

                    if (this.potions.vie > 0) {

                        // if salvateur didn't targeted this player
                        if (!lgTarget.immunity) {
                            promise.push(this.askIfWannaSave(lgTarget));
                        } else {
                            lgTarget.immunity = false;
                            this.targetIsSavedBySalva = true;
                        }

                    }

                    return Promise.all(promise);

                })
                .then(() => {
                    if (this.potions.poison > 0) {
                        return this.askIfWannaKill(configuration);
                    } else {
                        resolve(this);
                    }
                })
                .then(() => resolve(this)).catch(err => reject(err));
        });
    }

}

module.exports = {Sorciere};

const lg_var = require("../../lg_var");
const LgLogger = require("../../lg_logger");
const ReactionHandler = require("../../../functions/reactionHandler").ReactionHandler;
const Villageois = require("../baseRole").Villageois;
const MessageEmbed = require('discord.js').MessageEmbed;

/**
 * Si on décide de jouer avec le voleur, on doit ajouter deux cartes de plus au paquet de cartes qui seront distribuée
 * en début de partie (soit 2 cartes de plus que le nombre de joueurs - le meneur de jeu n'étant pas un joueur).
 * Au début de la première nuit (tour préliminaire), le meneur de jeu appelle le voleur. Il lui présente les deux
 * cartes qui n'ont pas été distribuées. Le Voleur a le droit de choisir une de ces deux cartes ou de rester
 * Voleur (auquel cas il a les pouvoirs d'un simple villageois).

 Si les deux cartes proposées sont deux loups-garous, le voleur est obligé d'en prendre une ; il n'est pas
 autorisé à rester simple villageois.

 Si le voleur est une des deux cartes non distribuées, le meneur de jeu doit faire comme si la c'était
 l'un des joueurs et doit faire le même discours que si quelqu'un avait la carte.

 Cependant, c'est un personnage dont les capacités varient énormément en fonction du meneur et des joueurs.
 Ainsi il est fréquent que des variantes soient mises en place pour que le voleur ne puisse qu'échanger
 les cartes des autres joueurs ou la sienne et celle d'un tiers. Dans ce dernier cas, la carte est parfois
 valable pendant toute la partie, l'amenant à changer de main toutes les nuits, ou peut ne fonctionner qu'une
 seule fois, le nouveau propriétaire devenant donc un simple villageois. Il faudrait donc vérifier sa carte
 tous les matins.
 */
class Voleur extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Voleur";

        this.additionnalRoles = null;
        this.roleChosen = null;

        return this;
    }

    proposeRoleChoice(gameConf) {
        return new Promise((resolve, reject) => {

            let dmchanpromise = [];

            if (!this.dmChannel) {
                dmchanpromise.push(this.getDMChannel());
            }

            let embed = null;

            Promise.all(dmchanpromise)
                .then(() => gameConf.rolesHandler.getAdditionnalRoles(2))
                .then(roles => {
                    this.additionnalRoles = roles;

                    let propositionMsg = new MessageEmbed()
                        .setAuthor(`${this.member.displayName}`, this.member.user.avatarURL())
                        .setTitle('Tu es le voleur de la partie')
                        .setDescription('Tu as le choix d\'échanger ton rôle de voleur considéré ' +
                            'comme villageois avec deux carte. Tu ne dois en choisir qu\'une seule')
                        .addField(`Carte 🇦 ${roles[0]}`, lg_var.roles_desc[roles[0]].embed.fields[0].value.slice(0, 1024), true)
                        .addField(`Carte 🇧 ${roles[1]}`, lg_var.roles_desc[roles[1]].embed.fields[0].value.slice(0, 1024), true)
                        .setFooter('Veuillez réagir avec la réaction de votre choix. Tu as 40 secondes pour prendre une décision', lg_var.roles_img.LoupGarou);

                    if (!(roles[0] === "LoupGarou" && roles[1] === "LoupGarou")) {
                        propositionMsg.addField('❌', 'Garder son rôle');
                    }

                    return this.dmChannel.send(propositionMsg);
                })
                .then(embedMsg => {
                    embed = embedMsg;
                    return new ReactionHandler(embedMsg, ['🇦', '🇧', '❌']).addReactions();
                })
                .then((proposition) => {
                    proposition.initCollector((reaction) => {
                        if (reaction.emoji.name === "🇦") {
                            this.roleChosen = this.additionnalRoles[0];
                            proposition.stop();
                        } else if (reaction.emoji.name === "🇧") {
                            this.roleChosen = this.additionnalRoles[1];
                            proposition.stop();
                        } else if (reaction.emoji.name === "❌" && !(this.additionnalRoles[0] === "LoupGarou" && this.additionnalRoles[1] === "LoupGarou")) {
                            this.roleChosen = undefined;
                            proposition.stop();
                        }
                    }, () => {

                        embed.delete().catch(() => true);

                        if (this.roleChosen) {
                            this.dmChannel.send(`Tu as choisi le rôle ${this.roleChosen}`).catch(() => true);
                        } else {
                            this.dmChannel.send(`Tu as choisi de garder ton rôle`).catch(() => true);
                        }

                        resolve(this);

                    }, (reaction) => reaction.count > 1,
                        { time: 40000 }
                    );
                })
                .catch(err => reject(err));

        });
    }

}

module.exports = {Voleur};

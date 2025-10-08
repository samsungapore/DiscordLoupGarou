const lg_var = require("../../lg_var");
const LgLogger = require("../../lg_logger");
const {sendEmbed} = require("../../../utils/message");
const Villageois = require("../baseRole").Villageois;
const MessageEmbed = require("../../../utils/embed");
const {ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');

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
            // IA path: bypass interactive flow for virtual members
            try {
                if (gameConf && gameConf.ai && gameConf.ai.enabled && this.member && this.member.isVirtual) {
                    gameConf.rolesHandler.getAdditionnalRoles(2).then((roles) => {
                        this.additionnalRoles = roles;
                        const decision = gameConf.ai.decideVoleur({additionalRoles: roles});
                        if (decision.keep) {
                            this.roleChosen = undefined;
                        } else {
                            this.roleChosen = decision.role || roles[0];
                        }
                        return resolve(this);
                    }).catch(() => resolve(this));
                    return;
                }
            } catch (e) { /* ignore and fallback to interactive */
            }

            let dmchanpromise = [];

            if (!this.dmChannel) {
                dmchanpromise.push(this.getDMChannel());
            }

            let selectionMade = false;

            Promise.all(dmchanpromise)
                .then(() => gameConf.rolesHandler.getAdditionnalRoles(2))
                .then(roles => {
                    this.additionnalRoles = roles;

                    const getRoleDescription = (roleName) => {
                        const roleData = lg_var.roles_desc[roleName];
                        return roleData && roleData.embed && roleData.embed.fields && roleData.embed.fields[0]
                            ? roleData.embed.fields[0].value.slice(0, 1024)
                            : 'Description indisponible.';
                    };

                    let propositionMsg = new MessageEmbed()
                        .setAuthor(`${this.member.displayName}`, this.member.user.avatarURL())
                        .setTitle('Tu es le voleur de la partie')
                        .setDescription('Tu as le choix d\'échanger ton rôle de voleur considéré ' +
                            'comme villageois avec deux carte. Tu ne dois en choisir qu\'une seule')
                        .addField(`Carte 🇦 ${roles[0]}`, getRoleDescription(roles[0]), true)
                        .addField(`Carte 🇧 ${roles[1]}`, getRoleDescription(roles[1]), true)
                        .setFooter('Utilise les boutons ci-dessous pour faire ton choix. Tu as 40 secondes.', lg_var.roles_img.LoupGarou);

                    if (!(roles[0] === "LoupGarou" && roles[1] === "LoupGarou")) {
                        propositionMsg.addField('❌', 'Garder son rôle');
                    }

                    return sendEmbed(this.dmChannel, propositionMsg);
                })
                .then(embedMsg => {

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('voleur_pick_0')
                                .setLabel('Carte 🇦')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('voleur_pick_1')
                                .setLabel('Carte 🇧')
                                .setStyle(ButtonStyle.Primary)
                        );

                    if (!(this.additionnalRoles[0] === "LoupGarou" && this.additionnalRoles[1] === "LoupGarou")) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId('voleur_keep')
                                .setLabel('Garder son rôle')
                                .setStyle(ButtonStyle.Secondary)
                        );
                    }

                    return embedMsg.edit({components: [row]});
                })
                .then(messageWithComponents => new Promise((resolveCollector) => {
                    const collector = messageWithComponents.createMessageComponentCollector({time: 40000});

                    collector.on('collect', async interaction => {
                        if (interaction.user.id !== this.member.id) return;

                        selectionMade = true;

                        try {
                            await interaction.deferUpdate();
                        } catch (err) {
                            // ignore errors from mocked environments
                        }

                        if (interaction.customId === 'voleur_pick_0') {
                            this.roleChosen = this.additionnalRoles[0];
                        } else if (interaction.customId === 'voleur_pick_1') {
                            this.roleChosen = this.additionnalRoles[1];
                        } else if (interaction.customId === 'voleur_keep' && !(this.additionnalRoles[0] === "LoupGarou" && this.additionnalRoles[1] === "LoupGarou")) {
                            this.roleChosen = undefined;
                        }

                        try {
                            await messageWithComponents.edit({components: []});
                        } catch (err) {
                            // ignore edit errors
                        }

                        collector.stop('selected');
                    });

                    collector.on('end', async () => {
                        try {
                            await messageWithComponents.delete();
                        } catch (err) {
                            // ignore delete errors
                        }

                        if (this.roleChosen) {
                            this.dmChannel.send(`Tu as choisi le rôle ${this.roleChosen}`).catch(() => true);
                        } else {
                            this.dmChannel.send(selectionMade ? `Tu as choisi de garder ton rôle` : `Tu n'as pas fait ton choix, tu gardes ton rôle`).catch(() => true);
                        }

                        resolveCollector();
                    });
                }))
                .then(() => resolve(this))
                .catch(err => reject(err));

        });
    }

}

module.exports = {Voleur};

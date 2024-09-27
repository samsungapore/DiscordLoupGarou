const {sendEmbed} = require("../../../utils/message");
const EveryOneVote = require("../../lg_vote").EveryOneVote;
const ReactionHandler = require("../../../functions/reactionHandler").ReactionHandler;
const Villageois = require("../baseRole").Villageois;
const MessageEmbed = require("../../../utils/embed");
const {ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder} = require('discord.js');


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

    async askIfWannaSave(lgTarget) {
        return new Promise(async (resolve, reject) => {
            try {

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('save_yes')
                            .setLabel('✅ Sauver')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('save_no')
                            .setLabel('❌ Ne rien faire')
                            .setStyle(ButtonStyle.Danger),
                    );

                const embed = new MessageEmbed()
                    .setAuthor(lgTarget.member.displayName, lgTarget.member.user.avatarURL())
                    .setTitle(`Voulez-vous sauver ${lgTarget.member.displayName} ?`);

                const message = await sendEmbed(this.dmChannel, embed);
                await message.edit({components: [row]});

                const collector = message.createMessageComponentCollector({time: 30000});

                collector.on('collect', async interaction => {
                    if (interaction.user.id !== this.member.id) return; // Vérifier que l'interaction vient bien de la sorcière

                    await interaction.deferUpdate();

                    if (interaction.customId === 'save_yes') {
                        this.potions.vie -= 1;
                        this.savedLgTarget = true;
                        // Modifier le message pour refléter le choix
                        await message.edit({content: 'Vous avez choisi de sauver la personne.', components: []});
                        collector.stop();
                    } else if (interaction.customId === 'save_no') {
                        await message.edit({content: 'Vous avez choisi de ne rien faire.', components: []});
                        collector.stop();
                    }
                });

                collector.on('end', () => {
                    resolve(this);
                });

            } catch (err) {
                reject(err);
            }
        });
    }

    async askIfWannaKill(configuration) {
        return new Promise(async (resolve, reject) => {
            try {
                const {ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');

                // Création des boutons
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('kill_yes')
                            .setLabel('✅ Oui')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('kill_no')
                            .setLabel('❌ Non')
                            .setStyle(ButtonStyle.Secondary),
                    );

                // Envoi du message avec les boutons
                const embed = new MessageEmbed()
                    .setAuthor(this.member.displayName, this.member.user.avatarURL())
                    .setTitle(`Voulez-vous tuer une personne ?`);

                const message = await sendEmbed(this.dmChannel, embed);
                await message.edit({components: [row]});

                // Gestion des interactions des boutons
                const collector = message.createMessageComponentCollector({time: 30000});

                collector.on('collect', async interaction => {
                    if (interaction.user.id !== this.member.id) return; // Vérifier que l'interaction vient bien de la sorcière

                    await interaction.deferUpdate();

                    if (interaction.customId === 'kill_yes') {
                        this.potions.poison -= 1;

                        // Modifier le message pour indiquer que la sélection est en cours
                        await message.edit({content: 'Veuillez choisir une personne à tuer.', components: []});

                        // Appeler la fonction pour choisir la cible à tuer
                        await this.askTargetToKill(configuration, interaction);


                        collector.stop();
                        resolve(this);

                    } else if (interaction.customId === 'kill_no') {
                        await message.edit({content: 'Vous avez choisi de ne rien faire.', components: []});
                        collector.stop();
                        resolve(this);
                    }
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        message.edit({content: 'Temps écoulé. Vous n\'avez pas fait de choix.', components: []});
                        resolve(this);
                    }
                });

            } catch (err) {
                reject(err);
            }
        });
    }


    async askTargetToKill(configuration, interaction) {
        return new Promise(async (resolve, reject) => {
            try {

                // Récupérer les joueurs disponibles
                const alivePlayers = configuration.getAlivePlayers();

                // Créer les options du menu déroulant
                const options = alivePlayers.map(player => ({
                    label: player.member.displayName,
                    description: `Joueur ${player.member.displayName}`,
                    value: player.member.id,
                }));

                // Créer le menu déroulant
                const row = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('select_player_to_kill')
                            .setPlaceholder('Choisissez un joueur à tuer')
                            .addOptions(options),
                    );

// Envoyer le menu déroulant
                const selectMessage = await this.dmChannel.send({
                    content: 'Sélectionnez la personne que vous souhaitez tuer :',
                    components: [row]
                });

                // Créer un collecteur pour le menu déroulant
                const collector = selectMessage.createMessageComponentCollector({time: 30000});


                collector.on('collect', async selectInteraction => {
                    if (selectInteraction.user.id !== this.member.id) return;

                    await selectInteraction.deferUpdate();

                    const selectedPlayerId = selectInteraction.values[0];
                    this.target = configuration.getPlayerById(selectedPlayerId);

                    await selectMessage.edit({
                        content: `Vous avez choisi de tuer **${this.target.member.displayName}**.`,
                        components: []
                    });


                    collector.stop();
                    resolve(this);
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        selectMessage.edit({
                            content: 'Temps écoulé. Vous n\'avez pas choisi de cible.',
                            components: []
                        });
                        resolve(this);
                    }
                });

            } catch (err) {
                reject(err);
            }
        });
    }


    async processRole(configuration, lgTarget) {
        return new Promise(async (resolve, reject) => {
            try {
                this.target = null;
                await this.getDMChannel();

                // Envoi de l'inventaire des potions
                await sendEmbed(this.dmChannel, new MessageEmbed()
                    .setColor('#0099ff')
                    .setAuthor(
                        'Voici ton inventaire de potions',
                        this.member.user.avatarURL()
                    )
                    .addFields([
                        {name: 'Poison', value: `${this.potions.poison}`, inline: true},
                        {name: 'Vie', value: `${this.potions.vie}`, inline: true}]
                    )
                );

                // Demander si elle veut sauver quelqu'un
                if (this.potions.vie > 0 && !lgTarget.immunity) {
                    await this.askIfWannaSave(lgTarget);
                } else if (lgTarget.immunity) {
                    lgTarget.immunity = false;
                    this.targetIsSavedBySalva = true;
                }

                // Demander si elle veut tuer quelqu'un
                if (this.potions.poison > 0) {
                    await this.askIfWannaKill(configuration);
                }

                resolve(this);

            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = {Sorciere};

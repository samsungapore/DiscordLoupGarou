const roles_img = require("../../lg_var").roles_img;
const EveryOneVote = require("../../lg_vote").EveryOneVote;
const Villageois = require("../baseRole").Villageois;
let MessageEmbed = require('discord.js').MessageEmbed;

class Voyante extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Voyante";

        return this;
    }

    processRole(configuration) {
        return new Promise((resolve, reject) => {

            this.GameConfiguration = configuration;
            let roleDetected = null;

            this.getDMChannel().then(dmChannel => {

                return new EveryOneVote(
                    "Choisissez une personne pour voir son rôle",
                    this.GameConfiguration,
                    40000, dmChannel, 1
                ).excludeDeadPlayers().runVote([this.member.id]);

            }).then(outcome => {

                if (!outcome || outcome.length === 0) {
                    this.dmChannel.send("Ton tour est terminé, tu n'as pas joué ton rôle de voyante").catch(console.error);

                    return resolve(this);
                } else if (outcome.length === 1) {

                    let target = this.GameConfiguration.getPlayerById(outcome[0]);

                    roleDetected = target.role;

                    return this.dmChannel.send(new MessageEmbed()
                        .setAuthor(target.member.displayName, target.member.user.avatarURL())
                        .setTitle(target.role)
                        .setImage(roles_img[target.role])
                        .setColor(target.member.displayColor)
                    );

                }

            }).then(() => {
                if (roleDetected) {
                    return configuration.channelsHandler.sendMessageToVillage(`La Voyante a détecté un(e) ${roleDetected}`);
                }
            }).then(() => resolve(this)).catch(err => reject(err));
        });
    }

}

module.exports = {Voyante};

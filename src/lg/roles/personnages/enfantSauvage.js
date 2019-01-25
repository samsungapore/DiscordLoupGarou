/**
 * L'enfant sauvage choisit un autre joueur au début de la partie qui devient son modèle.
 * //todo: Si le modèle meurt, l'enfant sauvage devient un loup-garou.
 * @param client
 * @param message
 */
const send = require("../../message_sending");
const RichEmbed = require("discord.js").RichEmbed;
const lg_var = require("../../lg_var.js");
const Villageois = require("../baseRole").Villageois;

class EnfantSauvage extends Villageois {

    constructor(guildMember) {
        super(guildMember);

        this.role = "EnfantSauvage";

        return this;
    }

}

let enfantSauvage = (client, message) => new Promise((resolve, reject) => {
    let gSettings = client.guilds_settings.get(message.guild.id);

    if (LG.role_players_id.EnfantSauvage.length === 0) {
        resolve(null);
    }

    let enfant_sauvage_id = LG.role_players_id.EnfantSauvage[0];
    let enfant_sauvage = LG.players[enfant_sauvage_id];

    send.message_to_village(client, message, "L'enfant sauvage se réveille").catch(err => reject(err));
    enfant_sauvage.member_object.createDM().then(enfantChan => {

        enfantChan.send("Tu es l'enfant sauvage, tu peux donc choisir ton modèle parmis les autres habitants" +
            " du village. Si ton modèle meurt, tu deviendras un Loup-Garou.").catch(err => reject(err));

        let otherPlayersMsg = new RichEmbed().setColor(message.guild.me.displayColor).setDescription(
            "Pour voter tapez **vote <numéro>**\nExemple : vote 1"
        );
        let i = 0;
        let player_array = [];
        Object.keys(LG.players).forEach(playerID => {
            if (playerID !== enfant_sauvage_id && LG.players[playerID].alive) {
                player_array.push(playerID);
                i += 1;
                if (i === 25) {
                    enfantChan.send(otherPlayersMsg).catch(err => reject(err));
                    otherPlayersMsg = new RichEmbed().setColor(message.guild.me.displayColor).setDescription(
                        "Pour voter tapez **vote <numéro>**\nExemple : vote 1"
                    );
                    i = 0;
                }
                otherPlayersMsg.addField(
                    `**${i}** - ${LG.players[playerID].display_name}`,
                    lg_var.memberStatus[LG.players[playerID].member_object.presence.status]
                );
            }
        });

        let enfantSauvageChoiceMsgCollecor = enfantChan.createMessageCollector(
            m => m.author.id === enfant_sauvage_id,
            {time: 120000}
        );

        LG.message_collector_list.push(enfantSauvageChoiceMsgCollecor);

        enfantSauvageChoiceMsgCollecor.on('collect', msg => {
            let m = msg.content;

            if (m.startsWith('vote ')) {
                let answer = parseInt(m.slice("vote ".length));

                if (isNaN(answer) || answer < 1 || answer > player_array.length) {
                    enfantChan.send(`Veuillez entrer un chiffre entre 1 et ${player_array.length}`)
                        .catch(err => reject(err));
                    return;
                }

                LG.players[enfant_sauvage_id].modele = player_array[answer];

                enfantSauvageChoiceMsgCollecor.stop();

            } else {
                enfantChan.send("rappel commande vote : **vote <numéro>**\nExemple : **vote 1**")
                    .catch(err => reject(err));
            }

        });

        enfantSauvageChoiceMsgCollecor.on('end', () => {

            if (LG.quitting_game) {
                return;
            }
            send.message_to_village(client, message, 'L\'**Enfant Sauvage** se rendort.')
                .catch(err => reject(err));
            resolve(null);

        })

    }).catch(err => reject(err));

});

module.exports = {EnfantSauvage,

    enfantSauvage

};

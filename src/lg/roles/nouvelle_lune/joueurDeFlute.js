const send = require("../../message_sending");
const lg_var = require("../../lg_var");
const lg_func = require("../../lg_functions");
const Player = require("../baseRole").Player;
//let GroupDMChannel = require("discord.js").GroupDMChannel;
let MessageEmbed = require("discord.js").MessageEmbed;

class JoueurDeFlute extends Player {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.team = "JOUEURDEFLUTE";
        this.role = "JoueurDeFlute";

        return this;
    }

}

/**
 * chaque nuit, il vous enverra un MP pour vous informer de qui ilva charmer.Il envoie alors, s'il le désire,
 * jusqu'à deux noms. A la fin de la nuit, juste avant d'annoncer le jour,on annonce alors aux charmés (par Mp)
 * qu'ils l'ont été, ainsi que l'identité de tous les autres charmés. Si le Joueur de Flute meurt, tous les
 * charmés ne le sont plus. //todo: (Attention : si le Joueur de Flute réussit à charmer l'ensemble des villageois, mais qu'il ne survit pas à la nuit, alors le joueur de flute a échoué dans sa mission, et meurt.)
 * @param client
 * @param message
 */
function joueurFlute(client, message) {
    return new Promise((resolve, reject) => {
       let g_set = client.guilds_settings.get(message.guild.id);

       /*if (LG.turn === 1) {
           LG.charmed_player_channel = new GroupDMChannel(client, {
               name: "Charmés par le joueur de flûte",
               icon: 'https://www.loups-garous-en-ligne.com/jeu/assets/images/carte15.png',
               ownerID: message.guild.me.id,
               managed: true,
               applicationID: '',
               lastMessageID: message.id
           });
       }*/
       if (g_set.LG.role_players_id.JoueurDeFlute.length === 0) {
           resolve(null);
       }

       send.message_to_village(client, message, "J'appelle le joueur de flûte").catch(err => reject(err));

       let joueurFluteID = g_set.LG.role_players_id.JoueurDeFlute[0];
       let joueurFlute = g_set.LG.players[joueurFluteID];

       joueurFlute.member_object.createDM().then(jFluteChan => {

           let exception_id_array = [g_set.LG.role_players_id.JoueurDeFlute[0]];
           let amoureux_id = g_set.LG.players[g_set.LG.role_players_id.JoueurDeFlute[0]].amoureux;
           if (amoureux_id) {
               exception_id_array.push(amoureux_id);
           }
           let players = lg_func.get_player_list(client, message, exception_id_array);
           let player_list = players.string;
           let players_array = players.array;

           jFluteChan.send(
               new MessageEmbed().setAuthor("Joueur de flûte", lg_var.roles_img.JoueurDeFlute).setColor(7419530)
                   .setDescription(
                       "Tu es le joueur de flûte, tu peux choisir de charmer jusqu'à deux joueurs"
                   )
                   .addField("**Choix 1 :** charmer jusqu'à 2 joueurs", `${player_list}\n__commande:__ vote 1 2`, true)
                   .addField("**Choix 2 :** passer son tour", "__commande:__ vote nul", true)
                   .setFooter("Tu as 2 minutes pour faire ton choix", lg_var.roles_img.JoueurDeFlute)
           ).catch(err => reject(err));

           let msg_timeout = setTimeout(() => {
               jFluteChan.send("Il te reste 20 secondes pour faire un choix.")
                   .catch(console.error);
           }, 100000);

           let joueurFluteMsgColl = jFluteChan.createMessageCollector(
               (m) => m.author.id !== m.guild.me.id,
               {time: 120000}
               );

           joueurFluteMsgColl.on("collect", msg => {

               if (msg.content) {

                   let answer = msg.content.toLowerCase().trim().split(/ +/g);
                   let choices = [];

                   if (answer[0] !== "vote" || answer.length > 3) {
                       return;
                   }

                   if (answer[1] === "nul") {
                       joueurFluteMsgColl.stop();
                       return;
                   } else {

                       let correct_answer = true;

                       answer.slice(1).forEach(choice => {

                           let choiceNb = parseInt(choice);

                           if (isNaN(choiceNb)) {
                               jFluteChan.send("Veuillez entrer un nombre.").catch(err => reject(err));
                               correct_answer = false;
                               return;
                           }

                           if (!g_set.LG.players[players_array[choiceNb - 1]]) {
                               jFluteChan.send(`Les numéros vont de ${players_array.length - players_array.length + 1} à ${players_array.length}.`)
                                   .catch(err => reject(err));
                               correct_answer = false;
                           }

                           choices.push(choiceNb);

                       });
                       if (!correct_answer) {
                           return;
                       }

                   }

                   choices.forEach(choice => {
                       let target = g_set.LG.players[players_array[choice - 1]];

                       g_set.LG.charmed_players_id_tmp_array.push(target.id);
                       g_set.LG.charmed_players_id.push(target.id);
                   });

                   joueurFluteMsgColl.stop('JoueurFlute turn done');
               }

           });

           joueurFluteMsgColl.on("end", () => {
               if (g_set.LG.quitting_game) {
                   return;
               }
               clearTimeout(msg_timeout);
               resolve(null);
           });

       }).catch(err => reject(err));

    });
}

module.exports = {JoueurDeFlute,

    joueurFlute

};

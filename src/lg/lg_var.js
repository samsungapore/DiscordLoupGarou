// lg_var.js

const MessageEmbed = require("../utils/embed");
const botColor = 7419530; // Votre couleur de bot (vous pouvez la modifier si nécessaire)

class LGGameObject {

    constructor() {

        this.lg_on = false;
        this.game_initialized = false;
        this.participants_complete = false;
        this.quitting_game = false;
        this.turn = 1;

        this.firstnight = true;

        /**
         * Exemple de structure pour les joueurs :
         * {
         *   display_name: message.member.displayName,
         *   id: message.member.id,
         *   member_object: message.member,
         *   immunity: false,
         *   alive: true,
         *   has_voted: false,
         *   infected: false,
         *   role: String
         * }
         */
        this.players = {};
        this.game_timeout = null;
        this.DEATHS_ID = [];

        /**
         * Channels de jeu
         * @type {{village_lg: Object, paradis_lg: Object, loups_garou_lg: Object, petite_fille_lg: Object}}
         */
        this.lg_game_channels = {
            village_lg: null,
            paradis_lg: null,
            loups_garou_lg: null,
            petite_fille_lg: null
        };

        this.lg_game_roles = {
            JoueurLG: {
                color: 'BLUE',
                object: null
            },
            MortLG: {
                color: 'RED',
                object: null
            },
        };

        this.lg_to_petite_fille = null;
        this.lg_vote = null;
        this.vote_village = null;
        this.timeout_list = [];
        this.message_collector_list = [];

        this.charmed_player_channel = null;
        this.charmed_players_id = [];
        this.charmed_players_id_tmp_array = [];

        this.vote_data = {
            result: '',
            votes: {}
        };

        this.vote_retry_nb = 0;
        this.revote = false;
        this.stemming_channel = null;
        this.stemming_player = null;
        this.salvateur_choice = null;
        this.kill_choice = false;

        /**
         * Capitaine
         * @type { GuildMember }
         */
        this.capitaine = null;

        this.role_players_id = {
            Villageois: [],
            LoupGarou: [],
            Voyante: [],
            Salvateur: [],
            Sorciere: [],
            Chasseur: [],
            Cupidon: [],
            Ancien: [],
            LoupBlanc: [],
            Voleur: [],
            PetiteFille: [],
            IdiotDuVillage: [],
            BoucEmissaire: [],
            JoueurDeFlute: [],
            EnfantSauvage: [],
            Ange: [],
            InfectPereDesLoups: [],
            GrandMechantLoup: [],
            Soeur: [],
            MontreurOurs: [],
            Renard: [],
            ChienLoup: [],
            Frere: [],
            Chevalier: [],
            JugeBegue: [],
            Corbeau: [],
            Capitaine: []
        };

        this.role_conf = [
            {
                LoupGarou: 1
            },
            // Thiercelieux
            {
                Voyante: 1,
                Voleur: 1,
                Chasseur: 1,
                Cupidon: 1,
                Sorciere: 1,
                PetiteFille: 1,
                Capitaine: 1,
                LoupGarou: 1
            },

            // Nouvelle lune
            {
                Villageois: 1,
                LoupGarou: 1,
                Salvateur: 1,
                IdiotDuVillage: 1,
                BoucEmissaire: 1,
                JoueurDeFlute: 1
            },
            {
                Villageois: 1,
                EnfantSauvage: 1,
                Chevalier: 1,
                Ange: 1,
                InfectPereDesLoups: 1,
                Soeur: 2, // todo: si une carte soeur est donnée, il faut donner la deuxième. Si impossible de donner la deuxième, donner un autre rôle.
                Renard: 1,
                ServanteDevouee: 1,
                Frere: 3, // todo: si une carte soeur est donnée, il faut donner les autres. Si impossible de les donner, donner un autre rôle.
                MontreurOurs: 1,
                Comedien: 1,
                AbominableSectaire: 1,
                ChienLoup: 1,
                VillageoisVillageois: 1,
                Corbeau: 1
            },
            {
                GrandMechantLoup: 1,
                Ancien: 1,
                JugeBegue: 1,
            },
            {
                Villageois: Number.MAX_SAFE_INTEGER
            }
        ]

    }

}

const memberStatus = {
    online: "En Ligne",
    offline: "Invisible ou Hors Ligne",
    idle: "AFK",
    dnd: "Ne pas déranger "
};

// Objet des permissions (à adapter selon vos besoins)
const permission = {
    // Vos permissions ici
};

const MINUTE = 60000;

const death_sentence = [
    "Il meurt dans d'atroces souffrances.",
    "Le bûcher était étrangement bien préparé.",
    "Les villageois s'empressent de démembrer le corps, après l'avoir frappé incessamment à coups de pelle.",
    "Paix à son âme. ~~Ou pas~~",
    "Puisse son âme reposer en paix.",
    "Ainsi s'achève son périple."
];

const bypass_roles = ["LoupGarou", "PetiteFille"];

const channel_reserved_roles = {
    LoupGarou: 'loups_garou_lg',
    PetiteFille: 'petite_fille_lg'
};

// Définition des descriptions des rôles
const roleDescriptions = {
    LoupGarou: {
        name: "Loup-garou",
        description: "Vous vous réveillez chaque nuit pour éliminer un villageois. Le jour, vous participerez aux débats en essayant de cacher votre identité de loup. Vous avez le droit de voter comme tous les autres joueurs, et éventuellement contre un des vôtres. Votre but est de tuer tous les autres villageois."
    },
    Voyante: {
        name: "Voyante",
        description: "Au début de chaque nuit, vous êtes appelée par le meneur et vous pouvez désigner une personne dont vous découvrirez secrètement le rôle. Ne vous dévoilez pas trop vite sous peine de vous faire tuer au cours de la prochaine nuit par les loups-garous."
    },
    Salvateur: {
        name: "Salvateur",
        description: "Vous vous réveillez chaque nuit, avant les loups-garous, et désignez au meneur de jeu un joueur que vous protégerez. Si ce joueur est la victime désignée par les loups-garous cette nuit, il survit à leur assaut. Vous pouvez éventuellement vous protéger vous-même, mais vous ne pouvez pas protéger la même personne deux tours de suite. Votre protection ne peut empêcher un amoureux de mourir de chagrin et la potion de la sorcière fonctionne toujours sur un joueur protégé."
    },
    Villageois: {
        name: "Villageois",
        description: "Vous êtes armés de votre force de persuasion et de votre perspicacité. Vous avez la possibilité de voter pour éliminer un joueur et d'être le Capitaine du village dont le vote unique compte comme deux."
    },
    Cupidon: {
        name: "Cupidon",
        description: "Durant la première nuit de la partie, vous allez désigner deux personnes qui seront amoureuses jusqu'à la fin du jeu. Si l'une des deux personnes vient à mourir, sa moitié meurt immédiatement de désespoir. Le but des deux amoureux est de finir comme seuls survivants de la partie, qu'importe leur rôle."
    },
    Voleur: {
        name: "Voleur",
        description: "Au début de la première nuit, vous pouvez choisir de changer de rôle selon les deux qui vous sont proposés ou vous pouvez rester Voleur (auquel cas vous avez les pouvoirs d'un simple villageois). Si les deux rôles proposés sont deux loups-garous, vous êtes obligé de devenir loup-garou."
    },
    Sorciere: {
        name: "Sorcière",
        description: "Vous possédez deux potions : une de guérison et une d'empoisonnement. Vous ne pouvez utiliser chacune de ces potions qu'une seule fois au cours de la partie. Durant la nuit, lorsque les loups-garous se sont rendormis, le meneur de jeu va vous appeler et va vous montrer la personne tuée par les loups-garous cette nuit. Vous pouvez utiliser la potion de vie pour sauver la victime, ou bien utiliser la potion d'empoisonnement pour tuer un joueur de votre choix, ou ne rien faire."
    },
    Chasseur: {
        name: "Chasseur",
        description: "Vous n'avez aucun rôle particulier à jouer tant que vous êtes vivant. Mais, dès que vous mourrez (de quelque manière que ce soit), vous devez désigner une personne qui mourra également sur-le-champ d'une balle de votre fusil."
    },
    Ange: {
        name: "Ange",
        description: "Votre rôle est simple : vous devez faire en sorte d'être le premier à être exécuté par les villageois pour remporter la partie. Si vous échouez, vous continuerez à jouer en tant que simple villageois."
    },
    PetiteFille: {
        name: "Petite Fille",
        description: "Votre rôle vous donne le droit d'espionner chaque nuit les conversations des loups-garous. Ils ne savent pas qui vous êtes mais vous ne pourrez pas non plus voir qui ils sont, seulement ce qu'ils se disent."
    },
    IdiotDuVillage: {
        name: "L'Idiot du Village",
        description: "Vous n'avez pas de pouvoir étant vivant. Si les villageois décident de vous exécuter, vous serez immédiatement épargné. Par la suite, vous restez en vie, mais vous ne pouvez plus voter ni être élu capitaine du village."
    },
    BoucEmissaire: {
        name: "Le Bouc Émissaire",
        description: "En cas d'égalité dans les votes du village, vous mourrez d'office. En mourant, vous avez le droit de désigner qui votera et ne votera pas le jour suivant."
    },
    Capitaine: {
        name: "Capitaine",
        description: "À l'aube du premier jour, les villageois élisent le capitaine du village. En cas d'égalité, la voix du capitaine l'emporte. Le capitaine peut être n'importe quel joueur (incluant les loups-garous). Si le capitaine meurt, dans son dernier souffle il désigne un successeur qui devient automatiquement le nouveau capitaine du village."
    },
    JoueurDeFlute: {
        name: "Joueur de Flûte",
        description: "Ennemi à la fois des villageois et des loups-garous, le joueur de flûte se réveille à la fin de chaque nuit et choisit chaque fois deux nouveaux joueurs qu'il va charmer. Si, à n'importe quel moment, le joueur de flûte est en vie et tous les autres joueurs vivants sont charmés, le joueur de flûte gagne immédiatement, seul."
    },
    LoupBlanc: {
        name: "Loup Blanc",
        description: "Il est différent des autres loups-garous, qui eux sont persuadés qu'il est dans leur camp. Son but est d'être le dernier survivant. Il se réveille en même temps que les autres loups-garous et désigne la victime avec eux, mais une nuit sur deux il se réveille une deuxième fois seul et peut choisir d'éliminer ou non un loup-garou."
    },
    Ancien: {
        name: "L'Ancien",
        description: "Il survit à la première attaque des loups-garous. Si l'ancien est la victime du vote du village ou du tir du chasseur, il meurt et tous les villageois perdent leurs pouvoirs."
    },
    EnfantSauvage: {
        name: "L'Enfant Sauvage",
        description: "L'enfant sauvage choisit un autre joueur au début de la partie qui devient son modèle. Si le modèle meurt, l'enfant sauvage devient un loup-garou."
    },
    InfectPereDesLoups: {
        name: "L'Infect Père des Loups",
        description: "C'est un loup-garou qui se réunit avec ses amis loups-garous et une fois dans la partie, il peut choisir d'infecter la victime des loups-garous et la transformer en loup."
    },
    GrandMechantLoup: {
        name: "Le Grand Méchant Loup",
        description: "Le grand méchant loup mange dans un premier temps avec les loups-garous, puis il mange une deuxième fois seul un villageois mais il ne peut manger une deuxième victime que si aucun loup-garou n'est mort avant cette nuit."
    },
    Soeur: {
        name: "Sœur",
        description: "Les deux sœurs se réveillent chaque nuit pour discuter ensemble. Elles sont des villageoises ordinaires en dehors de ce pouvoir."
    },
    Frere: {
        name: "Frère",
        description: "Les trois frères se réveillent chaque nuit pour discuter ensemble. Ils sont des villageois ordinaires en dehors de ce pouvoir."
    },
    MontreurOurs: {
        name: "Montreur d'Ours",
        description: "Le matin, si le montreur d'ours se trouve à côté d'un loup-garou, l'ours grogne indiquant au montreur d'ours qu'un loup-garou est à sa droite ou à sa gauche."
    },
    Renard: {
        name: "Renard",
        description: "La nuit, il désigne trois joueurs adjacents. Si au moins un de ces joueurs est loup-garou, le renard peut recommencer plus tard."
    },
    ChienLoup: {
        name: "Chien-Loup",
        description: "À l'appel du meneur de jeu, il choisit entre loup-garou et villageois. S'il choisit loup-garou, il rejoint leur camp."
    },
    Chevalier: {
        name: "Chevalier à l'Épée Rouillée",
        description: "Si le chevalier est tué par les loups-garous, le premier loup-garou à sa gauche meurt avec lui."
    },
    JugeBegue: {
        name: "Juge Bègue",
        description: "Le juge bègue peut décider une fois dans la partie de refaire un vote immédiatement après un premier vote."
    },
    Corbeau: {
        name: "Corbeau",
        description: "Il se réveille chaque nuit et peut désigner un joueur qui aura automatiquement deux voix contre lui lors du prochain vote."
    },
    ServanteDevouee: {
        name: "Servante Dévouée",
        description: "La servante dévouée peut, lors du vote du village, prendre la place du joueur désigné et récupérer son rôle."
    },
    Comedien: {
        name: "Comédien",
        description: "Au début de la partie, le meneur choisit trois rôles supplémentaires. Chaque nuit, le comédien peut choisir un de ces rôles à jouer jusqu'à la prochaine nuit."
    },
    AbominableSectaire: {
        name: "Abominable Sectaire",
        description: "La première nuit, le meneur divise le village en deux groupes. L'abominable sectaire doit éliminer tous les joueurs de l'autre groupe."
    },
    VillageoisVillageois: {
        name: "Villageois-Villageois",
        description: "Personnage dont la carte présente deux faces identiques, il est connu de tous comme un simple villageois."
    }
};

// Images associées aux rôles
const roles_img = {
    Villageois: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte1.png",
    LoupGarou: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte2.png",
    Voyante: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte3.png",
    Salvateur: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte4.png",
    Sorciere: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte5.png",
    Chasseur: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte6.png",
    Cupidon: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte7.png",
    Ancien: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte8.png",
    LoupBlanc: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte9.png",
    Voleur: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte11.png",
    PetiteFille: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte12.png",
    IdiotDuVillage: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte13.png",
    BoucEmissaire: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte14.png",
    JoueurDeFlute: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte15.png",
    EnfantSauvage: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte16.png",
    Ange: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte19.png",
    InfectPereDesLoups: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte20.png",
    GrandMechantLoup: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte21.png",
    Soeur: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte22.png",
    Frere: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte26.png",
    MontreurOurs: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte23.png",
    Renard: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte24.png",
    ChienLoup: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte25.png",
    Chevalier: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte27.png",
    JugeBegue: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte29.png",
    Corbeau: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte17.png",
    ServanteDevouee: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte30.png",
    Comedien: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte31.png",
    AbominableSectaire: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte32.png",
    VillageoisVillageois: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte33.png",
    Capitaine: "https://p1.storage.canalblog.com/13/28/1355275/103540695_o.jpg"
};

const roles_desc = {};

for (const [role, data] of Object.entries(roleDescriptions)) {
    roles_desc[role] = new MessageEmbed()
        .setColor(botColor)
        .setAuthor("LG - Rôle")
        .setThumbnail(roles_img[role]) // Ajoute l'image du rôle
        .addField(data.name, data.description)
}

const infinite_fill_roles = {
    Villageois: Number.MAX_SAFE_INTEGER
};

module.exports = {

    LGGameObject,
    MINUTE,
    death_sentence,
    bypass_roles,
    memberStatus,
    botColor,
    channel_reserved_roles,
    permission,
    roles_desc,
    infinite_fill_roles,
    roles_img

};

let LGGameObject = class {

    constructor() {

        this.lg_on = false;
        this.game_initialized = false;
        this.participants_complete = false;
        this.quitting_game = false;
        this.turn = 1;

        this.firstnight = true;
        /**
         * display_name: message.member.displayName,
         * id: message.member.id,
         * member_object: message.member,
         * immunity: false,
         * alive: true,
         * has_voted: false,
         * infected: false
         * role: String
         * @type {{}}
         */
        this.players = {};
        this.game_timeout = null;
        this.DEATHS_ID = [];

        /**
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

};

const botColor = 7419530;

const memberStatus = {
    online: "En Ligne",
    offline: "Invisible ou Hors Ligne",
    idle: "AFK",
    dnd: "Ne pas déranger "
};

// Permission Object
const permission = {
    JoueurLG: {
        village_lg: {
            day: {
                'ADD_REACTIONS': true,
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': true,
                'SEND_TTS_MESSAGES': true,
                'EMBED_LINKS': true,
                'ATTACH_FILES': true,
                'READ_MESSAGE_HISTORY': true,
                'USE_EXTERNAL_EMOJIS': true
            },
            night: {
                'ADD_REACTIONS': false,
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': false,
                'SEND_TTS_MESSAGES': false,
                'EMBED_LINKS': false,
                'ATTACH_FILES': false,
                'READ_MESSAGE_HISTORY': true,
                'USE_EXTERNAL_EMOJIS': false
            }
        },
    },
    MortLG: {
        village_lg: {
            'ADD_REACTIONS': false,
            'VIEW_CHANNEL': true,
            'SEND_MESSAGES': false,
            'SEND_TTS_MESSAGES': false,
            'EMBED_LINKS': false,
            'ATTACH_FILES': false,
            'READ_MESSAGE_HISTORY': true,
            'USE_EXTERNAL_EMOJIS': false
        },
        paradis_lg: {
            'ADD_REACTIONS': true,
            'VIEW_CHANNEL': true,
            'SEND_MESSAGES': true,
            'SEND_TTS_MESSAGES': true,
            'EMBED_LINKS': true,
            'ATTACH_FILES': true,
            'READ_MESSAGE_HISTORY': true,
            'USE_EXTERNAL_EMOJIS': true
        },
        loups_garous_lg: {
            'ADD_REACTIONS': false,
            'VIEW_CHANNEL': false,
            'SEND_MESSAGES': false,
            'SEND_TTS_MESSAGES': false,
            'EMBED_LINKS': false,
            'ATTACH_FILES': false,
            'READ_MESSAGE_HISTORY': false,
            'USE_EXTERNAL_EMOJIS': false
        }
    },
    everyone: {
        village_lg: {
            'ADD_REACTIONS': false,
            'VIEW_CHANNEL': true,
            'SEND_MESSAGES': false,
            'SEND_TTS_MESSAGES': false,
            'EMBED_LINKS': false,
            'ATTACH_FILES': false,
            'READ_MESSAGE_HISTORY': true,
            'USE_EXTERNAL_EMOJIS': false
        },
        paradis_lg: {
            'VIEW_CHANNEL': false,
        },
        lg_loups_garou: {
            'VIEW_CHANNEL': false,
        },
        petite_fille_lg: {
            'VIEW_CHANNEL': false,
        }
    },
    LoupGarou: {
        loups_garous_lg: {
            day: {
                'ADD_REACTIONS': false,
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': false,
                'SEND_TTS_MESSAGES': false,
                'EMBED_LINKS': false,
                'ATTACH_FILES': false,
                'READ_MESSAGE_HISTORY': true,
                'USE_EXTERNAL_EMOJIS': false
            },
            night: {
                'ADD_REACTIONS': true,
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': true,
                'SEND_TTS_MESSAGES': true,
                'EMBED_LINKS': true,
                'ATTACH_FILES': true,
                'READ_MESSAGE_HISTORY': true,
                'USE_EXTERNAL_EMOJIS': true
            }
        }
    }
};

const MINUTE = 60000;

const death_sentence = [
    "Il meurt dans d'atroces souffrances.",
    "Le bûcher était étrangement bien préparé.",
    "Les villageois s'empressent de démembrer le corps, après l'avoir frappé incessablement à coups de pelle.",
    "Paix à son âme. ~~Ou pas~~",
    "Puisse son âme reposer en paix.",
    "Ainsi s'achève son périple."
];

const bypass_roles = ["LoupGarou", "PetiteFille"];

const channel_reserved_roles = {
    LoupGarou: 'loups_garou_lg',
    PetiteFille: 'petite_fille_lg'
};

const roles_desc = {
    LoupGarou: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Loup-garou",
                value: "Vous vous réveillez chaque nuit pour éliminer un villageois. Le jour, vous participerez " +
                "aux débats en essayant de cacher votre identité de loup. Vous avez le droit de voter comme " +
                "tous les autres joueurs, et éventuellement contre un des vôtres. Votre but est de tuer tous" +
                " les autres villageois."
            }
            ]
        }
    },
    Voyante: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Voyante",
                value: "Au début de chaque nuit, vous êtes appelée par le meneur et vous pouvez désigner une " +
                "personne dont vous découvrirez secrètement le rôle. Ne vous dévoilez pas trop vite sous peine " +
                "de vous faire tuer au cours de la prochaine nuit par les loups-garous."
            }
            ]
        }
    },
    Salvateur: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Salvateur",
                value: "Vous vous réveillez chaque nuit, avant les loups-garous, et désignez au meneur de jeu " +
                "un joueur que vous protégerez. Si ce joueur est la victime désignée par les loups-garous cette " +
                "nuit, il survit à leur assaut. Vous pouvez éventuellement vous protéger vous-même, mais vous " +
                "ne pouvez pas protéger la même personne deux tours de suite. Votre protection ne peut empêcher " +
                "un amoureux de mourir de chagrin et la potion de la sorcière fonctionne toujours sur un joueur protégé."
            }
            ]
        }
    },
    Villageois: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Villageois",
                value: "Vous êtes armés de votre force de persuasion et de votre perspicacité. Vous avez la " +
                "possibilité de voter pour éliminer un joueur et d'être le Capitaine du village dont le vote " +
                "unique compte comme deux."
            }
            ]
        }
    },
    Cupidon: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Cupidon",
                value: "Durant la première nuit de la partie, vous allez désigner deux personnes qui seront " +
                "amoureuses jusqu'à la fin du jeu. Si l'une des deux personnes vient à mourir, sa moitié meurt" +
                " immédiatement de désespoir. Le but des deux amoureux et de finir comme seuls survivants de la" +
                " partie, qu'importe leur rôle."
            }
            ]
        }
    },
    Voleur: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Voleur",
                value: "Au début de la première nuit, vous pouvez choisir de changer de rôle selon les deux qui " +
                "vous sont proposé ou vous pouvez rester Voleur (auquel cas vous avez les pouvoirs d'un simple villageois).\n" +
                "Si les deux rôles proposées sont deux loups-garous, vous êtes obligé de devenir loup garou ; il " +
                "n'est pas autorisé à rester simple villageois.\n"
            }
            ]
        }
    },
    Sorciere: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Sorcière",
                value: "Vous possèdez deux potions : une de guérison et une d'empoisonnement. Vous ne pouvez" +
                " utiliser chacune de ses potions qu'une seule fois au cours de la partie. Durant la nuit, " +
                "lorsque les loups-garous se sont rendormis, le meneur de jeu va vous appeler et va vous montrer" +
                " la personne tuée par les loups-garous de cette nuit. Vous pouvez utiliser soit la potion de" +
                " vie pour sauver la victime, ou bien utiliser la potion d'empoisonnement pour tuer un joueur " +
                "de votre choix, ou ne rien faire."
            }
            ]
        }
    },
    Chasseur: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Chasseur",
                value: "Vous n'avez aucun rôle particulier à jouer tant que vous êtes vivant. Mais, dès que" +
                " vous mourrez (de quelque manière que ce soit), vous devez désigner une personne qui mourra " +
                "également sur-le-champ d'une balle de votre fusil."
            }
            ]
        }
    },
    Ange: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Ange",
                value: "Votre rôle est simple : vous devez faire en sorte d'être le premier à être exécuté par" +
                " les villageois pour remporter la partie. Si vous échouez, vous continuerez à jouer en tant " +
                "que simple villageois."
            }
            ]
        }
    },
    PetiteFille: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Petite fille",
                value: "Votre rôle vous donne le droit d'espionner chaque nuit les conversations des " +
                "loups-garous. Ils ne savent pas qui vous êtes mais vous ne pourrez pas non plus voir qui " +
                "ils sont, seulement ce qu'ils se disent."
            }
            ]
        }
    },
    IdiotDuVillage: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "L'idiot du village",
                value: "Vous n'avez pas de pouvoir étant vivant. Si les villageois décident de vous exécuter, " +
                "vous serez immédiatement épargné. Par la suite, vous restez en vie, mais vous ne pouvez plus " +
                "voter ni être élu capitaine du village. Si vous assumiez ce rôle de capitaine, il sera supprimé " +
                "jusqu'à la fin de la partie. À l'inverse du vote des villageois, la potion de la sorcière, le " +
                "tir du chasseur ou les loups-garous vous tueront."
            }
            ]
        }
    },
    BoucEmissaire: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Le bouc emissaire",
                value: "En cas d'égalité dans le votes du village, vous mourrez d'office (le capitaine n'a" +
                " alors pas à trancher, il ne devra le faire en cas d'égalité des votes qu'après votre mort)." +
                " En mourrant, vous avez le droit de désigner qui votera et ne votera pas le jour suivant."
            }]
        }
    },
    Capitaine: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Capitaine",
                value: "À l'aube du premier jour, les villageois élisent le capitaine (ou capitaine) du " +
                "village.En cas d'égalité, la voix du capitaine l'emporte. Le capitaine peut être " +
                "n'importe quel joueur (incluant les loups-garous). Si le capitaine meurt, dans son " +
                "dernier souffle il désigne un successeur qui devient automatiquement le nouveau" +
                "capitaine du village.\n\nS'il y a un désaccord pour le capitaine, celui-ci peut " +
                "être choisi au hasard. Dans ce cas, glisser la carte du capitaine dans les cartes" +
                " à distribuer. Le capitaine est celui qui reçoit cette carte. On l'appelle aussi capitaine. Le Capitaine peut aussi être élu par les deux sœurs, ou les trois frères."
            }]
        }
    },
    JoueurDeFlute: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Joueur de Flûte",
                value: "Ennemi à la fois des villageois et des loups-garous, le joueur de flûte se réveille à la fin de chaque nuit et choisit chaque fois deux nouveaux joueurs qu'il va charmer. Puis, il se rendort et le meneur de jeu réveille tous les joueurs charmés (anciens et nouveaux) pour qu'ils se reconnaissent. Les joueurs charmés continuent à jouer normalement (quel que soit leur rôle), mais si, à n'importe quel moment, le joueur de flûte est en vie et tous les autres joueurs vivants sont charmés, le joueur de flûte gagne immédiatement, seul. Sa victoire n'arrête pas la partie pour les autres joueurs.\n" +
                "\n" +
                "Si le joueur de flûte est en couple, il devra charmer tout le monde sauf lui et son amoureux.\n" +
                "\n" +
                "Si le joueur de flûte est infecté, son objectif change et il devra alors gagner avec les loups-garous."
            }]
        }
    },
    LoupBlanc: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Loup Blanc",
                value: "Il est différent des autres loups-garous, qui eux sont persuadés qu'il est dans leur camp. Son but est d'être le dernier survivant. Il se réveille en même temps que les autres loups-garous et désigne la victime avec eux, mais une nuit sur deux il se réveille une deuxième fois seul et peut choisir d'éliminer ou non un loup-garou. Ce rôle est aussi inclus dans l'extension Personnages. Il sera dit être le chef des loups."
            }]
        }
    },
    Ancien: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "L'Ancien",
                value: "Il survit à la première attaque des loups-garous. Attention ! Le tir du chasseur, le vote du village, la potion de la sorcière et la seconde attaque des loups-garous le tuent instantanément. Si l'ancien est la victime du vote du village, de la potion d'empoisonnement de la sorcière ou du tir du chasseur, il meurt et tous les villageois perdent leurs pouvoirs (le joueur de flûte et les loups-garous ne sont pas des villageois). Sous la protection du salvateur, il n'est pas considéré comme attaqué et la guérison de la sorcière annule l'effet de la dernière attaque seulement. Et si l'ancien est infecté par l'infect père des loups, l'infection ne fonctionne pas. Le problème d'inclure l'ancien dans le jeu réside dans le fait que tous les villageois qui ont des pouvoirs (sorcière, voyante, petite fille, chasseur etc.) risquent soudainement de les perdre si l'ancien est éliminé par autre chose que les loups-garous. Cette perte des pouvoirs peut engendrer parfois beaucoup de frustration et de démotivation chez les jeunes joueurs. Beaucoup de maîtres de jeux font donc le choix de ne pas inclure l'ancien pour les jeunes publics. Pour des joueurs plus avertis en revanche, l'ancien permet un jeu beaucoup plus intéressant puisque les analyses lors des débats se font plus fines afin d'éviter la désagréable surprise de supprimer l'ancien."
            }]
        }
    },
    EnfantSauvage: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "L'Enfant Sauvage",
                value: "L'enfant sauvage choisit un autre joueur au début de la partie qui devient son modèle. Si le modèle meurt, l'enfant sauvage devient un loup-garou."
            }]
        }
    },
    InfectPereDesLoups: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "L'Infect Père des Loups",
                value: "C'est un loup-garou qui se réunit avec ses amis loups-garous et une fois dans la partie, il peut choisir d'infecter la victime des loups-garous et la transformer en loup mais l'infecté garde les pouvoirs de sa carte initiale et conserve son rôle initial. L'infecté pourra être détecté seulement par le montreur d'ours, le flair du renard ou la petite fille. Il garde sa carte de base donc la voyante ne pourra jamais savoir que c'est un loup-garou. En créant un loup-garou en cours de partie, l'infect père des loups vient semer la confusion chez les villageois et apporte un stimulant au jeu.\n" +
                "\n" +
                "si le joueur de flute est infecté, son but est maintenant de gagner avec les loups garous et non charmer tout le monde ;\n" +
                "si l'ancien est infecté la première fois, l'infection ne marche pas ;\n" +
                "si le montreur d'ours est infecté, il grognera tous les tours."
            }]
        }
    },
    GrandMechantLoup: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Le Grand Méchant Loup",
                value: "Le grand méchant loup mange dans un premier temps avec les loups-garous, puis il mange une deuxième fois seul un villageois mais il ne peut manger une deuxième victime que si aucun loup-garou n'est mort avant cette nuit (chien/loup et enfant sauvage compris). Son rôle est plus apprécié dans les parties avec beaucoup de joueurs. En effet, avec peu de joueurs, la partie risque de rapidement se terminer avec deux victimes en une nuit. Dans les parties avec beaucoup de joueurs et donc de nombreux loups-garous, il pourra aussi jouer le rôle de chef de meute en cas de désaccord entre loups-garous sur la victime. Dans ce cas, il a des pouvoirs analogues au capitaine du village dans la décision des loups-garous la nuit: son vote compte double et en cas d'égalité c'est à lui de trancher."
            }]
        }
    },
    Soeur: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Soeur",
                value: "Les 3 frères / 2 sœurs durant toutes les nuits, après les loups garous, se réveillent ensemble et décident ce qu'ils vont faire pendant le jour, donc pour qui ils vont voter. Ce sont, sinon, de simples villageois. Ces cartes sont utiles dans les grands groupes de joueurs, puisque cela crée des sous-groupes de villageois qui se connaissent. Certains meneurs de jeu autorisent les 3 frères/2 sœurs à communiquer avec des mots, mais c'est moins sûr."
            }]
        }
    },
    Frere: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Frère",
                value: "Les 3 frères / 2 sœurs durant toutes les nuits, après les loups garous, se réveillent ensemble et décident ce qu'ils vont faire pendant le jour, donc pour qui ils vont voter. Ce sont, sinon, de simples villageois. Ces cartes sont utiles dans les grands groupes de joueurs, puisque cela crée des sous-groupes de villageois qui se connaissent. Certains meneurs de jeu autorisent les 3 frères/2 sœurs à communiquer avec des mots, mais c'est moins sûr."
            }]
        }
    },
    MontreurOurs: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Montreur D'ours",
                value: "Le matin, si le montreur d'ours se trouve à côté d'un loup garou, l'ours (le meneur de jeu) grogne indiquant au montreur d'ours qu'à sa droite ou sa gauche se trouve un loup garou. Si le montreur d'ours a lui-même été infecté par l'infect père des loups, alors l'ours grognera à tous les tours."
            }]
        }
    },
    Renard: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Renard",
                value: "La nuit, à l'appel du meneur, il désigne trois joueurs voisins. Si au moins un de ces joueurs est loup-garou, le renard peut recommencer plus tard. (N'est pas obligé de le faire chaque nuit). Par contre, si ce sont trois non loups-garous, il perd son pouvoir définitivement en innocentant trois personnes."
            }]
        }
    },
    ChienLoup: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Chien Loup",
                value: "Personnage qui à l'appel du meneur de jeu choisit entre loup-garou et villageois. S'il choisit la première, il devient loup-garou. Sinon, il reste villageois. Il est conseillé pour le meneur de jeu de le considérer comme un loup-garou dans le choix des cartes car les joueurs préfèrent en général être loup-garou à villageois. On ne sait pas son choix lors de sa mort. Donc on ne peut jamais savoir s'il était devenu loup-garou ou non (à part les loups-garous eux-mêmes). Une variante est de faire dépendre la possibilité de son choix du hasard (pièce de monnaie, dés) à chaque tour. À chaque début de nuit, le meneur de jeu peut par exemple tirer les dés ou lancer une pièce. Si cela tombe sur le(s) bon(s) nombre(s) ou la bonne face, le chien-loup peut opérer son choix. Dans cette variante, le chien-loup devra donc attendre les tours pour faire son choix. Cela évite qu'il choisisse dès le départ de devenir loup-garou, vidant par là le rôle de chien-loup de tout intérêt. En étant un loup-garou à retardement, le chien-loup vient semer la confusion chez les villageois et apporte un stimulant au jeu. Une seconde variante offre une autre palette de choix au chien-loup : celui de devenir loup-garou ou celui d'aider le chasseur. Dans cette seconde variante, si le chien-loup choisit cette seconde option, alors il rejoint le camp des villageois. Le chasseur devra alors impérativement prendre en compte son avis lorsqu'il fera usage de son pouvoir et il ne peut bien sûr tuer le chien-loup. Afin d'éviter de révéler le choix opéré par le chien-loup, le meneur de jeu tapera sur l'épaule du chasseur pour qu'il reconnaisse le chien-loup lorsque celui-ci décide de se mettre à son service. Si le chasseur est tué la nuit et si le chien-loup et le chasseur sont en désaccord sur la personne à éliminer, il convient de réveiller le capitaine qui tranchera. Tout se fait en silence la nuit et le meneur de jeu ne doit pas révéler aux autres joueurs que le chien-loup est impliqué dans la décision du chasseur. Si le chasseur est tué de jour par le vote du village, alors le chien-loup pourra tenter de ne pas révéler son identité mais ça lui sera difficile. Si les deux sont en désaccord et que le capitaine intervient, il trahit son rôle. Au chien-loup alors de juger ce qu'il préfère faire : trahir son rôle ou tenter de tuer celui qu'il pense être un loup-garou"
            }]
        }
    },
    Chevalier: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Chevalier à l'épée rouillée",
                value: "Le chevalier à l'épée rouillée donne le tétanos au premier loup à sa gauche (qui était présent lors du vote des loups) s'il est mangé par les loups durant la nuit. Ce loup-garou mourra la nuit d'après, sans manger, innocentant au passage toutes les personnes entre lui et le chevalier."
            }]
        }
    },
    JugeBegue: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Juge bègue",
                value: "Le juge bègue montre, la nuit, au meneur, un signe particulier. Si, lors d'un vote de village, il fait ce signe au meneur, le meneur lancera alors un deuxième vote après la mort du premier voté. Il doit choisir un signe discret pour ne pas se faire remarquer par les loups-garous. Tout comme le rôle du grand méchant loup, le rôle du juge bègue est plus apprécié dans les parties avec beaucoup de joueurs. En effet, avec peu de joueurs, la partie risque de rapidement se terminer avec deux victimes en une journée (puisque le village effectue deux votes)."
            }]
        }
    },
    Corbeau: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Corbeau",
                value: "Il se réveille en dernier toutes les nuits et peut désigner au maître du jeu un joueur qu'il pense être le loup-garou. Ce joueur aura automatiquement deux voix contre lui pour le prochain vote. Le corbeau est donc un personnage important car comme il est avec les villageois, il montre logiquement une personne qu'il pense être le loup-garou, et donc ne bluffe pas."
            }]
        }
    },
    ServanteDevouee: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Servante Dévouée",
                value: "La servante dévouée \"se sacrifie\" à la place d'un autre joueur choisi durant le vote (ou plus exactement change de rôle sans disparaître du jeu). Le joueur qui joue la servante échange la carte de la servante avec la carte du personnage qui vient d'être désigné comme mise à mort par le village (sans la révéler au village). Le joueur qui joue la servante joue maintenant cette carte, tandis que le joueur désigné à l'origine est bel et bien éliminé... mais avec la carte de la servante.De plus, le pouvoir de la carte échangée est \"réinitialisé\". En bref, la servante peut voler la carte d'un joueur mis à mort et donc prendre son pouvoir. Néanmoins, quand la servante est en couple, elle ne peut utiliser son pouvoir, l'amour étant plus fort que sa volonté de changer de rôle. Le meneur de jeu doit tout de même demander à la servante si elle souhaite échanger sa carte pour maintenir l'illusion."
            }]
        }
    },
    Comedien: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Comédien",
                value: "Lorsque le comédien est présent dans la partie, le meneur de jeu choisit trois cartes supplémentaires (sauf loups-garous, chien-loup, enfant sauvage et voleur) qu'il place face révélée. Chaque nuit, le comédien choisit parmi ces trois cartes le rôle qu'il veut jouer jusqu'à la prochaine nuit. Lorsqu'un rôle est sélectionné, il est retiré de la partie afin que les autres joueurs puissent voir lequel a été sélectionné. Quand il ne peut plus choisir de rôle, il redevient simple villageois."
            }]
        }
    },
    AbominableSectaire: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Abominable Sectaire",
                value: "La première nuit, le meneur divise le village en deux parties (femmes/hommes; blonds/bruns; barbus/imberbes…). L’abominable sectaire est forcément dans un de ces camps, et pour gagner, il doit éliminer tous les joueurs de l'autre camp. C'est un personnage solitaire, comme le joueur de flûte ou l'ange."
            }]
        }
    },
    VillageoisVillageois: {
        embed: {
            color: botColor,
            author: {
                name: "LG - Rôle"
            },
            fields: [{
                name: "Villageois Villagois",
                value: "Personnage dont la carte présente deux faces identiques, est connu de tous comme un simple villageois, c'est donc un personnage de \"confiance\" que l'on choisira pour être capitaine ou garde champêtre. C'est aussi une bonne cible pour l'infect père des loups."
            }]
        }
    },

};

const roles_img = {

    Villageois: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte1.png",
    LoupGarou: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte2.png",
    Voyante: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte3.png",
    Salvateur: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte4.png",
    Sorciere: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte5.png",
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
    MontreurOurs: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte23.png",
    Renard: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte24.png",
    ChienLoup: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte25.png",
    Frere: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte26.png",
    Chevalier: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte27.png",
    JugeBegue: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte29.png",
    Corbeau: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte17.png",
    Chasseur: "https://www.loups-garous-en-ligne.com/jeu/assets/images/carte6.png",
    Capitaine: "https://p1.storage.canalblog.com/13/28/1355275/103540695_o.jpg"
};

const infinite_fill_roles = {
    Villageois: Number.MAX_SAFE_INTEGER
};

module.exports = {

    LGGameObject, MINUTE, death_sentence, bypass_roles, memberStatus, botColor,
    channel_reserved_roles, permission, roles_desc, infinite_fill_roles, roles_img

};

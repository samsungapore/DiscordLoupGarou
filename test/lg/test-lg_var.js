// TDD: Test LG Variables and Game Object definitions
// Following TDD approach: Write failing test first, then implement bare minimum to pass

const {
    LGGameObject,
    death_sentence,
    bypass_roles,
    MINUTE,
    memberStatus
} = require('../../src/lg/lg_var');

describe('LGGameObject', () => {
    describe('constructor', () => {
        test('should initialize game state properties correctly', () => {
            // TDD: Red - define expected behavior
            const gameObject = new LGGameObject();

            expect(gameObject.lg_on).toBe(false);
            expect(gameObject.game_initialized).toBe(false);
            expect(gameObject.participants_complete).toBe(false);
            expect(gameObject.quitting_game).toBe(false);
            expect(gameObject.turn).toBe(1);
            expect(gameObject.firstnight).toBe(true);
        });

        test('should initialize players as empty object', () => {
            // TDD: Red - define expected behavior
            const gameObject = new LGGameObject();

            expect(gameObject.players).toEqual({});
        });

        test('should initialize game channels structure', () => {
            // TDD: Red - define expected behavior
            const gameObject = new LGGameObject();

            expect(gameObject.lg_game_channels).toEqual({
                village_lg: null,
                paradis_lg: null,
                loups_garou_lg: null,
                petite_fille_lg: null
            });
        });

        test('should initialize game roles structure', () => {
            // TDD: Red - define expected behavior
            const gameObject = new LGGameObject();

            expect(gameObject.lg_game_roles).toEqual({
                JoueurLG: {
                    color: 'BLUE',
                    object: null
                },
                MortLG: {
                    color: 'RED',
                    object: null
                }
            });
        });

        test('should initialize role players as object with empty arrays', () => {
            // TDD: Red - define expected behavior
            const gameObject = new LGGameObject();

            expect(gameObject.role_players_id).toEqual({
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
            });
        });
    });
});

describe('Constants', () => {
    test('should export MINUTE constant as 60000', () => {
        // TDD: Red - define expected behavior
        expect(MINUTE).toBe(60000);
    });

    test('should export death_sentence array with content', () => {
        // TDD: Red - define expected behavior
        expect(death_sentence).toBeDefined();
        expect(Array.isArray(death_sentence)).toBe(true);
        expect(death_sentence.length).toBeGreaterThan(0);
    });

    test('should export memberStatus object with status definitions', () => {
        // TDD: Red - define expected behavior
        expect(memberStatus).toEqual({
            online: "En Ligne",
            offline: "Invisible ou Hors Ligne",
            idle: "AFK",
            dnd: "Ne pas déranger "
        });
    });

    test('should export bypass_roles with expected values', () => {
        // TDD: Red - define expected behavior
        expect(bypass_roles).toEqual(["LoupGarou", "PetiteFille"]);
    });
});

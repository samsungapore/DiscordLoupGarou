const clone = require('../../../functions/clone');

class RandomRoleComposition {
    apply(handler) {
        handler.role_conf = [
            {
                LoupGarou: 1,
            },
            {
                Voyante: 1,
                Chasseur: 1,
                Cupidon: 1,
                Sorciere: 1,
            },
            {
                LoupGarou: 1,
            },
            {
                PetiteFille: 1,
                Voleur: 1,
            },
            {
                Villageois: 1,
                LoupGarou: 1,
                Salvateur: 1,
                IdiotDuVillage: 1,
                BoucEmissaire: 1,
                JoueurDeFlute: 1,
            },
            {
                Villageois: 1,
                EnfantSauvage: 1,
                Chevalier: 1,
                Ange: 1,
                InfectPereDesLoups: 1,
                Soeur: 2,
                Renard: 1,
                ServanteDevouee: 1,
                Frere: 3,
                MontreurOurs: 1,
                Comedien: 1,
                AbominableSectaire: 1,
                ChienLoup: 1,
                VillageoisVillageois: 1,
                Corbeau: 1,
            },
            {
                GrandMechantLoup: 1,
                Ancien: 1,
                JugeBegue: 1,
            },
            {
                Villageois: Number.MAX_SAFE_INTEGER,
                LoupGarou: 1,
            },
        ];

        handler.thiercelieux = [
            handler.role_conf[0],
            handler.role_conf[1],
            handler.role_conf[2],
            handler.role_conf[3],
            handler.role_conf[7],
        ];

        handler.nouvelleLune = [
            handler.role_conf[0],
            handler.role_conf[1],
            handler.role_conf[4],
            handler.role_conf[7],
        ];

        handler.allExtension = handler.thiercelieux;
        handler.gameType = handler.thiercelieux;

        handler.gameTypeCopy = clone(handler.gameType);

        let gameTypeCopyObj = handler.gameTypeCopy[0];
        for (let i = 1; i < handler.gameTypeCopy.length; i++) {
            gameTypeCopyObj = Object.assign(gameTypeCopyObj, handler.gameTypeCopy[i]);
            handler.gameTypeCopy[0] = gameTypeCopyObj;
        }

        try {
            delete gameTypeCopyObj.Voleur;
            delete gameTypeCopyObj.Cupidon;
            delete gameTypeCopyObj.JoueurDeFlute;
        } catch (e) {
            console.error(e);
        }

        handler.gameTypeCopy = [gameTypeCopyObj];
    }
}

class CustomRoleComposition {
    constructor(composition) {
        this.composition = Object.assign({}, composition || {});
    }

    apply(handler) {
        const sanitized = {};
        for (const [role, count] of Object.entries(this.composition)) {
            const value = Number.parseInt(count, 10);
            if (Number.isInteger(value) && value > 0) {
                sanitized[role] = value;
            }
        }

        if (Object.keys(sanitized).length === 0) {
            throw new Error('Custom role composition must contain at least one role');
        }

        const block = clone(sanitized);
        handler.role_conf = [clone(sanitized)];
        handler.gameType = [block];
        handler.gameTypeCopy = [clone(block)];
        handler.thiercelieux = handler.gameType;
        handler.nouvelleLune = handler.gameType;
        handler.allExtension = handler.gameType;
    }
}

function createRoleCompositionStrategy(composition) {
    if (composition && Object.keys(composition).length > 0) {
        return new CustomRoleComposition(composition);
    }

    return new RandomRoleComposition();
}

module.exports = {
    RandomRoleComposition,
    CustomRoleComposition,
    createRoleCompositionStrategy,
};

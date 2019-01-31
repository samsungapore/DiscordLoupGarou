const basicRole = require("./baseRole");
const EnfantSauvage = require("./personnages/enfantSauvage").EnfantSauvage;
const JoueurDeFlute = require("./nouvelle_lune/joueurDeFlute").JoueurDeFlute;
const BoucEmissaire = require("./nouvelle_lune/boucEmissaire").BoucEmissaire;
const IdiotDuVillage = require("./nouvelle_lune/idiotDuVillage").IdiotDuVillage;
const Salvateur = require("./nouvelle_lune/salvateur").Salvateur;
const PetiteFille = require("./thiercelieux/petiteFille").PetiteFille;
const Chasseur = require("./thiercelieux/chasseur").Chasseur;
const Voleur = require("./thiercelieux/voleur").Voleur;
const Voyante = require("./thiercelieux/voyante").Voyante;
const Sorciere = require("./thiercelieux/sorciere").Sorciere;
const Cupidon = require("./thiercelieux/cupidon").Cupidon;

class Create {

    static allRoles = {
        Villageois: this.villageois,
        LoupGarou: this.loupGarou,
        Voyante: this.voyante,
        Salvateur: this.salvateur,
        Sorciere: this.sorciere,
        Chasseur: this.chasseur,
        Cupidon: this.cupidon,
        //Ancien: this.ancien,
        //LoupBlanc: this.loupBlanc,
        Voleur: this.voleur,
        PetiteFille: this.petiteFille,
        IdiotDuVillage: this.idiotDuVillage,
        BoucEmissaire: this.boucEmissaire,
        JoueurDeFlute: this.joueurDeFlute,
        EnfantSauvage: this.enfantSauvage,
        //Ange: this.ange,
        //InfectPereDesLoups: this.infectPereDesLoups,
        //GrandMechantLoup: this.grandMechantLoup,
        //Soeur: this.soeur,
        //MontreurOurs: this.montreurOurs,
        //Renard: this.renard,
        //ChienLoup: this.chienLoup,
        //Frere: this.frere,
        //Chevalier: this.chevalier,
        //JugeBegue: this.jugeBegue,
        //Corbeau: this.corbeau,
    };

    static petiteFille(guildMember) {
        return new PetiteFille(guildMember);
    }

    static villageois(guildMember) {
        return new basicRole.Villageois(guildMember);
    }

    static salvateur(guildMember) {
        return new Salvateur(guildMember);
    }

    static idiotDuVillage(guildMember) {
        return new IdiotDuVillage(guildMember);
    }

    static boucEmissaire(guildMember) {
        return new BoucEmissaire(guildMember);
    }

    static joueurDeFlute(guildMember) {
        return new JoueurDeFlute(guildMember);
    }

    static enfantSauvage(guildMember) {
        return new EnfantSauvage(guildMember);
    }

    /*static chevalier(guildMember) {
        return new Chevalier(guildMember);
    }

    static ange(guildMember) {
        return new Ange(guildMember);
    }

    static infectPereDesLoups(guildMember) {
        return new InfectPereDesLoups(guildMember);
    }

    static soeur(guildMember) {
        return new Soeur(guildMember);
    }

    static renard(guildMember) {
        return new Renard(guildMember);
    }

    static servanteDevouee(guildMember) {
        return new ServanteDevouee(guildMember);
    }

    static frere(guildMember) {
        return new Frere(guildMember);
    }

    static montreurOurs(guildMember) {
        return new MontreurOurs(guildMember);
    }

    static comedien(guildMember) {
        return new Comedien(guildMember);
    }

    static abominableSectaire(guildMember) {
        return new AbominableSectaire(guildMember);
    }

    static chienLoup(guildMember) {
        return new ChienLoup(guildMember);
    }

    static villageoisVillageois(guildMember) {
        return new VillageoisVillageois(guildMember);
    }

    static grandMechantLoup(guildMember) {
        return new GrandMechantLoup(guildMember);
    }

    static ancien(guildMember) {
        return new Ancien(guildMember);
    }

    static jugeBegue(guildMember) {
        return new JugeBegue(guildMember);
    }

    static loupBlanc(guildMember) {
        return new LoupBlanc(guildMember);
    }

    static maire(guildMember) {
        return new Maire(guildMember);
    }*/

    static chasseur(guildMember) {
        return new Chasseur(guildMember);
    }

    static cupidon(guildMember) {
        return new Cupidon(guildMember);
    }

    static loupGarou(guildMember) {
        return new basicRole.LoupGarou(guildMember);
    }

    static sorciere(guildMember) {
        return new Sorciere(guildMember);
    }

    static voleur(guildMember) {
        return new Voleur(guildMember);
    }

    static voyante(guildMember) {
        return new Voyante(guildMember);
    }

}

module.exports = {Create};

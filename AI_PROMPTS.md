Cartographie complète des opportunités de prompts IA (LGDB)

Voici une liste exhaustive des points d’insertion possibles pour des messages narratifs IA, avec le canal cible, les
entrées de
contexte à fournir et des squelettes de prompts (System/User) à peaufiner.

Principes et garde‑fous
• Public vs secret: ne jamais révéler d’informations cachées dans les salons publics (village/vote); les révélations
privées vont en
DM aux rôles concernés ou dans le salon LG.
• Un seul message court, sans “meta” ni explication technique; style configurable (Higurashi/Monokuma/médiéval, etc.).
• Variables utiles: turn, phase, alive/dead, lastNightDeaths[], victim/victims, roleRevealed?, captain, lovers[],
savedBy?,
tieCandidates[], winners[], winnerTeam, table[], timers, etc.

Phase 0 — Pré‑jeu (lobby)
• Salon: village
• Triggers:
• Création/initialisation de partie
• Invitation à rejoindre/quitter (réactions 🐺/🚪)
• Compte à rebours “Début dans X sec”
• Contexte: table[] (participants), minPlayers, starterName
• Prompt:
• System: “Narrateur de Loup‑Garou. Annonce publique concise, sans rôles ni infos cachées.”
• User: “Annonce d’ouverture, invite à réagir pour rejoindre, ambiance {theme}. Nombre minimal {minPlayers}, joueurs
actuels:
{table}.”

Phase 1 — Jour 1 (matin + élection)
• Salon: village
• Matin (déjà implémenté IA): annonce d’aube
• Contexte: turn=1, deaths=[] (avant nuit), thème/style
• Prompt: “Annonce du petit matin. N’écris que l’annonce. Pas de morts.”
• Élection du capitaine: consigne + dramatisation
• Contexte: table[], durée, channelVote
• Prompt: “Annonce publique: élection du capitaine, consignes, ton immersif {theme}, court.”
• Résultat élection
• Contexte: outcome = elected|no_election|tie, electedName? candidates?
• Prompt: “Annonce publique du résultat; en cas d’égalité, expliquer brièvement.”

Phase 2+ — Jour générique
• Salon: village
• Matin (déjà implémenté IA): annonce d’aube avec morts de la nuit
• Contexte: deadPeople[] (noms + rôles si votre règle les révèle), savedEvents, specialChains (amoureux)
• Prompt: “Annonce du matin, mentionne les morts: {list}. Reste concis.”
• Débat ouvert
• Contexte: debateDuration, channelVote
• Prompt: “Annonce publique de début de débat et consignes de vote (channel).”
• Annonces de mi‑temps (optionnel, 1‑2 fois max)
• Contexte: remainingTime
• Prompt: “Rappel court du temps restant, évite la répétition.”
• Sentence du vote (résultat)
• Contexte: victimName, victimRole (si révélé), voteBlanc? tie?
• Prompt: “Annonce publique de la décision du village et de la victime (ou vote blanc), ton dramatique.”

Nuit — Cadence générale
• Salon: village
• Nuit tombe
• Contexte: turn, ambiance
• Prompt: “Annonce courte de la tombée de la nuit, pas d’indices.”
• Réveil / rendormissement des rôles (public, sans détails)
• Contexte: roleName (générique), ordre
• Prompt: “’{role} se réveille.’ puis ‘se rendort.’ (phrases brèves, sans détail secret).”

Nuit — Actions par rôle (DM/Salon privé)
• Loups‑Garous (salon LG)
• Contexte: aliveTargets[], previousTargets?, turn
• Prompt: “Narration pour choisir une proie (sans jeter de soupçons hors LG).”
• Petite Fille (DM)
• Contexte: start/stop écoute; ne pas divulguer identités
• Prompt: “Notification RP d’écoute en cours; strictement neutre.”
• Salvateur (DM)
• Contexte: protectable[], lastProtected?
• Prompt: “Invite à protéger un joueur; ton RP discret.”
• Voyante (DM)
• Contexte: target?, reveal: team|role|hint (selon vos règles)
• Prompt: “Révélation RP de l’alignement/carte de {target} (précise ce qui est autorisé).”
• Sorcière (DM)
• Contexte: lgTarget?, potions{vie,poison}, playerList
• Prompt: “Expose situation (une victime potentielle). Demande: soigner? tuer? Reste concis.”
• Voleur (DM, première nuit)
• Contexte: twoRoles[], constraints; choix garder ou prendre
• Prompt: “Présente les deux cartes, propose choix, style RP.”
• Cupidon (DM + DMs aux amoureux)
• Contexte: playerList pour sélection; DM aux lovers
• Prompt: “Annonce RP de l’union, sans révéler publiquement.”
• Enfant Sauvage (DM)
• Contexte: playerList, choix modèle
• Prompt: “Invite RP à choisir un modèle, confirme le choix.”
• Frères/Soeurs (DM/groupe; si activé)
• Contexte: chat privé en nuit
• Prompt: “Brève narration d’échange secret.”
• Corbeau (DM; si activé)
• Contexte: accuser un joueur (marque de suspicion)
• Prompt: “Invite à poser un corbeau sur un suspect; sans spoiler.”
• Joueur de Flûte (DM; si activé)
• Contexte: choisir 1‑2 charmés; DM aux charmés (liste)
• Prompt: “Annonce aux charmés, RP musical.”
• Infect Père des Loups (DM; si activé)
• Contexte: infecter la victime spéciale
• Prompt: “Invite à infecter; décrit la transformation.”

Gestion des morts et conséquences
• Annonce de décès (public) — jour suivant ou immédiat selon règle
• Contexte: deceasedName(s), cause? (attaque LG / exécution), roleReveal?
• Prompt: “Annonce sobre des décès, s’il faut révéler le rôle, fais‑le.”
• Amoureux: mort de chagrin (public)
• Contexte: names
• Prompt: “Annonce RP du double décès lié.”
• Capitaine mort: succession (public + DM au capitaine au moment de mourir si nécessaire)
• Contexte: choisir successeur (DM), annonce publique
• Prompt: “Récit du passage de flambeau.”
• Chasseur mort (DM + public)
• Contexte: DM pour choisir une cible; annonce publique post‑cible
• Prompt: “Derniers mots du chasseur (court) + victime emportée.”

Fin de partie — Épilogues
• Salon: village
• Scénarios finaux (selon code):
• Victoire LG / Victoire Village / Victoire du Couple / Tout le monde mort / (éventuels solos Loup Blanc/Joueur de
Flûte/Ange)
• Contexte: winnerTeam, winners[], timeline brève (history[]), images (lg_var)
• Prompt: “Épilogue RP court: titre de victoire + 1‑3 phrases de conclusion, cite les survivants gagnants.”

Rappels/Timers (optionnels, parcimonieux)
• Salon: vote ou village
• Contexte: remainingTime, requiredSkips/max
• Prompt: “Rappel atmosphérique (‘le temps presse…’). Éviter le spam.”

Cas spéciaux/erreurs (éviter spoilers)
• Égalité au vote: annonce publique + DM capitaine pour trancher
• Contexte: tieCandidates[], capitaineName
• Prompt (public): “Égalité, le capitaine tranchera.”
• Prompt (DM capitaine): “Choisissez entre: {candidates}.”
• Aucune action (loups/Sorcière/…): narration neutre
• Contexte: none
• Prompt: “Pas d’événement cette nuit.”

──────────────────────────────────────────

Gabarits de prompts (à affiner)

• Matin public (jour N):
• System: “Tu es le narrateur d’une partie de Loup‑Garou. Annonce publique concise en français, sans informations
cachées.”
• User: “Annonce du petit matin (tour {turn}). Morts cette nuit: {deathsPublicListOrNone}. Ton {theme}. N’écris rien
d’autre.”

• Nuit tombe:
• System: “Narrateur, annonce publique courte, sans indices.”
• User: “Il fait nuit à Thiercelieux. Ton {theme}. Un seul paragraphe.”

• Rôle (DM) — Voyante:
• System: “Tu parles en DM à la Voyante. Conserve le secret. Réponse brève.”
• User: “Révèle à la Voyante que {target} est {reveal} (seulement ce champ). Ton {theme}. Rien d’autre.”

• Vote résultat:
• System: “Annonce publique concise, dramatique, pas d’infos cachées.”
• User: “Le village a choisi {victimName}. Rôle révélé: {roleIfRevealedElseNone}. Vote blanc si applicable. N’écris rien
d’autre.”

• Épilogue:
• System: “Narrateur, conclusion publique courte. Citer vainqueurs, pas de secrets non révélés.”
• User: “Victoire: {winnerTeam}. Survivants: {winners}. Ton {theme}. 2‑3 phrases max.”

──────────────────────────────────────────

Couverture des rôles et états
• Couvert en code actuel: Loups, Voyante, Sorcière, Voleur, Cupidon, Enfant Sauvage, Petite Fille, Salvateur, Chasseur,
Frères/Sœurs/Corbeau/Joueur de Flûte (structures présentes; actions partielles), plus transitions Nuit/Jour, Vote,
Capitaine.
• Cas WIP/non implémentés (prompt générique possible): Infect Père des Loups, Renard, Juge Bègue, Loup Blanc, Ange, etc.

Si tu me donnes le style/thème que tu veux tester (ex: “Monokuma”, “Higurashi sombre”, “médiéval réaliste”), je te
fournis des prompts
prêts à coller pour chaque scénario ci‑dessus.
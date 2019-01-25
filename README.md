---
description: >-
  Ce bot discord a pour objectif de conduire des parties de loup garou
  simultanées à travers un nombre infini de serveurs discord.
---

# LGDB - Loup Garou Discord Bot

## Objectifs

L'objectif du bot est de pouvoir animer une session du jeu Loup garou. 

Le bot est capable de gérer tous les rôles existant sur Wikipédia, et et est paramétrable afin de définir les règles de la partie \(nombre de villageois, nombre de loup, etc.\).

Le bot distribue de manière équitable et aléatoire les rôles ; enfin, le bot anime la partie.

## Rappel des règles du jeu de Loup Garou

**Les Loups-Garous de Thiercelieux** est un [jeu de société](https://fr.wikipedia.org/wiki/Jeu_de_soci%C3%A9t%C3%A9) d'ambiance dans lequel chaque joueur incarne un villageois ou un [loup-garou](https://fr.wikipedia.org/wiki/Lycanthrope), et dont le but général est :

* pour les villageois \(dont certains ont des pouvoirs ou des particularités\) : démasquer et tuer tous les loups-garous
* pour les loups-garous : d'éliminer tous les villageois et ne pas se faire démasquer
* pour les amoureux : de finir la partie en couple sans que l'un d'eux ne meure \(auquel cas l'autre se « suicidera » de chagrin\)

## Normes

{% hint style="info" %}
### Programmation Orientée Objet

Pour le développement de ce jeu, une approche orientée objet paraît nécessaire. Le Javascript permet ce paradigme de programmation, c'est donc celui utilisé lors du développement de ce jeu.
{% endhint %}

{% hint style="warning" %}
### ES6

 La norme utilisé est la **norme ES6**, ce qui induit notamment les **arrow function**, les **promises**, et le **async**/**await**. Une bonne connaissance de ces notions est nécessaire au développement de ce jeu. L'**événementiel** et le **parallélisme** sont des éléments clés qui se retrouvent dans le code.
{% endhint %}

{% hint style="info" %}
### Discord.js

[La bibliothèque discord.js](https://discord.js.org) est celle utilisé pour le bot, compatible avec les normes mentionnées précédemment.
{% endhint %}


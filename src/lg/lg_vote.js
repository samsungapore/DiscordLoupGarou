const Sondage = require("../functions/cmds/referendum").SondageInfiniteChoice;
const CommunicationHandler = require("./message_sending.js").CommunicationHandler;
const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType,
    ChannelType
} = require('discord.js');

function isDMChannel(channel) {
    if (!channel) return false;
    if (typeof channel.isDMBased === 'function') {
        try {
            if (channel.isDMBased()) return true;
        } catch (err) {
            // ignore and fallback to type checks
        }
    }

    return channel.type === ChannelType.DM || channel.type === 'DM';
}

async function runDirectSelection({channel, question, ids, names, maxSelectable, time}) {
    if (!channel || ids.length === 0) return [];

    const uniqueCustomId = `vote_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

    const limitedIds = ids.slice(0, 25);
    const limitedNames = names.slice(0, limitedIds.length);
    const cappedMaxSelectable = Math.max(1, Math.min(maxSelectable || limitedIds.length, limitedIds.length));

    const menu = new StringSelectMenuBuilder()
        .setCustomId(uniqueCustomId)
        .setPlaceholder('Choisissez un joueur')
        .setMinValues(1)
        .setMaxValues(cappedMaxSelectable);

    limitedIds.forEach((id, index) => {
        const label = (limitedNames[index] || id).toString().substring(0, 100);
        menu.addOptions({label, value: id});
    });

    const choicesList = limitedNames
        .map((name, index) => `**${index + 1}.** ${name}`)
        .join('\n');

    const message = await channel.send({
        content: `${question}\n${choicesList}`,
        components: [new ActionRowBuilder().addComponents(menu)]
    });

    return await new Promise(resolve => {
        let resolved = false;
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time
        });

        collector.on('collect', async interaction => {
            if (interaction.customId !== uniqueCustomId) return;

            resolved = true;
            try {
                await interaction.deferUpdate();
            } catch (err) {
                // ignore defer errors in tests/mocks
            }

            const selection = interaction.values.slice(0, cappedMaxSelectable);

            try {
                await message.edit({components: []});
            } catch (err) {
                // ignore edit errors
            }

            collector.stop('completed');
            resolve(selection);
        });

        collector.on('end', async () => {
            if (!resolved) {
                try {
                    await message.edit({components: []});
                } catch (err) {
                    // ignore edit errors
                }
                resolve([]);
            }
        });
    });
}

class Vote {

    constructor(question, configuration, time, channel, maxVotes, deleteAll) {

        this.question = question;
        this.configuration = configuration;
        this.time = time;
        this.channel = channel;

        this.maxVotes = maxVotes;

        this.additionnalExceptions = [];

        this.deleteAll = deleteAll === undefined;

        return this;
    }

    excludeDeadPlayers() {

        for (let player of this.configuration._players.values()) {
            if (!player.alive) this.additionnalExceptions.push(player.member.id);
        }

        return this;
    }

    excludeAlivePlayers() {

        for (let player of this.configuration._players.values()) {
            if (player.alive) this.additionnalExceptions.push(player.member.id);
        }

        return this;
    }

    runVote(exceptionArrayOfIds) {
        return new Promise((resolve, reject) => {

            if (!exceptionArrayOfIds) exceptionArrayOfIds = [];

            let playersIdName = this.configuration.getPlayersIdName();
            let ids = [];
            let names = [];

            for (let [id, name] of playersIdName) {
                ids.push(id);
                names.push(name);
            }

            exceptionArrayOfIds = exceptionArrayOfIds.concat(this.additionnalExceptions);
            exceptionArrayOfIds = [...new Set(exceptionArrayOfIds)];

            if (exceptionArrayOfIds && exceptionArrayOfIds.length > 0) {
                exceptionArrayOfIds.forEach(exception => {

                    let index = ids.indexOf(exception);

                    ids.splice(index, 1);
                    names.splice(index, 1);

                });
            }

            // AI shortcut: if configuration has deterministic AI enabled, bypass interactive vote
            try {
                if (this.configuration && this.configuration.ai && this.configuration.ai.enabled) {
                    const aiIds = ids.filter(id => !exceptionArrayOfIds.includes(id));
                    const winners = this.configuration.ai.decideVote({
                        type: this.constructor.name,
                        ids: aiIds,
                        configuration: this.configuration,
                        maxVotes: this.maxVotes
                    });
                    return resolve(Array.isArray(winners) ? winners : (winners ? [winners] : []));
                }
            } catch (e) {
                // fallback to interactive path
            }

            if (isDMChannel(this.channel)) {
                runDirectSelection({
                    channel: this.channel,
                    question: this.question,
                    ids,
                    names,
                    maxSelectable: this.maxVotes,
                    time: this.time
                }).then(resolve).catch(reject);
                return;
            }

            new Sondage(
                this.question, names, this.channel, this.time,
                CommunicationHandler.getLGSampleMsg(),
                true, this.deleteAll, this.maxVotes
            ).post().then((choiceArray) => {

                let result = [];

                choiceArray.forEach(choice => {
                    result.push(ids[choice[0] - 1]);
                });

                resolve(result);

            });
        })
    }

}

class LoupGarouVote extends Vote {

    constructor(question, configuration, time, channel) {
        super(question, configuration, time, channel, configuration.getLG(true).length, false);

    }

}

class EveryoneVote extends Vote {

    constructor(question, configuration, time, channel, maxVotes) {
        super(question, configuration, time, channel, maxVotes);

        return this;
    }

}

class DayVote extends Vote {

    constructor(question, configuration, time, channel) {
        super(question, configuration, time, channel, configuration.getAlivePlayers().length);

    }

}

class VillageoisVote extends Vote {

    constructor(question, configuration, time, channel) {
        super(question, configuration, time, channel, configuration.getVillageois().length);

        return this;
    }

}

module.exports = {Vote, LoupGarouVote, EveryOneVote: EveryoneVote, VillageoisVote, DayVote};

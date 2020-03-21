class ReactionHandler {

    /**
     * Constructor of the reaction handler
     * @param message an existing message in a discord channel
     * @param reactionListInit optional parameter to init a list of reaction to the message
     */
    constructor(message, reactionListInit, obj) {
        this.message = message;
        this.collector = undefined;

        this.obj = obj;

        if (reactionListInit) {
            this.reactionList = reactionListInit;
        } else {
            this.reactionList = [];
        }

        return this;
    }

    /**
     * removes every reactions of the message
     * @returns {Promise<Message>} resolve(Message) if success
     */
    removeAllReactions() {
        return this.message.reactions.removeAll();
    }

    async addReactions(notordered) {

        let promises = [];

        if (!notordered) {

            for (let i = 0; i < this.reactionList.length; i++) {
                await this.message.react(this.reactionList[i]);
            }

        } else {

            this.reactionList.forEach(reaction => {
                promises.push(this.message.react(reaction))
            });

        }

        await Promise.allSettled(promises);

        return this;
    }

    addReaction(reaction) {
        this.reactionList.push(reaction);
        return this.message.react(reaction);
    }

    async addReactionList(reactionList) {
        for (let i = 0; i < reactionList.length; i++) {
            await this.message.react(reactionList[i]);
        }
    }

    removeReaction(reaction) {
        this.reactionList.splice(this.reactionList.indexOf(reaction), 1);

        let reactionArray = this.message.reactions.cache.array();
        for (let i = 0; i < reactionArray.length; i++) {
            if (reactionArray[i].emoji.name === reaction) {
                return reactionArray[i].remove();
            }
        }
        return new Promise((resolve, reject) => resolve(this));
    }

    async removeReactionList(reactionList) {

        let reaction;

        for (let i = 0; i < reactionList.length; i++) {

            reaction = reactionList[i];

            this.reactionList.splice(this.reactionList.indexOf(reaction), 1);

            let reactionArray = this.message.reactions.cache.array();
            for (let i = 0; i < reactionArray.length; i++) {
                if (reactionArray[i].emoji.name === reaction) {
                    await reactionArray[i].remove();
                }
            }

        }

        return this;

    }

    /**
     *
     * @param func on collect function
     * @param endFunc on end function
     * @param filter filter of the collector
     * @param options
     */
    initCollector(func, endFunc, filter, options) {
        if (!filter) {
            filter = () => {
                return true;
            };
        }
        if (!endFunc) {
            endFunc = () => {
                return true;
            }
        }
        if (options) {
            this.collector = this.message.createReactionCollector(filter, options);
        } else {
            this.collector = this.message.createReactionCollector(filter);
        }

        this.collector.on('collect', func);

        this.collector.on('end', endFunc);

        return this;
    }

    stop() {
        this.collector.stop();
        return this;
    }

}

module.exports = {ReactionHandler};

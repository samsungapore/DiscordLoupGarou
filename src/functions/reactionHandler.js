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
    }

    /**
     * removes every reactions of the message
     * @returns {Promise<bool>} resolve(true) if success, reject(err_message) if failure
     */
    removeAllReactions() {
        return new Promise((resolve, reject) => {
            if (!this.message) {
                reject("Message is undefined or null");
            }
            let reactionPromises = [];
            this.message.reactions.array().forEach(react => {
                reactionPromises.push(react.remove());
            });

            Promise.all(reactionPromises).then(() => {
                resolve(true);
            }).catch(err => reject(err));
        });
    }

    /**
     *
     * @param notordered if set to true, adds the reactions without order
     * @returns {Promise<bool>} resolve(true) if success, reject(err_message) if failure
     */
    addReactions(notordered) {
        return new Promise((resolve, reject) => {

            let promises = [];

            if (!notordered) {

                let addAll = async () => {
                    for (let i = 0; i < this.reactionList.length; i++) {
                        await this.message.react(this.reactionList[i]);
                    }
                };
                promises.push(addAll());

            } else {

                this.reactionList.forEach(reaction => {
                    promises.push(this.message.react(reaction))
                });

            }
            Promise.all(promises).then(() => resolve(this)).catch(err => reject(err));
        });
    }

    addReaction(reaction) {
        this.reactionList.push(reaction);
        return this.message.react(reaction);
    }

    async addReactionList(reactionList) {
        for (let i = 0 ; i < reactionList.length ; i++) {
            await this.message.react(reactionList[i]);
        }
    }

    removeReaction(reaction) {
        this.reactionList.splice(this.reactionList.indexOf(reaction), 1);

        let reactionArray = this.message.reactions.array();
        for (let i = 0 ; i < reactionArray.length ; i++) {
            if (reactionArray[i].emoji.name === reaction) {
                return reactionArray[i].remove();
            }
        }
        return new Promise((resolve, reject) => resolve(true));
    }

    async removeReactionList(reactionList) {

        let reaction;

        for (let i = 0 ; i < reactionList.length ; i++) {

            reaction = reactionList[i];

            this.reactionList.splice(this.reactionList.indexOf(reaction), 1);

            let reactionArray = this.message.reactions.array();
            for (let i = 0 ; i < reactionArray.length ; i++) {
                if (reactionArray[i].emoji.name === reaction) {
                    await reactionArray[i].remove();
                }
            }

        }

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
    }

    stop() {
        this.collector.stop();
    }

}

module.exports = {ReactionHandler};

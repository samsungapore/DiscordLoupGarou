const {mulberry32, decideVoteDefault, decideVoleurPolicy, decideSorcierePolicy} = require('./policy');

class AIController {
    constructor({seed = 42, fast = false} = {}) {
        this.rng = mulberry32(seed >>> 0);
        this.enabled = true;
        this.fast = !!fast;
    }

    decideVote({type, ids, configuration, maxVotes}) {
        // For now, always return a single choice deterministically
        return decideVoteDefault({rng: this.rng, ids});
    }

    decideVoleur({additionalRoles}) {
        return decideVoleurPolicy({rng: this.rng, additionalRoles});
    }

    decideSorciere({lgTargetId, selfId}) {
        return decideSorcierePolicy({rng: this.rng, lgTargetId, selfId});
    }
}

module.exports = AIController;

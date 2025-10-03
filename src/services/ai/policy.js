const {mulberry32} = require('./deterministicRng');

function pickIndex(rng, arrLength) {
    if (!arrLength || arrLength <= 0) return 0;
    return Math.floor(rng() * arrLength) % arrLength;
}

function chooseOne(rng, ids) {
    if (!ids || ids.length === 0) return [];
    if (ids.length === 1) return [ids[0]];
    const idx = pickIndex(rng, ids.length);
    return [ids[idx]];
}

function decideVoteDefault({rng, ids}) {
    // Default policy: pick one deterministically
    return chooseOne(rng, ids);
}

function decideVoleurPolicy({rng, additionalRoles}) {
    // Keep role unless both are LoupGarou -> take first
    if (!Array.isArray(additionalRoles) || additionalRoles.length < 2) return {keep: true};
    const bothLG = additionalRoles[0] === 'LoupGarou' && additionalRoles[1] === 'LoupGarou';
    if (bothLG) return {keep: false, role: additionalRoles[0]};
    return {keep: true};
}

function decideSorcierePolicy({rng, lgTargetId, selfId}) {
    // Save self if targeted, otherwise do nothing
    const save = lgTargetId && selfId && lgTargetId === selfId;
    return {save, poisonTarget: null};
}

module.exports = {
    mulberry32,
    pickIndex,
    chooseOne,
    decideVoteDefault,
    decideVoleurPolicy,
    decideSorcierePolicy,
};

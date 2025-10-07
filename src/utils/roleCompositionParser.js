function parseRoleComposition(spec) {
    if (typeof spec !== 'string' || spec.trim() === '') {
        throw new Error('Invalid role composition specification');
    }

    const tokens = spec
        .split(/[;,]/)
        .map(token => token.trim())
        .filter(Boolean);

    if (tokens.length === 0) {
        throw new Error('Invalid role composition specification');
    }

    const composition = {};

    for (const token of tokens) {
        const [roleName, countString] = token.split(':').map(part => part && part.trim());

        if (!roleName || !countString) {
            throw new Error('Invalid role composition specification');
        }

        const count = Number.parseInt(countString, 10);

        if (!Number.isInteger(count) || count <= 0) {
            throw new Error('Invalid role composition specification');
        }

        composition[roleName] = (composition[roleName] || 0) + count;
    }

    if (Object.keys(composition).length === 0) {
        throw new Error('Invalid role composition specification');
    }

    return composition;
}

module.exports = {
    parseRoleComposition,
};

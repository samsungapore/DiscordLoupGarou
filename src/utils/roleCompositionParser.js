const ROLE_COMPOSITION_USAGE = "Format: Rôle:Nombre séparés par des virgules (ex. Villageois:6,LoupGarou:2)";

function compositionError() {
    return new Error(`Composition de rôles invalide. ${ROLE_COMPOSITION_USAGE}`);
}

function parseRoleComposition(spec) {
    if (typeof spec !== 'string' || spec.trim() === '') {
        throw compositionError();
    }

    const tokens = spec
        .split(/[;,]/)
        .map(token => token.trim())
        .filter(Boolean);

    if (tokens.length === 0) {
        throw compositionError();
    }

    const composition = {};

    for (const token of tokens) {
        const [roleName, countString] = token.split(':').map(part => part && part.trim());

        if (!roleName || !countString) {
            throw compositionError();
        }

        const count = Number.parseInt(countString, 10);

        if (!Number.isInteger(count) || count <= 0) {
            throw compositionError();
        }

        composition[roleName] = (composition[roleName] || 0) + count;
    }

    if (Object.keys(composition).length === 0) {
        throw compositionError();
    }

    return composition;
}

module.exports = {
    parseRoleComposition,
    ROLE_COMPOSITION_USAGE,
};

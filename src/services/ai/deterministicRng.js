// Simple deterministic PRNG (Mulberry32)
// Seed with a 32-bit integer; returns a function producing [0,1)

function toUInt32(n) {
    return (n >>> 0);
}

function mulberry32(seed) {
    let t = toUInt32(seed || 0xDEADBEEF);
    return function () {
        t = toUInt32(t + 0x6D2B79F5);
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

module.exports = {mulberry32};

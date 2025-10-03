class VirtualDMChannel {
    constructor(member) {
        this.member = member;
    }

    async send() {
        return true;
    }
}

class VirtualMember {
    constructor({id, displayName}) {
        this.id = id;
        this.displayName = displayName || `Bot ${id}`;
        this.isVirtual = true;
        this.user = {
            id: this.id,
            avatarURL: () => undefined,
        };
        this.displayColor = 0x3498db;
        this.roles = {
            add: async () => this,
            remove: async () => this,
        };
    }

    async createDM() {
        return new VirtualDMChannel(this);
    }

    async send() {
        return true;
    }
}

module.exports = {VirtualMember};

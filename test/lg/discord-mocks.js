// Discord.js Mocking Infrastructure for LG Module Testing
// Following TDD: Provide minimal mocks needed for testing

// Mock collection class that behaves like Discord.js Collection
class MockCollection {
    constructor() {
        this.data = new Map();
    }

    get(key) {
        return this.data.get(key);
    }

    set(key, value) {
        this.data.set(key, value);
        return this;
    }

    has(key) {
        return this.data.has(key);
    }

    clear() {
        this.data.clear();
    }

    forEach(fn) {
        this.data.forEach(fn);
    }

    get size() {
        return this.data.size;
    }
}

// Mock Guild class
class MockGuild {
    constructor(id = 'test-guild') {
        this.id = id;
        this.name = 'Test Guild';
        this.channels = new MockCollection();
        this.members = new MockCollection();
        this.roles = new MockCollection();
    }
}

// Mock Role class
class MockRole {
    constructor(id = 'test-role', name = 'Test Role') {
        this.id = id;
        this.name = name;
        this.color = 16711680; // Red
        this.object = null;
    }
}

// Mock Channel class
class MockChannel {
    constructor(id = 'test-channel', type = 'text') {
        this.id = id;
        this.name = 'test-channel';
        this.type = type;
        this.messages = new MockCollection();
    }

    async send(content) {
        const mockMessage = new MockMessage(content, this);
        this.messages.set(Date.now().toString(), mockMessage);
        return mockMessage;
    }

    sendEmbed(embed) {
        return this.send({embeds: [embed]});
    }
}

// Mock Member class
class MockMember {
    constructor(id = 'test-member', displayName = 'Test User') {
        this.id = id;
        this.displayName = displayName;
        this.user = {id};
        this.roles = new MockCollection();
    }
}

// Mock Message class
class MockMessage {
    constructor(content, channel, member = null) {
        this.content = content;
        this.channel = channel;
        this.member = member;
        this.author = member || new MockMember();
        this.createdAt = new Date();
        this.edits = [];
        this.reactions = new MockCollection();
    }

    async edit(content) {
        this.edits.push(content);
        return this;
    }

    async delete() {
        return true;
    }
}

// Mock Client class (Discord.js Client)
class MockClient {
    constructor() {
        this.user = {id: 'bot-user-id', username: 'TestBot'};
        this.guilds = new MockCollection();
        this.channels = new MockCollection();
        this.emojis = new MockCollection();
        this.guilds_settings = new MockCollection();
        this.readyAt = new Date();
    }

    async login() {
        return 'mock-token';
    }
}

// MessageEmbed mock (simplified)
class MockMessageEmbed {
    constructor() {
        this.title = null;
        this.description = null;
        this.color = null;
        this.author = null;
        this.fields = [];
        this.footer = null;
        this.thumbnail = null;
        this.url = null;
    }

    setTitle(title) {
        this.title = title;
        return this;
    }

    setDescription(description) {
        this.description = description;
        return this;
    }

    setColor(color) {
        this.color = color;
        return this;
    }

    setAuthor(author, iconURL) {
        this.author = {name: author, iconURL};
        return this;
    }

    setThumbnail(url) {
        this.thumbnail = url;
        return this;
    }

    setFooter(text) {
        this.footer = text;
        return this;
    }

    addField(name, value, inline = false) {
        this.fields.push({name, value, inline});
        return this;
    }

    setURL(url) {
        this.url = url;
        return this;
    }

    build() {
        // Return a simplified build for testing
        return {
            ...this,
            toJSON: () => this
        };
    }
}

// Mock BotData
const MockBotData = {
    BotValues: {
        botColor: 7419530
    }
};

// Mock utils/message simulate channel.send behavior
const mockSendEmbed = async (channel, embed) => {
    return await channel.send({
        embeds: [embed]
    });
};

const mockUtilsMessage = {
    sendEmbed: mockSendEmbed
};

module.exports = {
    MockClient,
    MockGuild,
    MockChannel,
    MockMember,
    MockMessage,
    MockRole,
    MockCollection,
    MockMessageEmbed,
    MockBotData,
    mockUtilsMessage
};

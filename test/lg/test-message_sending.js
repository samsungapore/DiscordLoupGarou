// TDD: Test message_sending.js - Communication Handler and messaging utilities
// Following TDD approach: Write failing test first, then implement bare minimum to pass

// Mock external dependencies before requiring the module
jest.mock('../../src/lg/lg_var.js', () => ({
    roles_img: {
        LoupGarou: 'https://example.com/werewolf.png'
    }
}));

jest.mock('../../src/BotData.js', () => ({
    BotValues: {
        botColor: 7419530
    }
}));

jest.mock('../../src/utils/embed', () => require('../lg/discord-mocks').MockMessageEmbed);
jest.mock('../../src/utils/message', () => ({
    sendEmbed: async (channel, embed) => await channel.send({embeds: [embed]})
}));

const {CommunicationHandler, message_curr_chan, message_to_village, msg} = require('../../src/lg/message_sending');
const {MockClient, MockChannel, MockMember, MockMessage} = require('./discord-mocks');

describe('CommunicationHandler', () => {
    test('should instantiate with client', () => {
        // TDD: Define expected behavior - constructor should accept client
        const client = new MockClient();
        const handler = new CommunicationHandler(client);

        expect(handler.client).toBe(client);
        expect(typeof handler).toBe('object');
    });

    test('should construct message with serialized embed', () => {
        // TDD: Red - define expected behavior
        const client = new MockClient();
        const handler = new CommunicationHandler(client);

        // Test the static getLGSampleMsg method returns a properly configured embed
        const embed = CommunicationHandler.getLGSampleMsg();

        expect(embed.build).toBeDefined();
        expect(embed.fields).toBeDefined();
        expect(embed.color).toBe(7419530); // BotData.BotValues.botColor
        expect(embed.author.name).toBe('Loup-Garou de Thiercelieux');
    });

    test('should reconstruct embed with all fields', () => {
        // TDD: Red - define expected behavior
        const originalEmbed = {
            author: {name: 'Test', iconURL: 'icon.png'},
            color: 12345,
            description: 'Test desc',
            footer: {text: 'Footer'},
            image: {url: 'image.png'},
            thumbnail: 'thumb.png',
            title: 'Test Title',
            url: 'http://example.com',
            fields: [
                {name: 'Field1', value: 'Value1', inline: true},
                {name: '\u200B', value: '\u200B', inline: false}, // Should be filtered out
                {name: 'Field2', value: 'Value2', inline: false}
            ]
        };

        const reconstructed = CommunicationHandler.reconstructEmbed(originalEmbed);

        expect(reconstructed.title).toBe('Test Title');
        expect(reconstructed.color).toBe(12345);
        expect(reconstructed.description).toBe('Test desc');
        expect(reconstructed.url).toBe('http://example.com');
        expect(reconstructed.footer).toBeDefined();
        expect(reconstructed.fields.length).toBe(2); // Should filter out empty fields
        expect(reconstructed.fields[0].name).toBe('Field1');
        expect(reconstructed.fields[1].name).toBe('Field2');
    });
});

describe('Message Functions', () => {
    let client, message, channel, member;

    beforeEach(() => {
        client = new MockClient();
        member = new MockMember();
        message = new MockMessage('test message', null, member);
        channel = new MockChannel();
        message.channel = channel;
        message.guild = {id: 'test-guild'};
    });

    test('message_curr_chan should send embed to current channel', async () => {
        // TDD: Red - define expected behavior
        const title = 'Test Title';
        const content = 'Test Content';

        const result = await message_curr_chan(message, title, content);

        expect(result).toBeDefined();
        expect(channel.messages.size).toBe(1);

        // Check the message was sent with proper embed
        const sentMessage = Array.from(channel.messages.values())[0];
        expect(sentMessage.content.embeds).toBeDefined();
        expect(sentMessage.content.embeds[0].fields[0].name).toBe(title);
        expect(sentMessage.content.embeds[0].fields[0].value).toBe(content);
        expect(sentMessage.content.embeds[0].color).toBe(7419530);
    });

    test('message_to_village should send embed to village channel', async () => {
        // TDD: Red - define expected behavior - need to mock LG and its channels
        const msgContent = 'Village Message';

        // Mock the LG object and its channels
        const mockLG = {
            lg_game_channels: {
                village_lg: new MockChannel('village-channel')
            }
        };
        client.LG = new Map([['test-guild', mockLG]]);
        client.guilds_settings = new Map();

        const result = await message_to_village(client, message, msgContent);

        expect(result).toBeDefined();

        // Check it was sent to village channel
        const villageChannel = mockLG.lg_game_channels.village_lg;
        expect(villageChannel.messages.size).toBe(1);

        const sentMessage = Array.from(villageChannel.messages.values())[0];
        expect(sentMessage.content.embeds[0].fields[0].name).toBe('LG - Jeu');
        expect(sentMessage.content.embeds[0].fields[0].value).toBe(msgContent);
    });

    test('msg function should send message to specified channel', async () => {
        // TDD: Red - define expected behavior
        const targetChannel = new MockChannel('target-channel');
        const title = 'Custom Title';
        const msgContent = 'Custom Message';

        const result = await msg(message, targetChannel, title, msgContent);

        expect(result).toBeDefined();
        expect(targetChannel.messages.size).toBe(1);

        const sentMessage = Array.from(targetChannel.messages.values())[0];
        expect(sentMessage.content.embeds[0].fields[0].name).toBe(title);
        expect(sentMessage.content.embeds[0].fields[0].value).toBe(msgContent);
        expect(sentMessage.content.embeds[0].color).toBe(7419530);
    });
});

const assert = require('assert');
const MessageEmbed = require('../../src/utils/embed');
const { CommunicationHandler } = require('../../src/lg/message_sending');

describe('CommunicationHandler', function () {
  it('reconstructEmbed clones embed properties', function () {
    const embed = new MessageEmbed()
      .setTitle('Title')
      .setDescription('Desc')
      .addField('Field', 'Value');
    const built = embed.build().data;
    built.fields = embed.build().data.fields;
    const rebuilt = CommunicationHandler.reconstructEmbed(built);
    const actual = rebuilt.build().data;
    assert.strictEqual(actual.title, built.title);
    assert.strictEqual(actual.description, built.description);
    assert.deepStrictEqual(actual.fields, built.fields);
  });
});

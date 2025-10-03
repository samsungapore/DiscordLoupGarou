const assert = require('assert');
const MessageEmbed = require('../../src/utils/embed');
const COLORS = require("../../src/utils/colors");

describe('MessageEmbed', function () {
  it('adds fields and retrieves value', function () {
    const embed = new MessageEmbed();
    embed.addField('Name', 'Value');
    assert.strictEqual(embed.getFieldValue(0), 'Value');
    embed.setFieldValue(0, 'New');
    assert.strictEqual(embed.getFieldValue(0), 'New');
  });

  it('addField uses default when missing', function () {
    const embed = new MessageEmbed();
    embed.addField();
    const built = embed.build();
    assert.strictEqual(built.data.fields[0].name, '#0');
    assert.strictEqual(built.data.fields[0].value, 'Empty field.');
  });
  it('setColor uses constant and updates participation field', function () {
    const embed = new MessageEmbed();
    embed.addField('players', 'none');
    embed.setColor(COLORS.DEFAULT);
    embed.updateParticipationField('two');
    const built = embed.build();
    assert.strictEqual(built.data.color, 0);
    assert.strictEqual(built.data.fields[0].value, 'two');
  });

  it('chains setter methods', function () {
    const embed = new MessageEmbed()
      .setTitle('T')
      .setDescription('D')
      .setColor(COLORS.DEFAULT)
      .setURL('http://x')
      .setImage('http://img')
      .setThumbnail('https://example.com/thumb.png')
      .setFooter('f');
    const built = embed.build();
    assert.strictEqual(built.data.title, 'T');
    assert.strictEqual(built.data.url, 'http://x');
    assert.strictEqual(built.data.footer.text, 'f');
  });
});

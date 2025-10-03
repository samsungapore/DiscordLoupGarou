const sinon = require('sinon');
const permission = require('../../src/utils/permission');
const messageUtil = require('../../src/utils/message');
const embedPath = require.resolve('../../src/utils/embed');

function loadCommand() {
  delete require.cache[require.resolve('../../src/commands/stop')];
  return require('../../src/commands/stop');
}

describe('stop command', function () {
  let originalCheck, originalSend, OriginalEmbed;
  beforeEach(function () {
    originalCheck = permission.checkPermissions;
    originalSend = messageUtil.sendEmbed;
    OriginalEmbed = require(embedPath);
    class FakeEmbed {
      constructor(){ this.embed={data:{fields:[]}}; }
      setDescription(){ return this; }
      setColor(){ return this; }
      addField(){ return this; }
      build(){ return this; }
    }
    require.cache[embedPath].exports = FakeEmbed;
  });
  afterEach(function () {
    permission.checkPermissions = originalCheck;
    messageUtil.sendEmbed = originalSend;
    require.cache[embedPath].exports = OriginalEmbed;
    delete require.cache[require.resolve('../../src/commands/stop')];
  });

  it('informs when no game running', function () {
    permission.checkPermissions = () => true;
    const sendStub = sinon.stub().resolves();
    messageUtil.sendEmbed = sendStub;
    const LGBot = { LG: new Map() };
    const message = { guild: { id: 'g1' }, channel: {}, member: {}, author: {} };
    const cmd = loadCommand();
    cmd.execute(LGBot, message);
    sinon.assert.calledOnce(sendStub);
  });

  it('denies when user lacks permission', function () {
    permission.checkPermissions = () => false;
    const sendStub = sinon.stub().resolves();
    messageUtil.sendEmbed = sendStub;
    const LG = { running: true, canRun: [], game: null };
    const LGBot = { LG: new Map([['g1', LG]]) };
    const message = { guild: { id: 'g1' }, channel: {}, member: {}, author: { id: 'x' } };
    const cmd = loadCommand();
    cmd.execute(LGBot, message);
    sinon.assert.calledOnce(sendStub);
  });
});

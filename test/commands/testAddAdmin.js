const sinon = require('sinon');
const assert = require('assert');
const permission = require('../../src/utils/permission');

// Helper to load command with stubs
function loadCommand() {
  delete require.cache[require.resolve('../../src/commands/addAdmin')];
  return require('../../src/commands/addAdmin');
}

describe('addAdmin command', function () {
  let originalCheck;
  beforeEach(function () {
    originalCheck = permission.checkPermissions;
  });
  afterEach(function () {
    permission.checkPermissions = originalCheck;
    delete require.cache[require.resolve('../../src/commands/addAdmin')];
  });

  it('adds admins when permitted', function () {
    permission.checkPermissions = () => true;
    const LGBot = { Settings: new Map() };
    const message = {
      member: {},
      guild: { id: '1' },
      mentions: { members: { array: () => [{ id: 'a' }, { id: 'b' }] } },
      reply: sinon.stub()
    };
    const cmd = loadCommand();
    cmd.execute(LGBot, message);
    const settings = LGBot.Settings.get('1');
    assert.deepStrictEqual(settings.Admins, [['a', 'b']]);
    sinon.assert.notCalled(message.reply);
  });

  it('replies when not permitted', function () {
    permission.checkPermissions = () => false;
    const LGBot = { Settings: new Map() };
    const message = {
      member: {},
      guild: { id: '1' },
      mentions: { members: { array: () => [] } },
      reply: sinon.stub()
    };
    const cmd = loadCommand();
    cmd.execute(LGBot, message);
    sinon.assert.calledWith(message.reply, "Tu n'as pas la permission");
  });
});

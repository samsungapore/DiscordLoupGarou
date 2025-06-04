const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

describe('env util', function () {
  const cwd = process.cwd();
  let tmp;
  beforeEach(function () {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'envtest-'));
    process.chdir(tmp);
    delete process.env.LOG_PATH;
    delete require.cache[require.resolve('../../src/utils/env')];
  });
  afterEach(function () {
    process.chdir(cwd);
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  it('creates default .env file and sets LOG_PATH', function () {
    require('../../src/utils/env');
    assert.ok(fs.existsSync(path.join(tmp, '.env')));
    assert.strictEqual(process.env.LOG_PATH, './logs');
  });
});

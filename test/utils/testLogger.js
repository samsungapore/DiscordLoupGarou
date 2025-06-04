const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

describe('logger util', function () {
  const cwd = process.cwd();
  let tmp;
  beforeEach(function () {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'logtest-'));
    process.chdir(tmp);
    delete process.env.LOG_PATH;
    delete require.cache[require.resolve('../../src/utils/logger')];
    delete require.cache[require.resolve('../../src/utils/env')];
  });
  afterEach(function () {
    process.chdir(cwd);
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  it('creates log directory on require', function () {
    require('../../src/utils/logger');
    assert.ok(fs.existsSync(path.join(tmp, 'logs')));
  });
});

const assert = require('assert');
const path = require('path');

const { loadSlashCommands, registerSlashCommands } = require(path.resolve(__dirname, '../../src/slashCommands/index.js'));

describe('slashCommands/index loader and registrar', () => {
  it('loadSlashCommands populates client.slashCommands with command definitions', () => {
    const client = {};
    loadSlashCommands(client);
    assert(client.slashCommands, 'slashCommands collection should be set');
    // should include admin-broadcast command
    const cmd = client.slashCommands.get('admin-broadcast');
    assert(cmd, 'admin-broadcast should be loaded');
    assert.strictEqual(typeof cmd.execute, 'function');
  });

  it('registerSlashCommands creates missing global commands', async () => {
    const created = [];
    const client = {
      slashCommands: new Map([
        ['admin-broadcast', { name: 'admin-broadcast', description: 'x', options: [], dm_permission: false }]
      ]),
      application: {
        commands: {
          async fetch() {
            // return empty, so registrar will create
            return new Map();
          },
          async create(payload) {
            created.push(payload);
          }
        }
      }
    };

    await registerSlashCommands(client);
    assert.strictEqual(created.length, 1);
    assert.strictEqual(created[0].name, 'admin-broadcast');
  });

  it('registerSlashCommands is idempotent when command already exists', async () => {
    const created = [];
    const client = {
      slashCommands: new Map([
        ['admin-broadcast', { name: 'admin-broadcast', description: 'x', options: [], dm_permission: false }]
      ]),
      application: {
        commands: {
          async fetch() {
            return new Map([
              ['1', { name: 'admin-broadcast' }]
            ]);
          },
          async create(payload) {
            created.push(payload);
          }
        }
      }
    };

    await registerSlashCommands(client);
    assert.strictEqual(created.length, 0, 'no creation when already exists');
  });

  it('registerSlashCommands no-ops when client.application is missing', async () => {
    const client = { slashCommands: new Map() };
    await registerSlashCommands(client);
  });

  it('registerSlashCommands handles missing slashCommands (empty fallback)', async () => {
    const created = [];
    const client = {
      application: {
        commands: {
          async fetch() { return new Map(); },
          async create(payload) { created.push(payload); }
        }
      }
    };
    await registerSlashCommands(client);
    assert.strictEqual(created.length, 0);
  });

  it('registerSlashCommands defaults options to [] when undefined', async () => {
    const created = [];
    const client = {
      slashCommands: new Map([
        ['custom', { name: 'custom', description: 'x', dm_permission: false }]
      ]),
      application: {
        commands: {
          async fetch() { return new Map(); },
          async create(payload) { created.push(payload); }
        }
      }
    };
    await registerSlashCommands(client);
    assert.strictEqual(created.length, 1);
    assert.deepStrictEqual(created[0].options, []);
  });
});

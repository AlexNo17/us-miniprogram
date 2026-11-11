const assert = require('assert')
const store = require('../utils/store')
const sync = require('../utils/cloud-sync')
const source = { plans: [{ id: 1, title: 'existing' }, { id: 2, title: 'new' }], moments: [{ id: 3, title: 'offline' }], about: [] }
store.get = name => source[name]
const cloud = { plan: [{ id: 1 }], moment: [], about: [] }
sync.list = async type => cloud[type].slice()
sync.saveWithImages = async (type, item) => { if (item.id === 3) throw new Error('offline'); const saved = { ...item, _cloudId: 'saved' }; cloud[type].push(saved); return saved }
const migration = require('../utils/migrate-local')
async function run() {
  assert.deepStrictEqual(await migration.migrate(), { copied: 1, skipped: 1, failed: 1 })
  assert.strictEqual(source.plans.length, 2)
  assert.strictEqual(source.plans[1]._cloudId, undefined)
  assert.deepStrictEqual(await migration.migrate(), { copied: 0, skipped: 2, failed: 1 })
  console.log('旧记录复制、重试和本地保留通过')
}
run().catch(error => { console.error(error); process.exitCode = 1 })

const assert = require('assert')
const { createHandler } = require('../cloudfunctions/space/service')
let calls = 0
const db = { collection: () => ({
  add: async () => { calls++ },
  where: query => ({
    update: async () => { calls++; return { stats: { updated: query.version === 1 ? 1 : 0 } } },
    remove: async () => { calls++; return { stats: { removed: query.version === 1 ? 1 : 0 } } }
  })
}) }
async function run() {
  let user = 'outsider'
  const handle = createHandler(db, () => user, { MEMBER_A_OPENID: 'alice', MEMBER_B_OPENID: 'bob' })
  assert.deepStrictEqual(await handle({ action: 'identity' }), { ok: true, openid: 'outsider' })
  assert.strictEqual((await handle({ action: 'create', type: 'moment', data: { title: 'private' } })).error, 'FORBIDDEN')
  assert.strictEqual(calls, 0)
  user = 'alice'
  assert.strictEqual((await handle({ action: 'create', type: 'moment', data: { image: 'cloud://private' } })).error, 'INVALID_DATA')
  const created = await handle({ action: 'create', type: 'moment', data: { title: 'hi' } })
  assert.strictEqual(created.record.version, 1)
  assert.strictEqual((await handle({ action: 'update', type: 'moment', id: created.record._id, version: 2, data: { title: 'stale' } })).error, 'CONFLICT_OR_NOT_FOUND')
  assert.strictEqual((await handle({ action: 'update', type: 'moment', id: created.record._id, version: 1, data: { title: 'new' } })).ok, true)
  const unconfigured = createHandler(db, () => 'alice', { MEMBER_A_OPENID: 'alice' })
  assert.strictEqual((await unconfigured({ action: 'list', type: 'moment' })).error, 'FORBIDDEN')
  console.log('云函数身份权限、数据限制和冲突处理通过')
}
run().catch(err => { console.error(err); process.exitCode = 1 })

const assert = require('assert')
const cloud = require('../utils/cloud')
const api = require('../utils/cloud-records')
const sync = require('../utils/cloud-sync')
const calls = []
cloud.call = async (action, input) => {
  calls.push({ action, input })
  if (action === 'list') return { records: input.skip ? [] : [{ _id: 'abc', version: 2, data: { id: 1, title: 'hi' } }] }
  if (action === 'create') return { record: { _id: 'new', version: 1 } }
  if (action === 'update' && input.version !== 2) { const err = new Error('conflict'); err.code = 'CONFLICT_OR_NOT_FOUND'; throw err }
  return { ok: true }
}
async function run() {
  const [item] = await api.list('plan')
  assert.strictEqual(item._cloudVersion, 2)
  const saved = await api.save('plan', item)
  assert.strictEqual(saved._cloudVersion, 3)
  assert.strictEqual(calls[1].input.data._cloudId, undefined)
  await assert.rejects(api.save('plan', saved), { code: 'CONFLICT_OR_NOT_FOUND' })
  await assert.rejects(api.remove('plan', { id: 5 }), /尚未保存/)
  assert.strictEqual((await api.save('plan', { id: 2, title: 'new' }))._cloudId, 'new')
  await assert.rejects(sync.saveText('moment', { images: ['/local/image'] }), /图片云端同步尚未开放/)
  assert.match(sync.formatError({ code: 'FORBIDDEN' }), /没有访问权限/)
  console.log('云端记录分页、版本和失败处理通过')
}
run().catch(err => { console.error(err); process.exitCode = 1 })

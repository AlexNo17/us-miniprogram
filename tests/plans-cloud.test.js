const assert = require('assert')
const cloud = require('../utils/cloud')
const saved = []
let fail = false
cloud.call = async (action, input) => {
  if (fail) throw Object.assign(new Error('offline'), { code: 'NETWORK' })
  if (action === 'list') return { records: saved }
  if (action === 'create') { const record = { _id: 'cloud-id', version: 1, data: input.data }; saved.push(record); return { record } }
  if (action === 'update') { saved[0] = { ...saved[0], data: input.data, version: input.version + 1 }; return { ok: true } }
  if (action === 'delete') { saved.length = 0; return { ok: true } }
}
const local = {}
global.wx = { getStorageSync: key => local[key] || '', setStorageSync: (key, value) => { local[key] = value }, removeStorageSync: key => delete local[key], showToast: () => {}, showModal: () => {}, switchTab: () => {} }
let page
global.Page = value => { page = value }
require('../pages/plans/index')
page.setData = function (patch, callback) { Object.assign(this.data, patch); if (callback) callback() }
async function run() {
  local.love_plans = [{ id: 7, title: '旧本地计划' }]
  await page.onShow()
  assert.strictEqual(page.data.cloudReady, true)
  assert.strictEqual(local.love_plans[0].title, '旧本地计划')
  page.setData({ form: { title: '新计划', category: '其他', content: '', date: '' }, showForm: true })
  fail = true
  await page.save()
  assert.strictEqual(page.data.showForm, true)
  assert.strictEqual(saved.length, 0)
  fail = false
  await page.save()
  assert.strictEqual(page.data.showForm, false)
  assert.strictEqual(saved[0].data.title, '新计划')
  await page.toggle({ currentTarget: { dataset: { id: page.data.plans[0].id } } })
  assert.strictEqual(saved[0].data.done, true)
  assert.strictEqual(local.love_plans[0].title, '旧本地计划')
  console.log('云端计划保存失败保留输入与本地数据通过')
}
run().catch(err => { console.error(err); process.exitCode = 1 })

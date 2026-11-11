const assert = require('assert')
const cloud = require('../utils/cloud')
const local = { love_profile: { me: '旧昵称', partner: '旧称呼', startDate: '2026-10-18' } }
let offline = false
const remote = []
cloud.call = async (action, input) => {
  if (offline) throw new Error('offline')
  if (action === 'list') return { records: remote.filter(item => item.type === input.type) }
  if (action === 'create') { const record = { _id: 'abc', version: 1, type: input.type, data: input.data }; remote.push(record); return { record } }
  throw new Error('unexpected action')
}
global.wx = { getStorageSync: key => local[key] || '', setStorageSync: (key, value) => { local[key] = value }, showToast: () => {}, showModal: () => {} }
let page
global.Page = instance => { page = instance }
require('../pages/us/index')
page.setData = function (values) { Object.assign(this.data, values) }
async function run() {
  await page.onShow()
  assert.strictEqual(page.data.cloudReady, true)
  assert.strictEqual(local.love_profile.me, '旧昵称')
  page.setData({ draft: { me: '新昵称', partner: '你', startDate: '2026-10-18', partnerZodiac: '天秤座', partnerMbti: 'INFP', partnerRising: '狮子座', partnerMemo: '喜欢小狗\n不吃香菜' }, editing: true })
  offline = true
  await page.save()
  assert.strictEqual(page.data.editing, true)
  assert.strictEqual(remote.length, 0)
  offline = false
  await page.save()
  assert.strictEqual(page.data.editing, false)
  assert.strictEqual(remote[0].data.me, '新昵称')
  assert.strictEqual(remote[0].data.partnerZodiac, '天秤座')
  assert.strictEqual(remote[0].data.partnerMbti, 'INFP')
  assert.strictEqual(remote[0].data.partnerRising, '狮子座')
  assert.strictEqual(remote[0].data.partnerMemo, '喜欢小狗\n不吃香菜')
  assert.strictEqual(local.love_profile.me, '旧昵称')
  console.log('云端资料保存失败保留输入及本地资料通过')
}
run().catch(error => { console.error(error); process.exitCode = 1 })

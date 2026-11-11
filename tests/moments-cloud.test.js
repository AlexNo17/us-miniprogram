const assert = require('assert')
const cloud = require('../utils/cloud')
let fail = false
const records = []
cloud.call = async (action, input) => {
  if (fail) throw new Error('offline')
  if (action === 'list') return { records }
  if (action === 'create') { const record = { _id: 'c1', version: 1, data: input.data }; records.push(record); return { record } }
  return { ok: true }
}
const local = { love_moments: [{ id: 8, title: '原记录' }] }
global.wx = { cloud: { uploadFile: async () => ({ fileID: 'cloud://cloud1-d0gnr8ygh74fddee2.bucket/private/test.jpg' }) }, getStorageSync: key => local[key] || '', setStorageSync: (key, value) => { local[key] = value }, removeStorageSync: key => delete local[key], showToast: () => {}, showModal: () => {} }
let page
global.Page = value => { page = value }
require('../pages/timeline/index')
page.setData = function (patch, callback) { Object.assign(this.data, patch); if (callback) callback() }
async function run() {
  await page.onShow()
  assert.strictEqual(page.data.cloudReady, true)
  assert.strictEqual(local.love_moments[0].title, '原记录')
  const form = { title: '云端回忆', content: '文字', category: '电影', images: [], date: '' }
  page.setData({ form, showForm: true })
  fail = true
  await page.save()
  assert.strictEqual(page.data.showForm, true)
  assert.strictEqual(records.length, 0)
  fail = false
  await page.save()
  assert.strictEqual(records[0].data.title, '云端回忆')
  page.setData({ form: { ...form, images: ['/local/photo'] }, showForm: true })
  await page.save()
  assert.strictEqual(records.length, 2)
  assert.match(records[1].data.images[0], /^cloud:\/\//)
  assert.strictEqual(page.data.showForm, false)
  assert.strictEqual(local.love_moments[0].title, '原记录')
  console.log('云端回忆失败保留输入、图片上传及本地记录保留通过')
}
run().catch(err => { console.error(err); process.exitCode = 1 })

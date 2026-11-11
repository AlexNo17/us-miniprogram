const assert = require('assert')
const sync = require('../utils/cloud-sync')
const cloud = require('../utils/cloud')
let uploads = 0
cloud.call = async () => ({ record: { _id: 'cloud-id', version: 1 } })
global.wx = { cloud: { uploadFile: async () => { uploads++; if (uploads === 2) throw new Error('offline'); return { fileID: `cloud://cloud1-d0gnr8ygh74fddee2.bucket/private/${uploads}.jpg` } } } }
async function run() {
  let draft = { images: ['/local/a', '/local/b'] }
  await assert.rejects(sync.saveWithImages('moment', draft, paths => { draft = { ...draft, images: paths } }), /offline/)
  assert.match(draft.images[0], /^cloud:\/\//)
  assert.strictEqual(draft.images[1], '/local/b')
  await sync.saveWithImages('moment', draft, paths => { draft = { ...draft, images: paths } })
  assert.strictEqual(uploads, 3)
  assert.ok(draft.images.every(path => path.startsWith('cloud://')))
  console.log('照片上传失败后保留已上传图片并重试通过')
}
run().catch(error => { console.error(error); process.exitCode = 1 })

const cloud = require('./cloud')

// Keep the server's opaque document ID and version separate from the UI's local ID.
async function list(type) {
  const records = []
  for (let skip = 0; ; skip += 50) {
    const page = await cloud.call('list', { type, limit: 50, skip })
    records.push(...page.records)
    if (page.records.length < 50) break
    if (skip >= 10000) throw new Error('云端记录过多，请分页查看')
  }
  return records.map(record => ({ ...record.data, _cloudId: record._id, _cloudVersion: record.version }))
}

async function save(type, item) {
  const { _cloudId, _cloudVersion, ...data } = item
  if (_cloudId) {
    await cloud.call('update', { type, id: _cloudId, version: _cloudVersion, data })
    return { ...data, _cloudId, _cloudVersion: _cloudVersion + 1 }
  }
  const result = await cloud.call('create', { type, data })
  return { ...data, _cloudId: result.record._id, _cloudVersion: result.record.version }
}

async function remove(type, item) {
  if (!item._cloudId || !item._cloudVersion) throw new Error('此记录尚未保存到云端')
  await cloud.call('delete', { type, id: item._cloudId, version: item._cloudVersion })
}
module.exports = { list, save, remove }

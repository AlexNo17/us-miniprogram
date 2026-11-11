const crypto = require('crypto')
const TYPES = ['profile', 'about', 'moment', 'plan']
const MAX_LENGTH = 12000

function createHandler(db, getOpenId, env) {
  const records = db.collection('couple_records')
  return async function handle(event = {}) {
    const openid = getOpenId()
    if (!openid) return { ok: false, error: 'UNAUTHENTICATED' }
    // This returns only the caller's own identifier, for initial allowlist setup.
    if (event.action === 'identity') return { ok: true, openid }
    const memberA = typeof env.MEMBER_A_OPENID === 'string' ? env.MEMBER_A_OPENID.trim() : ''
    const memberB = typeof env.MEMBER_B_OPENID === 'string' ? env.MEMBER_B_OPENID.trim() : ''
    if (!memberA || (openid !== memberA && (!memberB || openid !== memberB))) return { ok: false, error: 'FORBIDDEN' }
    if (!TYPES.includes(event.type)) return { ok: false, error: 'INVALID_TYPE' }
    try {
      if (event.action === 'list') {
        const limit = Math.min(Math.max(Number(event.limit) || 20, 1), 50)
        const skip = Math.min(Math.max(Number(event.skip) || 0, 0), 10000)
        const result = await records.where({ type: event.type }).orderBy('updatedAt', 'desc').skip(skip).limit(limit).get()
        return { ok: true, records: result.data }
      }
      if (event.action === 'create') {
        if (!validData(event.data)) return { ok: false, error: 'INVALID_DATA' }
        const id = crypto.randomBytes(16).toString('hex'); const now = Date.now()
        const record = { _id: id, type: event.type, data: event.data, version: 1, createdAt: now, updatedAt: now, createdBy: openid, updatedBy: openid }
        await records.add({ data: record })
        return { ok: true, record }
      }
      if (event.action === 'update' || event.action === 'delete') {
        if (!/^[a-f0-9]{32}$/.test(event.id || '') || !Number.isSafeInteger(event.version) || event.version < 1) return { ok: false, error: 'INVALID_REQUEST' }
        if (event.action === 'update' && !validData(event.data)) return { ok: false, error: 'INVALID_DATA' }
        const query = records.where({ _id: event.id, type: event.type, version: event.version })
        const result = event.action === 'update'
          ? await query.update({ data: { data: event.data, version: event.version + 1, updatedAt: Date.now(), updatedBy: openid } })
          : await query.remove()
        const changed = event.action === 'update' ? result.stats.updated : result.stats.removed
        return changed === 1 ? { ok: true, version: event.version + 1 } : { ok: false, error: 'CONFLICT_OR_NOT_FOUND' }
      }
      return { ok: false, error: 'INVALID_ACTION' }
    } catch (error) {
      console.error('space operation failed', event.action, error.message)
      return { ok: false, error: 'SERVER_ERROR' }
    }
  }
}

function validData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  try {
    const serialized = JSON.stringify(value)
    // Only files from this project's private environment may be referenced.
    const links = serialized.match(/cloud:\/\/[^"\s]+/g) || []
    return serialized.length <= MAX_LENGTH && links.every(link => /^cloud:\/\/cloud1-d0gnr8ygh74fddee2\.[a-z0-9-]+\/private\/[a-zA-Z0-9_./-]+$/.test(link))
  } catch (_) { return false }
}
module.exports = { createHandler }

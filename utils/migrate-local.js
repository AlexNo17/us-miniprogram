const store = require('./store')
const sync = require('./cloud-sync')

// Copies only missing items. Never deletes or modifies the local source.
// The user explicitly starts this operation from the UI.
async function migrate(onProgress) {
  const types = [{ local: 'plans', remote: 'plan' }, { local: 'moments', remote: 'moment' }, { local: 'about', remote: 'about' }]
  const report = { copied: 0, skipped: 0, failed: 0 }
  for (const group of types) {
    const localItems = store.get(group.local)
    const existing = await sync.list(group.remote)
    for (const item of localItems) {
      if (existing.some(x => String(x.id) === String(item.id))) { report.skipped++; continue }
      try {
        const saved = await sync.saveWithImages(group.remote, item)
        existing.push(saved); report.copied++
      } catch (_) { report.failed++ }
      if (onProgress) onProgress({ ...report })
    }
  }
  return report
}
module.exports = { migrate }

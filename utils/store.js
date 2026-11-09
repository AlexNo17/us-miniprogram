const KEYS = { moments: 'love_moments', plans: 'love_plans', profile: 'love_profile' }
const defaults = { profile: { me: '我', partner: '你', startDate: '', anniversary: '' }, moments: [], plans: [] }
function seed() { Object.keys(KEYS).forEach(name => { if (wx.getStorageSync(KEYS[name]) === '') wx.setStorageSync(KEYS[name], defaults[name]) }) }
function get(name) { const value = wx.getStorageSync(KEYS[name]); return value === '' || value == null ? defaults[name] : value }
function set(name, value) { wx.setStorageSync(KEYS[name], value) }
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
function dayNumber(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null
  const parts = date.split('-').map(Number); const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
  if (d.getUTCFullYear() !== parts[0] || d.getUTCMonth() !== parts[1] - 1 || d.getUTCDate() !== parts[2]) return null
  return Math.floor(d.getTime() / 86400000)
}
function daysTogether(date, now = today()) { const start = dayNumber(date); const end = dayNumber(now); return start == null || end == null || start > end ? 0 : end - start + 1 }
function nextAnniversary(date, now = today()) {
  if (dayNumber(date) == null || dayNumber(now) == null) return null
  const parts = date.split('-').map(Number); const year = Number(now.slice(0, 4))
  // 闰年 2 月 29 日在非闰年按 2 月 28 日提醒。
  function inYear(y) { const month = parts[1]; const day = Math.min(parts[2], new Date(Date.UTC(y, month, 0)).getUTCDate()); return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` }
  let next = inYear(year); if (next < now) next = inYear(year + 1)
  return { date: next, days: dayNumber(next) - dayNumber(now) }
}
function sorted(items) { return items.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id) }
module.exports = { seed, get, set, today, daysTogether, nextAnniversary, sorted }

const assert = require('assert')
const data = {}
global.wx = {
  getStorageSync: key => Object.prototype.hasOwnProperty.call(data, key) ? data[key] : '',
  setStorageSync: (key, value) => { data[key] = JSON.parse(JSON.stringify(value)) },
  showToast: () => {},
  showModal: ({ success }) => success({ confirm: true }),
  switchTab: () => {},
  removeStorageSync: key => { delete data[key] }
}
const store = require('../utils/store')
store.seed()
assert.deepStrictEqual(store.get('moments'), [])
assert.strictEqual(store.get('profile').startDate, '2026-10-18')
assert.strictEqual(store.daysTogether('2026-10-18', '2026-11-10'), 24)
store.set('profile', { ...store.get('profile'), startDate: '2026-10-19' })
store.seed()
assert.strictEqual(store.get('profile').startDate, '2026-10-19')
assert.strictEqual(store.daysTogether('2024-02-28', '2024-03-01'), 3)
assert.strictEqual(store.daysTogether('2025-01-02', '2025-01-01'), 0)
assert.strictEqual(store.daysTogether('2025-02-30', '2025-03-01'), 0)
assert.deepStrictEqual(store.nextAnniversary('2024-02-29', '2025-02-28'), { date: '2025-02-28', days: 0 })
assert.deepStrictEqual(store.nextAnniversary('2020-05-01', '2025-05-02'), { date: '2026-05-01', days: 364 })
assert.deepStrictEqual(store.sorted([{ id: 1, date: '' }, { id: 2, date: '2026-01-01' }]).map(x => x.id), [2, 1])
console.log('日期计算与旧数据排序通过')

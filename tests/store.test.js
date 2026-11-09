const assert = require('assert')
const data = {}
global.wx = {
  getStorageSync: key => Object.prototype.hasOwnProperty.call(data, key) ? data[key] : '',
  setStorageSync: (key, value) => { data[key] = JSON.parse(JSON.stringify(value)) },
  showToast: () => {},
  showModal: ({ success }) => success({ confirm: true })
}
const store = require('../utils/store')
store.seed()
assert.deepStrictEqual(store.get('moments'), [])
assert.strictEqual(store.daysTogether('2024-02-28', '2024-03-01'), 3)
assert.strictEqual(store.daysTogether('2025-01-02', '2025-01-01'), 0)
assert.strictEqual(store.daysTogether('2025-02-30', '2025-03-01'), 0)
assert.deepStrictEqual(store.nextAnniversary('2024-02-29', '2025-02-28'), { date: '2025-02-28', days: 0 })
assert.deepStrictEqual(store.nextAnniversary('2020-05-01', '2025-05-02'), { date: '2026-05-01', days: 364 })
store.set('plans', [{ id: 1, title: '看日出', category: '旅行', date: '2025-01-01', done: false }])
let page
global.Page = value => { page = value }
require('../pages/plans/index')
page.setData = function (values, callback) { Object.assign(this.data, values); if (callback) callback() }
page.onShow()
page.toggle({ currentTarget: { dataset: { id: 1 } } })
assert.strictEqual(store.get('plans')[0].done, true)
assert.strictEqual(store.get('moments')[0].planId, 1)
page.toggle({ currentTarget: { dataset: { id: 1 } } })
page.toggle({ currentTarget: { dataset: { id: 1 } } })
assert.strictEqual(store.get('moments').length, 1)
console.log('日期计算和计划完成流程通过')

const store = require('../../utils/store')
Page({
  data: { plans: [], filtered: [], filter: '想做', showForm: false, title: '', date: '', category: '约会' },
  onShow() { this.refresh(store.get('plans')) },
  noop() {},
  refresh(plans) { this.setData({ plans, filtered: plans.filter(x => this.data.filter === '已完成' ? x.done : !x.done) }) },
  setFilter(e) { this.setData({ filter: e.currentTarget.dataset.filter }, () => this.refresh(this.data.plans)) },
  toggle(e) { const id = Number(e.currentTarget.dataset.id); const plans = this.data.plans.map(x => x.id === id ? { ...x, done: !x.done } : x); store.set('plans', plans); this.refresh(plans); wx.showToast({ title: '状态已更新' }) },
  openForm() { this.setData({ showForm: true, date: new Date().toISOString().slice(0, 10) }) },
  closeForm() { this.setData({ showForm: false }) },
  onInput(e) { this.setData({ title: e.detail.value }) },
  onDate(e) { this.setData({ date: e.detail.value }) },
  save() { if (!this.data.title.trim()) return wx.showToast({ title: '写下想做的事', icon: 'none' }); const plans = [{ id: Date.now(), title: this.data.title.trim(), date: this.data.date, category: this.data.category, done: false }, ...this.data.plans]; store.set('plans', plans); this.setData({ showForm: false, title: '', filter: '想做' }); this.refresh(plans) }
})

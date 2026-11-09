const store = require('../../utils/store')
Page({
  data: { plans: [], filtered: [], filter: '想做', showForm: false, title: '', date: '', categories: ['约会', '旅行', '美食', '日常', '其他'], categoryIndex: 0 },
  onShow() { this.refresh(store.get('plans')) },
  noop() {},
  refresh(plans) { this.setData({ plans, filtered: plans.filter(x => this.data.filter === '已完成' ? x.done : !x.done) }) },
  setFilter(e) { this.setData({ filter: e.currentTarget.dataset.filter }, () => this.refresh(this.data.plans)) },
  toggle(e) {
    const id = Number(e.currentTarget.dataset.id); const plan = this.data.plans.find(x => x.id === id)
    if (!plan) return
    const plans = this.data.plans.map(x => x.id === id ? { ...x, done: !x.done } : x)
    const moments = store.get('moments')
    if (!plan.done && !moments.some(x => x.planId === id)) {
      moments.unshift({ id: Date.now(), planId: id, date: store.today(), mood: '✨', title: plan.title, content: '我们一起完成了这个计划。' })
      store.set('moments', moments)
    }
    store.set('plans', plans); this.refresh(plans)
    wx.showToast({ title: plan.done ? '已移回想做' : '已记入时光' })
  },
  remove(e) { const id = Number(e.currentTarget.dataset.id); wx.showModal({ title: '删除这个计划？', content: '已生成的回忆会保留。', success: result => { if (!result.confirm) return; const plans = this.data.plans.filter(x => x.id !== id); store.set('plans', plans); this.refresh(plans) } }) },
  openForm() { this.setData({ showForm: true, date: store.today(), title: '', categoryIndex: 0 }) },
  closeForm() { this.setData({ showForm: false }) },
  onInput(e) { this.setData({ title: e.detail.value }) },
  onDate(e) { this.setData({ date: e.detail.value }) },
  onCategory(e) { this.setData({ categoryIndex: Number(e.detail.value) }) },
  save() {
    if (!this.data.title.trim()) return wx.showToast({ title: '写下想做的事', icon: 'none' })
    const plans = [{ id: Date.now(), title: this.data.title.trim(), date: this.data.date, category: this.data.categories[this.data.categoryIndex], done: false }, ...this.data.plans]
    store.set('plans', plans); this.setData({ showForm: false, title: '', filter: '想做' }); this.refresh(plans); wx.showToast({ title: '计划已添加' })
  }
})

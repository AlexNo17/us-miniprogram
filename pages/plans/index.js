const store = require('../../utils/store')
const categories = ['电影', '地点', '其他']
function draft() { return { title: '', category: '电影', content: '', date: '' } }
Page({
  data: { plans: [], filtered: [], filter: '想做', showForm: false, form: {}, detail: null, categories, today: '' },
  onShow() { this.refresh(); this.setData({ today: store.today() }); const open = wx.getStorageSync('love_open_plan'); if (open) { wx.removeStorageSync('love_open_plan'); this.openDetail({ currentTarget: { dataset: { id: open } } }) } },
  noop() {},
  refresh() { const plans = store.get('plans'); const done = this.data.filter === '已完成'; const filtered = plans.filter(x => !!x.done === done).sort((a, b) => done ? (b.completedAt || b.id) - (a.completedAt || a.id) : (b.createdAt || b.id) - (a.createdAt || a.id)); this.setData({ plans, filtered }) },
  setFilter(e) { this.setData({ filter: e.currentTarget.dataset.filter }, () => this.refresh()) },
  openForm() { this.setData({ showForm: true, form: draft(), detail: null }) },
  closeForm() { this.setData({ showForm: false }) },
  openDetail(e) { const detail = this.data.plans.find(x => x.id === Number(e.currentTarget.dataset.id)); if (detail) this.setData({ detail }) },
  closeDetail() { this.setData({ detail: null }) },
  edit() { this.setData({ form: { ...draft(), ...this.data.detail }, detail: null, showForm: true }) },
  input(e) { this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  category(e) { this.setData({ 'form.category': categories[Number(e.detail.value)] }) },
  date(e) { this.setData({ 'form.date': e.detail.value }) },
  clearDate() { this.setData({ 'form.date': '' }) },
  save() {
    const form = this.data.form; const title = (form.title || '').trim()
    if (!title) return wx.showToast({ title: '请填写计划标题', icon: 'none' })
    const plans = store.get('plans'); const old = plans.find(x => x.id === form.id)
    const item = { ...form, id: old ? old.id : store.id(), title, content: (form.content || '').trim(), done: old ? old.done : false, createdAt: old ? (old.createdAt || old.id) : Date.now() }
    store.set('plans', old ? plans.map(x => x.id === old.id ? item : x) : [item, ...plans]); this.setData({ showForm: false }); this.refresh(); wx.showToast({ title: '保存成功' })
  },
  toggle(e) {
    const id = Number(e.currentTarget.dataset.id); const plan = this.data.plans.find(x => x.id === id); if (!plan) return
    const done = !plan.done; const updated = { ...plan, done, completedAt: done ? Date.now() : null, completedDate: done ? store.today() : '' }
    store.set('plans', this.data.plans.map(x => x.id === id ? updated : x)); this.setData({ detail: null }); this.refresh()
    if (done && (plan.category === '电影' || plan.category === '地点') && !store.get('moments').some(x => x.planId === id)) {
      wx.showModal({ title: '计划完成啦', content: '要把这次经历保存为回忆吗？', confirmText: '去记录', cancelText: '暂时不用', success: res => { if (res.confirm) this.createMemory(updated) } })
    } else wx.showToast({ title: done ? '已完成' : '已移回想做' })
  },
  createMemory(plan) {
    if (store.get('moments').some(x => x.planId === plan.id)) return wx.showToast({ title: '此计划已有回忆', icon: 'none' })
    store.set('momentDraft', { category: plan.category === '电影' ? '电影' : '足迹', title: plan.title, content: plan.content || '', date: plan.completedDate || store.today(), planId: plan.id, images: [] })
    wx.switchTab({ url: '/pages/timeline/index' })
  },
  saveMemory() { this.createMemory(this.data.detail) },
  remove() { const id = this.data.detail.id; wx.showModal({ title: '删除这个计划？', content: '已经保存的回忆会保留。', success: result => { if (!result.confirm) return; store.set('plans', store.get('plans').filter(x => x.id !== id)); this.setData({ detail: null }); this.refresh() } }) }
})

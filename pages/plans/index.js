const store = require('../../utils/store')
const sync = require('../../utils/cloud-sync')
const categories = ['电影', '地点', '其他']
function draft() { return { title: '', category: '电影', content: '', date: '' } }
Page({
  data: { plans: [], filtered: [], filter: '想做', showForm: false, form: {}, detail: null, categories, today: '', cloudReady: false, loading: true, busy: false },
  async onShow() { this.setData({ today: store.today() }); await this.loadCloud(); const open = wx.getStorageSync('love_open_plan'); if (open) { wx.removeStorageSync('love_open_plan'); this.openDetail({ currentTarget: { dataset: { id: open } } }) } },
  async loadCloud() { this.setData({ loading: true, cloudReady: false }); try { const plans = await sync.list('plan'); this.setData({ plans, cloudReady: true }); this.refresh() } catch (error) { wx.showToast({ title: '云端加载失败，请重试', icon: 'none' }) } finally { this.setData({ loading: false }) } },
  noop() {},
  refresh() { const plans = this.data.plans; const done = this.data.filter === '已完成'; const filtered = plans.filter(x => !!x.done === done).sort((a, b) => done ? (b.completedAt || b.id) - (a.completedAt || a.id) : (b.createdAt || b.id) - (a.createdAt || a.id)); this.setData({ filtered }) },
  setFilter(e) { this.setData({ filter: e.currentTarget.dataset.filter }, () => this.refresh()) },
  openForm() { if (!this.data.cloudReady) return wx.showToast({ title: '请先连接云端', icon: 'none' }); this.setData({ showForm: true, form: draft(), detail: null }) },
  closeForm() { this.setData({ showForm: false }) },
  openDetail(e) { const detail = this.data.plans.find(x => x.id === Number(e.currentTarget.dataset.id)); if (detail) this.setData({ detail }) },
  closeDetail() { this.setData({ detail: null }) },
  edit() { this.setData({ form: { ...draft(), ...this.data.detail }, detail: null, showForm: true }) },
  input(e) { this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  category(e) { this.setData({ 'form.category': categories[Number(e.detail.value)] }) },
  date(e) { this.setData({ 'form.date': e.detail.value }) },
  clearDate() { this.setData({ 'form.date': '' }) },
  async save() {
    if (!this.data.cloudReady || this.data.busy) return
    const form = this.data.form; const title = (form.title || '').trim()
    if (!title) return wx.showToast({ title: '请填写计划标题', icon: 'none' })
    const plans = this.data.plans; const old = plans.find(x => x.id === form.id)
    const item = { ...form, id: old ? old.id : store.id(), title, content: (form.content || '').trim(), done: old ? old.done : false, createdAt: old ? (old.createdAt || old.id) : Date.now() }
    this.setData({ busy: true })
    try { const saved = await sync.saveText('plan', item); this.setData({ plans: old ? plans.map(x => x.id === old.id ? saved : x) : [saved, ...plans], showForm: false }); this.refresh(); wx.showToast({ title: '已保存到云端' }) } catch (error) { wx.showModal({ title: '未能保存', content: sync.formatError(error), showCancel: false }) } finally { this.setData({ busy: false }) }
  },
  async toggle(e) {
    if (!this.data.cloudReady || this.data.busy) return
    const id = Number(e.currentTarget.dataset.id); const plan = this.data.plans.find(x => x.id === id); if (!plan) return
    const done = !plan.done; const updated = { ...plan, done, completedAt: done ? Date.now() : null, completedDate: done ? store.today() : '' }
    this.setData({ busy: true })
    try { const saved = await sync.saveText('plan', updated); this.setData({ plans: this.data.plans.map(x => x.id === id ? saved : x), detail: null }); this.refresh() } catch (error) { wx.showModal({ title: '未能保存', content: sync.formatError(error), showCancel: false }); return } finally { this.setData({ busy: false }) }
    if (done && (plan.category === '电影' || plan.category === '地点')) {
      wx.showModal({ title: '计划完成啦', content: '要把这次经历保存为回忆吗？', confirmText: '去记录', cancelText: '暂时不用', success: res => { if (res.confirm) this.createMemory(updated) } })
    } else wx.showToast({ title: done ? '已完成' : '已移回想做' })
  },
  async createMemory(plan) {
    try { const moments = await sync.list('moment'); if (moments.some(x => x.planId === plan.id)) return wx.showToast({ title: '此计划已有回忆', icon: 'none' }) } catch (_) { return wx.showToast({ title: '无法检查云端回忆，请重试', icon: 'none' }) }
    store.set('momentDraft', { category: plan.category === '电影' ? '电影' : '足迹', title: plan.title, content: plan.content || '', date: plan.completedDate || store.today(), planId: plan.id, images: [] })
    wx.switchTab({ url: '/pages/timeline/index' })
  },
  saveMemory() { this.createMemory(this.data.detail) },
  remove() { if (!this.data.cloudReady || this.data.busy) return; const plan = this.data.detail; wx.showModal({ title: '删除这个计划？', content: '已经保存的回忆会保留。', success: async result => { if (!result.confirm) return; this.setData({ busy: true }); try { await sync.remove('plan', plan); this.setData({ plans: this.data.plans.filter(x => x.id !== plan.id), detail: null }); this.refresh() } catch (error) { wx.showModal({ title: '未能删除', content: sync.formatError(error), showCancel: false }) } finally { this.setData({ busy: false }) } } }) }
})

const store = require('../../utils/store')
const images = require('../../utils/images')
const categories = ['合影', '漫画', '电影', '足迹']
function draft() { return { category: '电影', title: '', content: '', date: '', images: [] } }
Page({
  data: { categories, tabs: ['全部', ...categories], filter: '全部', moments: [], filtered: [], form: {}, showForm: false, today: '', detail: null },
  onShow() {
    this.refresh(); this.setData({ today: store.today() })
    const pending = store.get('momentDraft')
    if (pending) { store.set('momentDraft', null); this.setData({ form: { ...draft(), ...pending }, showForm: true }) }
    const open = wx.getStorageSync('love_open_moment')
    if (open) { wx.removeStorageSync('love_open_moment'); this.openDetail({ currentTarget: { dataset: { id: open } } }) }
  },
  noop() {},
  refresh() { const moments = store.sorted(store.get('moments')); this.setData({ moments, filtered: moments.filter(x => this.data.filter === '全部' || x.category === this.data.filter) }) },
  setFilter(e) { this.setData({ filter: e.currentTarget.dataset.value }, () => this.refresh()) },
  openForm() { this.setData({ form: draft(), showForm: true, detail: null }) },
  closeForm() { this.setData({ showForm: false }) },
  openDetail(e) { const detail = this.data.moments.find(x => x.id === Number(e.currentTarget.dataset.id)); if (detail) this.setData({ detail }) },
  closeDetail() { this.setData({ detail: null }) },
  edit() { const item = this.data.detail; this.setData({ form: { ...draft(), ...item, images: item.images || [] }, showForm: true, detail: null }) },
  input(e) { this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  category(e) { this.setData({ 'form.category': categories[Number(e.detail.value)] }) },
  date(e) { this.setData({ 'form.date': e.detail.value }) },
  clearDate() { this.setData({ 'form.date': '' }) },
  chooseImages() { images.choose(this.data.form.images, 9, paths => this.setData({ 'form.images': paths })) },
  removeImage(e) { const paths = this.data.form.images.slice(); paths.splice(Number(e.currentTarget.dataset.index), 1); this.setData({ 'form.images': paths }) },
  moveImage(e) { const paths = this.data.form.images.slice(); const i = Number(e.currentTarget.dataset.index); if (i > 0) { [paths[i - 1], paths[i]] = [paths[i], paths[i - 1]]; this.setData({ 'form.images': paths }) } },
  preview(e) { images.preview(this.data.detail.images || [], Number(e.currentTarget.dataset.index)) },
  save() {
    const form = this.data.form; const title = (form.title || '').trim(); const content = (form.content || '').trim()
    if (!title) return wx.showToast({ title: form.category === '电影' ? '请填写片名' : form.category === '足迹' ? '请填写地点' : '请填写标题', icon: 'none' })
    if (form.date && form.date > store.today()) return wx.showToast({ title: '日期不能晚于今天', icon: 'none' })
    if ((form.category === '合影' || form.category === '漫画') && !form.images.length) return wx.showToast({ title: '请至少添加一张图片', icon: 'none' })
    const moments = store.get('moments'); const old = moments.find(x => x.id === form.id)
    if (form.planId && moments.some(x => x.planId === form.planId && x.id !== form.id)) return wx.showToast({ title: '此计划已有回忆', icon: 'none' })
    const item = { ...form, id: old ? old.id : store.id(), title, content, createdAt: old ? (old.createdAt || old.id) : Date.now(), createdDate: old ? (old.createdDate || old.date || store.today()) : store.today() }
    store.set('moments', old ? moments.map(x => x.id === old.id ? item : x) : [item, ...moments]); this.setData({ showForm: false }); this.refresh(); wx.showToast({ title: '保存成功' })
  },
  remove() { const id = this.data.detail.id; wx.showModal({ title: '删除这条回忆？', content: '删除后无法恢复。', success: result => { if (!result.confirm) return; store.set('moments', store.get('moments').filter(x => x.id !== id)); this.setData({ detail: null }); this.refresh() } }) }
})

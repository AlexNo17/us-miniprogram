const store = require('../../utils/store')
const images = require('../../utils/images')
const sync = require('../../utils/cloud-sync')
const categories = ['合影', '漫画', '电影', '足迹']
function draft() { return { category: '电影', title: '', content: '', date: '', images: [] } }
Page({
  data: { categories, tabs: ['全部', ...categories], filter: '全部', moments: [], filtered: [], form: {}, showForm: false, today: '', detail: null, cloudReady: false, loading: true, busy: false },
  async onShow() {
    this.setData({ today: store.today() }); await this.loadCloud()
    const pending = store.get('momentDraft')
    if (pending) { store.set('momentDraft', null); this.setData({ form: { ...draft(), ...pending }, showForm: true }) }
    const open = wx.getStorageSync('love_open_moment')
    if (open) { wx.removeStorageSync('love_open_moment'); this.openDetail({ currentTarget: { dataset: { id: open } } }) }
  },
  async loadCloud() { this.setData({ loading: true, cloudReady: false }); try { const moments = await sync.list('moment'); this.setData({ moments, cloudReady: true }); this.refresh() } catch (_) { wx.showToast({ title: '云端加载失败，请重试', icon: 'none' }) } finally { this.setData({ loading: false }) } },
  noop() {},
  refresh() { const moments = store.sorted(this.data.moments); this.setData({ moments, filtered: moments.filter(x => this.data.filter === '全部' || x.category === this.data.filter) }) },
  setFilter(e) { this.setData({ filter: e.currentTarget.dataset.value }, () => this.refresh()) },
  openForm() { if (!this.data.cloudReady) return wx.showToast({ title: '请先连接云端', icon: 'none' }); this.setData({ form: draft(), showForm: true, detail: null }) },
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
  previewFeed(e) { const moment = this.data.moments.find(x => x.id === Number(e.currentTarget.dataset.id)); if (moment) images.preview(moment.images || [], Number(e.currentTarget.dataset.index)) },
  async save() {
    if (!this.data.cloudReady || this.data.busy) return
    const form = this.data.form; const title = (form.title || '').trim(); const content = (form.content || '').trim()
    if (!title) return wx.showToast({ title: form.category === '电影' ? '请填写片名' : form.category === '足迹' ? '请填写地点' : '请填写标题', icon: 'none' })
    if (form.date && form.date > store.today()) return wx.showToast({ title: '日期不能晚于今天', icon: 'none' })
    if ((form.category === '合影' || form.category === '漫画') && !form.images.length) return wx.showToast({ title: '请至少添加一张图片', icon: 'none' })
    const moments = this.data.moments; const old = moments.find(x => x.id === form.id)
    if (form.planId && moments.some(x => x.planId === form.planId && x.id !== form.id)) return wx.showToast({ title: '此计划已有回忆', icon: 'none' })
    const item = { ...form, id: old ? old.id : store.id(), title, content, createdAt: old ? (old.createdAt || old.id) : Date.now(), createdDate: old ? (old.createdDate || old.date || store.today()) : store.today() }
    this.setData({ busy: true }); try { const saved = await sync.saveWithImages('moment', item, paths => this.setData({ 'form.images': paths })); this.setData({ moments: old ? moments.map(x => x.id === old.id ? saved : x) : [saved, ...moments], showForm: false }); this.refresh(); wx.showToast({ title: '已保存到云端' }) } catch (error) { wx.showModal({ title: '未能保存', content: sync.formatError(error), showCancel: false }) } finally { this.setData({ busy: false }) }
  },
  remove() { if (!this.data.cloudReady || this.data.busy) return; const item = this.data.detail; wx.showModal({ title: '删除这条回忆？', content: '删除后无法恢复。', success: async result => { if (!result.confirm) return; this.setData({ busy: true }); try { await sync.remove('moment', item); this.setData({ moments: this.data.moments.filter(x => x.id !== item.id), detail: null }); this.refresh() } catch (error) { wx.showModal({ title: '未能删除', content: sync.formatError(error), showCancel: false }) } finally { this.setData({ busy: false }) } } }) }
})

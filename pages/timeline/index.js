const store = require('../../utils/store')
Page({
  data: { moments: [], showForm: false, title: '', content: '', mood: '🥰', date: '' },
  onShow() { this.setData({ moments: store.get('moments') }) },
  noop() {},
  openForm() { this.setData({ showForm: true, date: new Date().toISOString().slice(0, 10) }) },
  closeForm() { this.setData({ showForm: false }) },
  onInput(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }) },
  onDate(e) { this.setData({ date: e.detail.value }) },
  save() {
    if (!this.data.title.trim()) return wx.showToast({ title: '写个标题吧', icon: 'none' })
    const moments = [{ id: Date.now(), title: this.data.title.trim(), content: this.data.content.trim(), mood: this.data.mood, date: this.data.date }, ...this.data.moments]
    store.set('moments', moments)
    this.setData({ moments, showForm: false, title: '', content: '' })
    wx.showToast({ title: '记下来啦' })
  }
})

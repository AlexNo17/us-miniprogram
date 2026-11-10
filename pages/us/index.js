const store = require('../../utils/store')
const images = require('../../utils/images')
const cloud = require('../../utils/cloud')
Page({
  data: { profile: {}, draft: {}, days: 0, momentCount: 0, doneCount: 0, editing: false, today: '', about: [], record: {}, showRecord: false, owners: ['成员 A', '成员 B', '共同'] },
  onShow() { this.refresh() },
  refresh() { const profile = store.get('profile'); this.setData({ profile, about: store.get('about').slice().sort((a, b) => b.updatedAt - a.updatedAt), days: store.daysTogether(profile.startDate), momentCount: store.get('moments').length, doneCount: store.get('plans').filter(x => x.done).length, today: store.today() }) },
  noop() {},
  getIdentity() {
    wx.showLoading({ title: '获取中' })
    cloud.call('identity').then(result => {
      wx.hideLoading()
      wx.showModal({ title: '当前微信身份', content: '身份标识仅用于配置两人访问权限，请只发给小程序管理员。', confirmText: '复制标识', success: choice => { if (choice.confirm) wx.setClipboardData({ data: result.openid }) } })
    }).catch(() => { wx.hideLoading(); wx.showToast({ title: '云函数未部署或连接失败', icon: 'none' }) })
  },
  edit() { this.setData({ draft: { ...this.data.profile }, editing: true }) },
  close() { this.setData({ editing: false }) },
  input(e) { this.setData({ [`draft.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  dateChange(e) { this.setData({ [`draft.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  chooseAvatar(e) { const field = e.currentTarget.dataset.field; images.choose([], 1, paths => { if (paths.length) this.setData({ [`draft.${field}`]: paths[0] }) }) },
  addRecord() { this.setData({ record: { owner: '共同', title: '', content: '', images: [] }, showRecord: true }) },
  editRecord(e) { const record = this.data.about.find(x => x.id === Number(e.currentTarget.dataset.id)); if (record) this.setData({ record: { ...record, images: record.images || [] }, showRecord: true }) },
  closeRecord() { this.setData({ showRecord: false }) },
  recordInput(e) { this.setData({ [`record.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  ownerChange(e) { this.setData({ 'record.owner': this.data.owners[Number(e.detail.value)] }) },
  chooseImage() { images.choose(this.data.record.images, 1, paths => this.setData({ 'record.images': paths })) },
  removeImage() { this.setData({ 'record.images': [] }) },
  previewImage(e) { const record = this.data.about.find(x => x.id === Number(e.currentTarget.dataset.id)); if (record) images.preview(record.images || [], 0) },
  saveRecord() {
    const record = this.data.record; const title = (record.title || '').trim(); const content = (record.content || '').trim()
    if (!title || !content) return wx.showToast({ title: '请填写标题和内容', icon: 'none' })
    const records = store.get('about'); const old = records.find(x => x.id === record.id); const now = Date.now()
    const item = { ...record, title, content, id: old ? old.id : store.id(), createdAt: old ? old.createdAt : now, updatedAt: now, creator: old ? old.creator : '本机用户', lastEditor: '本机用户' }
    store.set('about', old ? records.map(x => x.id === old.id ? item : x) : [item, ...records]); this.setData({ showRecord: false }); this.refresh(); wx.showToast({ title: '保存成功' })
  },
  deleteRecord(e) { const id = Number(e.currentTarget.dataset.id); wx.showModal({ title: '删除这条记录？', content: '删除后无法恢复。', success: result => { if (!result.confirm) return; store.set('about', store.get('about').filter(x => x.id !== id)); this.refresh() } }) },
  save() {
    const draft = this.data.draft
    if (!draft.me.trim() || !draft.partner.trim()) return wx.showToast({ title: '请填写两个人的昵称', icon: 'none' })
    if (draft.startDate && draft.startDate > store.today()) return wx.showToast({ title: '恋爱日期不能晚于今天', icon: 'none' })
    store.set('profile', { ...draft, me: draft.me.trim(), partner: draft.partner.trim() }); this.setData({ editing: false }); this.refresh(); wx.showToast({ title: '保存成功' })
  }
})

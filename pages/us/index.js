const store = require('../../utils/store')
const images = require('../../utils/images')
const cloud = require('../../utils/cloud')
const sync = require('../../utils/cloud-sync')
const migration = require('../../utils/migrate-local')
Page({
  data: { profile: {}, draft: {}, days: 0, momentCount: 0, doneCount: 0, editing: false, today: '', about: [], record: {}, showRecord: false, owners: ['成员 A', '成员 B', '共同'], cloudReady: false, loading: true, busy: false },
  async onShow() { await this.loadCloud() },
  async loadCloud() {
    this.setData({ loading: true, cloudReady: false, today: store.today() })
    try {
      const [profiles, about, moments, plans] = await Promise.all(['profile', 'about', 'moment', 'plan'].map(type => sync.list(type)))
      if (profiles.length > 1) throw new Error('资料有多份，请联系管理员处理')
      const profile = profiles[0] || { me: '我', partner: '你', startDate: '2026-10-18', anniversary: '' }
      this.setData({ profile, about: about.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)), days: store.daysTogether(profile.startDate), momentCount: moments.length, doneCount: plans.filter(x => x.done).length, cloudReady: true })
    } catch (_) { wx.showToast({ title: '云端加载失败，请重试', icon: 'none' }) } finally { this.setData({ loading: false }) }
  },
  noop() {},
  migrateLocal() {
    if (!this.data.cloudReady || this.data.busy) return wx.showToast({ title: '请先连接云端', icon: 'none' })
    wx.showModal({ title: '复制本机记录到云端？', content: '将复制本机的计划、回忆和关于我们的记录，原本地数据不会删除。资料和头像请单独设置。', confirmText: '开始复制', success: async result => {
      if (!result.confirm) return
      this.setData({ busy: true }); wx.showLoading({ title: '正在复制' })
      try { const report = await migration.migrate(); wx.hideLoading(); wx.showModal({ title: '复制完成', content: `已复制 ${report.copied} 条，已存在 ${report.skipped} 条，失败 ${report.failed} 条。原本地数据仍保留。`, showCancel: false }); await this.loadCloud() } catch (_) { wx.hideLoading(); wx.showModal({ title: '复制中断', content: '本地数据仍保留。请检查网络后重试，已成功复制的记录会跳过。', showCancel: false }) } finally { this.setData({ busy: false }) }
    } })
  },
  getIdentity() {
    wx.showLoading({ title: '获取中' })
    cloud.call('identity').then(result => {
      wx.hideLoading()
      wx.showModal({ title: '当前微信身份', content: '身份标识仅用于配置两人访问权限，请只发给小程序管理员。', confirmText: '复制标识', success: choice => { if (choice.confirm) wx.setClipboardData({ data: result.openid }) } })
    }).catch(() => { wx.hideLoading(); wx.showToast({ title: '云函数未部署或连接失败', icon: 'none' }) })
  },
  edit() { if (!this.data.cloudReady) return wx.showToast({ title: '请先连接云端', icon: 'none' }); this.setData({ draft: { ...this.data.profile }, editing: true }) },
  close() { this.setData({ editing: false }) },
  input(e) { this.setData({ [`draft.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  dateChange(e) { this.setData({ [`draft.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  chooseAvatar(e) { const field = e.currentTarget.dataset.field; images.choose([], 1, paths => { if (paths.length) this.setData({ [`draft.${field}`]: paths[0] }) }) },
  addRecord() { if (!this.data.cloudReady) return wx.showToast({ title: '请先连接云端', icon: 'none' }); this.setData({ record: { owner: '共同', title: '', content: '', images: [] }, showRecord: true }) },
  editRecord(e) { const record = this.data.about.find(x => x.id === Number(e.currentTarget.dataset.id)); if (record) this.setData({ record: { ...record, images: record.images || [] }, showRecord: true }) },
  closeRecord() { this.setData({ showRecord: false }) },
  recordInput(e) { this.setData({ [`record.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  ownerChange(e) { this.setData({ 'record.owner': this.data.owners[Number(e.detail.value)] }) },
  chooseImage() { images.choose(this.data.record.images, 1, paths => this.setData({ 'record.images': paths })) },
  removeImage() { this.setData({ 'record.images': [] }) },
  previewImage(e) { const record = this.data.about.find(x => x.id === Number(e.currentTarget.dataset.id)); if (record) images.preview(record.images || [], 0) },
  async saveRecord() {
    if (!this.data.cloudReady || this.data.busy) return
    const record = this.data.record; const title = (record.title || '').trim(); const content = (record.content || '').trim()
    if (!title || !content) return wx.showToast({ title: '请填写标题和内容', icon: 'none' })
    const records = this.data.about; const old = records.find(x => x.id === record.id); const now = Date.now()
    const item = { ...record, title, content, id: old ? old.id : store.id(), createdAt: old ? old.createdAt : now, updatedAt: now, creator: old ? old.creator : '本机用户', lastEditor: '本机用户' }
    this.setData({ busy: true }); try { const saved = await sync.saveWithImages('about', item, paths => this.setData({ 'record.images': paths })); this.setData({ about: old ? records.map(x => x.id === old.id ? saved : x) : [saved, ...records], showRecord: false }); wx.showToast({ title: '已保存到云端' }) } catch (error) { wx.showModal({ title: '未能保存', content: sync.formatError(error), showCancel: false }) } finally { this.setData({ busy: false }) }
  },
  deleteRecord(e) { if (!this.data.cloudReady || this.data.busy) return; const item = this.data.about.find(x => x.id === Number(e.currentTarget.dataset.id)); if (!item) return; wx.showModal({ title: '删除这条记录？', content: '删除后无法恢复。', success: async result => { if (!result.confirm) return; this.setData({ busy: true }); try { await sync.remove('about', item); this.setData({ about: this.data.about.filter(x => x.id !== item.id) }) } catch (error) { wx.showModal({ title: '未能删除', content: sync.formatError(error), showCancel: false }) } finally { this.setData({ busy: false }) } } }) },
  async save() {
    if (!this.data.cloudReady || this.data.busy) return
    const draft = this.data.draft
    if (!draft.me.trim() || !draft.partner.trim()) return wx.showToast({ title: '请填写两个人的昵称', icon: 'none' })
    if (draft.startDate && draft.startDate > store.today()) return wx.showToast({ title: '恋爱日期不能晚于今天', icon: 'none' })
    this.setData({ busy: true }); try {
      const item = { ...draft, me: draft.me.trim(), partner: draft.partner.trim() }
      for (const field of ['avatarA', 'avatarB']) { if (item[field]) { item[field] = await sync.uploadImage(item[field]); this.setData({ [`draft.${field}`]: item[field] }) } }
      const saved = await sync.saveText('profile', item); this.setData({ profile: saved, days: store.daysTogether(saved.startDate), editing: false }); wx.showToast({ title: '已保存到云端' })
    } catch (error) { wx.showModal({ title: '未能保存', content: sync.formatError(error), showCancel: false }) } finally { this.setData({ busy: false }) }
  }
})

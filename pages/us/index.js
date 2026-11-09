const store = require('../../utils/store')
Page({
  data: { profile: {}, draft: {}, days: 0, momentCount: 0, doneCount: 0, editing: false, today: '' },
  onShow() { this.refresh() },
  refresh() { const profile = store.get('profile'); this.setData({ profile, days: store.daysTogether(profile.startDate), momentCount: store.get('moments').length, doneCount: store.get('plans').filter(x => x.done).length, today: store.today() }) },
  noop() {},
  edit() { this.setData({ draft: { ...this.data.profile }, editing: true }) },
  close() { this.setData({ editing: false }) },
  input(e) { this.setData({ [`draft.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  dateChange(e) { this.setData({ [`draft.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  save() {
    const draft = this.data.draft
    if (!draft.me.trim() || !draft.partner.trim()) return wx.showToast({ title: '请填写两个人的昵称', icon: 'none' })
    if (draft.startDate && draft.startDate > store.today()) return wx.showToast({ title: '恋爱日期不能晚于今天', icon: 'none' })
    store.set('profile', { ...draft, me: draft.me.trim(), partner: draft.partner.trim() }); this.setData({ editing: false }); this.refresh(); wx.showToast({ title: '保存成功' })
  }
})

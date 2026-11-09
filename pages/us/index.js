const store = require('../../utils/store')
Page({
  data: { profile: {}, days: 0, momentCount: 0, doneCount: 0 },
  onShow() { const profile = store.get('profile'); const plans = store.get('plans'); this.setData({ profile, days: store.daysBetween(profile.startDate), momentCount: store.get('moments').length, doneCount: plans.filter(x => x.done).length }) },
  coming() { wx.showToast({ title: '下一版见', icon: 'none' }) }
})

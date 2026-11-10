const store = require('../../utils/store')
Page({
  data: { profile: {}, days: 0, anniversary: null, moments: [], pending: [] },
  onShow() { const profile = store.get('profile'); this.setData({ profile, days: store.daysTogether(profile.startDate), anniversary: store.nextAnniversary(profile.anniversary || profile.startDate), moments: store.sorted(store.get('moments')).slice(0, 3), pending: store.get('plans').filter(x => !x.done).sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id)).slice(0, 2) }) },
  goTimeline() { wx.switchTab({ url: '/pages/timeline/index' }) },
  goPlans() { wx.switchTab({ url: '/pages/plans/index' }) },
  goUs() { wx.switchTab({ url: '/pages/us/index' }) },
  openMoment(e) { wx.setStorageSync('love_open_moment', e.currentTarget.dataset.id); this.goTimeline() },
  openPlan(e) { wx.setStorageSync('love_open_plan', e.currentTarget.dataset.id); this.goPlans() }
})

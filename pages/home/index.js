const store = require('../../utils/store')
Page({
  data: { profile: {}, days: 0, countdown: 0, moments: [], pending: [] },
  onShow() {
    const profile = store.get('profile')
    const moments = store.get('moments')
    const plans = store.get('plans')
    const countdown = Math.max(0, store.daysBetween(new Date().toISOString().slice(0, 10), profile.anniversary) - 1)
    this.setData({ profile, days: store.daysBetween(profile.startDate), countdown, moments: moments.slice(0, 2), pending: plans.filter(x => !x.done).slice(0, 2) })
  },
  goTimeline() { wx.switchTab({ url: '/pages/timeline/index' }) },
  goPlans() { wx.switchTab({ url: '/pages/plans/index' }) }
})

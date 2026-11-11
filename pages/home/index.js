const store = require('../../utils/store')
const sync = require('../../utils/cloud-sync')
Page({
  data: { profile: {}, days: 0, anniversary: null, moments: [], pending: [] },
  async onShow() { this.setData({ profile: { me: '我', partner: '你' }, days: 0, anniversary: null, moments: [], pending: [], profileError: false, plansError: false, momentsError: false }); try { const profiles = await sync.list('profile'); if (profiles.length > 1) throw new Error('duplicate profiles'); const profile = profiles[0] || { me: '我', partner: '你', startDate: '2026-10-18' }; this.setData({ profile, days: store.daysTogether(profile.startDate), anniversary: store.nextAnniversary(profile.anniversary || profile.startDate) }) } catch (_) { this.setData({ profileError: true }) } try { const plans = await sync.list('plan'); this.setData({ pending: plans.filter(x => !x.done).sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id)).slice(0, 2) }) } catch (_) { this.setData({ plansError: true }) } try { const moments = await sync.list('moment'); this.setData({ moments: store.sorted(moments).slice(0, 3) }) } catch (_) { this.setData({ momentsError: true }) } },
  goTimeline() { wx.switchTab({ url: '/pages/timeline/index' }) },
  goPlans() { wx.switchTab({ url: '/pages/plans/index' }) },
  goUs() { wx.switchTab({ url: '/pages/us/index' }) },
  openMoment(e) { wx.setStorageSync('love_open_moment', e.currentTarget.dataset.id); this.goTimeline() },
  openPlan(e) { wx.setStorageSync('love_open_plan', e.currentTarget.dataset.id); this.goPlans() }
})

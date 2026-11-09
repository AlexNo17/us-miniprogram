const KEYS = { moments: 'love_moments', plans: 'love_plans', profile: 'love_profile' }

const demo = {
  profile: { me: '小满', partner: '阿屿', startDate: '2025-02-14', anniversary: '2027-02-14' },
  moments: [
    { id: 1, date: '2026-11-02', mood: '🥰', title: '秋天的第一次散步', content: '路边的桂花很香，我们绕着湖走了两圈。' },
    { id: 2, date: '2026-10-18', mood: '🎂', title: '一起过生日', content: '偷偷准备的小蛋糕没有被提前发现。' }
  ],
  plans: [
    { id: 1, title: '去海边看一次日出', category: '旅行', date: '2027-01-01', done: false },
    { id: 2, title: '一起做一顿晚餐', category: '日常', date: '2026-11-16', done: false },
    { id: 3, title: '拍一组秋日合照', category: '约会', date: '2026-10-20', done: true }
  ]
}

function seed() {
  if (!wx.getStorageSync(KEYS.profile)) wx.setStorageSync(KEYS.profile, demo.profile)
  if (!wx.getStorageSync(KEYS.moments)) wx.setStorageSync(KEYS.moments, demo.moments)
  if (!wx.getStorageSync(KEYS.plans)) wx.setStorageSync(KEYS.plans, demo.plans)
}

function get(name) { return wx.getStorageSync(KEYS[name]) || demo[name] }
function set(name, value) { wx.setStorageSync(KEYS[name], value) }
function daysBetween(from, to = new Date()) {
  const start = new Date(`${from}T00:00:00`)
  const end = typeof to === 'string' ? new Date(`${to}T00:00:00`) : to
  return Math.max(1, Math.floor((end - start) / 86400000) + 1)
}

module.exports = { seed, get, set, daysBetween }


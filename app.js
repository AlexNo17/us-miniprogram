const store = require('./utils/store')

App({
  onLaunch() {
    if (wx.cloud) wx.cloud.init({ env: 'cloud1-d0gnr8ygh74fddee2', traceUser: true })
    store.seed()
  }
})


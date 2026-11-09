const store = require('./utils/store')

App({
  onLaunch() {
    store.seed()
  },
  globalData: {
    coupleName: '小满与阿屿'
  }
})


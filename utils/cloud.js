function call(action, data = {}) {
  if (!wx.cloud) return Promise.reject(new Error('当前微信版本不支持云开发'))
  return wx.cloud.callFunction({ name: 'space', data: { ...data, action } }).then(({ result }) => {
    if (!result || !result.ok) { const error = new Error((result && result.error) || '云服务暂不可用'); error.code = result && result.error; throw error }
    return result
  })
}
module.exports = { call }

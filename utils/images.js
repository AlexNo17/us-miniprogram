// Save selected images into the mini program's persistent local storage.
function choose(existing, limit, done) {
  if (existing.length >= limit) return wx.showToast({ title: `最多 ${limit} 张图片`, icon: 'none' })
  wx.chooseMedia({ count: limit - existing.length, mediaType: ['image'], sourceType: ['album', 'camera'], success: async result => {
    const files = result.tempFiles || []; const saved = []
    for (const file of files) {
      try {
        const path = await new Promise((resolve, reject) => wx.getFileSystemManager().saveFile({ tempFilePath: file.tempFilePath, success: res => resolve(res.savedFilePath), fail: reject }))
        saved.push(path)
      } catch (err) { wx.showToast({ title: '图片保存失败，请重试', icon: 'none' }); break }
    }
    done(existing.concat(saved))
  } })
}
function preview(images, index) { if (images.length) wx.previewImage({ current: images[index] || images[0], urls: images }) }
module.exports = { choose, preview }

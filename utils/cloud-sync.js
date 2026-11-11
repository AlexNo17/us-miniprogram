const records = require('./cloud-records')

// This module deliberately does not touch existing local caches or images.
// Callers must wait for cloud acknowledgement before closing an edit form.
function formatError(error) {
  if (error && error.code === 'CONFLICT_OR_NOT_FOUND') return '这条记录已被修改或删除，请刷新后重试'
  if (error && error.code === 'FORBIDDEN') return '当前微信没有访问权限，请检查云端白名单'
  return '云端连接失败，请保留内容并重试'
}

async function saveText(type, item) {
  if (item.images && item.images.length) throw new Error('图片云端同步尚未开放')
  return records.save(type, item)
}

async function saveWithImages(type, item, onProgress) {
  const uploaded = []
  for (const path of (item.images || [])) {
    if (path.startsWith('cloud://')) { uploaded.push(path); continue }
    const random = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const result = await wx.cloud.uploadFile({ cloudPath: `private/${random}.jpg`, filePath: path })
    if (!result || !result.fileID) throw new Error('图片上传失败')
    uploaded.push(result.fileID)
    // Preserve uploaded IDs in the draft so retries do not upload them twice.
    if (onProgress) onProgress(uploaded.concat((item.images || []).slice(uploaded.length)))
  }
  return records.save(type, { ...item, images: uploaded })
}

async function uploadImage(path) {
  if (!path || path.startsWith('cloud://')) return path
  const random = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const result = await wx.cloud.uploadFile({ cloudPath: `private/${random}.jpg`, filePath: path })
  if (!result || !result.fileID) throw new Error('图片上传失败')
  return result.fileID
}

module.exports = { list: records.list, saveText, saveWithImages, uploadImage, remove: records.remove, formatError }

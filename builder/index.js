const { withOra, initAxios } = require('./utils')
const syncBlogs = require('./sync')

const start = async () => {
  initAxios()

  // 同步github上的blogs到md文件夹
  await withOra(
    syncBlogs,
    '正在同步博客中...',
  )
}
start()

/**
 * 同步github上的blogs
 */
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { rebuild } = require('./utils')
const {
  repo: { owner, name }, mdDir,
} = require('../config')

const GITHUB_BASE_URL = 'https://api.github.com'
module.exports = async () => {
  // 清空md文件夹
  rebuild(mdDir)

  try {
    // 请求github博客内容
    const { data: blogs } = await axios.get(
      `${GITHUB_BASE_URL}/repos/${owner}/${name}/issues`,
    )
    
    // 创建md文件
    blogs.forEach((blog) => {
      const blogDir = `${mdDir}/${blog.id}`
      fs.mkdirSync(blogDir)
      
      const body = injectHeader(blog)
      fs.writeFileSync(path.join(blogDir, `index.md`), body, 'utf8')
    })

    return blogs
  } catch (e) {
    console.log('e: ', e);
    console.error('仓库拉取失败，请检查您的用户名和仓库名')
    throw e
  }
}

function injectHeader(blog) {
  const header = `---
title: '${blog.title}'
date: '${blog.created_at.slice(0, 10)}'
spoiler: ''
---
`
  const result = `${header}
  ${blog.body}
  `

  return result
}

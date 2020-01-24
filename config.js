const path = require('path')

const mdDir = path.resolve(__dirname, './src/pages')

const config = {
  mdDir,
  // 用于更改标题上的用户信息
  username: 'ssh',
  // 你的掘金主页
  juejin: 'https://juejin.im/user/5b13f11d5188257da1245183',
  // 用于同步github的博客
  repo: {
    // 你的github用户名
    owner: 'sl1673495',
    // 博客的仓库名 会从这个仓库拉取issues
    name: 'blogs',
  },
  // 可选 如果申请了github Oauth app的话
  // 可以填写用于取消github请求限制
  client_id: '',
  client_secret: '',
}

const githubUrl = `https://github.com/${config.repo.owner}`;

module.exports = {
  ...config,
  githubUrl
}

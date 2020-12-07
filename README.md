# sync-overreacted

利用 gatsby 静态导出 html 的功能实现一键同步 github issues 博客，生成可以自己定制主题的静态 html 文件博客，默认采用了 overreacted.io 的主题！

### 预览地址

https://blog.sl1673495.now.sh/

### 对应的我的 github blog 仓库

https://github.com/sl1673495/blogs/issues

### 说明

1. config.js 里改掉 repo 的 owner 和 name 两个字段，分别对应你的 github 用户名和博客仓库名。
   如https://github.com/sl1673495/blogs/issues 这个仓库对应的 owner 是 sl1673495，name 是 blogs。

2. 在 gatsby-config.js 里修改个人信息。

3. 更换头像可以修改 src/assets/avatar.jpeg

4. 如果被 github 限制调取接口的频率，可以在 .github.js 中把你在 github 上申请的 client_id 和 client_secret 填入。

### 运行

1. clone 本项目

2. 安装依赖

```
npm i
```

3. 同步博客并导出  
   按照上面的说明更改好配置以后

```
// 同步博客 生成md文件
npm run sync
// 构建静态页面 输出到public目录下
npm run build
// 查看html页面
cd public
```

生成了 html 文件后，想怎么部署的方式都可以了。

开发环境调试：

```
npm run dev
```

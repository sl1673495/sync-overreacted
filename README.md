# sync-overreacted
利用gatsby静态导出html的功能实现一键同步github issues博客，生成可以自己定制主题的静态html文件博客，默认采用了overreacted.io的主题！

### 预览地址
https://blog.sl1673495.now.sh/

### 对应的我的github blog仓库
https://github.com/sl1673495/blogs/issues

### 说明
1. config.js里改掉repo的owner和name两个字段，分别对应你的github用户名和博客仓库名。
如https://github.com/sl1673495/blogs/issues 这个仓库对应的owner是sl1673495，name是blogs。

2. 更换头像可以修改src/assets/avatar.jpeg

### 运行  

1. clone本项目

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

生成了html文件后，想怎么部署的方式都可以了。

开发环境调试：
```
npm run dev
```

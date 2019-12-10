# sync-overreacted
利用gatsby静态导出html的功能实现一键同步github issues博客，生成可以自己定制主题的静态html文件博客，默认采用了overreacted.io的主题！

### 预览地址
https://blog.sl1673495.now.sh/

### 对应的我的github blog仓库
https://github.com/sl1673495/blogs/issues

### 说明

#### 更换头像
src/assets/avatar.jpeg

#### 同步仓库
只需要在config.js里改掉repo的owner和name两个字段，  
分别对应你的github用户名和博客仓库名，  
然后执行`npm run sync`，  
就可以在src/pages下看到你的issues博客。
config中填写client_id和client_secret可以用于取消请求限制。

### 使用[now](https://zeit.co/home)部署
进入public目录，然后执行`now`，页面就会自动部署了。
https://blog.sl1673495.now.sh/

### 运行  

1. clone本项目

2. 安装依赖
```
npm i
```
3. 同步博客并导出
按照上面的说明更改好配置以后

```
// 同步博客
npm run sync
// 构建静态页面
npm run build
// 查看
cd public
```

生成了html文件后，想怎么部署的方式都可以了。

开发环境调试：
```
npm run dev
```

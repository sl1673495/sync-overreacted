# next-blog
利用nextjs静态导出html的功能实现一键同步github issues博客，生成可以自己定制主题的静态html文件博客！

### 预览地址
https://blog.sl1673495.now.sh/

### 对应的我的github blog仓库
https://github.com/sl1673495/blogs/issues

### 运行
安装依赖：
```
npm i
```
开发环境：
```
npm run dev
```
导出博客(会放在public目录下，导出后请进入public目录后启动anywhere或者http-server类似的静态服务然后访问)：
```
npm run sync && npm run build
```

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

---
title: '中级前端面试指南'
date: '2020-06-27'
spoiler: ''
---

  ## 前言
本篇文章，献给我家女朋友，祝她在杭州找一个965的好公司！

>题外话：关于中级 -> 高级的进阶，我也写了一篇文章，希望对你有帮助：
[写给初中级前端的高级进阶指南](https://juejin.im/post/5e7c08bde51d455c4c66ddad)
## HTML篇
#### HTML5语义化
[html5语义化标签](https://rainylog.com/post/ife-note-1)
> 百度ife的h5语义化文章，讲得很好，很多不错的公司都会问语义化的问题。

## CSS篇

#### CSS常见面试题
[50道CSS经典面试题](https://segmentfault.com/a/1190000013325778)
> CSS基础有的公司很重视，在面试前还是需要好好复习一遍的。  

#### 能不能讲一讲Flex布局，以及常用的属性？。  
[阮一峰的flex系列](https://www.ruanyifeng.com/blog/2015/07/flex-grammar.html)
> Flex布局是高频考点，而且是平常开发中最常用的布局方式之一，一定要熟悉。

#### BFC是什么？能解决什么问题？
[什么是BFC？什么条件下会触发？应用场景有哪些？](http://47.98.159.95/my_blog/css/008.html)  
> 关于bfc，可以看看三元大佬总结的文章  
这篇文章里，顺便也把外边距重叠的问题讲了一下。

## JS基础篇
#### 讲讲JS的数据类型？
最新的 ECMAScript 标准定义了 8种数据类型:
* 6 种原始类型
    *  Boolean 
    *  Undefined
    *  Number
    *  BigInt
    *  String
    *  Symbol
* null
* Object
* Function

> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures
#### 讲讲Map和Set？
1. Map的key相比较普通对象来说更为灵活，普通对象的key只能以基础数据类型作为key值，并且所有传入的key值都会被转化成string类型，而Map的key可以是各种数据类型格式。
2. Set可以讲讲它去重的特性。

#### WeakMap和Map之间的区别？
WeakMap只能以复杂数据类型作为key，并且key值是**弱引用**，对于垃圾回收更加友好。
#### 讲讲原型链？
[JavaScript深入之从原型到原型链](https://github.com/mqyqingfeng/Blog/issues/2)
> 关于原型链，虽然现在用的不太多了，但是__proto__和prototype之间的关系，以及对于属性的向上查找这些还是一定要清楚的，其余不用看的太细。

#### 讲讲this？  
[JavaScript中的this](https://juejin.im/post/59748cbb6fb9a06bb21ae36d)  
> 1. this指向调用者这个关系一定要清楚
> 2. 要知道改变this指向的几种方式(call, bind, apply)
> 3. 箭头函数中this的特殊性要能讲清楚

#### 浅拷贝和深拷贝的区别
- 浅拷贝：一般指的是把对象的第一层拷贝到一个新对象上去，比如
```js
var a = { count: 1, deep: { count: 2 } }
var b = Object.assign({}, a)
// 或者
var b = {...a}
```

- 深拷贝：一般需要借助递归实现，如果对象的值还是个对象，要进一步的深入拷贝，完全替换掉每一个复杂类型的引用。  
```js
var deepCopy = (obj) => {
    var ret = {}
    for (var key in obj) {
        var value = obj[key]
        ret[key] = typeof value === 'object' ? deepCopy(value) : value
    }
    return ret
}
```

对于同一个用例来说
```js
// 浅拷贝
var a = { count: 1, deep: { count: 2 } }
var b = {...a}

a.deep.count = 5
b.deep.count // 5
```

```js
var a = { count: 1, deep: { count: 2 } }
var b = deepCopy(a)
a.deep.count = 5
b.deep.count // 2
```

#### 讲讲事件冒泡和事件捕获以及事件代理？
[你真的理解 事件冒泡 和 事件捕获 吗？](https://juejin.im/post/5cc941436fb9a03236394027)

## 框架篇

### React
React需要尽可能的保证熟练。因为作为中级工程师来说，公司可能不会让你去写框架，调性能优化，但是一定是会让你保质保量的完成开发任务的，这需要你能熟练掌握框架。

#### React2019高频面试题  
[2019年17道高频React面试题及详解](https://juejin.im/post/5d5f44dae51d4561df7805b4)
> 这些题可以先过一下，如果暂时不能理解的就先跳过，不需要死磕。
#### 有没有使用过 React Hooks？
- 常用的有哪些？都有什么作用？  
- 如何使用hook在依赖改变的时候重新发送请求？
- 写过自定义hook吗？解决了哪些问题。
- 讲讲React Hooks的闭包陷阱，你是怎么解决的？  

[useEffect 完整指南](https://overreacted.io/zh-hans/a-complete-guide-to-useeffect/)
> 其实关于Hook的问题，把Dan的博文稍微过一遍，基本上就可以和面试官谈笑风生了。

#### 讲讲React中的组件复用？
[【React深入】从Mixin到HOC再到Hook](https://juejin.im/post/5cad39b3f265da03502b1c0a)
> 这篇文章从mixin到HOC到Hook，详细的讲解了React在组件复用中做的一些探索和发展，能把这个好好讲明白，面试官也会对你的React实力刮目相看。 
另外这篇文章中的`高阶组件`和`Hook`本身也是高频考点。

## 工具

### webpack的基础知识
这个系列从基础到优化都有，可以自己选择深入  
[掘金刘小夕的webpack系列](https://juejin.im/post/5e5c65fc6fb9a07cd00d8838)

## 性能优化
### 讲讲web各个阶段的性能优化？
[React 16 加载性能优化指南](https://mp.weixin.qq.com/s/XSvhOF_N0VbuOKStwi0IYw)
> 这个很长，很细节，一样不要死磕其中的某一个点，对于你大概知道的点再巩固一下印象就ok。
### webpack代码分割是怎么做的？
[webpack的代码分割（路由懒加载同理）](https://juejin.im/post/5e796ec1e51d45271e2a9af9)
> 路由懒加载和webpack异步加载模块都是这个import()语法，值得仔细看看。

## 网络
#### 讲讲http的基本结构？  
[http的基础结构](http://47.98.159.95/my_blog/http/001.html#%E8%B5%B7%E5%A7%8B%E8%A1%8C)

#### 说说常用的http状态码？  
[http状态码](http://47.98.159.95/my_blog/http/004.html#_1xx)

#### 浏览器从输入url到渲染页面，发生了什么？  
[细说浏览器输入URL后发生了什么](https://juejin.im/post/5e32449d6fb9a02fe4581907)

#### 讲讲你对cookie的理解？包括SameSite属性。  
[预测最近面试会考 Cookie 的 SameSite 属性](https://juejin.im/post/5e718ecc6fb9a07cda098c2d)
> 这篇文章可以主要讲chrome80新增的cookie的SameSite属性，另外对于cookie整体也可以复习和回顾一遍，非常棒~

#### 谈谈https的原理？为什么https能保证安全？  
[谈谈 HTTPS](https://juejin.im/post/59e4c02151882578d02f4aca)
> https也是一个高频考点，需要过一遍https的加密原理。

#### 谈谈前端的安全知识？XSS、CSRF，以及如何防范。
[寒冬求职之你必须要懂的Web安全](https://juejin.im/post/5cd6ad7a51882568d3670a8e)
> 安全问题也是很多公司必问的，毕竟谁也不希望自己的前端写的网站漏洞百出嘛。

#### 讲讲http的缓存机制吧，强缓存，协商缓存？
[深入理解浏览器的缓存机制](https://www.jianshu.com/p/54cc04190252)
> 浏览器缓存基本上是必问的，这篇文章非常值得一看。 

## 手写系列
### 基础
#### 手写各种原生方法
如何模拟实现一个new的效果？  
如何模拟实现一个 bind 的效果？  
如何实现一个 call/apply 函数？  
[三元-手写代码系列](http://47.98.159.95/my_blog/js-api/001.html)

> 说实话我不太喜欢手写代码的面试题，但是很多公司喜欢考这个，有余力的话还是过一遍吧。

### 进阶
[手写Promise 20行](https://juejin.im/post/5e6f4579f265da576429a907)  
> 精力有限的情况下，就先别背A+规范的promise手写了，但是如果有时间的话，可以大概过一遍文章，然后如果面试的时候考到了，再用简短的方式写出来。  
[剖析Promise内部结构，一步一步实现一个完整的、能通过所有Test case的Promise类](https://github.com/xieranmaya/blog/issues/3)

## ❤️感谢大家
1.如果本文对你有帮助，就点个赞支持下吧，你的「赞」是我创作的动力。

2.关注公众号「前端从进阶到入院」即可加我好友，我拉你进「前端进阶交流群」，大家一起共同交流和进步。

![](https://user-gold-cdn.xitu.io/2020/4/5/17149cc27888eadd?w=910&h=436&f=jpeg&s=78195)
  
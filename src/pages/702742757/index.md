---
title: '深入探索前端路由，手写 react-mini-router'
date: '2020-09-16'
spoiler: ''
---

  ## 前言

前端路由一直是一个很经典的话题，不管是日常的使用还是面试中都会经常遇到。本文通过实现一个简单版的 `react-router` 来一起揭开路由的神秘面纱。

通过本文，你可以学习到：

- 前端路由本质上是什么。
- 前端路由里的一些坑和注意点。
- hash 路由和 history 路由的区别。
- Router 组件和 Route 组件分别是做什么的。

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6b24f563851e41cb9379f3227f824265~tplv-k3u1fbpfcp-zoom-1.image)

## 路由的本质

简单来说，浏览器端路由其实并不是真实的网页跳转（和服务器没有任何交互），而是纯粹在浏览器端发生的一系列行为，本质上来说前端路由就是：

**对 url 进行改变和监听，来让某个 dom 节点显示对应的视图**。

仅此而已。新手不要被路由这个概念给吓到。

## 路由的区别

一般来说，浏览器端的路由分为两种：

1. hash 路由，特征是 url 后面会有 `#` 号，如 `baidu.com/#foo/bar/baz`。
2. history 路由，url 和普通路径没有差异。如 `baidu.com/foo/bar/baz`。

我们已经讲过了路由的本质，那么实际上只需要搞清楚两种路由分别是如何 **改变**，并且组件是如何**监听并完成视图的展示**，一切就真相大白了。

不卖关子，先分别谈谈两种路由用什么样的 api 实现前端路由：

### hash

通过 `location.hash = 'foo'` 这样的语法来**改变**，路径就会由 `baidu.com` 变更为 `baidu.com/#foo`。

通过 `window.addEventListener('hashchange')` 这个事件，就可以**监听**到 `hash` 值的变化。

### history

其实是用了 `history.pushState` 这个 API 语法**改变**，它的语法乍一看比较怪异，先看下 mdn 文档里对它的定义：

> `history.pushState(state, title[, url])`

其中 `state` 代表状态对象，这让我们可以给每个路由记录创建自己的状态，并且它还会序列化后保存在用户的磁盘上，以便用户重新启动浏览器后可以将其还原。

`title` 当前没啥用。

`url` 在路由中最重要的 url 参数反而是个可选参数，放在了最后一位。

通过 `history.pushState({}, '', 'foo')`，可以让 `baidu.com` 变化为 `baidu.com/foo`。

为什么路径更新后，浏览器页面不会重新加载？

这里我们需要思考一个问题，平常通过 `location.href = 'baidu.com/foo'` 这种方式来跳转，是会让浏览器重新加载页面并且请求服务器的，但是 `history.pushState` 的神奇之处就在于它可以让 url 改变，但是不重新加载页面，完全由用户决定如何处理这次 url 改变。

因此，这种方式的前端路由必须在支持 `histroy` API 的浏览器上才可以使用。

为什么刷新后会 404？

本质上是因为刷新以后是带着 `baidu.com/foo` 这个页面去请求服务端资源的，但是服务端并没有对这个路径进行任何的映射处理，当然会返回 404，处理方式是让服务端对于"不认识"的页面,返回 `index.html`，这样这个包含了前端路由相关`js`代码的首页，就会加载你的前端路由配置表，并且此时虽然服务端给你的文件是首页文件，但是你的 url 上是 `baidu.com/foo`，前端路由就会加载 `/foo` 这个路径相对应的视图，完美的解决了 404 问题。

`history` 路由的**监听**也有点坑，浏览器提供了 `window.addEventListener('popstate')` 事件，但是它只能监听到浏览器回退和前进所产生的路由变化，对于主动的 `pushState` 却监听不到。解决方案当然有，下文实现 `react-router` 的时候再细讲~

## 实现 react-mini-router

本文实现的 `react-router` 基于 `history` 版本，用最小化的代码还原路由的主要功能，所以不会有正则匹配或者嵌套子路由等高阶特性，回归本心，从零到一实现最简化的版本。

### 实现 history

对于 `history` 难用的官方 API，我们专门抽出一个小文件对它进行一层封装，对外提供：

1. `history.push`。
2. `history.listen`。

这两个 API，减轻用户的心智负担。

我们利用`观察者模式`封装了一个简单的 `listen` API，让用户可以监听到 `history.push` 所产生的路径改变。

```ts
// 存储 history.listen 的回调函数
let listeners: Listener[] = [];
function listen(fn: Listener) {
  listeners.push(fn);
  return function() {
    listeners = listeners.filter(listener => listener !== fn);
  };
}
```

这样外部就可以通过：

```ts
history.listen(location => {
  console.log('changed', location);
});
```

这样的方式感知到路由的变化了，并且在 `location` 中，我们还提供了 `state`、`pathname`、`search` 等关键的信息。

实现改变路径的核心方法 `push` 也很简单：

```ts
function push(to: string, state?: State) {
  // 解析用户传入的 url
  // 分解成 pathname、search 等信息
  location = getNextLocation(to, state);
  // 调用原生 history 的方法改变路由
  window.history.pushState(state, '', to);
  // 执行用户传入的监听函数
  listeners.forEach(fn => fn(location));
}
```

在 `history.push('foo')` 的时候，本质上就是调用了 `window.history.pushState` 去改变路径，并且通知 `listen` 所挂载的回调函数去执行。

当然，别忘了用户点击浏览器后退前进按钮的行为，也需要用 `popstate` 这个事件来监听，并且执行同样的处理：

```js
// 用于处理浏览器前进后退操作
window.addEventListener('popstate', () => {
  location = getLocation();
  listeners.forEach(fn => fn(location));
});
```

接下来我们需要实现 `Router` 和 `Route` 组件，你就会看到它们是如何和这个简单的 `history` 库结合使用了。

### 实现 Router

Router 的核心原理就是通过 `Provider` 把 `location` 和 `history` 等路由关键信息传递给子组件，并且在路由发生变化的时候要让子组件可以感知到：

```tsx
import React, { useState, useEffect, ReactNode } from 'react';
import { history, Location } from './history';
interface RouterContextProps {
  history: typeof history;
  location: Location;
}

export const RouterContext = React.createContext<RouterContextProps | null>(
  null,
);

export const Router: React.FC = ({ children }) => {
  const [location, setLocation] = useState(history.location);
  // 初始化的时候 订阅 history 的变化
  // 一旦路由发生改变 就会通知使用了 useContext(RouterContext) 的子组件去重新渲染
  useEffect(() => {
    const unlisten = history.listen(location => {
      setLocation(location);
    });
    return unlisten;
  }, []);

  return (
    <RouterContext.Provider value={{ history, location }}>
      {children}
    </RouterContext.Provider>
  );
};
```

注意看注释的部分，我们在组件初始化的时候利用 `history.listen` 监听了路由的变化，一旦路由发生改变，就会调用 `setLocation` 去更新 `location` 并且通过 `Provider` 传递给子组件。

并且这一步也会触发 `Provider` 的 `value` 值的变化，通知所有用 `useContext` 订阅了 `history` 和 `location` 的子组件去重新 `render`。

## 实现 Route

`Route` 组件接受 `path` 和 `children` 两个 `prop`，本质上就决定了在某个路径下需要渲染什么组件，我们又可以通过 `Router` 的 `Provider` 传递下来的 `location` 信息拿到当前路径，所以这个组件需要做的就是判断当前的路径是否匹配，渲染对应组件。

```tsx
import { ReactNode } from 'react';
import { useLocation } from './hooks';

interface RouteProps {
  path: string;
  children: ReactNode;
}

export const Route = ({ path, children }: RouteProps) => {
  const { pathname } = useLocation();
  const matched = path === pathname;

  if (matched) {
    return children;
  }
  return null;
};
```

这里的实现比较简单，路径直接用了全等，实际上真正的实现考虑的情况比较复杂，使用了 `path-to-regexp` 这个库去处理动态路由等情况，但是核心原理其实就是这么简单。

## 实现 useLocation、useHistory

这里就很简单了，利用 `useContext` 简单封装一层，拿到 `Router` 传递下来的 `history` 和 `location` 即可。

```tsx
import { useContext } from 'react';
import { RouterContext } from './Router';

export const useHistory = () => {
  return useContext(RouterContext)!.history;
};

export const useLocation = () => {
  return useContext(RouterContext)!.location;
};
```

## 实现验证 demo

至此为止，以下的路由 demo 就可以跑通了：

```tsx
import React, { useEffect } from 'react';
import { Router, Route, useHistory } from 'react-mini-router';

const Foo = () => 'foo';
const Bar = () => 'bar';

const Links = () => {
  const history = useHistory();

  const go = (path: string) => {
    const state = { name: path };
    history.push(path, state);
  };

  return (
    <div className="demo">
      <button onClick={() => go('foo')}>foo</button>
      <button onClick={() => go('bar')}>bar</button>
    </div>
  );
};

export default () => {
  return (
    <div>
      <Router>
        <Links />
        <Route path="foo">
          <Foo />
        </Route>
        <Route path="bar">
          <Bar />
        </Route>
      </Router>
    </div>
  );
};
```

  
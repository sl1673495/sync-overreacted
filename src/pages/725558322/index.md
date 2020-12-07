---
title: 'React 的一些技巧'
date: '2020-10-20'
spoiler: ''
---

  ## 前言

我工作中的技术栈主要是 `React + TypeScript`，这篇文章我想总结一下如何在项目中运用 React 的一些技巧解决一些实际问题，本文中使用的代码都是简化后的，不代表生产环境。生产环境的代码肯定比文中的例子要复杂很多，但是简化后的思想应该是相通的。

## 取消请求

React 中当前正在发出请求的组件从页面上卸载了，理想情况下这个请求也应该取消掉，那么如何把请求的取消和页面的卸载关联在一起呢？

这里要考虑利用 useEffect 传入函数的返回值：

```js
useEffect(() => {
  return () => {
    // 页面卸载时执行
  };
}, []);
```

假设我们的请求是利用 fetch，那么还有一个需要运用的知识点：[`AbortController`](https://developer.mozilla.org/zh-CN/docs/Web/API/FetchController)，简单看一下它的用法：

```js
const abortController = new AbortController();

fetch(url, {
  // 这里传入 signal 进行关联
  signal: abortController.signal,
});

// 这里调用 abort 即可取消请求
abortController.abort();
```

那么结合 React 封装一个 `useFetch` 的 hook：

```js
export function useFetch = (config, deps) => {
  const abortController = new AbortController()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState()

  useEffect(() => {
    setLoading(true)
    fetch({
      ...config,
      signal: abortController.signal
    })
      .then((res) => setResult(res))
      .finally(() => setLoading(false))
  }, deps)

  useEffect(() => {
    return () => abortController.abort()
  }, [])

  return { result, loading }
}
```

那么比如在路由发生切换，Tab 发生切换等场景下，被卸载掉的组件发出的请求也会被中断。

## 深比较依赖

在使用 useEffect 等需要传入依赖的 hook 时，最理想的状况是所有依赖都在真正发生变化的时候才去改变自身的引用地址，但是有些依赖不太听话，每次渲染都会重新生成一个引用，但是内部的值却没变，这可能会让 useEffect 对于依赖的「浅比较」没法正常工作。

比如说：

```js
const getDep = () => {
  return {
    foo: 'bar',
  };
};

useEffect(() => {
  // 无限循环了
}, [getDep()]);
```

这是一个人为的例子，由于 getDeps 函数返回的对象每次执行都是一个全新的引用，所以会导致触发渲染->effect->渲染->effect 的无限更新。

有一个比较取巧的解决办法，把依赖转为字符串：

```js
const getDep = () => {
  return {
    foo: 'bar',
  };
};

const dep = JSON.stringify(getDeps());

useEffect(() => {
  // ok!
}, [dep]);
```

这样对比的就是字符串 `"{ foo: 'bar' }"` 的值，而不是对象的引用，那么只有在值真正发生变化时才会触发更新。

当然最好还是用社区提供的方案：`useDeepCompareEffect`，它选用**深比较**策略，对于对象依赖来说，它逐个对比 key 和 value，在性能上会有所牺牲。

如果你的某个依赖触发了多次无意义的接口请求，那么宁愿选用 `useDeepCompareEffect` ，在对象比较上多花费些时间可比重复请求接口要好得多。

`useDeepCompareEffect` 大致原理：

```js
import { isEqual } from 'lodash';
export function useDeepCompareEffect(fn, deps) {
  const trigger = useRef(0);
  const prevDeps = useRef(deps);
  if (!isEqual(prevDeps.current, deps)) {
    trigger.current++;
  }
  prevDeps.current = deps;
  return useEffect(fn, [trigger.current]);
}
```

真正传入 `useEffect` 用以更新的是 `trigger` 这个数字值。用`useRef` 保留上一次传入的依赖，每次都利用 lodash 的 isEqual 对本次依赖和旧依赖进行**深比较**，如果发生变化，则让 `trigger` 的值增加。

当然我们也可以用 [`fast-deep-equal`](https://github.com/epoberezkin/fast-deep-equal) 这个库，根据官方的 benchmark 对比，它比 lodash 的效率高 7 倍左右。

## 以 URL 为数据仓库

在公司内部的后台管理项目中，无论你做的系统面向的人群是运营还是开发，都会涉及到分享，那么保留「页面状态」就非常重要了。比如我是运营 A，在使用一个内部数据平台，我一定是想向运营 B 分享某 App 的消费数据的第二页，并且筛选为某个用户的**状态**的网页，并且进行讨论。那么状态和 URL 同步就尤为重要了。

在传统的状态管理思路中，我们需要在代码里用`redux`、`recoil`等库去做一系列的数据管理，但是如果把 URL 后面的那串 query 想象成数据仓库呢？是不是也可以，尝试配合`react-router`封装一下。

```js
export function useQuery() {
  const history = useHistory();
  const { search, pathname } = useLocation();
  // 保存query状态
  const queryState = useRef(qs.parse(search));
  // 设置query
  const setQuery = handler => {
    const nextQuery = handler(queryState.current);
    queryState.current = nextQuery;
    // replace会使组件重新渲染
    history.replace({
      pathname: pathname,
      search: qs.stringify(nextQuery),
    });
  };
  return [queryState.current, setQuery];
}
```

在组件中，可以这样使用：

```js
const [query, setQuery] = useQuery();

// 接口请求依赖 page 和 size
useEffect(() => {
  api.getUsers();
}, [query.page, query, size]);

// 分页改变 触发接口重新请求
const onPageChange = page => {
  setQuery(prevQuery => ({
    ...prevQuery,
    page,
  }));
};
```

这样，所有的页面状态更改都会自动同步到 URL，非常方便。

## 利用 AST 做国际化

国际化中最头疼的就是手动去替换代码中的文本，转为 `i18n.t(key)` 这种国际化方法调用，而这一步则可以交给 Babel AST 去完成。扫描出代码中需要替换文本的位置，修改 AST 把它转为方法调用即可，比较麻烦的点在于需要考虑各种边界情况，我写过一个比较简单的例子，仅供参考：

https://github.com/sl1673495/babel-ast-practise/blob/master/i18n.js

这样的一段源代码：

```js
import React from 'react';
import { Button, Toast, Popover } from 'components';
const Comp = props => {
  const tips = () => {
    Toast.info('这是一段提示');
    Toast({
      text: '这是一段提示',
    });
  };
  return (
    <div>
      <Button onClick={tips}>这是按钮</Button>
      <Popover tooltip="气泡提示" />
    </div>
  );
};
export default Comp;
```

经过处理后，转变为这样：

```js
import React from 'react';
import { useI18n } from 'react-intl';
import { Button, Toast, Popover } from 'components';
const Comp = props => {
  const { t } = useI18n();
  const tips = () => {
    Toast.info(t('tips'));
    Toast({
      text: t('tips'),
    });
  };
  return (
    <div>
      <Button onClick={tips}>{t('btn')}</Button>
      <Popover tooltip={t('popover')} />
    </div>
  );
};
export default Comp;
```

放一段脚本的 `traverse` 部分：

```js
// 遍历ast
traverse(ast, {
  Program(path) {
    // i18n的import导入 一般第一项一定是import React 所以直接插入在后面就可以
    path.get('body.0').insertAfter(makeImportDeclaration(I18_HOOK, I18_LIB));
  },
  // 通过找到第一个jsxElement 来向上寻找Component函数并且插入i18n的hook函数
  JSXElement(path) {
    const functionParent = path.getFunctionParent();
    const functionBody = functionParent.node.body.body;
    if (!this.hasInsertUseI18n) {
      functionBody.unshift(
        buildDestructFunction({
          VALUE: t.identifier(I18_FUNC),
          SOURCE: t.callExpression(t.identifier(I18_HOOK), []),
        })
      );
      this.hasInsertUseI18n = true;
    }
  },
  // jsx中的文字 直接替换成{t(key)}的形式
  JSXText(path) {
    const { node } = path;
    const i18nKey = findI18nKey(node.value);
    if (i18nKey) {
      node.value = `{${I18_FUNC}("${i18nKey}")}`;
    }
  },
  // Literal找到的可能是函数中调用参数的文字 也可能是jsx属性中的文字
  Literal(path) {
    const { node } = path;
    const i18nKey = findI18nKey(node.value);
    if (i18nKey) {
      if (path.parent.type === 'JSXAttribute') {
        path.replaceWith(
          t.jsxExpressionContainer(makeCallExpression(I18_FUNC, i18nKey))
        );
      } else {
        if (t.isStringLiteral(node)) {
          path.replaceWith(makeCallExpression(I18_FUNC, i18nKey));
        }
      }
    }
  },
});
```

当然，实际项目中还需要考虑文案翻译的部分，如何建立平台，如何和运营或者翻译专员协作。

以及 AST 处理各种各样的边界情况，肯定要复杂的多，以上只是简化版的思路。

## 总结

进入大厂搬砖也有 3 个月了，对这里的感受就是人才的密度是真的很高，可以看到社区的很多大佬在内部前端群里讨论最前沿的问题，甚至如果你和他在一个楼层，你还可以现实里跑过去和他面基，请教问题，这种感觉真的很棒。有一次我遇到了一个 TS 上的难题，就直接去对面找某个知乎上比较出名的大佬讨论解决（厚脸皮）。

在之后的工作中，对于学到的知识点我也会进行进一步的总结，发一些有价值的文章，感兴趣的话欢迎关注~
  
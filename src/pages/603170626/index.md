---
title: 'Vue3 究竟好在哪里？（和 React Hook 的详细对比）'
date: '2020-04-20'
spoiler: ''
---

  ## 前言

这几天 Vue 3.0 Beta 版本发布了，本以为是皆大欢喜的一件事情，但是论坛里还是看到了很多反对的声音。主流的反对论点大概有如下几点：

1. 意大利面代码结构吐槽：

> “太失望了。杂七杂八一堆丢在 setup 里，我还不如直接用 react”

> 我的天，3.0 这么搞的话，代码结构不清晰，语义不明确，无异于把 vue 自身优点都扔了

> 怎么感觉代码结构上没有 2.0 清晰了呢 😂 这要是代码量上去了是不是不好维护啊

2. 抄袭 React 吐槽：

> 抄来抄去没自己的个性

> 有 react 香吗？越来越像 react 了

在我看来，Vue 黑暗的一天还远远没有过去，很多人其实并没有认真的去看 `Vue-Composition-Api` 文档中的 `动机` 章节，本文就以[这个章节](https://vue-composition-api-rfc.netlify.app/#logic-reuse-code-organization)为线索，从 `代码结构`、`底层原理` 等方面来一一打消大家的一些顾虑。

在文章的开头，首先要标明一下作者的立场，我对于 React 和 Vue 都非常的喜欢。他们都有着各自的优缺点，本文绝无引战之意。两个框架都很棒！只是各有优缺点而已。React 的 Immutable 其实也带来了很多益处，并且 Hook 的思路还是 Facebook 团队的大佬们首创的，真的是很让人赞叹的设计，我对 React 100% 致敬！

## 设计动机

大如 Vue3 这种全球热门的框架，任何一个 `breaking-change` 的设计一定有它的深思熟虑和权衡，那么 `composition-api` 出现是为了解决什么问题呢？这是一个我们需要首先思考明白的问题。

首先抛出 Vue2 的代码模式下存在的几个问题。

1. 随着功能的增长，复杂组件的代码变得越来越难以维护。 尤其发生你去新接手别人的代码时。 根本原因是 Vue 的现有 API 通过「选项」组织代码，但是在大部分情况下，通过逻辑考虑来组织代码更有意义。
2. 缺少一种比较「干净」的在多个组件之间提取和复用逻辑的机制。
3. 类型推断不够友好。

### 逻辑重用

相信很多接触过 React Hook 的小伙伴已经对这种模式下组件间逻辑复用的简单性有了一定的认知，自从 React 16.7 发布以来，社区涌现出了海量的 Hook 轮子，以及主流的生态库 `react-router`，`react-redux` 等等全部拥抱 Hook，都可以看出社区的同好们对于 Hook 开发机制的赞同。

其实组件逻辑复用在 React 中是经历了很长的一段发展历程的，
`mixin` -> `HOC & render-props` -> `Hook`，`mixin` 是 React 中最早启用的一种逻辑复用方式，因为它的缺点实在是[多到数不清](https://www.zhihu.com/question/67588479)，而后面的两种也有着自己的问题，比如增加组件嵌套啊、props 来源不明确啊等等。可以说到目前为止，Hook 是相对完美的一种方案。

当然，我的一贯风格就是上代码对比，我就拿 HOC 来说吧，Github 上的一个真实的开源项目里就出现了这样的场景：

#### HOC 对比 Hook

```js
class MenuBar extends React.Component {
  // props 里混合着来自各个HOC传入的属性，还有父组件传入的属性。
  handleClickNew() {
    const readyToReplaceProject = this.props.confirmReadyToReplaceProject(
      this.props.intl.formatMessage(sharedMessages.replaceProjectWarning)
    );
    this.props.onRequestCloseFile();
    if (readyToReplaceProject) {
      this.props.onClickNew(this.props.canSave && this.props.canCreateNew);
    }
    this.props.onRequestCloseFile();
  }
  handleClickRemix() {
    this.props.onClickRemix();
    this.props.onRequestCloseFile();
  }
  handleClickSave() {
    this.props.onClickSave();
    this.props.onRequestCloseFile();
  }
  handleClickSaveAsCopy() {
    this.props.onClickSaveAsCopy();
    this.props.onRequestCloseFile();
  }
}

export default compose(
  // 国际化
  injectIntl,
  // 菜单
  MenuBarHOC,
  // react-redux
  connect(mapStateToProps, mapDispatchToProps)
)(MenuBar);
```

没错，这里用 compose 函数组合了好几个 HOC，其中还有 connect 这种 `接受几个参数返回一个接受组件作为函数的函数` 这种东西，如果你是新上手（或者哪怕是 React 老手）这套东西的人，你会在 「这个 props 是从哪个 HOC 里来的？」，「这个 props 是外部传入的还是 HOC 里得到的？」这些问题中迷失了大脑，最终走向堕落（误）。

不谈 HOC，我的脑子已经快炸开来了，来看看用 Hook 的方式复用逻辑是怎么样的场景吧？

```js
function MenuBar(props) {
  // props 里只包含父组件传入的属性
  const { show } = props;
  // 菜单
  const { onClickRemix, onClickNew } = useMenuBar();
  // 国际化
  const { intl } = useIntl();
  // react-redux
  const { user } = useSelector((store) => store.user);
}

export default MenuBar;
```

一切都变得很明朗，我可以非常清楚的知道这个方法的来源，`intl` 是哪里注入进来的，点击了 `useMenuBar` 后，就自动跳转到对应的逻辑，维护和可读性都极大的提高了。

当然，这是一个比较「刻意」的例子，但是相信我，我在 React 开发中已经体验过这种收益了。随着组件的「职责」越来越多，只要你掌握了这种代码组织的思路，那么你的组件并不会膨胀到不可读。

#### 常见的请求场景

再举个非常常见的请求场景。

在 Vue2 中如果我需要请求一份数据，并且在`loading`和`error`时都展示对应的视图，一般来说，我们会这样写：

```xml
<template>
    <div v-if="error">failed to load</div>
    <div v-else-if="loading">loading...</div>
    <div v-else>hello {{fullName}}!</div>
</template>

<script>
import { createComponent, computed } from 'vue'

export default {
  data() {
    // 集中式的data定义 如果有其他逻辑相关的数据就很容易混乱
    return {
        data: {
            firstName: '',
            lastName: ''
        },
        loading: false,
        error: false,
    },
  },
  async created() {
      try {
        // 管理loading
        this.loading = true
        // 取数据
        const data = await this.$axios('/api/user')
        this.data = data
      } catch (e) {
        // 管理error
        this.error = true
      } finally {
        // 管理loading
        this.loading = false
      }
  },
  computed() {
      // 没人知道这个fullName和哪一部分的异步请求有关 和哪一部分的data有关 除非仔细阅读
      // 在组件大了以后更是如此
      fullName() {
          return this.data.firstName + this.data.lastName
      }
  }
}
</script>
```

这段代码，怎么样都谈不上优雅，凑合的把功能完成而已，并且对于`loading`、`error`等处理的可复用性为零。

数据和逻辑也被分散在了各个`option`中，这还只是一个逻辑，如果又多了一些逻辑，多了`data`、`computed`、`methods`？如果你是一个新接手这个文件的人，你如何迅速的分辨清楚这个`method`是和某两个`data`中的字段关联起来的？

让我们把[zeit/swr](https://github.com/zeit/swr)的逻辑照搬到 Vue3 中，

看一下`swr`在 Vue3 中的表现：

```xml
<template>
    <div v-if="error">failed to load</div>
    <div v-else-if="loading">loading...</div>
    <div v-else>hello {{fullName}}!</div>
</template>

<script>
import { createComponent, computed } from 'vue'
import useSWR from 'vue-swr'

export default createComponent({
  setup() {
      // useSWR帮你管理好了取数、缓存、甚至标签页聚焦重新请求、甚至Suspense...
      const { data, loading, error } = useSWR('/api/user', fetcher)
      // 轻松的定义计算属性
      const fullName = computed(() => data.firstName + data.lastName)
      return { data, fullName, loading, error }
  }
})
</script>
```

就是这么简单，对吗？逻辑更加聚合了。

对了，顺嘴一提， `use-swr` 的威力可远远不止看到的这么简单，随便举几个它的能力：

1. 间隔轮询

2. 请求重复数据删除

3. 对于同一个 key 的数据进行缓存

4. 对数据进行乐观更新

5. 在标签页聚焦的时候重新发起请求

6. 分页支持

7. 完备的 TypeScript 支持

等等等等……而这么多如此强大的能力，都在一个小小的 `useSWR()` 函数中，谁能说这不是魔法呢？

类似的例子还数不胜数。

[umi-hooks](https://link.zhihu.com/?target=http%3A//github.com/umijs/hooks)

[react-use](https://github.com/streamich/react-use)

### 代码组织

上面说了那么多，还只是说了 Hook 的其中一个优势。这其实并不能解决「意大利面条代码」的问题。当逻辑多起来以后，组件的逻辑会糅合在一起变得一团乱麻吗？

#### 从获取鼠标位置的需求讲起

我们有这样一个跨组件的需求，我想在组件里获得一个响应式的变量，能实时的指向我鼠标所在的位置。

Vue 官方给出的自定义 Hook 的例子是这样的：

```js
import { ref, onMounted, onUnmounted } from "vue";

export function useMousePosition() {
  const x = ref(0);
  const y = ref(0);

  function update(e) {
    x.value = e.pageX;
    y.value = e.pageY;
  }

  onMounted(() => {
    window.addEventListener("mousemove", update);
  });

  onUnmounted(() => {
    window.removeEventListener("mousemove", update);
  });

  return { x, y };
}
```

在组件中使用：

```js
import { useMousePosition } from "./mouse";

export default {
  setup() {
    const { x, y } = useMousePosition();
    // other logic...
    return { x, y };
  },
};
```

就这么简单，无需多言。在任何组件中我们需要「获取响应式的鼠标位置」，并且和我们的「视图层」关联起来的时候，仅仅需要简单的一句话即可。并且这里返回的 `x`、`y` 是由 `ref` 加工过的响应式变量，我们可以用 `watch` 监听它们，可以把它们传递给其他的自定义 Hook 继续使用。几乎能做到你想要的一切，只需要发挥你的想象力。

#### 从 Vue 官方的例子讲起

上面的例子足够入门和精简，让我们来到现实世界。举一个 [Vue CLI UI file explorer](https://github.com/vuejs/vue-cli/blob/a09407dd5b9f18ace7501ddb603b95e31d6d93c0/packages/@vue/cli-ui/src/components/folder/FolderExplorer.vue#L198-L404) 官方吐槽的例子，这个组件是 Vue-CLI 的 gui 中（也就是平常我们命令行里输入 `vue ui` 出来的那个图形化控制台）的一个复杂的文件浏览器组件，这是 Vue 官方团队的大佬写的，相信是比较有说服力的一个案例了。

这个组件有以下的几个功能：

1. 跟踪当前文件夹状态并显示其内容

2. 处理文件夹导航（打开，关闭，刷新...）

3. 处理新文件夹的创建

4. 切换显示收藏夹

5. 切换显示隐藏文件夹

6. 处理当前工作目录更改

文档中提出了一个尖锐的灵魂之问，你作为一个新接手的开发人员，能够在茫茫的 `method`、`data`、`computed` 等选项中一目了然的发现这个变量是属于哪个功能吗？比如「创建新文件夹」功能使用了两个数据属性，一个计算属性和一个方法，其中该方法在距数据属性「一百行以上」的位置定义。

当一个组价中，维护同一个逻辑需要跨越上百行的「空间距离」的时候，即使是让我去维护 Vue 官方团队的代码，我也会暗搓搓的吐槽一句，「这写的什么玩意，这变量干嘛用的！」

尤大很贴心的给出了一张图，在这张图中，不同的色块代表着不同的功能点。

![](https://user-gold-cdn.xitu.io/2020/4/20/17194f60261ac9e6?w=262&h=1016&f=png&s=128194)

其实已经做的不错了，但是在维护起来的时候还是挺灾难的，比如淡蓝色的那个色块代表的功能。我想要完整的理清楚它的逻辑，需要「上下反复横跳」，类似的事情我已经经历过好多次了。

而使用 Hook 以后呢？我们可以把「新建文件夹」这个功能美美的抽到一个函数中去：

```js
function useCreateFolder(openFolder) {
  // originally data properties
  const showNewFolder = ref(false);
  const newFolderName = ref("");

  // originally computed property
  const newFolderValid = computed(() => isValidMultiName(newFolderName.value));

  // originally a method
  async function createFolder() {
    if (!newFolderValid.value) return;
    const result = await mutate({
      mutation: FOLDER_CREATE,
      variables: {
        name: newFolderName.value,
      },
    });
    openFolder(result.data.folderCreate.path);
    newFolderName.value = "";
    showNewFolder.value = false;
  }

  return {
    showNewFolder,
    newFolderName,
    newFolderValid,
    createFolder,
  };
}
```

我们约定这些「自定义 Hook」以 `use` 作为前缀，和普通的函数加以区分。

右边用了 Hook 以后的代码组织色块：

![](https://user-gold-cdn.xitu.io/2020/4/20/17194f848bf2cf10?w=1200&h=1201&f=png&s=254247)

我们想要维护紫色部分功能的逻辑，那就在紫色的部分去找就好了，反正不会有其他「色块」里的变量或者方法影响到它，很快咱就改好了需求，6 点准时下班！

这是 Hook 模式下的组件概览，真的是一目了然。感觉我也可以去维护 `@vue/ui` 了呢（假的）。

```js
export default {
  setup() {
    // ...
  },
};

function useCurrentFolderData(networkState) {
  // ...
}

function useFolderNavigation({ networkState, currentFolderData }) {
  // ...
}

function useFavoriteFolder(currentFolderData) {
  // ...
}

function useHiddenFolders() {
  // ...
}

function useCreateFolder(openFolder) {
  // ...
}
```

再来看看被吐槽成「意大利面条代码」的 `setup` 函数。

```js
export default {
  setup() {
    // Network
    const { networkState } = useNetworkState();

    // Folder
    const { folders, currentFolderData } = useCurrentFolderData(networkState);
    const folderNavigation = useFolderNavigation({ networkState, currentFolderData });
    const { favoriteFolders, toggleFavorite } = useFavoriteFolders(currentFolderData);
    const { showHiddenFolders } = useHiddenFolders();
    const createFolder = useCreateFolder(folderNavigation.openFolder);

    // Current working directory
    resetCwdOnLeave();
    const { updateOnCwdChanged } = useCwdUtils();

    // Utils
    const { slicePath } = usePathUtils();

    return {
      networkState,
      folders,
      currentFolderData,
      folderNavigation,
      favoriteFolders,
      toggleFavorite,
      showHiddenFolders,
      createFolder,
      updateOnCwdChanged,
      slicePath,
    };
  },
};
```

这是谁家的小仙女这么美啊！这逻辑也太清晰明了，和意大利面没半毛钱关系啊！

## 对比

### Hook 和 Mixin & HOC 对比

说到这里，还是不得不把官方对于「Mixin & HOC 模式」所带来的缺点整理一下。

1. 渲染上下文中公开的属性的来源不清楚。 例如，当使用多个 mixin 读取组件的模板时，可能很难确定从哪个 mixin 注入了特定的属性。
2. 命名空间冲突。 Mixins 可能会在属性和方法名称上发生冲突，而 HOC 可能会在预期的 prop 名称上发生冲突。
3. 性能问题，HOC 和无渲染组件需要额外的有状态组件实例，这会降低性能。

而 「Hook」模式带来的好处则是：

1. 暴露给模板的属性具有明确的来源，因为它们是从 Hook 函数返回的值。
2. Hook 函数返回的值可以任意命名，因此不会发生名称空间冲突。
3. 没有创建仅用于逻辑重用的不必要的组件实例。

当然，这种模式也存在一些缺点，比如 `ref` 带来的心智负担，详见[drawbacks](https://vue-composition-api-rfc.netlify.app/#drawbacks)。

### React Hook 和 Vue Hook 对比

其实 React Hook 的限制非常多，比如官方文档中就专门有一个[章节](https://zh-hans.reactjs.org/docs/hooks-rules.html)介绍它的限制：

1. 不要在循环，条件或嵌套函数中调用 Hook
2. 确保总是在你的 React 函数的最顶层调用他们。
3. 遵守这条规则，你就能确保 Hook 在每一次渲染中都按照同样的顺序被调用。这让 React 能够在多次的 useState 和 useEffect 调用之间保持 hook 状态的正确。

而 Vue 带来的不同在于：

1. 与 React Hooks 相同级别的逻辑组合功能，但有一些重要的区别。 与 React Hook 不同，`setup` 函数仅被调用一次，这在性能上比较占优。

2. 对调用顺序没什么要求，每次渲染中不会反复调用 Hook 函数，产生的的 GC 压力较小。

3. 不必考虑几乎总是需要 useCallback 的问题，以防止传递`函数prop`给子组件的引用变化，导致无必要的重新渲染。

4. React Hook 有臭名昭著的闭包陷阱问题（甚至成了一道热门面试题，omg），如果用户忘记传递正确的依赖项数组，useEffect 和 useMemo 可能会捕获过时的变量，这不受此问题的影响。 Vue 的自动依赖关系跟踪确保观察者和计算值始终正确无误。

5. 不得不提一句，React Hook 里的「依赖」是需要你去手动声明的，而且官方提供了一个 eslint 插件，这个插件虽然大部分时候挺有用的，但是有时候也特别烦人，需要你手动加一行丑陋的注释去关闭它。

我们认可 React Hooks 的创造力，这也是 Vue-Composition-Api 的主要灵感来源。上面提到的问题确实存在于 React Hook 的设计中，我们注意到 Vue 的响应式模型恰好完美的解决了这些问题。

顺嘴一题，React Hook 的心智负担是真的很严重，如果对此感兴趣的话，请参考：

使用 react hooks 带来的收益抵得过使用它的成本吗? - 李元秋的回答 - 知乎
https://www.zhihu.com/question/350523308/answer/858145147

并且我自己在实际开发中，也遇到了很多问题，尤其是在我想对组件用 `memo` 进行一些性能优化的时候，闭包的问题爆炸式的暴露了出来。最后我用 `useReducer` 大法解决了其中很多问题，让我不得不怀疑这从头到尾会不会就是 `Dan` 的阴谋……（别想逃过 `reducer`）

[React Hook + TS 购物车实战（性能优化、闭包陷阱、自定义 hook）](https://juejin.im/post/5e5a57b0f265da575b1bc055)

## 原理

既然有对比，那就从原理的角度来谈一谈两者的区别，

在 Vue 中，之所以 `setup` 函数只执行一次，后续对于数据的更新也可以驱动视图更新，归根结底在于它的「响应式机制」，比如我们定义了这样一个响应式的属性：

### Vue

```xml
<template>
  <div>
    <span>{{count}}</span>
    <button @click="add"> +1 </button>
  </div>
</template>

export default {
    setup() {
        const count = ref(0)

        const add = () => count.value++

        return { count, add }
    }
}
```

这里虽然只执行了一次 `setup` 但是 `count` 在原理上是个 「响应式对象」，对于其上 `value` 属性的改动，

是会触发「由 template 编译而成的 render 函数」 的重新执行的。

如果需要在 `count` 发生变化的时候做某件事，我们只需要引入 `effect` 函数：

```xml
<template>
  <div>
    <span>{{count}}</span>
    <button @click="add"> +1 </button>
  </div>
</template>

export default {
    setup() {
        const count = ref(0)

        const add = () => count.value++

        effect(function log(){
            console.log('count changed!', count.value)
        })

        return { count, add }
    }
}
```

这个 `log` 函数只会产生一次，这个函数在读取 `count.value` 的时候会收集它作为依赖，那么下次 `count.value` 更新后，自然而然的就能触发 `log` 函数重新执行了。

仔细思考一下这之间的数据关系，相信你很快就可以理解为什么它可以只执行一次，但是却威力无穷。

实际上 Vue3 的 Hook 只需要一个「初始化」的过程，也就是 `setup`，命名很准确。它的关键字就是「只执行一次」。

### React

同样的逻辑在 React 中，则是这样的写法：

```js
export default function Counter() {
  const [count, setCount] = useState(0);

  const add = () => setCount((prev) => prev + 1);

  // 下文讲解用
  const [count2, setCount2] = useState(0);

  return (
    <div>
      <span>{count}</span>
      <button onClick={add}> +1 </button>
    </div>
  );
}
```

它是一个函数，而父组件引入它是通过 `<Counter />` 这种方式引入的，实际上它会被编译成 `React.createElement(Counter)` 这样的函数执行，也就是说每次渲染，这个函数都会被完整的执行一次。

而 `useState` 返回的 `count` 和 `setCount` 则会被保存在组件对应的 `Fiber` 节点上，每个 React 函数每次执行 Hook 的顺序必须是相同的，举例来说。 这个例子里的 `useState` 在初次执行的时候，由于执行了两次 `useState`，会在 `Fiber` 上保存一个 `{ value, setValue } -> { value2, setValue2 }` 这样的链表结构。

而下一次渲染又会执行 `count 的 useState`、 `count2 的 useState`，那么 React 如何从 `Fiber` 节点上找出上次渲染保留下来的值呢？当然是只能按顺序找啦。

第一次执行的 useState 就拿到第一个 `{ value, setValue }`，第二个执行的就拿到第二个 `{ value2, setValue2 }`，

这也就是为什么 React 严格限制 Hook 的执行顺序和禁止条件调用。

假如第一次渲染执行两次 useState，而第二次渲染时第一个 useState 被 if 条件判断给取消掉了，那么第二个 `count2 的 useState` 就会拿到链表中第一条的值，完全混乱了。

如果在 React 中，要监听 `count` 的变化做某些事的话，会用到 `useEffect` 的话，那么下次 `render`

之后会把前后两次 `render` 中拿到的 `useEffect` 的第二个参数 `deps` 依赖值进行一个逐项的浅对比（对前后每一项依次调用 Object.is），比如

```js
export default function Counter() {
  const [count, setCount] = useState(0);

  const add = () => setCount((prev) => prev + 1);

  useEffect(() => {
    console.log("count updated!", count);
  }, [count]);

  return (
    <div>
      <span>{count}</span>
      <button onClick={add}> +1 </button>
    </div>
  );
}
```

那么，当 React 在渲染后发现 `count` 发生了变化，会执行 `useEffect` 中的回调函数。（细心的你可以观察出来，每次渲染都会重新产生一个函数引用，也就是 useEffect 的第一个参数）。

是的，React 还是不可避免的引入了 `依赖` 这个概念，但是这个 `依赖` 是需要我们去手动书写的，实时上 React 社区所讨论的「心智负担」也基本上是由于这个 `依赖` 所引起的……

由于每次渲染都会不断的执行并产生闭包，那么从性能上和 GC 压力上都会稍逊于 Vue3。它的关键字是「每次渲染都重新执行」。

## 关于抄袭 React Hook

其实前端开源界谈抄袭也不太好，一种新的模式的出现的值得框架之间相互借鉴和学习的，毕竟框架归根结底的目的不是为了「标榜自己的特立独行」，而是「方便广大开发者」。这是值得思考的一点，很多人似乎觉得一个框架用了某种模式，另一个框架就不能用，其实这对于框架之间的进步和发展并没有什么好处。

这里直接引用尤大在 17 年[回应](https://www.zhihu.com/people/evanyou/posts)「Vue 借鉴虚拟 dom」的一段话吧：

> 再说 vdom。React 的 vdom 其实性能不怎么样。Vue 2.0 引入 vdom 的主要原因是 vdom 把渲染过程抽象化了，从而使得组件的抽象能力也得到提升，并且可以适配 DOM 以外的渲染目标。这一点是借鉴 React 毫无争议，因为我认为 vdom 确实是个好思想。但要分清楚的是 Vue 引入 vdom 不是因为『react 有所以我们也要有』，而是因为它确实有技术上的优越性。社区里基于 vdom 思想造的轮子海了去了，而 ng2 的渲染抽象层和 Ember Glimmer 2 的模板 -> opcode 编译也跟 vdom 有很多思想上的相似性。

这段话如今用到 Hook 上还是一样的适用，程序员都提倡开源精神，怎么到了 Vue 和 React 之间有些人又变得小气起来了呢？说的难听点，Vue 保持自己的特立独行，那你假如换了一家新公司要你用 Vue，你不是又得从头学一遍嘛。

更何况 React 社区也一样有对 Vue 的借鉴，比如你看 `react-router@6` 的 api，你会发现很多地方和 `vue-router` 非常相似了。比如 useRoutes 的「配置式路由」，以及在组件中使子路由的代码结构等等。当然这只是我浅显的认知，不对的地方也欢迎指正。

## 扩展阅读

对于两种 Hook 之间的区别，想要进一步学习的同学还可以看黄子毅大大的好文：

[精读《Vue3.0 Function API》](https://juejin.im/post/5d1955e3e51d4556d86c7b09)

尤小右在官方 issue 中对于 React Hook 详细的对比看法：

[Why remove time slicing from vue3?](https://github.com/vuejs/rfcs/issues/89)

## 总结

其实总结下来，社区中还是有一部分的反对观点是由于「没有好好看文档」造成的，那本文中我就花费自己一些业余时间整理社区和官方的一些观点作为一篇文章，至于看完文章以后你会不会对 Vue3 的看法有所改观，这并不是我能决定的，只不过我很喜欢 Vue3，我也希望能够尽自己的一点力量，让大家能够不要误解它。

对于意大利面代码：

1. 提取共用的自定义 Hook（在写 React 购物车组件的时候，我提取了 3 个以上可以全局复用的 Hook）。
2. 基于「逻辑功能」去组织代码，而不是 `state` 放在一块，`method` 放在一块，这样和用 Vue2 没什么本质上的区别（很多很多新人在用 React Hook 的时候犯这样的错误，包括我自己）。

对于心智负担：

1. 更强大的能力意味着更多的学习成本，但是 Vue3 总体而言我觉得已经把心智负担控制的很到位了。对于 `ref` 这个玩意，确实是需要仔细思考一下才能理解。
2. React Hook 的心智负担已经重的出名了，在我实际的开发过程中，有时候真的会被整到头秃…… 尤其是抽了一些自定义 Hook，`deps` 依赖会层层传递的情况下（随便哪一层的依赖错了，你的应用就爆炸了）。
3. 不学习怎么能升职加薪，迎娶白富美，走向人生巅峰呢！（瞎扯）

Vue3 有多香呢？甚至《React 状态管理与同构实战》的作者、React 的忠实粉丝[Lucas HC](https://www.zhihu.com/people/lucas-hc)在这篇 [Vue 和 React 的优点分别是什么？](https://www.zhihu.com/question/301860721/answer/724759264) 中都说了这样的一句话：

> 我不吐槽更多了：一个 React 粉丝向 Vue3.0 致敬！

Vue3 目前也已经有了 Hook 的一些尝试：

https://github.com/u3u/vue-hooks

总之，希望看完这篇文章的你，能够更加喜欢 Vue3，对于它的到来我已经是期待的不行了。

最后再次强调一下作者的立场，我对于 React 和 Vue 都非常的喜欢。他们都有着各自的优缺点，本文绝无引战之意。两个框架都很棒！只是各有优缺点而已。React 的 Immutable 其实也带来了很多益处，并且 Hook 的思路还是 Facebook 团队的大佬们首创的，真的是很让人赞叹的设计，我对 React 100% 致敬！

本文的唯一目的就是想消除一些朋友对于 Vue 3.0 的误解，绝无他意，如有冒犯敬请谅解~

## 求点赞

如果本文对你有帮助，就点个赞支持下吧，你的「赞」是我持续进行创作的动力，让我知道你喜欢看我的文章吧~

## ❤️ 感谢大家

关注公众号「前端从进阶到入院」，有机会抽取「掘金小册 5 折优惠码」

关注公众号加好友，拉你进「前端进阶交流群」，大家一起共同交流和进步。

![](https://user-gold-cdn.xitu.io/2020/4/5/17149cbcaa96ff26?w=910&h=436&f=jpeg&s=78195)

  
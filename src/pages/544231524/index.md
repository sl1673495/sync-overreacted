---
title: 'Vue3 + TypeScript  + 新型状态管理模式，手把手带你实现小型应用。'
date: '2019-12-31'
spoiler: ''
---

  ## 前言
Vue3的热度还没过去，React Hook在社区的发展也是如火如荼。  

一时间大家都觉得Redux很low，都在研究各种各样配合hook实现的新形状态管理模式。  

在React社区中，Context + useReducer的新型状态管理模式广受好评。  

这篇文章就从Vue3的角度出发，探索一下未来的Vue状态管理模式。  

vue-composition-api-rfc：  
https://vue-composition-api-rfc.netlify.com/api.html

vue官方提供的尝鲜库：  
https://github.com/vuejs/composition-api


## api
Vue3中有一对新增的api，`provide`和`inject`，熟悉Vue2的朋友应该明白，  

在上层组件通过provide提供一些变量，在子组件中可以通过inject来拿到，但是必须在组件的对象里面声明，使用场景的也很少，所以之前我也并没有往状态管理的方向去想。  

但是Vue3中新增了Hook，而Hook的特征之一就是可以在组件外去写一些自定义Hook，所以我们不光可以在.vue组件内部使用Vue的能力， 
在任意的文件下（如context.ts）下也可以，

如果我们在context.ts中
1. 自定义并export一个hook叫`useProvide`，并且在这个hook中使用provide并且注册一些全局状态，  

2. 再自定义并export一个hook叫`useInject`，并且在这个hook中使用inject返回刚刚provide的全局状态，  

3. 然后在根组件的setup函数中调用`useProvide`。

4. 就可以在任意的子组件去共享这些全局状态了。  
 
顺着这个思路，先看一下这两个api的介绍，然后一起慢慢探索这对api。  

```jsx
import { provide, inject } from 'vue'

const ThemeSymbol = Symbol()

const Ancestor = {
  setup() {
    provide(ThemeSymbol, 'dark')
  }
}

const Descendent = {
  setup() {
    const theme = inject(ThemeSymbol, 'light' /* optional default value */)
    return {
      theme
    }
  }
}
```

## 开始

### 项目介绍
这个项目是一个简单的图书管理应用，功能很简单：
1. 查看图书
2. 增加已阅图书
3. 删除已阅图书

### 项目搭建
首先使用vue-cli搭建一个项目，在选择依赖的时候手动选择，这个项目中我使用了TypeScript，各位小伙伴可以按需选择。  

然后引入官方提供的vue-composition-api库，并且在main.ts里注册。
```ts
import VueCompositionApi from '@vue/composition-api';
Vue.use(VueCompositionApi);
```

### context编写

按照刚刚的思路，我建立了src/context/books.ts  

```ts
import { provide, inject, computed, ref, Ref } from '@vue/composition-api';
import { Book, Books } from '@/types';

type BookContext = {
  books: Ref<Books>;
  setBooks: (value: Books) => void;
};

const BookSymbol = Symbol();

export const useBookListProvide = () => {
  // 全部图书
  const books = ref<Books>([]);
  const setBooks = (value: Books) => (books.value = value);

  provide(BookSymbol, {
    books,
    setBooks,
  });
};

export const useBookListInject = () => {
  const booksContext = inject<BookContext>(BookSymbol);

  if (!booksContext) {
    throw new Error(`useBookListInject must be used after useBookListProvide`);
  }

  return booksContext;
};

```

全局状态肯定不止一个模块，所以在context/index.ts下做统一的导出
```ts
import { useBookListProvide, useBookListInject } from './books';

export { useBookListInject };

export const useProvider = () => {
  useBookListProvide();
};
```
后续如果增加模块的话，就按照这个套路就好。

然后在main.ts的根组件里使用provide，在最上层的组件中注入全局状态。
```ts
new Vue({
  router,
  setup() {
    useProvider();
    return {};
  },
  render: h => h(App),
}).$mount('#app');
```

在组件view/books.vue中使用：
```jsx
<template>
  <Books :books="books" :loading="loading" />
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';
import Books from '@/components/Books.vue';
import { useAsync } from '@/hooks';
import { getBooks } from '@/hacks/fetch';
import { useBookListInject } from '@/context';

export default createComponent({
  name: 'books',
  setup() {
    const { books, setBooks } = useBookListInject();

    const loading = useAsync(async () => {
      const requestBooks = await getBooks();
      setBooks(requestBooks);
    });

    return { books, loading };
  },
  components: {
    Books,
  },
});
</script>
```

这个页面需要初始化books的数据，并且从inject中拿到setBooks的方法并调用，之后这份books数据就可以供所有组件使用了。  

在setup里引入了一个`useAsync`函数，我编写它的目的是为了管理异步方法前后的loading状态，看一下它的实现。

```ts
import { ref, onMounted } from '@vue/composition-api';

export const useAsync = (func: () => Promise<any>) => {
  const loading = ref(false);

  onMounted(async () => {
    try {
      loading.value = true;
      await func();
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  });

  return loading;
};
```

可以看出，这个hook的作用就是把外部传入的异步方法`func`在`onMounted`生命周期里调用  
并且在调用的前后改变响应式变量`loading`的值，并且把loading返回出去，这样loading就可以在模板中自由使用，从而让loading这个变量和页面的渲染关联起来。

Vue3的hooks让我们可以在组件外部调用Vue的所有能力，  
包括onMounted,ref, reactive等等，  

这使得自定义hook可以做非常多的事情，  
并且在组件的setup函数把多个自定义hook组合起来完成逻辑， 

这恐怕也是起名叫composition-api的初衷。

### 最终的books模块context
```ts
import { provide, inject, computed, ref, Ref } from '@vue/composition-api';
import { Book, Books } from '@/types';

type BookContext = {
  books: Ref<Books>;
  setBooks: (value: Books) => void;
  finishedBooks: Ref<Books>;
  addFinishedBooks: (book: Book) => void;
  booksAvailable: Ref<Books>;
};

const BookSymbol = Symbol();

export const useBookListProvide = () => {
  // 待完成图书
  const books = ref<Books>([]);
  const setBooks = (value: Books) => (books.value = value);

  // 已完成图书
  const finishedBooks = ref<Books>([]);
  const addFinishedBooks = (book: Book) => {
    if (!finishedBooks.value.find(({ id }) => id === book.id)) {
      finishedBooks.value.push(book);
    }
  };
  const removeFinishedBooks = (book: Book) => {
    const removeIndex = finishedBooks.value.findIndex(({ id }) => id === book.id);
    if (removeIndex !== -1) {
      finishedBooks.value.splice(removeIndex, 1);
    }
  };

  // 可选图书
  const booksAvailable = computed(() => {
    return books.value.filter(book => !finishedBooks.value.find(({ id }) => id === book.id));
  });

  provide(BookSymbol, {
    books,
    setBooks,
    finishedBooks,
    addFinishedBooks,
    removeFinishedBooks,
    booksAvailable,
  });
};

export const useBookListInject = () => {
  const booksContext = inject<BookContext>(BookSymbol);

  if (!booksContext) {
    throw new Error(`useBookListInject must be used after useBookListProvide`);
  }

  return booksContext;
};
```

最终的books模块就是这个样子了，可以看到在hooks的模式下，  

代码不再按照state, mutation和actions区分，而是按照逻辑关注点分隔，  

这样的好处显而易见，我们想要维护某一个功能的时候更加方便的能找到所有相关的逻辑，而不再是在选项和文件之间跳来跳去。

## 总结
本文相关的所有代码都放在  

https://github.com/sl1673495/vue-bookshelf  

这个仓库里了，感兴趣的同学可以去看，  

在之前刚看到composition-api，还有尤大对于Vue3的Hook和React的Hook的区别对比的时候，我对于Vue3的Hook甚至有了一些盲目的崇拜，但是真正使用下来发现，虽然不需要我们再去手动管理依赖项，但是由于Vue的响应式机制始终需要非原始的数据类型来保持响应式，所带来的一些心智负担也是需要注意和适应的。  

举个简单的例子
```ts
  setup() {
    const loading = useAsync(async () => {
      await getBooks();
    });

    return {
      isLoading: !!loading.value
    }
  },
```

这一段看似符合直觉的代码，却会让`isLoading`这个变量失去响应式，但是这也是性能和内部实现设计的一些取舍，我们选择了Vue，也需要去学习和习惯它。  

总体来说，Vue3虽然也有一些自己的缺点，但是带给我们React Hook几乎所有的好处，而且还规避了React Hook的一些让人难以理解坑，在某些方面还优于它，期待Vue3正式版的发布！
  
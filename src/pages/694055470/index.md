---
title: '利用 TS 4.1 新特性实现 Vuex 无限层级命名空间的 dispatch 类型推断。'
date: '2020-09-05'
spoiler: ''
---

  ## 前言

前几天，TypeScript 发布了一项 4.1 版本的新特性，字符串模板类型，还没有了解过的小伙伴可以先去这篇看一下：[TypeScript 4.1 新特性：字符串模板类型，Vuex 终于有救了？](https://juejin.im/post/6867785919693832200)。

本文就利用这个特性，简单实现下 Vuex 在 `modules` 嵌套情况下的 `dispatch` 字符串类型推断，先看下效果，我们有这样结构的 `store`：

```ts
const store = Vuex({
  mutations: {
    root() {},
  },
  modules: {
    cart: {
      mutations: {
        add() {},
        remove() {},
      },
    },
    user: {
      mutations: {
        login() {},
      },
      modules: {
        admin: {
          mutations: {
            login() {},
          },
        },
      },
    },
  },
})
```

需要实现这样的效果，在 `dispatch` 的时候可选的 `action` 字符串类型要可以被提示出来：

```ts
store.dispatch('root')
store.dispatch('cart/add')
store.dispatch('user/login')
store.dispatch('user/admin/login')
```

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bcf91dd55baa425faed6fcc6f95757b6~tplv-k3u1fbpfcp-zoom-1.image)

## 实现

### 定义函数骨架

首先先定义好 Vuex 这个函数，用两个泛型把 `mutations` 和 `modules` 通过反向推导给拿到：

```ts
type Store<Mutations, Modules> = {
  // 下文会实现这个 Action 类型
  dispatch(action: Action<Mutations, Modules>): void
}

type VuexOptions<Mutations, Modules> = {
  mutations: Mutations
  modules: Modules
}

declare function Vuex<Mutations, Modules>(
  options: VuexOptions<Mutations, Modules>
): Store<Mutations, Modules>
```

### 实现 Action

那么接下来的重点就是实现 `dispatch(action: Action<Mutations, Modules>): void` 中的 `Action` 了，我们的目标是把他推断成一个 `'root' | 'cart/add' | 'user/login' | 'user/admin/login'` 这样的联合类型，这样用户在调用 `dispatch` 的时候，就可以智能提示了。

`Action` 里首先可以简单的先把 `keyof Mutations` 拿到，因为根 `store` 下的 `mutations` 不需要做任何的拼接，

重头戏在于，我们需要根据 `Modules` 这个泛型，也就是对应结构：

```ts
modules: {
   cart: {
      mutations: {
         add() { },
         remove() { }
      }
   },
   user: {
      mutations: {
         login() { }
      },
      modules: {
         admin: {
            mutations: {
               login() { }
            },
         }
      }
   }
}
```

来拿到 `modules` 中的所有拼接后的 `key`。

### 推断 Modules Keys

先提前和大伙同步好，后续泛型里的：

- `Modules` 代表 `{ cart: { modules: {} }, user: { modules: {} }` 这种多个 `Module` 组合的对象结构。
- `Module` 代表单个子模块，比如 `cart` 。

利用

```ts
type Values<Modules> = {
  [K in keyof Modules]: Modules[K]
}[keyof Modules]
```

这种方式，可以轻松的把对象里的所有**值** 类型给展开，比如

```ts
type Obj = {
  a: 'foo'
  b: 'bar'
}

type T = Values<Obj> // 'foo' | 'bar'
```

由于我们要拿到的是 `cart`、`user` 对应的值里提取出来的 `key`，

所以利用上面的知识，我们编写 `GetModulesMutationKeys` 来获取 `Modules` 下的所有 `key`：

```ts
type GetModulesMutationKeys<Modules> = {
  [K in keyof Modules]: GetModuleMutationKeys<Modules[K], K>
}[keyof Modules]
```

首先利用 `K in keyof Modules` 来拿到所有的 key，这样我们就可以拿到 `cart`、`user` 这种单个 `Module`，并且传入给 `GetModuleMutationKeys` 这个类型，`K` 也要一并传入进去，因为我们需要利用 `cart`、`user` 这些 `key` 来拼接在最终得到的类型前面。

### 推断单个 Module Keys

接下来实现 `GetModuleMutationKeys`，分解一下需求，首先单个 `Module` 是这样子的：

```ts
cart: {
   mutations: {
      add() { },
      remove() { }
   }
},
```

那么拿到它的 `Mutations` 后，我们只需要去拼接 `cart/add`、`cart/remove` 即可，那么如何拿到一个对象类型中的 `mutations`？

我们用 `infer` 来取：

```ts
type GetMutations<Module> = Module extends { mutations: infer M } ? M : never
```

然后通过 `keyof GetMutations<Module>`，即可轻松拿到 `'add' | 'remove'` 这个类型，我们再实现一个拼接 `Key` 的类型，注意这里就用到了 TS 4.1 的字符串模板类型了

```ts
type AddPrefix<Prefix, Keys> = `${Prefix}/${Keys}`
```

这里会自动把联合类型展开并分配，`${'cart'}/${'add' | 'remove'}` 会被推断成 `'cart/add' | 'cart/remove'`，不过由于我们传入的是 `keyof GetMutations<Module>` 它还有可能是 `symbol | number` 类型，所以用 `Keys & string` 来取其中的 `string` 类型，这个技巧也是老爷子在 [Template string types MR](https://github.com/microsoft/TypeScript/pull/40336?from=groupmessage) 中提到的：

> Above, a keyof T & string intersection is required because keyof T could contain symbol types that cannot be transformed using template string types.

```ts
type AddPrefix<Prefix, Keys> = `${Prefix & string}/${Keys & string}`
```

那么，利用 `AddPrefix<Key, keyof GetMutations<Module>>` 就可以轻松的把 `cart` 模块下的 `mutations` 拼接出来了。

### 推断嵌套 Module Keys

`cart` 模块下还可能有别的 `Modules`，比如这样：

```ts
cart: {
   mutations: {
      add() { },
      remove() { }
   }
   modules: {
      subCart: {
      	mutations: {
          add() { },
        }
      }
   }
},
```

其实很简单，我们刚刚已经定义好了从 `Modules` 中提取 `Keys` 的工具类型，也就是 `GetModulesMutationKeys`，只需要递归调用即可，不过这里我们需要做一层预处理，把 `modules` 不存在的情况给排除掉：

```ts
type GetModuleMutationKeys<Module, Key> =
  // 这里直接拼接 key/mutation
  | AddPrefix<Key, keyof GetMutations<Module>>
  // 这里对子 modules 做 keys 的提取
  | GetSubModuleKeys<Module, Key>
```

利用 extends 去判断类型结构，对不存在 `modules` 的结构直接返回 never，再用 infer 去提取出 Modules 的结构，并且把前一个模块的 `key` 拼接在刚刚写好的 `GetModulesMutationKeys` 返回的结果之前：

```ts
type GetSubModuleKeys<Module, Key> = Module extends { modules: infer SubModules }
  ? AddPrefix<Key, GetModulesMutationKeys<SubModules>>
  : never
```

以这个 `cart` 模块为例，分解一下每个工具类型得到的结果：

```ts
cart: {
   mutations: {
      add() { },
      remove() { }
   }
   modules: {
      subCart: {
      	mutations: {
          add() { },
        }
      }
   }
},

type GetModuleMutationKeys<Module, Key> =
    // 'cart/add' | 'cart | remove'
    AddPrefix<Key, keyof GetMutations<Module>> |
    // 'cart/subCart/add'
    GetSubModuleKeys<Module, Key>

type GetSubModuleKeys<Module, Key> = Module extends { modules: infer SubModules }
   ? AddPrefix<
       // 'cart'
       Key,
       // 'subCart/add'
       GetModulesMutationKeys<SubModules>
   >
   : never
```

这样，就巧妙的利用递归把无限层级的 `modules` 拼接实现了。

## 完整代码

```ts
type GetMutations<Module> = Module extends { mutations: infer M } ? M : never

type AddPrefix<Prefix, Keys> = `${Prefix & string}/${Keys & string}`

type GetSubModuleKeys<Module, Key> = Module extends { modules: infer SubModules }
   ? AddPrefix<Key, GetModulesMutationKeys<SubModules>>
   : never

type GetModuleMutationKeys<Module, Key> = AddPrefix<Key, keyof GetMutations<Module>> | GetSubModuleKeys<Module, Key>

type GetModulesMutationKeys<Modules> = {
   [K in keyof Modules]: GetModuleMutationKeys<Modules[K], K>
}[keyof Modules]

type Action<Mutations, Modules> = keyof Mutations | GetModulesMutationKeys<Modules>

type Store<Mutations, Modules> = {
   dispatch(action: Action<Mutations, Modules>): void
}

type VuexOptions<Mutations, Modules> = {
   mutations: Mutations,
   modules: Modules
}

declare function Vuex<Mutations, Modules>(options: VuexOptions<Mutations, Modules>): Store<Mutations, Modules>

const store = Vuex({
   mutations: {
      root() { },
   },
   modules: {
      cart: {
         mutations: {
            add() { },
            remove() { }
         }
      },
      user: {
         mutations: {
            login() { }
         },
         modules: {
            admin: {
               mutations: {
                  login() { }
               },
            }
         }
      }
   }
})

store.dispatch("root")
store.dispatch("cart/add")
store.dispatch("user/login")
store.dispatch("user/admin/login")
```

前往 [TypeScript Playground](https://www.typescriptlang.org/play?ts=4.1.0-pr-40336-8#code/C4TwDgpgBA4hwFkCuwCGwCWB7AdgZwB4EsATJAGwgD4oBeKYsyqCAD2AhxLygG8oAtinTZ8ALigYcAMwgAnBlAC+UAPyKJOCADd5AKD2hIUAIIkSABTkRpGVgSs27AGigBpCCDw16AAwAkvI62rFAAZFB4wHJSAOZKAPSBHl7hkdFxSr4GRtBwwADKSABGjBQQKYRllK4pPgyk5SzsnNx8go2UeBJSsgpFpZ0QPCp6UOPqZpbWIQQprvnVw8homLiVBANL3jRj45o6+obgefBLKyLrnlVDtZ71U8F2c56uANaeWNKwZ8Jr+EQhlQaAAfH6FEpLDZLO4gKg5E7g7YXf7QobeOh8PZQADabkkOCgHxAXwaTGGAF0JIshijRGjyXg8RTavClDjiaTthSEcYTABjf5EP6iPCubb1TnfOm4HhgmmMmU4Bnlby86AFYBYazC1ai8Xo+q8bEkDB4MDofkACwAFKhBaIJAKhUqxWTVVQAJQSbRYDAkPRKdVQABqSDYAHkwP8qiLZQbGUbsUI9bKJK7nMn0en0YGDCQIPzyKhrFBpEgcA7cKHw-YM+6ulQbVho6KJGHI63ZbrLvgEx7vVBNdqID2Y-3GwZ+bLgOkR5iO6wbcbxoI4+IsavV3IsFhgDbPe0lJnV8es4yJCut1B+SXgJfsde16mN1en1vUOYD0eT++t9YBCwXRv34IM-2UR9xjPJ8kDweQH3AlNe26TdwPGcgsFiKQQIg8DoL-QCL1QtDPwEKQELQrckJjCjKOvDCsJwHCwLoqDfzQlj30409sSDJRPQMKIRwAOlNc1LVtAAiHc90kgShOsUSzQtYBrRtSTbzkYAEk-Eg5L0BSICU8TVKk2D5ASBipH0wzjJUtTJPMuQdJIMicEszDrM9IA) 体验。

## 结语

这个新特性给 TS 库开发的作者带来了无限可能性，有人用它实现了 [URL Parser 和 HTML parser](https://www.zhihu.com/question/418792736/answer/1448844286)，有人用它实现了 `JSON parse` 甚至有人用它实现了[简单的正则](https://www.typescriptlang.org/play?ts=4.1.0-pr-40336-8#code/C4TwDgpgBAggNmAFgQygXigImZqAfLAI1wMwGMSsATSzCWgM1oHNbFaBLWgK1oGtacWgFtaAO1oB7WmFoBHWgCdaAZ1rBaAV1oA3WgHdaAD1ohaAL0wBYAFC3QkKAEkVAMWRwVEADwAVKBBGwBBiVCpQDB5eAHzoUL629uDQvgDCkmJkyMDeADIANFAASrEYAN62UFVQZBlZwAD6cBAMwABcUAWV1bWZ2Q2KHMyI7cW2AL6JNg4pAKpiHBl5hSVxFTbVUJoLGU0to10b1duLYgNDIx1FE1Mz8alwkiqaij4AaqVQ65tkj8+vDR0Hk0EA6bxudmmyXiAAVkK8xN4PmtulUwPCQoDgaCoOCbJNIXc0ihFCokZ9vj0SSosXAQWCIUlHLk4Qi4pgABTWQnQoqskLsgCU3KZ0AAysB4eyAFQiqGOABCUowmDwcruMLp4RVAGp1dDXBw4MFFABRYRgUAwUIAOQgOggij8n38gWCoXCAG0OGIGI7ihBnsbCj6-YoAypgABdKAAfgjwACQRCYSwuHjRUDmmNUA6Ynt-rzBcUt2hrK8qRJ3glikKqQAEjBVhgG02k+7U5HBmJmHGoDX2ynwgADAAkZVbRXG49D-szkfGw77nsnK0D0dzUHzDvDRZ3pcc5YgAFlkGIQNXgLX4vDmBBE26h1Auz7mIUYa8dIOPc+r6-2ZgpSov2V7fqmmDplAnofvahQQTGbTAQOj4-mOZS+Le97TmUs7hvOwCLnGSGgShqZobhUCVth+GEfGlZgeEL49n2R6nue3j4YUGGKHewCFGhME6NhVHDrEe6Fluxa5sB0GfoUNZRgA3Ae0BHpW8K5BwkaXoonysWeF41oU8BIMgcGASpUBqdSOl6fCFYkpp2k1rEpFehRYohr6c7rjG8aesS9nVtEa6Rghkn7jyh72RA-KIi56AydZ8I6YULIYmI0Qxm5UHbo6fkRRJyVOkZnRxa5yY-t63nhiyXlhmV+F+UlMXzKceQwvhWUMblxYFXlu5Wa1OyIiyXU9dVDVvNi9X+m8TVEUcVTQTF6lOvN64rOV2WVamnoDf1UkdMVSKccU5UTRRfKzXhnW+cuvhxUi2IhedC2IUthWDQNm4DcpUWqTF7hkMAkglVeQGfStpIQGtqVlRl3U5ftfWLZs0MOSlpUmSgSO7V6B19j9x2rTZCUfZsR5PS5-2ikNMMPE8Lw+AlGAYxAwOg+Duk7R2BOo-GxP014nNg7Zl01Z0N2dAtsYtQzVa5GdErwnjfO9TuBWegUMv3STCspUrm0garEsNZ5UAebLUFpH8zN5K9YrvcBQt-ZZal1Nk4toPLFZ268tm80+KOa0TR3C7D-ssxDZv+jrFFG2FaPVOzcOJ3xVlamrweE-5Ovp+FJ3p++Wex+GqTS6ksu+7Dns5FX67Z1VudfZuHt9PX43I1d0tFNbAXpB3yzFK9fd6y74eu8WtPyoDMNtUsrM14P9SBxNLdC+3q8Jd3kvx3v1dQ0XZ1Kjz68C1B+fvRHacn6bu8Naf0sKof6NHgviIv43QfNxfm-De1L+kYKrq0mnOXu-dfAf2HiUFYztPpTx3L9ae7sYreygIaY0jpzSWhANaKgdodzeHfiNWy0RLKnmAGQRANZ4ZrRUJDTYyF8ZpjDkgim1R6E9UCqSbwFFkTxjeD1JivZ4zMPVmhN42ErrrlogmZB7DW7iUUDPO4lDqHQNKh-T4H9uHQITr3WI8Z1GIHhrkWIBATHw1WMo1R0ITEry9qVRxwBGHVHEU+CCbDCzARcdwlxfC96GL7FYqxpVzErDEl9Ch2RqGM3+NHa88TmZuKqB4n8Xj4xeI4VUZJrx-FR0CQ1VIRioAOMKWEq8dZXp5IgFEgaMSqGIGplU+mIQ7Jshyo9DKRT-QwlKZU68-SFGOjsY4QZXFXh1MSp9XwUz-E2QMgM2JNCrzwzmRAaZOT4jzK6U9JZISVktOvBsrZwFTl6NIQZQoBzjErM0a005Ylzm7JYWkOu3hrlQFuWUlZATSpPOkrM156tbZMwDj88p4LEmTM2c8hBKCAaWxUDaSQwBCGOmdHEAKP89ot0iJ4aAHQrwgjplpHBoAayvixRgV0LDMlQBJUSiIUQIBjOgC4ExEAqA0uRai9FxYsU5SZX2clFpKV-h7EKlhIr4wio6ASrwm5FUQDJSoOZII-A9SZS6Syrw7xGAAIxxCPN4bAOoOSEB1GQPAEBBR4BoNEf6dxgiRmNRgLSGqfCcpWdy7wVjsCEAoIUfVgRDXRAjc66ErrgAACY4iesUJqn1TS-UBuQPQENEADXhsjXTGNABmBN6qk3epUFynl6ag2YCzTmiNTr83rgACzFq9d4FN1C00rLNTQWtYb63sqgKGow8aMCms5MgHUhA8BkEFLKBts9GXrgAKyttLe28tvrK3dsDcgYgfaR0DsbZGAAbGu5Nm7U3bqaWasgwah3ZsCLGo9NggA)，这个特性让类型体操的爱好者以及框架的库作者可以进一步的大展身手，期待他们写出更加强大的类型库来方便业务开发的童鞋吧~

## 感谢大家

关注公众号「前端从进阶到入院」，关注第一手干货资讯，还可以获取『高级前端进阶指南』和『前端算法零基础进阶指南』。

  
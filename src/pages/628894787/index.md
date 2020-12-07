---
title: '前端瀑布流布局如何应用动态规划和贪心算法'
date: '2020-06-02'
spoiler: ''
---

  ## 前言

瀑布流布局是前端领域中一个很常见的需求，由于图片的高度是不一致的，所以在多列布局中默认布局下很难获得满意的排列。

我们的需求是，图片高度不规律的情况下，在两列布局中，让左右两侧的图片总高度尽可能的接近，这样的布局会非常的美观。

注意，**本文的目的仅仅是讨论算法在前端中能如何运用**，而不是说瀑布流的最佳解法是动态规划，可以仅仅当做学习拓展来看。

本文的图片节选自知乎问题[《有个漂亮女朋友是种怎样的体验？》](https://www.zhihu.com/question/28997505)，我先去看美女了，本文到此结束。（逃

## 预览

![](https://user-gold-cdn.xitu.io/2020/6/2/17272def722a4f89?w=628&h=1138&f=png&s=1612372)

## 分析

从预览图中可以看出，虽然图片的高度是不定的，但是到了这个布局的最底部，左右两张图片是正好对齐的，这就是一个比较美观的布局了。

那么怎么实现这个需求呢？从头开始拆解，现在我们能拿到一组图片数组 `[img1, img2, img3]`，我们可以通过一些方法得到它对应的高度 `[1000, 2000, 3000]`，那么现在我们的目标就是能够计算出左右两列 `left: [1000, 2000]` 和 `right: [3000]` 这样就可以把一个左右等高的布局给渲染出来了。

## 准备工作

首先准备好小姐姐数组 `SISTERS`：

```js
let SISTERS = [
  'https://pic3.zhimg.com/v2-89735fee10045d51693f1f74369aaa46_r.jpg',
  'https://pic1.zhimg.com/v2-ca51a8ce18f507b2502c4d495a217fa0_r.jpg',
  'https://pic1.zhimg.com/v2-c90799771ed8469608f326698113e34c_r.jpg',
  'https://pic1.zhimg.com/v2-8d3dd83f3a419964687a028de653f8d8_r.jpg',
  ... more 50 items
]
```

准备好一个工具方法 `loadImages`，这个方法的目的就是把所有图片预加载以后获取对应的高度，放到一个数组里返回。并且要对外通知所有图片处理完成的时机，有点类似于 `Promise.all` 的思路。

这个方法里，我们把图片按照 `宽高比` 和屏幕宽度的一半进行相乘，得到缩放后适配屏宽的图片高度。

```js
let loadImgHeights = (imgs) => {
  return new Promise((resolve, reject) => {
    const length = imgs.length
    const heights = []
    let count = 0
    const load = (index) => {
      let img = new Image()
      const checkIfFinished = () => {
        count++
        if (count === length) {
          resolve(heights)
        }
      }
      img.onload = () => {
        const ratio = img.height / img.width
        const halfHeight = ratio * halfInnerWidth
        // 高度按屏幕一半的比例来计算
        heights[index] = halfHeight
        checkIfFinished()
      }
      img.onerror = () => {
        heights[index] = 0
        checkIfFinished()
      }
      img.src = imgs[index]
    }
    imgs.forEach((img, index) => load(index))
  })
}
```

有了图片高度以后，我们就开始挑选适合这个需求的算法了。

## 贪心算法

在人的脑海中最直观的想法是什么样的？在每装一个图片前都对比一下左右数组的高度和，往高度较小的那个数组里去放入下一项。

这就是贪心算法，我们来简单实现下：

```js
let greedy = (heights) => {
  let leftHeight = 0
  let rightHeight = 0
  let left = []
  let right = []

  heights.forEach((height, index) => {
    if (leftHeight >= rightHeight) {
      right.push(index)
      rightHeight += height
    } else {
      left.push(index)
      leftHeight += height
    }
  })

  return { left, right }
}
```

我们得到了 `left`，`right` 数组，对应左右两列渲染图片的下标，并且我们也有了每个图片的高度，那么渲染到页面上就很简单了：

```xml
<div class="wrap" v-if="imgsLoaded">
  <div class="half">
    <img
      class="img"
      v-for="leftIndex in leftImgIndexes"
      :src="imgs[leftIndex]"
      :style="{ width: '100%', height: imgHeights[leftIndex] + 'px' }"
    />
  </div>
  <div class="half">
    <img
      class="img"
      v-for="rightIndex in rightImgIndexes"
      :src="imgs[rightIndex]"
      :style="{ width: '100%', height: imgHeights[rightIndex] + 'px' }"
    />
  </div>
</div>
```

效果如图：
![](https://user-gold-cdn.xitu.io/2020/6/2/17272ec94dcda26a?w=640&h=1138&f=png&s=1692813)

预览地址：
https://sl1673495.github.io/dp-waterfall/greedy.html

可以看出，贪心算法只寻求局部最优解（只在考虑当前图片的时候找到一个最优解），所以最后左右两边的高度差还是相对较大的，局部最优解很难成为全局最优解。

再回到文章开头的图片去看看，对于同样的一个图片数组，那个预览图里的高度差非常的小，是怎么做到的呢？

## 动态规划

和局部最优解对应的是全局最优解，而说到全局最优解，我们很难不想到动态规划这种算法。它是求全局最优解的一个利器。

如果你还没有了解过动态规划，建议你看一下海蓝大佬的 [一文搞懂动态规划](https://juejin.im/post/5e86d0ad6fb9a03c387f3342)，也是这篇文章让我入门了最基础的动态规划。

动态规划中有一个很著名的问题：「01 背包问题」，题目的意思是这样的：

**有 n 个物品，它们有各自的体积和价值，现有给定容量的背包，如何让背包里装入的物品具有最大的价值总和？**

关于 01 背包问题的题解，网上不错的教程似乎不多，我推荐看慕课网 bobo 老师的[玩转算法面试 从真题到思维全面提升算法思维](https://coding.imooc.com/class/82.html) 中的第九章，会很仔细的讲解背包问题，对于算法思维有很大的提升，这门课的其他部分也非常非常的优秀。

我也有在我自己维护的题解仓库中对老师的 01 背包解法做了一个[js 版的改写](https://github.com/sl1673495/leetcode-javascript/issues/15)。

那么 01 背包问题和这个瀑布流算法有什么关系呢？这个思路确实比较难找，但是我们仔细想一下，假设我们有 `[1, 2, 3]` 这 3 个图片高度的数组，我们怎么通过转化成 01 背包问题呢？

由于我们要凑到的是图片总高度的一半，也就是 `(1 + 2 + 3) / 2 = 3`，那么我们此时就有了一个 `容量为3` 的背包，而由于我们装进左列中的图片高度需要低于总高度的一半，待装进背包的物体的总重量和高度是相同的 `[1, 2, 3]`。

那么这个问题也就转化为了，在 `容量为3的背包` 中，尽可能的从重量为 `[1, 2, 3]`，并且价值也为 `[1, 2, 3]` 的物品中，尽可能的挑选出总价值最大的物品集合装进背包中。

也就是 `总高度为3`，在 `[1, 2, 3]` 这几种高度的图片中，尽可能挑出 `总和最大，但是又小于3` 的图片集合，装进数组中。

可以分析出 **状态转移方程** 是 
```js
dp[heights][height] = max(
  // 选择当前图片放入列中
  currentHeight + dp[heights - 1][height - currnetHeight], 
  // 不选择当前图片
  dp[heights - 1][height]
)
```

注意这里的纵坐标命名为 `heights`，代表它的意义是「可选择图片的集合」，比如 `dp[0]` 意味着只考虑第一张图片，`dp[1]` 则意味着既考虑第一张图片又考虑第二张图片，以此类推。

### 二维数组结构

我们构建的二维 dp 数组

**纵坐标 y** 是：当前可以考虑的图片，比如 `dp[0]` 是只考虑下标为 0 的图片，`dp[1]` 是考虑下标为 0 的图片，并且考虑下标为 1 的图片，以此类推，取值范围是 `0 ~ 图片数组的长度 - 1`。

**横坐标 x** 是：用当前考虑的图片集合，去尽可能凑到总高度为 `y` 时，所能凑成的最大高度 `max`，以及当前所使用的图片下标集合 `indexes`，取值范围是 `0 ~ 高度的一半`。

### 小问题拆解

就以 `[1, 4, 5, 4]` 这四张图片高度为例，高度的一半是 7，用肉眼可以看出最接近 7 的子数组是`[1, 5]`，我们来看看动态规划是怎么求出这个结果的。

我们先看纵坐标为 `0`，也就是只考虑图片 1 的情况：

1. 首先去尝试凑高度 `1`：我们知道图片 1 的高度正好是 1，所以此时`dp[0][0]`所填写的值是 `{ max: 1, indexes: [0] }`，也就代表用总高度还剩 1，并且只考虑图片 1 的情况下，我们的最优解是选用第一张图片。

2. 凑高度`2 ~ 7`：由于当前只有 1 可以选择，所以最优解只能是选择第一张图片，它们都是 `{ max: 1, indexes: [0] }`。

```
高度       1  2  3  4  5  6  7
图片1(h=1) 1  1  1  1  1  1  1
```

这一层在动态规划中叫做基础状态，它是最小的子问题，它不像后面的纵坐标中要考虑多张图片，而是只考虑单张图片，所以一般来说都会在一层循环中单独把它求解出来。

这里我们还要考虑第一张图片的高度大于我们要求的总高度的情况，这种情况下需要把 max 置为 0，选择的图片项也为空。

```js
let mid = Math.round(sum(heights) / 2)
let dp = []
// 基础状态 只考虑第一个图片的情况
dp[0] = []
for (let cap = 0; cap <= mid; cap++) {
  dp[0][cap] =
    heights[0] > cap
      ? { max: 0, indexes: [] }
      : { max: heights[0], indexes: [0] }
}
```

有了第一层的基础状态后，我们就可以开始考虑多张图片的情况了，现在来到了纵坐标为 1，也就是考虑图片 1 和考虑图片 2 时求最优解：

```
高度       1  2  3  4  5  6  7
图片1(h=1) 1  1  1  1  1  1  1
图片2(h=2)
```

此时问题就变的有些复杂了，在多张图片的情况下，我们可以有两种选择：

1. 选择当前图片，那么假设当前要凑的总高度为 3，当前图片的高度为 2，剩余的高度就为 1，此时我们可以用剩余的高度去「上一个纵坐标」里寻找「只考虑前面几种图片」的情况下，高度为 1 时的最优解。并且记录 `当前图片的高度 + 前几种图片凑剩余高度的最优解` 为 `max1`。
2. 不选择当前图片，那么就直接去「只考虑前面几种图片」的上一个纵坐标里，找到当前高度下的最优解即可，记为 `max2`。
3. 比较 `max1` 和`max2`，找出更大的那个值，记录为当前状态下的最优解。

有了这个前置知识，来继续分解这个问题，在纵坐标为 1 的情况下，我们手上可以选择的图片有图片 1 和图片 2：

1. 凑高度 1：由于图片 2 的高度为 2，相当于是容量超了，所以这种情况下不选择图片 2，而是直接选择图片 1，所以 `dp[1][0]` 可以直接沿用 `dp[0][0]`的最优解，也就是 `{ max: 1, indexes: [0] }`。
2. 凑高度 2：
   1. 选择图片 2，图片 2 的高度为 4，能够凑成的高度为 4，已经超出了当前要凑的高度 2，所以不能选则图片 2。
   2. 不选择图片 2，在只考虑图片 1 时的最优解数组 `dp[0]` 中找到高度为 2 时的最优解： `dp[0][2]`，直接沿用下来，也就是 `{ max: 1, indexes: [0] }`
   3. 这种情况下只能不选择图片 2，而沿用只选择图片 1 时的解， `{ max: 1, indexes: [0] }`
3. 省略凑高度 `3 ~ 4` 的情况，因为得出的结果和凑高度 2 是一样的。
4. 凑高度 5：高度为 5 的情况下就比较有意思了：
   1. 选择图片 2，图片 2 的高度为 4，能够凑成的高度为 4，此时剩余高度是 1，再去只考虑图片 1 的最优解数组 `dp[0]`中找高度为 1 时的最优解`dp[0][1]`，发现结果是 `{ max: 1, indexes: [0] }`，这两个高度值 4 和 1 相加后没有超出高度的限制，所以得出最优解：`{ max: 5, indexes: [0, 1] }`
   2. 不选择图片 2，在图片 1 的最优解数组中找到高度为 5 时的最优解： `dp[0][5]`，直接沿用下来，也就是 `{ max: 1, indexes: [0] }`
   3. 很明显选择图片 2 的情况下，能凑成的高度更大，所以 `dp[1][2]` 的最优解选择 `{ max: 5, indexes: [0, 1] }`

仔细理解一下，相信你可以看出动态规划的过程，从最小的子问题 `只考虑图片1`出发，先求出最优解，然后再用子问题的最优解去推更大的问题 `考虑图片1、2`、`考虑图片1、2、3`的最优解。

画一下`[1,4,5,4]`问题的 dp 状态表吧：

![](https://user-gold-cdn.xitu.io/2020/6/2/1727328d6aacdcef?w=1644&h=214&f=png&s=25629)

可以看到，和我们刚刚推论的结果一致，在考虑图片 1 和图片 2 的情况下，凑高度为 5，也就是`dp[1][5]`的位置的最优解就是 5。

最右下角的 `dp[3][7]` 就是考虑所有图片的情况下，凑高度为 7 时的**全局最优解**。

`dp[3][7]` 的推理过程是这样的：

1. 用最后一张高度为 4 的图片，加上前三张图片在高度为 7 - 4 = 3 时的最优解也就是 `dp[2][3]`，得到结果 4 + 1 = 5。
2. 不用最后一张图片，直接取前三张图片在高度为 7 时的最优解，也就是 `dp[2][7]`，得到结果 6。
3. 对比这两者的值，得到最优解 6。

至此我们就完成了整个动态规划的过程，得到了考虑所有图片的情况下，最大高度为 7 时的最优解：6，所需的两张图片的下标为 `[0, 2]`，对应高度是 `1` 和 `5`。

给出代码：

```js
// 尽可能选出图片中高度最接近图片总高度一半的元素
let dpHalf = (heights) => {
  let mid = Math.round(sum(heights) / 2)
  let dp = []

  // 基础状态 只考虑第一个图片的情况
  dp[0] = []
  for (let cap = 0; cap <= mid; cap++) {
    dp[0][cap] =
      heights[0] > cap
        ? { max: 0, indexes: [] }
        : { max: heights[0], indexes: [0] }
  }

  for (
    let useHeightIndex = 1;
    useHeightIndex < heights.length;
    useHeightIndex++
  ) {
    if (!dp[useHeightIndex]) {
      dp[useHeightIndex] = []
    }
    for (let cap = 0; cap <= mid; cap++) {
      let usePrevHeightDp = dp[useHeightIndex - 1][cap]
      let usePrevHeightMax = usePrevHeightDp.max
      let currentHeight = heights[useHeightIndex]
      // 这里有个小坑 剩余高度一定要转化为整数 否则去dp数组里取到的就是undefined了
      let useThisHeightRestCap = Math.round(cap - heights[useHeightIndex])
      let useThisHeightPrevDp = dp[useHeightIndex - 1][useThisHeightRestCap]
      let useThisHeightMax = useThisHeightPrevDp
        ? currentHeight + useThisHeightPrevDp.max
        : 0

      // 是否把当前图片纳入选择 如果取当前的图片大于不取当前图片的高度
      if (useThisHeightMax > usePrevHeightMax) {
        dp[useHeightIndex][cap] = {
          max: useThisHeightMax,
          indexes: useThisHeightPrevDp.indexes.concat(useHeightIndex),
        }
      } else {
        dp[useHeightIndex][cap] = {
          max: usePrevHeightMax,
          indexes: usePrevHeightDp.indexes,
        }
      }
    }
  }

  return dp[heights.length - 1][mid]
}
```

有了一侧的数组以后，我们只需要在数组中找出另一半，即可渲染到屏幕的两列中：

```js
this.leftImgIndexes = dpHalf(imgHeights).indexes
this.rightImgIndexes = omitByIndexes(this.imgs, this.leftImgIndexes)
```

得出效果：
![](https://user-gold-cdn.xitu.io/2020/6/2/17272def722a4f89?w=628&h=1138&f=png&s=1612372)

### 优化 1
由于纵轴的每一层的最优解都只需要参考上一层节点的最优解，因此可以只保留两行。通过判断除 2 取余来决定“上一行”的位置。此时空间复杂度是 O(n)。

### 优化 2
由于每次参考值都只需要取上一行和当前位置左边位置的值（因为减去了当前高度后，剩余高度的最优解一定在左边），因此 dp 数组可以只保留一行，把问题转为从右向左求解，并且在求解的过程中不断覆盖当前的值，而不会影响下一次求解。此时空间复杂度是 O(n)，但是其实占用的空间进一步缩小了。

并且在这种情况下对于时间复杂度也可以做优化，由于优化后，求当前高度的最优解是倒序遍历的，那么当发现求最优解的高度小于当前所考虑的那个图片的的高度时，说明本次求解不可能考虑当前图片了，此时左边的高度的最优解一定是「上一行的最优解」。

## 代码地址
[预览地址](https://sl1673495.github.io/dp-waterfall)

[完整代码地址](https://github.com/sl1673495/dp-waterfall/blob/master/index.html)

## 总结

算法思想在前端中的应用还是可以见到不少的，本文只是为了演示动态规划在求解最优解问题时的威力，并不代表这种算法适用于生产环境（实际上性能非常差）。

在实际场景中我们可能一定需要最优解，而只是需要左右两侧的高度不要相差的过大就好，那么这种情况下简单的贪心算法完全足够。

在业务工程中，我们需要结合当前的人力资源，项目周期，代码可维护性，性能等各个方面，去选择最适合业务场景的解法，而不一定要去找到那个最优解。

但是算法对于前端来说还是非常重要的，想要写出 bug free 的代码，在复杂的业务场景下也能游刃有余的想出优化复杂度的方法，学习算法是一个非常棒的途径，这也是工程师必备的素养。

## 推荐

我维护了一个 LeetCode 的[题解仓库](https://github.com/sl1673495/leetcode-javascript/issues)，这里会按照标签分类记录我平常刷题时遇到的一些比较经典的问题，并且也会经常更新 bobo 老师的力扣算法课程中提到的各个分类的经典算法，把他 C++ 的解法改写成 JavaScript 解法。欢迎关注，我会持续更新。

## 参考资料

[一文搞懂动态规划](https://juejin.im/post/5e86d0ad6fb9a03c387f3342)

[玩转算法面试 从真题到思维全面提升算法思维](https://coding.imooc.com/class/82.html)

## ❤️ 感谢大家

1.如果本文对你有帮助，就点个赞支持下吧，你的「赞」是我创作的动力。

2.关注公众号「前端从进阶到入院」即可加我好友，我拉你进「前端进阶交流群」，大家一起共同交流和进步。

![](https://user-gold-cdn.xitu.io/2020/4/5/17149cbcaa96ff26?w=910&h=436&f=jpeg&s=78195)

  
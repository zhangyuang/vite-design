# SSR + Vite

在经过了大半个月的努力后终于将 Vite 接入进了我们的 [SSR框架](https://github.com/ykfe/ssr)。总共源码改动大概几十行代码。其实本不用这么长时间，主要是最近业务太忙，所以这个 PR 的代码基本都是我之前在阿里认识的校招同学贡献的，我负责出 idea 他负责代码实现。在这里感谢一下祥杰同学的贡献。

不了解 Vite 是什么或者其工作机制的同学，可以去看看 Vite 的[中文文档](https://cn.vitejs.dev/) 或者本人之前写的 [Vite 源码解析](https://github.com/zhangyuang/vite-design) 来简单了解下。正如知乎上的问题 [2021前端会有什么新的变化？](https://www.zhihu.com/question/428128531/answer/1665281144) 就提到了 `Vite` 会取代 `Webpack`。今年快过半了，也看到不少团队的 PPT 分享时介绍自己用了 `Vite` 后构建速度从 Webpack 的 几十秒 到 `Vite` 的 几秒钟 的提升。可以看出 `Vite` 主打的优势就是快，包括闪电般的启动速度，以及 `HMR` 速度。

## 前言

在这里先发表一下本人对 `Vite` 的看法，首先从 `Vite1.0` 开始我便对 Vite 有着极大的兴趣。包括上述 `Vite` 源码解析的文档也是从 1.0 写到了 2.0。毫无疑问从今天的角度看来，`Vite` 的设计和使用体验是要比 `Webpack` 优秀非常多的(当然其实原理完全不一样所以也不存在 `Webpack` 吸收 `Vite` 优点的可能)。但我不建议盲目的抛弃 `Webpack` 选择 `Vite`。理由如下

1. 个人认为 `Webpack` 最大的问题从来都不是它的性能，而是配置的复杂度。当然过于复杂的配置导致绝大多数人并不能正确的配置导致性能十分低下又绕回去了。但是如果正确的使用了 `Webpack` 的配置，在绝大多数场景下 `Webpack > 4.0` 的性能我认为是足够用的。正如本篇文章介绍的 SSR 框架使用 `Webpack` 也用来开发过十几个页面几百个组件的应用，并没有感受到速度的明显下降。绝大多数前端框架(这里指的是在 React/Vue 上面包一层或者包很多层的那种框架比如 Next, Nuxt 等等)速度慢的原因无外乎是使用了错误的构建配置，或者是包了太多层导致自己都不知道哪一层导致性能出问题了。

2. 旧应用迁移到 `Vite` 成本过高，且无法保证稳定性。了解 `Vite` 的同学都知道，它是基于浏览器 ESM 特性的，虽然它提供了预优化这一步骤来将不支持 ESM 格式的第三方模块转换为 ESM 格式，但对于业务代码仍需要我们手动修改。且生产环境它采用 Rollup 进行打包构建，并不能保证构建出来的行为与原 Webpack 构建出的文件行为一致。目前我的部分同时反馈会出现一些非预期的情况。这一点有待商榷需要收集整理问题。不过如果是新的 SPA 应用，倒是可以放心大胆的使用

3. 在 SSR 场景下，本人是暂时不推荐 All in `Vite` 的，诚如目前 `Vite` 官方的 SSR 也只能说自己处于试验阶段，不保证有无风险。这一点我会在接下来说明可能会出现的风险，以及我们的 SSR 框架最终采用的策略

## SSR 框架集成 Vite

`注：此章节内容，如果是之前未了解过服务端渲染原理的同学可能阅读起来会有一定障碍。`

在 Vite 官方给出了一个简单的 [SSR Demo](https://github.com/vitejs/vite/tree/main/packages/playground/ssr-vue) 后，我就去看了一下。代码非常简单易懂，阅读起来难度不大。首先是服务端打包入口与客户端打包入口文件这一块，其实与原来的 Webpack 场景几乎没有任何区别可以直接移植。需要注意的点如下

### Vite MiddleWare

如下代码所示

```js
if (!isProd) {
    vite = await require('vite').createServer({
      root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: true
      }
    })
    // use vite's connect instance as middleware
    app.use(vite.middlewares)
  } else {
    app.use(require('compression')())
    app.use(
      require('serve-static')(resolve('dist/client'), {
        index: false
      })
    )
  }
```

Vite 在本地开发时，提供了中间件的形式可以在任何 Node.js 框架接入。默认的示例使用的是 express。此中间件的作用是接管客户端文件的请求。相比于 Webpack 构建出来的 bundle 执行流程的区别如下

- Webpack: 服务端渲染组件为 html 字符串或者流 -> 浏览器接受展示首屏内容 -> 浏览器加载 Webpack 根据 `entry-client` 构建出来的客户端 bundle 进行 hydrate 激活 dom

- Vite: 服务端渲染组件为 html 字符串或者流 -> 浏览器接受展示首屏内容 -> 浏览器直接加载 `entry-client` 文件，再根据实际的业务以 http 请求的方式加载 entry-client 所依赖的文件，也就是跟常规的 Vite SPA 应用一样会在浏览器中看到一排文件列表

在生产环境时，Vite 则使用 Rollup 来将代码打包成一个 bundle 放在静态资源文件夹中加载，这种形式就跟 Webpack 没有任何区别了。只有在本地开发时才会感受到明显区别。

### Vite LoadModule

此外，Vite 还提供了 LoadModule API 来解析 `entry-server`, 使得我们可以直接在 Node.js 环境执行 ESM 格式的代码，且支持 HMR

```js
render = (await vite.ssrLoadModule('/src/entry-server.js')).render
```

分析完之后其实一个 Vite SSR 应用的执行流程就很容易看懂了。但是我们的框架并没有采用跟官方一样的方案思路。理由如下

### SSR 框架升级策略

下面介绍了一下本框架是如何最小成本化的接入 Vite 的，如果有不准确的地方麻烦轻吐槽

在 Vite 出现大部分类似的框架都是使用 Webpack 来作为构建工具，如果全量切换成 Vite 或者将 Webpack 与 Vite 完全隔离以插件的形式来让用户决定到底是用 Webpack 还是 Vite 进行构建，那么改动量我认为前者会非常大，后者的工作量也不小。但是其实在我们的框架完全分离其实也不难，因为我们的核心源码也就几千行，不像 Next, Nuxt 这种代码巨无霸级别的项目就算支持了 Vite 我认为 Bug 也会非常多。但是即使是这样，在这个版本中，我们仍没有打算完全的分离 Webpack 与 Vite，理由如下

- 本框架原 Webpack 构建逻辑非常成熟，包括 externals 逻辑以及接入第三方 UI 库 如 antd, vant 样式处理，以及各种 loader 逻辑。如果迁移成 Vite + Rollup 的形式在稳定性和一致性上需要花较多功夫调试。

- 个人认为 Vite 最大的发挥场景还是在浏览器当中，`vite.ssrLoadModule` 方法虽然能够让我们在 Node.js 环境中直接使用 ESM 模块，但是这样需要在生产环境中安装 Vite 依赖，且由于缺少了 bundle 的这个过程，由于 Node.js 环境是无法识别处理样式文件的，一旦使用了 antd vant 这样的依赖，由于 antd/vant 在使用 `babel-plugin-import` 导入时会在一个 js 文件中去 require 样式文件。由于缺少了 bundle 的这个过程，对于 服务端入口这一块的处理会非常麻烦。由于目前我尚未看过 `ssrLoadModule` 源码，但我猜测干的事情应该与浏览器差不多，会针对不同类型的文件做了不同的处理。但就算不使用 `babel-plugin-import` 直接去 import 具体的文件也会遇到一些问题。虽然这些问题肯定都有对应的解决方案，但需要去修改 Vite 默认的一些配置。这样其实又绕回到原来使用 Webpack 那一套麻烦的配置中去了

- 首屏样式闪烁。由于 Vite nobundle 的特性，只有在 Vite 请求到达浏览器的时候，我们才知道该请求的依赖。所以就导致我们只有在加载完 `entry-client` 文件后再依次加载首屏需要用的文件，包括样式文件。这之后样式才能够正常展示目前官方的 [playground demo](https://github.com/vitejs/vite/tree/main/packages/playground/ssr-vue) 就存在这个问题。以前 Webpack 场景下的常规的解决方案是在构建时我们能够知道首屏需要依赖的 css 文件，提前打包成独立文件或者 style 标签的形式在服务端注入到页面头部。不过由于 Vite 存在 optimize 预优化这个过程，这个过程中会分析文件的依赖链，所以我认为要解决的话在 `ssrLoadModule` 中做一些逻辑应该也有对应的解决方案。

综上所述，在这个版本中我定下的接入 Vite 方案如下

- 同时支持 Webpack/Vite 两种方案，当使用 `ssr start --vite` 进行本地开发时使用 Webpack 去打包 服务端 bundle，然后在 Node.js 框架中加载 Vite 提供的中间件，让 Vite 服务接管客户端文件请求。
- 生产环境仍使用 Webpack 去构建项目

我思考了一下此方案的优劣势如下  

优势

- 稳定，只有本地开发才会用的 Vite，生产环境的行为仍和以前一致不需要担心
- 改动成本极低，我们其实只需要在本地开发时砍掉原来的 Webpack 构建客户端 bundle 的步骤以及新增接入 Vite  中间件，再将本来的一些 `entry-client` 中的语法改成 ESM 即可完成迁移。统计了一下大概改动量在几十行代码左右

不足

- 由于我们在本地开发与生产环境使用了不同的工具，这就会导致我们不能过分依赖某一个工具的某一配置特性，这样需要在本地开发和生产环境都做对应配置的兼容。好在 Vite 默认的配置已经足够 cover 绝大多数客户端应用执行过程所需要的功能。

其实这种开箱即用的框架其实我都不建议开放类似于 chainWebpack 之类的配置来让用户去自己 diy。可以看看 github 绝大部分的 issue 都是由于用户自己 diy 引起的。要么默认的配置就做到足够好，要么只提供关键配置让用户使用例如 cssloaderOptions，而不是整个 chainWebpack 这样的 API

性能对比

由于我们仍然使用了 Webpack 所以注定我们的性能速度跟 All in Vite 的情况肯定是比不了。但其实就如同上面提到的，Webpack 的最大问题从来不是性能并且本框架之前的 Webpack 配置性能已经足够使用了，特别是在打包服务端 bundle 这一块，由于我们开启了 externals 配置需要打包的文件体积非常小，所以我们的打包速度大概在 2s 内即可完成。

构建步骤如下

1. 启动命令 import一些 必要的模块，这里我们已经对 Webpack 的依赖做了细致的分离，例如在 Vite 场景下很多 Webpack 打包客户端 bundle 所需要的依赖我们是没有必要加载的，这样会拖慢我们的启动速度。

2. Webpack 构建服务端 bundle (耗时在 2s 左右)

3. Midway/Nest.js 服务启动，加载 Vite 中间件 (耗时在 3s 左右)

跟之前版本的做法比起来。在启动速度上，我们少了构建客户端 bundle 这一步，时间大概能减少 2s 左右，主要是之前的 Webpack 版本构建速度已经足够快了。如果你之前使用的是  Nuxt, Next 这种项目稍微一大起来速度就慢的跟蜗牛一样的巨无霸框架那你应该能感受到明显的速度提升。  

跟 All in Vite 的方式比起来，我们多了一个 Webpack 构建服务端 bundle 的耗时。至于 Midway/Nest.js 服务启动，加载 Vite 中间件 无论你使用什么方案这都是必经之路。这快的速度可以让 Midway 的同学优化一下。

总结：写了这么多内容，其实也并不代表这里介绍的方案是最优的，但是我认为肯定是修改成本最小的方案。主要还是想跟大家分享一下我在升级过程中的一些思考。代码实现从来都不是最难的，难的是思路以及整体层面的一些思考设计。就像我在做 SSR 场景下代码分割的一些想法，也跟官方 loadable 的推荐做法完全不一致。在这里感谢一下 尤大的贡献让大家的工作效率提升这么多，有些同学可能看了点 Vite 的源码或者 Vue 源码后觉得不难感觉自己也能实现。其实这是错误的思想。在这里引用一段回答 

>以王垠的水平，他可以开发出像 nginx 和 redis 这样的软件吗？
答案：nginx和redis的伟大之处， 不在于它们技术有多难，基本上任何一个合格的程序员，在学习它们背后的设计思路和底层技术后， 通过记忆复刻一个类似的东西出来并不算难。nginx和redis之所以伟大， 是它们都是它们的作者出于对现实的不满意，通过自己的能力改造世界的成果。这背后最不可思议的是，一个人能认识到现实世界中的不完美， 同时他还能想到一种方式做出改进，同时他还有能力实现自己的想法，这三件事巧合地发生在一个人身上，这才是最难能可贵的。

最后，也并不排除之后我们的 `SSR` 框架会将 `Webpack/ Vite` 完全分离，提供 `All in Vite` 的方案给大家使用，这套方案已经在微信内部正式的投入使用了，我们会持续更新维护下去。其实这个框架从 1.0 `egg-react-ssr` 的版本开始到今天也算开发了 2年 多了。作者都已经从 阿里 跳到 微信了，绝不是什么 KPI 项目纯属个人对 coding 的爱好支撑维护欢迎使用
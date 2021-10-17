# vite ⚡ 1.0 中文文档

[![npm][npm-img]][npm-url]
[![node][node-img]][node-url]
[![unix CI status][unix-ci-img]][unix-ci-url]
[![windows CI status][windows-ci-img]][windows-ci-url]

Vite 是一个有态度的 web 开发构建工具，在本地开发时使用原生的 ES Module 特性导入你的代码。在生产环境使用 [Rollup](https://rollupjs.org/) 打包代码。

- 更快的冷启动速度
- 即时的热替换功能
- 真正的按需编译
- 更多详细信息请查看[How and Why](#how-and-why)

## 状态

目前在beta阶段, 预计很快发布1.0版本。

## 快速开始

> 对于 Vue 用户来说: Vite 目前仅支持 Vue 3.x. 这意味着你不能使用尚未与 Vue 3 兼容的库

```bash
$ npm init vite-app <project-name>
$ cd <project-name>
$ npm install
$ npm run dev
```

如果你使用yarn:

```bash
$ yarn create vite-app <project-name>
$ cd <project-name>
$ yarn
$ yarn dev
```

> 虽然 Vite 主要是为了与 Vue 3 一起工作而设计的, 但它同时也能很好的支持其他框架。例如, 你可以尝试 `npm init vite-app --template react` 或者 `--template preact`.

### 使用 master 分支

如果你迫不及待的想要测试最新的特性，克隆 `vite` 到本地并且执行以下命令:

```
yarn
yarn build
yarn link
```

然后进入基于 vite 创建的项目并且执行 `yarn link vite`。 现在可以重启你的服务 (`yarn dev`) 去体验最新的特性！

## Browser Support

Vite 在开发环境下依赖原生[ES module imports](https://caniuse.com/#feat=es6-module)。在生产环境构建时依赖动态加载实现代码分割 (polyfill参考[polyfilled](https://github.com/GoogleChromeLabs/dynamic-import-polyfill))

Vite 假设你的代码运行在现代浏览器上，默认将会使用 `es2019` 规范来转换你的代码。(这使得可选链功能在代码压缩后能被使用)。同时你能够手动的在配置选项中指定构建目标版本。最低的版本规范是 `es2015`。

## 功能

- [Bare Module Resolving](#bare-module-resolving)
- [Hot Module Replacement](#hot-module-replacement)
- [TypeScript](#typescript)
- [CSS / JSON Importing](#css--json-importing)
- [Asset URL Handling](#asset-url-handling)
- [PostCSS](#postcss)
- [CSS Modules](#css-modules)
- [CSS Pre-processors](#css-pre-processors)
- [JSX](#jsx)
- [Web Assembly](#web-assembly)
- [Inline Web Workers](#web-workers)
- [Custom Blocks](#custom-blocks)
- [Config File](#config-file)
- [HTTPS/2](#https2)
- [Dev Server Proxy](#dev-server-proxy)
- [Production Build](#production-build)
- [Modes and Environment Variables](#modes-and-environment-variables)

Vite 尽可能的尝试复用 [vue-cli](http://cli.vuejs.org/) 的默认配置。如果你之前使用过 `vue-cli` 或者其他基于 `Webpack` 的模版项目，你应该会非常熟悉这些。这意味着不要期望在这里和那里会有什么不同。

### Bare Module Resolving

原生的 ES imports 规范不支持裸模块的导入，例如

```js
import { createApp } from 'vue'
```

这种写法默认将会抛出错误。Vite 会检测到当前服务中的所有 `.js` 文件，并且重写他们的路径例如 `/@modules/vue`。 在这种路径下，Vite 将会从你安装的依赖中正确的解析执行模块。

对于 `vue` 这个依赖则有着特殊的处理。如果你没有在项目的本地依赖中安装，Vite 将会回退到它自身的依赖版本。这意味着如果你全局安装了 Vite, 它将更快的找到 Vue 实例而不需要在本地安装依赖。

### Hot Module Replacement

- `vue` `react` 以及 `preact` 模版已经在 `create-vite-app` 集成了热替换功能可以开箱即用

- 为了手动的控制热替换功能, 可以使用该 API `import.meta.hot`.

  如果模块想要接收到自身替换回调, 可以使用 `import.meta.hot.accept`:

  ```js
  export const count = 1

  // 这个条件判断使得热替换相关的代码将会在生产环境被丢弃
  if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
      console.log('updated: count is now ', newModule.count)
    })
  }
  ```

  一个模块同样能够接收到来自其他模块的更新通知而不需要重新加载。可以使用 `import.meta.hot.acceptDeps`：

  ```js
  import { foo } from './foo.js'

  foo()

  if (import.meta.hot) {
    import.meta.hot.acceptDeps('./foo.js', (newFoo) => {
      // 回调函数将会在 './foo.js' 被更新时触发
      newFoo.foo()
    })

    // 同样我们可以接受一个数组
    import.meta.hot.acceptDeps(['./foo.js', './bar.js'], ([newFooModule, newBarModule]) => {
      // 回调函数将会在这个数组中的模块被更新时触发
    })
  }
  ```

  接收自身更新通知的模块或者接收来自其他模块更新通知的模块可以使用 `hot.dispose` 来清理一些更新过程中产生的副作用

  ```js
  function setupSideEffect() {}

  setupSideEffect()

  if (import.meta.hot) {
    import.meta.hot.dispose((data) => {
      // cleanup side effect
    })
  }
  ```

  完整的API可以查看 [hmr.d.ts](https://github.com/vitejs/vite/blob/master/hmr.d.ts).
  
  Vite 的热替换功能并不会交换导入的模块来源。如果一个被接收的模块被重复的导出了，它有责任去更新这些重复的导出(这些导出必须使用 `let`)。另外，接收模块的上游将不会被通知这些变化。(这块尝试写了一些事例验证但是还是无法get到原文想表达的准确意思)

  这个简洁的的热替换实现在很多开发场景是足够用的。这使得我们可以跳过昂贵的生成代理模块的过程。

### TypeScript

Vite 支持在Vue 单文件组件中使用 `<script lang="ts">` 导入 `.ts` 文件。

Vite 只进行 `.ts` 文件的转换而不会进行类型检查。它假设类型检查已经在你的 IDE 或者在构建命令中已经被加入进来了(例如你可以在构建脚本中执行 `tsc --noEmit`)。

Vite 使用 [esbuild](https://github.com/evanw/esbuild) 来转换 TypeScript 到 JavaScript 速度相比 `tsc` 快 20-30倍。 热替换的更新时间在浏览器中将小于50ms。

因为 `esbuild` 仅进行转换不附带类型信息。所以它不支持以下功能例如常量枚举以及隐式的类型导入。你必须在 `tsconfig.json` 文件的 `compilerOptions` 选项中设置 `"isolatedModules": true`, 这样 TS 将会警告你这些功能在这个选项下不能被使用。

### CSS / JSON Importing

You can directly import `.css` and `.json` files from JavaScript (including `<script>` tags of `*.vue` files, of course).

- `.json` 文件的内容将会以默认导出的形式导出一个对象

- `.css` 文件将不会导出任何东西除非它是以 `.module.css` 作为后缀名。(查看 [CSS Modules](#css-modules))。 在开发环境下导入它会产生副作用并且注入到页面当中，在生产环境最终会单独打包为 `style.css` 文件。

CSS 和 JSON 的导入都支持热替换功能。

### Asset URL Handling

你可以在 `*.vue` 模版 styles 标签以及 `.css` 文件中引用静态资源，通过绝对的静态目录路径(基于你的项目根目录) 或者相对路径 (基于当前文件)。后者的行为与你之前在 `vue-cli` 或者webpack的 `file-loader` 的使用方式非常像。

所有被引用的资源包括使用绝对路径引用的资源最终都会被复制到打包后的 dist 文件夹当中并且文件名包含 has h值, 没有被引用的文件将不会被复制。与 `vue-cli` 一样，小于 4kb 的图片资源将会以 base64 的形式内联。

所有的静态资源路径引用，包括绝对路径都是基于你当前的工作目录结构。

#### The `public` Directory

项目工程下的 `public` 目录提供不会在源码中引入静态文件资源文件(例如 `robots.txt`), 或者必须保留原始名称的文件(不附带 hash 值)。

`public` 目录中的文件将会被复制到最终的 dist 文件夹当中。

如果要引用 `public` 中的文件需要使用绝对路径，例如 `public/icon.png` 文件在源码中的引用方式为 `/icon.png`。

#### Public Base Path

如果你的项目以嵌套文件夹的形式发布。可以使用 `--base=/your/public/path/` 选项，这样所有的静态资源的路径会被自动重写。

为了动态的路径引用，这里有两种方式提供

- 你可以获得解析后的静态文件路径通过在 JavaScript 中 导入不它们。例如  `import path from './foo.png'` 将会以字符串的形式返回加载路径。

- 如果你需要在云端拼接完整的路径，可以使用注入的全局变量 `import.meta.env.BASE_URL` 它的值等于静态资源的基路径。这个变量在构建过程中是静态的，所以它必须以这种方式出现。 (`import.meta.env['BASE_URL']` 将不会生效)

### PostCSS

Vite 将自动的在 `*.vue` 文件中的所有 styles 标签 以及所有导入的 `.css` 文件中应用 PostCSS。只需要安装必要的插件并且在项目根目录下添加 `postcss.config.js` 配置文件。

### CSS Modules

如果你想使用 CSS Modules 你并不需要配置 PostCSS，因为这已经集成好是开箱即用的。在 `*.vue` 组件中你可以使用 `<stype module>`, 在 `.css` 文件中你可以使用 `*.module.css` 的后缀名便可以以带有 hash 值的形式来导入它们。

### CSS Pre-Processors

因为 Vite 期望你的代码将会运行在现代浏览器中，所以它建议使用原生的 CSS 变量结合 PostCSS 插件来实现 CSSWG 草案 (例如 [postcss-nesting](https://github.com/jonathantneal/postcss-nesting)) 使其变得简洁以及标准化。这意味着，如果你坚持要使用 CSS 预处理，你需要在本地安装预处理器然后使用。

```bash
yarn add -D sass
```

```vue
<style lang="scss">
/* use scss */
</style>
```

同样也可以在 JS 文件中导入

```js
import './style.scss'
```

#### Passing Options to Pre-Processor

> 要求版本大于等于 1.0.0-beta.9+
> 如果你需要修改默认预处理器的配置，你可以使用 config 文件中的 `cssPreprocessOptions` 选项(查看 [Config File](#config-file))
> 例如为你的 less 文件定义一个全局变量

```js
// vite.config.js
module.exports = {
  cssPreprocessOptions: {
    less: {
      modifyVars: {
        'preprocess-custom-color': 'green'
      }
    }
  }
}
```

### JSX

`.jsx` and `.tsx` files are also supported. JSX transpilation is also handled via `esbuild`.

`.jsx` 以及 `.tsx` files 同样是支持的。 JSX 文件同样使用 `esbuild` 来进行转换。

默认与 Vue3 结合的 JSX 配置是开箱即用的 (对 Vue 来说目前还没有针对 JSX 语法的热替换功能)

```jsx
import { createApp } from 'vue'

function App() {
  return <Child>{() => 'bar'}</Child>
}

function Child(_, { slots }) {
  return <div onClick={() => console.log('hello')}>{slots.default()}</div>
}

createApp(App).mount('#app')
```

同时这种写法将会自动导入与 `jsx` 兼容的函数，esbuild 将会转换 JSX 使其成为与 Vue 3 兼容并且能够在虚拟节点中被调用。Vue 3 最终将提供可利用Vue 3的运行时快速的自定义JSX转换。

#### JSX with React/Preact

我们准备了两种方案分别是 `react` 和 `preact`。你可以使用 Vite 执行下列命令来进行方案的选择使用 `--jsx react` or `--jsx preact`。

如果你需要一个自定义的 JSX 编译规则，JSX 支持自定义通过在 CLI 中使用 `--jsx-factory` 以及 `--jsx-fragment` 标志。或者使用 API 提供的 `jsx: { factory, fragment }`。例如你可执行 `vite --jsx-factory=h` 来使用 `h` 作为 JSX 元素被创建时候的函数调用。在配置文件中 (参考 [Config File](#config-file)), 可以通过下面的写法来指定。

```js
// vite.config.js
module.exports = {
  jsx: {
    factory: 'h',
    fragment: 'Fragment'
  }
}
```

在使用 Preact 作为预置的场景下， `h` 已经自动注入在上下文当中，不需要手动的导入。然而这会导致在使用 `.tsx` 结合 Preact 的情况下 TS 为了类型推断期望 `h` 函数能够被显示的导入。在这种情况下，你可以显示的指定 factory 配置来禁止 `h` 函数的自动注入。

### Web Assembly

> 1.0.0-beta.3+

预编译的 `.wasm` 文件能够被直接导入。默认的导出会作为初始化函数返回一个 Promise 对象来导出 wasm 实例对象:

``` js
import init from './example.wasm'

init().then(exports => {
  exports.test()
})
```

init 函数也能够获取到 `imports` 对象作为 `WebAssembly.instantiate` 的第二个参数传递。

``` js
init({
  imports: {
    someFunc: () => { /* ... */ }
  }
}).then(() => { /* ... */ })
```

在生产环境构建时，小于 `assetInlineLimit` 大小限制的 `.wasm` 文件将会以 base64 的形式内联。否则将会复制到 dist 文件夹作为静态资源被获取。

### Inline Web Workers

> 1.0.0-beta.3+

web worker 脚本能够被直接导入只需要在后面加上 `?worker`。默认的导出是一个自定义的 worker 构造函数。


``` js
import MyWorker from './worker?worker'

const worker = new MyWorker()
```

在生产环境构建时，workers 将会以 base64 的形式内联。

worker 脚本同样使用 `import` 而不是 `importScripts()`，在开发环境下这依赖于浏览器的原生支持，并且仅在 Chrome 中能够工作，但是生产环境已经被编译过了。

如果你不希望内联 worker 脚本，你可以替换你的 worker 脚本到 `public` 文件夹，然后初始化 worker 例如 `new Worker('/worker.js')`

### Config File

你可以在当前项目中创建一个 `vite.config.js` 或者 `vite.config.ts` 文件。Vite 将会自动的使用它。你也可以通过 `vite --config my-config.js` 显式的指定配置文件。

除了在 CLI 映射的选项之外，它也支持 `alias`, `transfroms`, `plugins` (将作为配置接口的子集)选项。在文档完善之前参考 [config.ts](https://github.com/vuejs/vite/blob/master/src/node/config.ts) 来获得更全面的信息。

### Custom Blocks

[自定义区块](https://vue-loader.vuejs.org/guide/custom-blocks.html) 在 Vue 的单文件组件中也是支持的。可以通过 `vueCustomBlockTransforms` 选项来指定自定义区块的转换规则:

``` js
// vite.config.js
module.exports = {
  vueCustomBlockTransforms: {
    i18n: ({ code }) => {
      // return transformed code
    }
  }
}
```

### HTTPS/2

通过 `--https` 的方式来启动服务将会自动生成自签名的证书。并且服务将会启用 TLS 以及 HTTP/2。

同样可以通过 `httpsOptions` 选项来自定义签名证书。与 Node 的 `https.ServerOptions` 一样支持接收以下参数 `key`, `cert`, `ca`, `pfx`。

### Dev Server Proxy

你可以使用配置文件中的 `proxy` 选项来自定义本地开发服务的代理功能。Vite 使用 `koa-proxies`](https://github.com/vagusX/koa-proxies), 它底层使用了[`http-proxy`](https://github.com/http-party/node-http-proxy)。键名可以是一个路径，更多的配置可以查看 [here](https://github.com/http-party/node-http-proxy#options)。

用例:

``` js
// vite.config.js
module.exports = {
  proxy: {
    // string shorthand
    '/foo': 'http://localhost:4567/foo',
    // with options
    '/api': {
      target: 'http://jsonplaceholder.typicode.com',
      changeOrigin: true,
      rewrite: path => path.replace(/^\/api/, '')
    }
  }
}
```

### Production Build

Vite 在生产环境构建时会进行打包。因为原生的 ES 模块导入在瀑布流网络请求中很容易导致页面的加载时间过长让人难以接受。

执行 `vite build` 来打包应用。

在内部我们使用 Rollup 来生成最终的构建结果。构建配置我们将会透传给 Rollup，一些选项我们可以通过 CLI 来进行透传 (参考 [build/index.ts](https://github.com/vuejs/vite/blob/master/src/node/build/index.ts) 来获得更多信息)。

### Modes and Environment Variables

模式选项用于指定 `import.meta.env.MODE` 的值，同时正确的环境变量文件将会被加载。

默认存在两种模式:
  - `development` 使用于 `vite` 以及 `vite serve`
  - `production` 使用于 `vite build`

你可以通过 `--mode` 选项来覆盖默认的模式，例如你想以开发模式来进行构建：

```bash
vite build --mode development
```

当执行 `vite` 命令时，环境变量将会从当前目录的以下文件中被加载

```
.env                # 在任何情况下都被加载
.env.local          # 在任何情况下都被加载, 会被 git 忽略
.env.[mode]         # 仅在当前指定的模式下被加载
.env.[mode].local   # 仅在当前指定的模式下被加载, 会被 git 忽略
```

只有 `VITE_` 开头的变量会暴露在你的代码中。例如 `VITE_SOME_KEY=123` 将会暴露在 `import.meta.env.VITE_SOME_KEY`。但是 `SOME_KEY=123` 将不会。 因为 `.env` 文件或许会被一些用户在服务端或者构建脚本中使用。有可能包含一些敏感信息不适合出现在浏览器。

## API

### Dev Server

你可以使用这个 API 来自定义本地开发服务。这个服务接受一些插件并且将会注入到 Koa app 实例当中：

```js
const { createServer } = require('vite')

const myPlugin = ({
  root, // 项目根路径，绝对路径
  app, // Koa app 实例
  server, // http server 实例
  watcher // chokidar file watcher instance
}) => {
  app.use(async (ctx, next) => {
    // 你可以在这里做一些预处理。这些是最原始的请求
    // 在 vite 接触它之前
    if (ctx.path.endsWith('.scss')) {
      //  vue <style lang="xxx"> 默认已经被支持只要默认的预处理器被安装
      // 所以下面的写法仅应用于 <link ref="stylesheet" href="*.scss"> 或者 js imports like
      // `import '*.scss'`.
      console.log('pre processing: ', ctx.url)
      ctx.type = 'css'
      ctx.body = 'body { border: 1px solid red }'
    }

    // ...wait for vite to do built-in transforms
    await next()

    // Post processing before the content is served. Note this includes parts
    // compiled from `*.vue` files, where <template> and <script> are served as
    // `application/javascript` and <style> are served as `text/css`.
    // 在内容被发送之前进行预处理包括以下部分
    // 编译 `*.vue` 文件，<template> 和 <script> 以 `application/javascript` 的形式托管服务， <style> 以 `text/css` 的形式托管服务
    if (ctx.response.is('js')) {
      console.log('post processing: ', ctx.url)
      console.log(ctx.body) // 可以是字符串或者可读流
    }
  })
}

createServer({
  configureServer: [myPlugin]
}).listen(3000)
```

### Build

获取更全面的选项请查看 [build/index.ts](https://github.com/vuejs/vite/blob/master/src/node/build/index.ts)

```js
const { build } = require('vite')

;(async () => {
  // All options are optional.
  // check out `src/node/build/index.ts` for full options interface.
  const result = await build({
    rollupInputOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
    },
    rollupOutputOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
    },
    rollupPluginVueOptions: {
      // https://github.com/vuejs/rollup-plugin-vue/tree/next#options
    }
    // ...
  })
})()
```

## How and Why

### 与 `vue-cli` 以及 其他打包工具的区别

主要的区别是 Vite 在开发环境下没有打包的过程。源码中的模块的导入语法是服务端直接发送给浏览器运行。浏览器解析它们通过原生的 `<script module>` 支持，对每一个 import 使用 http 请求。本地开发服务将拦截这些请求并进行必要的代码转换。例如 import `*.vue` 文件将会在发送给浏览器之前被编译。

通过这种方式处理我们有以下优势:

- 不需要等待打包，所以冷启动的速度将会非常快

- 代码是按需编译的。只有你当前页面实际导入的模块才会被编译。你不需要等待整个应用程序被打包完才能够启动服务。这在有很多页面的应用上体验差别更加巨大。

- 热替换的性能将与模块的总数量无关。这将使得热替换变得非常迅速无论你的应用有多大。

整个页面的刷新比起基于工具打包会慢一点。存在很深的导入链的情况下的原生的 ES 模块的导入很容易导致网络瀑布。然而这是本地开发与实际编译相比差别应该不大。(在页面重载时不需要编译，因为编译结果已经缓存在内存中了)

因为编译是在 Node 中完成的，在技术上我们可以进行任何的代码转换，没有什么可以阻止你捆绑最终打包到生产环境的代码。事实上， Vite 提供了 `vite build` 命令来进行精确的打包让你的应用在生产环境中不会发生网络瀑布。

### How is This Different from [es-dev-server](https://open-wc.org/developing/es-dev-server.html)?

`es-dev-server` 是一个非常好的项目，我们早期设计有很多灵感来自于它。下面是 Vite 和 `es-dev-server` 的区别以及为什么我们不以 `es-dev-server` 中间件的形式来实现 Vite：

- Vite 的主要目标之一是实现热替换，但是 `es-dev-server` 的内部不是很透明导致无法通过中间件来使其很好的工作

- Vite 目标做一个独立的工作同时在开发环境以及构建时使用。你可以无需配置便可以针对同一份源码在开发环境或构建时使用 Vite 

- Vite 对处理一些明确类型的导入文件是更加有态度的。例如 `.css` 文件和静态资源。基于上述理由这些处理方式类似于 `vue-cli`

### How is This Different from [Snowpack](https://www.snowpack.dev/)?

Snowpack v2 和 Vite 在本地开发服务都提供了原生 ES 模块的导入。Vite 依赖预优化的灵感也来自于Snowpack v1。在开发反馈速度上面，两个项目非常类似。一些值得注意的不同点如下：

- Vite 被创造出来用于处理基于原生 ES 模块的热替换功能。当 Vite 首次发布能够正常工作的基于原生 ES 模块的热替换功能时，没有其他的项目积极尝试将原生 ES 模块的热替换功能用于生产。

  Snowpack v2 最初也不支持热替换但是计划在之后的版本提供。这将使得两个项目更加的类似。Vite 和 Snowpack 计划合作针对原生 ES 模块的热替换提供一个通用的 API 规范。但是由于两个项目的内部实现方式的区别，两个项目的 API 仍将会有所区别。

- 两个项目的解决方案都是在生产环境进行应用的打包。但是 Vite 使用 Rollup 进行构建，Snowpack 通过插件使用 Parcel/webpack 进行构建。Vite 在很多场景下构建结果是更快并且更小的。另外与打包程序更紧密的结合可以更容易的在开发环境和生产环境配置中修改 Vite 的转换规则以及插件。

- Vue是Vite的一等公民，这意味着Vite会对Vue提供更加细粒度的HMR集成，而且通过打包配置能生成更加高效的bundle。

- Vite 对 Vue 的支持是一流的。Vite 针对 Vue 提供了更细粒度的热替换功能以及在构建配置上做了调整来生成最有效的打包结果。

## Contribution

See [Contributing Guide](https://github.com/vitejs/vite/tree/master/.github/contributing.md).


## Trivia

[vite](https://en.wiktionary.org/wiki/vite)是法语单词"fast"，读作`/vit/`。

## License

MIT

[npm-img]: https://img.shields.io/npm/v/vite.svg
[npm-url]: https://npmjs.com/package/vite
[node-img]: https://img.shields.io/node/v/vite.svg
[node-url]: https://nodejs.org/en/about/releases/
[unix-ci-img]: https://circleci.com/gh/vitejs/vite.svg?style=shield
[unix-ci-url]: https://app.circleci.com/pipelines/github/vitejs/vite
[windows-ci-img]: https://ci.appveyor.com/api/projects/status/0q4j8062olbcs71l/branch/master?svg=true
[windows-ci-url]: https://ci.appveyor.com/project/yyx990803/vite/branch/master

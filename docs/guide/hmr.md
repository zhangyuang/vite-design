---
sidebarDepth: 3
---

# 热替换

热替换(Hot Module Replacement) 指的是修改代码后无需刷新页面即可生效。经常跟 Hot Module Reload 搞混。一个成熟的框架是必须要具备热替换能力的。Vite 的热替换实现与业界知名的一些模块如 webpack-dev-server 的实现类似。本质都是通过 websocket 建立服务端与浏览器的通信。如果对 websocket 不了解的可能需要先去学习下相关知识点。这里我们将分别分析修改几种不同类型的文件如 .vue .js .css 文件的热替换机制在 Vite 是具体如何实现的。同时也会分析 Vite 提供的热替换相关的 API，如: import.meta.hot

## 监听文件变化

首先服务端向浏览器发送消息肯定是在文件有变动才发送。在 webpack 的生态中，大多数 middleware/plugin 都是通过监听 webpack 提供的一些钩子函数，如下方代码摘自 webpack-dev-server 源码：

```js
const addHooks = (compiler) => {
    const { compile, invalid, done } = compiler.hooks
    done.tap('webpack-dev-server', (stats) => {
        // 通过开启webpack --watch选项，在webpack每次编译完新的文件时，触发这个钩子，向sockjs发送新的message，内容为新的静态资源的hash
        // 在_sendStats方法末尾会根据当前编译情况发送error/warning/ok三种类型的message给client
        this._sendStats(this.sockets, this.getStats(stats))
    })
}
```

Node.js 本身提供了官方的 API 例如 fs.watch fs.watchFile 来监听文件的变化，Vite 则使用了这些 API 更上层的封装模块 [chokidar](https://www.npmjs.com/package/chokidar) 来进行文件系统的变动监听。

```js
// src/node/server/index.ts
// 监听整个项目根目录。忽略 node_modules 和 .git 文件夹
const watcher = chokidar.watch(root, {
    ignored: [/\bnode_modules\b/, /\b\.git\b/]
}) as HMRWatcher
```

## css 热替换

有两种情况都可以修改样式，一种是修改外部 css 源文件。例如 `import './index.css'`, 或者直接改 Vue 组件的 style 标签。这两种修改方式的热更新策略也不一样。

```js
  watcher.on('change', (filePath) => {
    if (isCSSRequest(filePath)) {
      const publicPath = resolver.fileToRequest(filePath)
      if (srcImportMap.has(filePath)) {
        // handle HMR for <style src="xxx.css">
        // it cannot be handled as simple css import because it may be scoped
        const styleImport = srcImportMap.get(filePath)
        vueCache.del(filePath)
        vueStyleUpdate(styleImport)
        return
      }
    }
  })
```
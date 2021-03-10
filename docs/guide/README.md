# 简介

最新消息：Vite 2.0 已经发布，本文档是基于 Vite 1.0 的源码分析。2.0的代码量相比1.0增加了很多，由于 1.0 的代码比较清晰 所以开发者仍可阅读本文档学习思路
本文档分析的 1.0 版本的代码可以 clone 该仓库获得 https://github.com/zhangyuang/vite

```bash
$ git clone https://github.com/zhangyuang/vite.git
```

2.0 版本的文档翻译以及源码分析正在编写中，可时刻关注本项目获取最新信息。

此[文档](https://github.com/zhangyuang/vite-design)将对 [Vite](https://github.com/vitejs/vite) 进行源码分析，以开发者的角度来讲述如何阅读调试开源项目的源码。不会涉及到所有的源码文件，将会对 Vite 中最核心的几个部分内容进行讲解。

- Vite 的模块加载解析机制
- Vite 的预优化机制
- Vite 的 HMR(热替换)机制

如果觉得对你有帮助，麻烦跳转到 [github](https://github.com/zhangyuang/vite-design) 点个 Star ✨
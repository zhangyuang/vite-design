---
sidebarDepth: 3
---

# 开发准备

在进行正式的源码阅读之前我们需要做以下准备

## 本地文件准备

需要在本地准备 Vite 以及 Vite   创建的默认项目

### Clone Vite 到本地

可以直接 Clone Vite 的原仓库也可以自己先 fork 一份再 Clone

```bash
$ git clone git@github.com:vitejs/vite.git
```

### 使用 Vite 创建默认项目

使用 Vite 脚手架来创建默认的 Vue 模版项目

```bash
$ npm init vite-app vite_test
```

### link Vite

link 本地的 Vite 到项目依赖

```bash
$ cd vite && yarn && yarn link
$ cd vite_test && yarn link vite
```

现在我们可以直接修改 Vite src 目录下的代码并且实时验证了

## 目录结构分析

让我们来分析一下 Vite 源码目录中的各个文件夹的作用

```bash
$ tree -L 2 -I 'node_modules' ./src

├── client # 客户端运行代码，主要是客户端的 socket 通信以及 HMR 相关
│   ├── client.ts
│   ├── env.d.ts
│   ├── tsconfig.json
│   └── vueJsxCompat.ts
├── hmrPayload.ts # HMR 类型定义
└── node # 服务端运行代码
    ├── build # Vite build 命令运行代码
    ├── cli.ts
    ├── config.ts
    ├── esbuildService.ts
    ├── index.ts
    ├── optimizer # 预优化
    ├── resolver.ts # 模块加载逻辑
    ├── server # Vite (serve) 命令运行代码
    ├── transform.ts
    ├── tsconfig.json
    └── utils

6 directories, 12 files
```
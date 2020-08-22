const { description } = require('../../package')

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: 'Vite Design',
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: description,

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ['meta', { name: 'keywords', itemprop: 'keywords', content: 'Vite 源码 分析 Vue' }],
    ['meta', { property: 'og:title', content: 'Vite 源码分析' }],
    ['meta', { property: 'og:description', content: 'vite vue 源码分析' }],
  ],

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    repo: '',
    editLinks: false,
    docsDir: '',
    editLinkText: '',
    lastUpdated: false,
    nav: [
      {
        text: 'Guide',
        link: '/guide/',
      },
      {
        text: 'Github',
        link: 'https://github.com/zhangyuang/vite-design',
      },
    ],
    sidebar: {
      '/guide/': [
        {
          collapsable: false,
          children: [
            '',
            'chinese-doc',
            'getting-start',
            'module-resolve',
            'optimize',
            'render',
            'hmr'
          ],
        }
      ]
    }
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom',
  ]
}

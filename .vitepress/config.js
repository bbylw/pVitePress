import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'WebNav Hub',
  description: 'A curated collection of useful web navigation links.',
  cleanUrls: true,
  head: [
    ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/css/all.min.css' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]
  ],
  themeConfig: {
    nav: [
      { text: '主页', link: '/' },
      { text: '关于', link: '/about' }
    ],
    sidebar: [
      {
        text: '导航目录',
        items: [
          { text: 'Ai搜索', link: '#ai-search' },
          { text: '社交媒体', link: '#social' },
          { text: '实用工具', link: '#tools' },
          { text: '科技资讯', link: '#tech-news' },
          { text: '云存储', link: '#cloud-storage' },
          { text: '电子邮箱', link: '#email' }
        ]
      }
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: `© ${new Date().getFullYear()} WebNav Hub. 保留所有权利。`
    }
  }
})

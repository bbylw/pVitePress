import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  lang: 'zh-CN',
  title: 'WebNav Hub',
  description: 'A curated collection of useful web navigation links.',
  cleanUrls: true,
  vite: {
    publicDir: fileURLToPath(new URL('./public', import.meta.url))
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === 'search'
      }
    }
  },
  head: [
    ['meta', { name: 'color-scheme', content: 'light dark' }],
    ['meta', { name: 'text-scale', content: 'scale' }],
    ['meta', { name: 'referrer', content: 'strict-origin-when-cross-origin' }],
    ['link', { rel: 'preconnect', href: 'https://cdn.jsdelivr.net', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.3.1/css/all.min.css',
        integrity: 'sha384-qrALq7+6jBOZIQsNnT6xGkMDru64qD6uTlDra39xrt2SoXl4pO3FX6Roz/RpR/BS',
        crossorigin: 'anonymous',
        referrerpolicy: 'no-referrer'
      }
    ],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
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
          { text: '托管社交', link: '#social' },
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
      { icon: 'github', link: 'https://github.com/bbylw/pVitePress' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: `© ${new Date().getFullYear()} WebNav Hub. 保留所有权利。`
    }
  }
})

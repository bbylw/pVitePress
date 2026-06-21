# WebNav Hub (VitePress Stack)

这是一个基于 **VitePress** 和 **Vue 3** 构建的现代化、极速网页导航中心项目。它完整保留了原单页面 HTML 导航站的经典深色 UI 风格与橙色主色调，同时将底层架构升级为现代前端工程化方案。

## 🌟 核心特性

* ⚡ **极速热更新与加载**：底层由 Vite 驱动，无论是本地开发还是线上访问都具有秒级响应速度。
* 🎨 **1:1 原生 UI 还原**：完全保留了原网页的黑色页眉、深黑底色 (`#0d0d0d`)、深灰卡片 (`#1a1a1a`) 以及代表性的橙色高亮设计。
* 🔍 **智能实时检索**：集成了无缝拼音和关键词本地搜索功能，输入字符瞬间过滤匹配的卡片并显示结果数量。
* ⌨️ **快捷键焦点**：在页面任意位置按下键盘的 `/` 键，搜索框将自动获得焦点，优化使用效率。
* ⚓ **粘性导航与滚动 spy**：顶部导航栏自动贴顶，并利用 `IntersectionObserver` 监听页面滚动，根据用户当前所处的分类自动点亮对应的导航项。
* 📂 **数据解耦管理**：将原 HTML 里繁杂的链接抽取至独立的 JSON 文件中，极大简化了维护和更新工作。

---

## 🛠️ 项目结构

```text
pVitePress/
├── .vitepress/
│   ├── config.js               # VitePress 全局配置文件
│   ├── public/
│   │   └── logo.svg            # 站点 Favicon 与 Logo 文件
│   └── theme/
│       ├── components/
│       │   ├── NavLinks.vue    # (备用) 默认文档样式导航组件
│       │   └── NavPage.vue     # 核心组件 - 完美复原原站 UI 的整页导航面板
│       ├── custom.css          # 全局自定义样式及 CSS 主题色重写
│       ├── index.js            # 自定义主题入口与组件注册
│       └── navData.json        # 导航网址数据库 (共计 177 个站点)
├── package.json                # 项目依赖及运行脚本
├── README.md                   # 本说明文件
├── index.md                    # 主页入口 (配置为自定义布局)
└── about.md                    # 关于页面
```

---

## 🚀 快速开始

### 1. 安装依赖
确保本地已安装 Node.js 环境，在项目根目录下运行以下命令安装必要依赖：
```bash
npm install
```

### 2. 启动本地开发服务器
运行开发命令，默认会在 `http://localhost:5173/` 启动服务：
```bash
npm run dev
```

### 3. 构建静态生产包
执行打包编译命令，编译生成的静态 HTML 和 assets 将会输出到 `.vitepress/dist/` 目录：
```bash
npm run build
```

### 4. 本地预览静态包
在打包完成后，可以使用以下命令在本地启动服务预览打包好的生产静态资源：
```bash
npm run preview
```

---

## 📝 网址更新指南

项目的所有导航链接均存储在 `[.vitepress/theme/navData.json](file:///.vitepress/theme/navData.json)` 中。当需要新增、删除或修改某个网址时，**无需修改任何 HTML 或 Vue 代码**，只需修改该 JSON 文件：

### 数据格式示例：
```json
[
  {
    "id": "ai-search",              // 分类的 HTML 锚点 ID
    "title": "Ai搜索",              // 导航栏及分类标题显示的文字
    "items": [
      {
        "name": "智谱清言",          // 网站的显示名称
        "link": "https://chatglm.cn/", // 网站跳转链接
        "icon": "fa-solid fa-comment-dots" // FontAwesome 图标 Class
      },
      ...
    ]
  },
  ...
]
```

> 💡 **提示**：图标类名支持任意 FontAwesome 图标，可在 [FontAwesome 官网](https://fontawesome.com/) 寻找并替换。

---

## 🌐 部署指南

本导航项目是一个纯静态站点。在部署时，请确保配置以下通用参数：
* **构建命令 (Build Command)**: `npm run build`
* **输出目录 (Publish/Output Directory)**: `.vitepress/dist`
* **Node.js 版本 (Node Version)**: 推荐使用 `20.x` 或以上

以下是四大主流静态托管平台的详细部署教程：

### 1. Cloudflare Pages 部署 (推荐)
Cloudflare Pages 免费额度大，在全球边缘节点访问极快，且不需要特殊配置：

#### 方案 A：Git 自动关联部署（推荐）
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，在左侧导航栏选择 **Workers 和 Pages (Workers & Pages)**。
2. 点击 **创建应用程序 (Create Application)** -> 选择 **Pages** 选项卡 -> 点击 **连接到 Git (Connect to Git)**。
3. 授权并选择您的 GitHub 仓库。
4. 展开构建设置：
   - **框架预设 (Framework Preset)**: 选择 `无 (None)` 或 `VitePress`。
   - **构建命令 (Build command)**: `npm run build`
   - **构建输出目录 (Build output directory)**: `.vitepress/dist`
5. （可选）如果构建因 Node 版本报错，请在项目 **设置 (Settings)** -> **构建与部署 (Builds & Deployments)** -> **环境变量 (Environment Variables)** 中添加环境变量：`NODE_VERSION` = `20`。
6. 点击 **保存并部署 (Save and Deploy)**，后续每次推送代码至 `main` 分支均会自动构建更新。

#### 方案 B：Wrangler 命令行直接部署
如果您不想关联 Git 仓库，可以在本地打包后通过命令行部署：
```bash
# 1. 本地生成静态打包文件
npm run build

# 2. 部署到 Cloudflare
npx wrangler pages deploy .vitepress/dist
```

---

### 2. Vercel 部署
Vercel 针对静态站提供了极致的全球加速与一键部署体验：

#### 方案 A：Git 自动关联部署（推荐）
1. 进入 [Vercel Dashboard](https://vercel.com/dashboard)，点击右上角的 **Add New** -> **Project**。
2. 选择并导入您的 GitHub 仓库。
3. 在 **Build and Output Settings**（构建与输出设置）面板中：
   - **Framework Preset**: 选择 `Other`。
   - **Build Command**: 打开开关，并输入 `npm run build`。
   - **Output Directory**: 打开开关，并输入 `.vitepress/dist`。
4. 点击 **Deploy** 按钮。Vercel 将在 1 分钟内完成部署，并为您分配一个随机免费二级域名（可绑定自定义域名）。

#### 方案 B：Vercel CLI 命令行部署
```bash
# 安装 Vercel CLI
npm install -g vercel

# 启动部署（在项目根目录下）
vercel

# 部署至生产环境
vercel --prod
```

---

### 3. Netlify 部署
Netlify 是知名的静态站点托管平台，提供了非常简便的集成：

#### 方案 A：Git 自动关联部署（推荐）
1. 登录 [Netlify Dashboard](https://app.netlify.com/)，点击 **Add new site** -> **Import an existing project**。
2. 选择 **GitHub** 并授权，选择您的导航库。
3. 填写构建设置：
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `.vitepress/dist`
4. 点击 **Deploy site**。

#### 方案 B：Netlify CLI 命令行部署
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 本地打包
npm run build

# 部署并生成生产预览
netlify deploy --dir=.vitepress/dist --prod
```

---

### 4. GitHub Pages 部署
如果您希望完全将站点托管在 GitHub 上，可以使用 GitHub Pages 配合 GitHub Actions 实现每次 Push 后自动构建部署。

#### 步骤一：修改项目 Base 路径
如果您的项目部署在类似 `https://<用户名>.github.io/<仓库名>/` 的二级路径下，必须修改 `[.vitepress/config.js](file:///.vitepress/config.js)`，在配置对象中添加 `base` 字段：
```js
export default defineConfig({
  base: '/<您的仓库名称>/', // 如果是主域名部署，比如 <用户名>.github.io，则无需添加或设置为 '/'
  // ... 其他配置
})
```

#### 步骤二：创建 GitHub Actions 工作流
在项目根目录下创建目录和配置文件 `.github/workflows/deploy.yml`，并写入以下配置：
```yaml
name: Deploy VitePress site to Pages

on:
  push:
    branches: [main] # 推送至 main 分支时触发

# 赋予部署 Pages 所需的权限
permissions:
  contents: read
  pages: write
  id-token: write

# 确保并发部署不会发生冲突
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 获取完整提交记录，保证 VitePress 页面最后修改时间准确

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build with VitePress
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .vitepress/dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### 步骤三：在 GitHub 启用 Actions 部署
1. 将本地代码提交并推送到 GitHub 仓库。
2. 打开 GitHub 仓库页面，点击 **Settings** -> 左侧选择 **Pages**。
3. 在 **Build and deployment** 下的 **Source**，将下拉菜单从 `Deploy from a branch` 改为 **`GitHub Actions`**。
4. 重新推送代码，或者查看仓库的 **Actions** 面板，等待构建完成即可上线。

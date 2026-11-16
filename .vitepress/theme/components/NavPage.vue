<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { pinyin } from 'pinyin-pro'
import navData from '../navData.json'

// 预生成拼音索引（模块加载时一次性计算，支持全拼与首字母搜索）
const indexedNavData = navData.map(category => ({
  ...category,
  items: (category.items || category.links || []).map(item => ({
    ...item,
    link: item.link || item.url,
    pinyinFull: pinyin(item.name, { toneType: 'none' }).toLowerCase(),
    pinyinInitials: pinyin(item.name, { pattern: 'first', toneType: 'none' }).toLowerCase()
  }))
}))

// Search state
const searchQuery = ref('')
const searchInputRef = ref(null)
const searchAnnouncement = ref('')
let announcementTimer = null

// Navigation & scrollspy state
const stickyNavRef = ref(null)
const activeHash = ref(navData.length > 0 ? '#' + navData[0].id : '')
const supportsScrollTargetGroup = ref(false)
let currentScrollId = 0
let observer = null
let navResizeObserver = null

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Scroll element into view and resolve when scrolling settles.
 * Awaits the native scrollIntoView() Promise and guards against Chrome's early-resolving
 * root-scroller Promise by also waiting for scrollend (with an idle scroll timer fallback).
 */
const scrollIntoViewAsync = async (element, options) => {
  const scrollSettled = new Promise((resolve) => {
    let timeoutId
    let sawScroll = false

    const finish = () => {
      clearTimeout(timeoutId)
      document.removeEventListener('scrollend', finish)
      window.removeEventListener('scroll', onScroll)
      resolve()
    }

    const onScroll = () => {
      sawScroll = true
      clearTimeout(timeoutId)
      timeoutId = setTimeout(finish, 150)
    }

    document.addEventListener('scrollend', finish, { once: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    timeoutId = setTimeout(() => {
      if (!sawScroll) finish()
    }, 150)
  })

  const result = element.scrollIntoView(options)
  if (result instanceof Promise) {
    await Promise.all([result, scrollSettled])
  } else {
    await scrollSettled
  }
}

const syncAriaCurrentFromNative = () => {
  if (!supportsScrollTargetGroup.value || !stickyNavRef.value) return
  requestAnimationFrame(() => {
    if (!stickyNavRef.value) return
    const links = stickyNavRef.value.querySelectorAll('a')
    const currentLink = stickyNavRef.value.querySelector('a:target-current')
    links.forEach((link) => {
      link.setAttribute('aria-current', link === currentLink ? 'true' : 'false')
    })
  })
}

// Focus search input on "/" key press (safe with IME composition & editable targets)
const handleKeyDown = (e) => {
  if (e.isComposing || e.keyCode === 229) return
  if (e.ctrlKey || e.metaKey || e.altKey) return

  const target = e.target
  const isEditable =
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

  if (e.key === '/' && !isEditable && document.activeElement !== searchInputRef.value) {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

const skipToMain = async (event) => {
  if (event) event.preventDefault()
  const mainEl = document.getElementById('main-content')
  if (!mainEl) return
  const scrollId = ++currentScrollId
  await scrollIntoViewAsync(mainEl, {
    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
  })
  if (scrollId !== currentScrollId) return
  mainEl.focus({ preventScroll: true })
}

// Scroll to section smoothly and update focus/history once settled
const scrollToSection = async (id, event) => {
  if (event) event.preventDefault()

  const scrollId = ++currentScrollId
  activeHash.value = '#' + id

  const targetElement = document.getElementById(id)
  if (!targetElement) return

  const newUrl = new URL('#' + id, window.location.href).href
  window.history.pushState({ path: newUrl }, '', newUrl)

  await scrollIntoViewAsync(targetElement, {
    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
  })

  if (scrollId !== currentScrollId) return
  targetElement.focus({ preventScroll: true })
  syncAriaCurrentFromNative()
}

// Handle initial hash and browser back/forward hash navigation
const handleHashChange = async () => {
  const hash = window.location.hash
  if (hash) {
    activeHash.value = hash
    const targetElement = document.getElementById(hash.substring(1))
    if (targetElement) {
      const scrollId = ++currentScrollId
      await scrollIntoViewAsync(targetElement, {
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      })
      if (scrollId !== currentScrollId) return
      syncAriaCurrentFromNative()
    }
  } else if (navData.length > 0) {
    activeHash.value = '#' + navData[0].id
  }
}

// Fallback scrollspy via IntersectionObserver for browsers without scroll-target-group
const setupIntersectionObserver = () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (supportsScrollTargetGroup.value) return

  const options = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activeHash.value = '#' + entry.target.id
      }
    })
  }, options)

  filteredNavData.value.forEach((category) => {
    const el = document.getElementById(category.id)
    if (el) observer.observe(el)
  })
}

const updateStickyNavHeight = () => {
  if (!stickyNavRef.value) return
  const height = Math.ceil(stickyNavRef.value.getBoundingClientRect().height)
  document.documentElement.style.setProperty('--nav-sticky-height', `${height + 8}px`)
}

onMounted(async () => {
  supportsScrollTargetGroup.value =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('scroll-target-group: auto')

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('hashchange', handleHashChange)

  updateStickyNavHeight()
  if (typeof ResizeObserver !== 'undefined' && stickyNavRef.value) {
    navResizeObserver = new ResizeObserver(updateStickyNavHeight)
    navResizeObserver.observe(stickyNavRef.value)
  }

  await handleHashChange()
  await nextTick()

  if (supportsScrollTargetGroup.value) {
    document.addEventListener('scrollend', syncAriaCurrentFromNative)
    syncAriaCurrentFromNative()
  } else {
    setupIntersectionObserver()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('hashchange', handleHashChange)
  document.removeEventListener('scrollend', syncAriaCurrentFromNative)
  clearTimeout(announcementTimer)
  if (observer) observer.disconnect()
  if (navResizeObserver) navResizeObserver.disconnect()
  if (typeof document !== 'undefined') {
    document.documentElement.style.removeProperty('--nav-sticky-height')
  }
})

// Filter items based on search query (name / link / pinyin full / pinyin initials)
const filteredNavData = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return indexedNavData

  return indexedNavData
    .map((category) => {
      const filteredItems = category.items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.link.toLowerCase().includes(query) ||
          item.pinyinFull.includes(query) ||
          item.pinyinInitials.includes(query)
      )
      return {
        ...category,
        items: filteredItems
      }
    })
    .filter((category) => category.items.length > 0)
})

const totalResultsCount = computed(() => {
  return filteredNavData.value.reduce((acc, cat) => acc + cat.items.length, 0)
})

// Re-sync scrollspy observers when filtered sections change
watch(filteredNavData, async () => {
  await nextTick()
  if (supportsScrollTargetGroup.value) {
    syncAriaCurrentFromNative()
  } else {
    setupIntersectionObserver()
  }
})

// Debounce screen-reader live announcements while typing
watch(searchQuery, (val) => {
  clearTimeout(announcementTimer)
  const trimmed = val.trim()
  if (!trimmed) {
    searchAnnouncement.value = ''
    return
  }
  announcementTimer = setTimeout(() => {
    searchAnnouncement.value =
      totalResultsCount.value > 0
        ? `共为您找到 ${totalResultsCount.value} 个相关站点`
        : '没有找到相关站点，请尝试其他关键词。'
  }, 350)
})

const clearSearch = () => {
  searchQuery.value = ''
  searchInputRef.value?.focus()
}
</script>

<template>
  <div class="original-body">
    <!-- Header -->
    <header>
      <a href="#main-content" class="skip-link visually-hidden vp-raw" @click="skipToMain">
        跳转到主要内容
      </a>
      <h1 lang="en">WebNav Hub</h1>
    </header>

    <!-- Navigation (Sticky) -->
    <!-- vp-raw: 让 VitePress 路由放弃接管锚点链接，避免合成 hashchange 打断平滑滚动 -->
    <nav ref="stickyNavRef" class="sticky-nav vp-raw" aria-label="分类目录">
      <ul>
        <li v-for="category in navData" :key="category.id">
          <a
            :href="'#' + category.id"
            :class="{ active: !supportsScrollTargetGroup && activeHash === '#' + category.id }"
            :aria-current="!supportsScrollTargetGroup ? (activeHash === '#' + category.id ? 'true' : 'false') : undefined"
            @click="scrollToSection(category.id, $event)"
          >
            {{ category.title }}
          </a>
        </li>
      </ul>
    </nav>

    <!-- Main Content -->
    <main id="main-content" tabindex="-1">
      <!-- Integrated Search Box -->
      <search class="search-box-wrapper">
        <div class="search-box">
          <label for="nav-search-input" class="visually-hidden">搜索导航站点</label>
          <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
          <input
            id="nav-search-input"
            ref="searchInputRef"
            v-model="searchQuery"
            type="search"
            inputmode="search"
            enterkeyhint="search"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="none"
            spellcheck="false"
            placeholder="搜索导航站点，支持拼音... (按 / 键自动聚焦)"
            class="search-input"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="clearSearch"
            class="clear-btn"
            aria-label="清除搜索"
          >
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <div class="search-info" v-if="searchQuery">
          共为您找到 <span>{{ totalResultsCount }}</span> 个相关站点
        </div>
        <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          {{ searchAnnouncement }}
        </div>
      </search>

      <!-- No Results State -->
      <div v-if="filteredNavData.length === 0" class="no-results">
        <i class="fa-solid fa-face-frown no-results-icon" aria-hidden="true"></i>
        <p>没有找到相关站点，请尝试其他关键词。</p>
        <button type="button" @click="clearSearch" class="reset-btn">清除搜索</button>
      </div>

      <!-- Link Sections -->
      <template v-else>
        <section
          v-for="(category, catIndex) in filteredNavData"
          :key="category.id"
          :id="category.id"
          tabindex="-1"
          class="category-section"
        >
          <h2 class="category-title">{{ category.title }}</h2>
          <ul
            class="link-grid"
            :class="{ 'deferred-grid': !searchQuery.trim() && catIndex > 0 }"
            :style="!searchQuery.trim() && catIndex > 0 ? { '--intrinsic-rows': Math.max(1, Math.ceil(category.items.length / 7)) } : undefined"
            role="list"
          >
            <li
              v-for="item in category.items"
              :key="`${category.id}-${item.link}-${item.name}`"
              class="link-card"
            >
              <a
                :href="item.link"
                target="_blank"
                rel="noopener noreferrer"
                class="link-card-link"
              >
                <i :class="item.icon" aria-hidden="true"></i>
                <h3>{{ item.name }}</h3>
              </a>
            </li>
          </ul>
        </section>
      </template>
    </main>

    <!-- Footer -->
    <footer>
      <p>© {{ new Date().getFullYear() }} WebNav Hub. 保留所有权利。</p>
      <nav class="footer-nav vp-raw" aria-label="页脚链接">
        <a href="#">隐私政策</a>
        <a href="#">使用条款</a>
        <a href="#">联系我们</a>
      </nav>
    </footer>
  </div>
</template>

<style scoped>
/* Visually hidden utility (remains in accessibility tree; becomes visible on focus for skip links) */
.visually-hidden:where(:not(:focus-within, :active)) {
  position: absolute !important;
  clip-path: inset(50%) !important;
  overflow: hidden !important;
  width: 1px !important;
  height: 1px !important;
  margin: -1px !important;
  padding: 0 !important;
  border: 0 !important;
  white-space: nowrap !important;
}

.skip-link:focus-visible {
  position: fixed;
  inset-block-start: 0.75rem;
  inset-inline-start: 0.75rem;
  z-index: 2000;
  padding: 0.5rem 1rem;
  background-color: var(--color-brand);
  color: var(--color-on-brand);
  font-weight: bold;
  text-decoration: none;
  border-radius: 0.375rem;
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.original-body {
  --color-bg: #0d0d0d;
  --color-header-bg: #000;
  --color-surface: #1a1a1a;
  --color-surface-hover: #2a2a2a;
  --color-border: #333;
  --color-brand: #ff9000;
  --color-on-brand: #000;
  --color-text: #fff;
  --color-text-muted: #ccc;
  --color-text-subtle: #999;

  color-scheme: dark;
  font-family: Arial, sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  min-block-size: 100dvh;
  display: flex;
  flex-direction: column;
}

header {
  background-color: var(--color-header-bg);
  padding: 1rem;
  text-align: center;
}

header h1 {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-brand);
  margin: 0;
  text-transform: uppercase;
  text-wrap: balance;
}

.sticky-nav {
  background-color: var(--color-surface);
  padding: 0.5rem;
  position: sticky;
  inset-block-start: 0;
  z-index: 1000;
  border-block-end: 1px solid #222;
  scroll-target-group: auto;
}

.sticky-nav ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.sticky-nav li {
  margin: 0.3rem;
}

.sticky-nav a {
  color: var(--color-text);
  text-decoration: none;
  font-size: 1rem;
  font-weight: bold;
  padding: 0.5rem 0.8rem;
  border-radius: 1.25rem;
  display: inline-block;
  transition: background-color 0.3s, color 0.3s;
}

.sticky-nav a:hover,
.sticky-nav a:is(:target-current, .active) {
  background-color: var(--color-brand);
  color: var(--color-on-brand);
}

.sticky-nav a:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

main {
  max-inline-size: 1200px;
  margin: 0 auto;
  padding: 1rem;
  inline-size: 100%;
  box-sizing: border-box;
  flex: 1;
}

main:focus {
  outline: none;
}

.category-section:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 4px;
  border-radius: 4px;
}

/* Defer rendering for below-the-fold card grids when not filtering */
.deferred-grid {
  content-visibility: auto;
  contain-intrinsic-block-size: auto calc(var(--intrinsic-rows, 3) * 7rem);
}

@supports not (content-visibility: auto) {
  .deferred-grid {
    contain: layout style paint;
  }
}

.category-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 2.5rem 0 1rem;
  color: var(--color-brand);
  border-inline-start: 4px solid var(--color-brand);
  padding-inline-start: 0.6rem;
  text-transform: uppercase;
  text-wrap: balance;
}

.link-grid {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  gap: 1rem;
}

.link-card {
  background-color: var(--color-surface);
  border-radius: 8px;
  display: flex;
  translate: 0 0;
  scale: 1;
  transition: background-color 0.2s;
}

.link-card:hover {
  background-color: var(--color-surface-hover);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.link-card-link {
  box-sizing: border-box;
  inline-size: 100%;
  min-block-size: 90px;
  padding: 1.2rem 0.8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  text-decoration: none;
  border-radius: inherit;
  cursor: pointer;
}

.link-card-link:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.link-card i {
  font-size: 1.8rem;
  margin-block-end: 0.7rem;
  color: var(--color-brand);
  scale: 1;
}

.link-card h3 {
  font-size: 0.9rem;
  margin: 0;
  color: var(--color-text);
  line-height: 1.3;
  font-weight: 500;
  max-inline-size: 100%;
  min-block-size: 2.6em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  overflow-wrap: break-word;
  white-space: normal;
  padding: 0 0.3rem;
}

@media (prefers-reduced-motion: no-preference) {
  .link-card {
    transition: translate 0.2s ease-out, scale 0.15s ease-out, background-color 0.2s;
  }

  .link-card:hover {
    translate: 0 -2px;
  }

  .link-card:active {
    scale: 0.98;
  }

  .link-card i {
    transition: scale 0.2s ease;
  }

  .link-card:hover i {
    scale: 1.1;
  }
}

footer {
  background-color: var(--color-header-bg);
  color: var(--color-text-muted);
  text-align: center;
  padding: 1.5rem 1rem;
  font-size: 0.75rem;
  margin-block-start: auto;
  border-block-start: 1px solid var(--color-surface);
}

footer p {
  margin: 0 0 0.6rem 0;
}

.footer-nav {
  display: flex;
  justify-content: center;
  background-color: transparent;
  padding: 0;
}

.footer-nav a {
  color: var(--color-text-muted);
  margin: 0 0.6rem;
  font-size: 0.75rem;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-nav a:hover {
  color: var(--color-brand);
}

.footer-nav a:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Integrated Search Box - Styled to match original theme */
.search-box-wrapper {
  margin: 1.5rem 0 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.search-box {
  position: relative;
  inline-size: 100%;
  max-inline-size: 500px;
  display: flex;
  align-items: center;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.search-box:focus-within {
  border-color: var(--color-brand);
  box-shadow: 0 0 8px rgba(255, 144, 0, 0.3);
}

.search-box:has(.search-input:focus-visible) {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.search-icon {
  position: absolute;
  inset-inline-start: 0.9rem;
  color: var(--color-text-subtle);
  font-size: 0.95rem;
  pointer-events: none;
}

.search-box:focus-within .search-icon {
  color: var(--color-brand);
}

.search-input {
  inline-size: 100%;
  padding: 0.6rem 2.5rem;
  font: inherit;
  font-size: max(1rem, 0.95rem);
  border: none;
  background: transparent;
  color: var(--color-text);
  outline: none;
}

.search-input::placeholder {
  color: var(--color-text-subtle);
  opacity: 1;
}

.search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.clear-btn {
  position: absolute;
  inset-inline-end: 0.7rem;
  background: none;
  border: none;
  color: var(--color-text-subtle);
  cursor: pointer;
  min-inline-size: 24px;
  min-block-size: 24px;
  padding: 0.15rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font: inherit;
}

.clear-btn:hover {
  color: var(--color-text);
}

.clear-btn:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.search-info {
  font-size: 0.8rem;
  color: var(--color-text-subtle);
}

.search-info span {
  color: var(--color-brand);
  font-weight: bold;
}

/* No Results Styles */
.no-results {
  text-align: center;
  padding: 3rem 1rem;
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  margin: 2rem 0;
}

.no-results-icon {
  font-size: 2.5rem;
  color: #777;
  margin-block-end: 0.8rem;
}

.no-results p {
  color: #bbb;
  margin-block-end: 1.2rem;
  text-wrap: pretty;
}

.reset-btn {
  background-color: var(--color-brand);
  color: var(--color-on-brand);
  border: none;
  padding: 0.4rem 1.2rem;
  min-block-size: 36px;
  border-radius: 1.25rem;
  font: inherit;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.reset-btn:hover {
  opacity: 0.9;
}

.reset-btn:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: no-preference) {
  .reset-btn {
    transition: opacity 0.2s, scale 0.15s ease-out;
  }

  .reset-btn:active {
    scale: 0.97;
  }
}

/* Forced Colors (Windows High Contrast) Support */
@media (forced-colors: active) {
  .sticky-nav a:is(:target-current, .active) {
    background-color: Highlight;
    color: HighlightText;
    outline: 2px solid Highlight;
  }

  .link-card {
    border: 1px solid CanvasText;
  }

  .link-card:hover {
    border-color: Highlight;
  }
}

/* Responsive Rules matching original layout */
@media (max-width: 1200px) {
  main {
    padding: 1rem;
    max-inline-size: 95%;
  }
}

@media (max-width: 768px) {
  main {
    padding: 0.8rem;
  }

  .link-grid {
    grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
    gap: 0.8rem;
  }

  .sticky-nav {
    padding: 0.4rem;
  }

  .sticky-nav a {
    padding: 0.4rem 0.7rem;
    font-size: 0.95rem;
  }

  .category-title {
    font-size: 1.4rem;
    margin: 1.8rem 0 1rem;
  }

  .link-card-link {
    padding: 1rem 0.6rem;
    min-block-size: 80px;
  }

  .link-card i {
    font-size: 1.6rem;
    margin-block-end: 0.5rem;
  }

  .link-card h3 {
    font-size: 0.8rem;
    min-block-size: 2.4em;
  }
}

@media (max-width: 480px) {
  main {
    padding: 0.6rem;
  }

  .link-grid {
    grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
    gap: 0.7rem;
  }

  header h1 {
    font-size: 1.6rem;
  }

  .sticky-nav li {
    margin: 0.25rem;
  }

  .sticky-nav a {
    padding: 0.35rem 0.6rem;
    font-size: 0.9rem;
  }

  .link-card-link {
    padding: 0.8rem 0.5rem;
    min-block-size: 70px;
  }

  .link-card i {
    font-size: 1.4rem;
    margin-block-end: 0.4rem;
  }

  .link-card h3 {
    font-size: 0.75rem;
    padding: 0 0.2rem;
    min-block-size: 2.4em;
  }
}

@media (max-width: 360px) {
  .link-grid {
    grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
    gap: 0.6rem;
  }

  header h1 {
    font-size: 1.4rem;
  }

  .link-card-link {
    padding: 0.8rem 0.5rem;
    min-block-size: 70px;
  }

  .link-card i {
    font-size: 1.3rem;
    margin-block-end: 0.3rem;
  }

  .link-card h3 {
    font-size: 0.7rem;
    padding: 0 0.15rem;
    min-block-size: 2.2em;
  }
}
</style>

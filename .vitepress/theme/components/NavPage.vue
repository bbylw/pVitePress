<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { pinyin } from 'pinyin-pro'
import navData from '../navData.json'

// 预生成拼音索引（模块加载时一次性计算，支持全拼与首字母搜索）
const indexedNavData = navData.map(category => ({
  ...category,
  items: category.items.map(item => ({
    ...item,
    pinyinFull: pinyin(item.name, { toneType: 'none' }).toLowerCase(),
    pinyinInitials: pinyin(item.name, { pattern: 'first', toneType: 'none' }).toLowerCase()
  }))
}))

// Search state
const searchQuery = ref('')
const searchInputRef = ref(null)

// Navigation active state
const activeHash = ref('')

// Focus search input on "/" key press
const handleKeyDown = (e) => {
  if (e.key === '/' && document.activeElement !== searchInputRef.value) {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

// Scroll to section smoothly
const scrollToSection = (id, event) => {
  if (event) event.preventDefault()
  
  activeHash.value = '#' + id
  const targetElement = document.getElementById(id)
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: 'smooth' })
    const newUrl = new URL('#' + id, window.location.href).href
    window.history.pushState({ path: newUrl }, '', newUrl)
  }
}

// Handle initial hash on load
const handleHashChange = () => {
  const hash = window.location.hash
  if (hash) {
    activeHash.value = hash
    const targetElement = document.getElementById(hash.substring(1))
    if (targetElement) {
      setTimeout(() => {
        targetElement.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  } else if (navData.length > 0) {
    activeHash.value = '#' + navData[0].id
  }
}

// Track scrolling to update active link
let observer = null
const setupIntersectionObserver = () => {
  const options = {
    root: null,
    rootMargin: '-20% 0px -60% 0px', // Trigger when section occupies the sweet spot of viewport
    threshold: 0
  }
  
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeHash.value = '#' + entry.target.id
      }
    })
  }, options)
  
  navData.forEach(category => {
    const el = document.getElementById(category.id)
    if (el) observer.observe(el)
  })
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('hashchange', handleHashChange)
  handleHashChange()
  
  // Set up intersection observer for scroll spy after DOM renders
  setTimeout(setupIntersectionObserver, 300)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('hashchange', handleHashChange)
  if (observer) observer.disconnect()
})

// Filter items based on search query (name / link / pinyin full / pinyin initials)
const filteredNavData = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return indexedNavData

  return indexedNavData.map(category => {
    const filteredItems = category.items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.link.toLowerCase().includes(query) ||
      item.pinyinFull.includes(query) ||
      item.pinyinInitials.includes(query)
    )
    return {
      ...category,
      items: filteredItems
    }
  }).filter(category => category.items.length > 0)
})

const totalResultsCount = computed(() => {
  return filteredNavData.value.reduce((acc, cat) => acc + cat.items.length, 0)
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
      <h1>WebNav Hub</h1>
    </header>

    <!-- Navigation (Sticky) -->
    <nav class="sticky-nav">
      <ul>
        <li v-for="category in navData" :key="category.id">
          <a 
            :href="'#' + category.id" 
            :class="{ active: activeHash === '#' + category.id }"
            @click="scrollToSection(category.id, $event)"
          >
            {{ category.title }}
          </a>
        </li>
      </ul>
    </nav>

    <!-- Main Content -->
    <main>
      <!-- Integrated Search Box -->
      <div class="search-box-wrapper">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="搜索导航站点，支持拼音... (按 / 键自动聚焦)"
            class="search-input"
            aria-label="搜索导航站点"
          />
          <button v-if="searchQuery" @click="clearSearch" class="clear-btn" aria-label="清除搜索">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="search-info" v-if="searchQuery">
          共为您找到 <span>{{ totalResultsCount }}</span> 个相关站点
        </div>
      </div>

      <!-- No Results State -->
      <div v-if="filteredNavData.length === 0" class="no-results">
        <i class="fa-solid fa-face-frown no-results-icon"></i>
        <p>没有找到相关站点，请尝试其他关键词。</p>
        <button @click="clearSearch" class="reset-btn">清除搜索</button>
      </div>

      <!-- Link Sections -->
      <template v-else>
        <section 
          v-for="category in filteredNavData" 
          :key="category.id" 
          :id="category.id"
          class="category-section"
        >
          <h2 class="category-title">{{ category.title }}</h2>
          <div class="link-grid">
            <div 
              v-for="(item, index) in category.items" 
              :key="`${category.id}-${index}`" 
              class="link-card"
            >
              <a :href="item.link" target="_blank" rel="noopener noreferrer" :aria-label="item.name"></a>
              <i :class="item.icon"></i>
              <h3>{{ item.name }}</h3>
            </div>
          </div>
        </section>
      </template>
    </main>

    <!-- Footer -->
    <footer>
      <p>© {{ new Date().getFullYear() }} WebNav Hub. 保留所有权利。</p>
      <nav class="footer-nav">
        <a href="#">隐私政策</a>
        <a href="#">使用条款</a>
        <a href="#">联系我们</a>
      </nav>
    </footer>
  </div>
</template>

<style scoped>
/* Exact original CSS extracted from index.html */
.original-body {
  font-family: Arial, sans-serif;
  background-color: #0d0d0d;
  color: #fff;
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background-color: #000;
  padding: 1rem;
  text-align: center;
}

header h1 {
  font-size: 2rem;
  font-weight: bold;
  color: #ff9000;
  margin: 0;
  text-transform: uppercase;
}

.sticky-nav {
  background-color: #1a1a1a;
  padding: 0.5rem;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid #222;
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
  color: #fff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: bold;
  padding: 0.5rem 0.8rem;
  border-radius: 1.25rem;
  transition: background-color 0.3s, color 0.3s;
}

.sticky-nav a:hover,
.sticky-nav a.active {
  background-color: #ff9000;
  color: #000;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
}

.category-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 2.5rem 0 1rem;
  color: #ff9000;
  border-left: 4px solid #ff9000;
  padding-left: 0.6rem;
  text-transform: uppercase;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.link-card {
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 1.2rem 0.8rem;
  text-align: center;
  transition: transform 0.2s ease-out, background-color 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  position: relative;
  overflow: hidden;
}

.link-card a {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  text-decoration: none;
  z-index: 12;
  display: block;
}

.link-card:hover {
  background-color: #2a2a2a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.link-card i {
  font-size: 1.8rem;
  margin-bottom: 0.7rem;
  color: #ff9000;
  transition: transform 0.2s ease;
  position: relative;
  z-index: 11;
}

.link-card:hover i {
  transform: scale(1.1);
}

.link-card h3 {
  font-size: 0.9rem;
  margin: 0;
  color: #fff;
  line-height: 1.3;
  font-weight: 500;
  max-width: 100%;
  height: 2.6em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  white-space: normal;
  padding: 0 0.3rem;
  position: relative;
  z-index: 11;
}

footer {
  background-color: #000;
  color: #ccc;
  text-align: center;
  padding: 1.5rem 1rem;
  font-size: 0.75rem;
  margin-top: auto;
  border-top: 1px solid #1a1a1a;
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
  color: #ccc;
  margin: 0 0.6rem;
  font-size: 0.75rem;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-nav a:hover {
  color: #ff9000;
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
  width: 100%;
  max-width: 500px;
  display: flex;
  align-items: center;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 20px;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.search-box:focus-within {
  border-color: #ff9000;
  box-shadow: 0 0 8px rgba(255, 144, 0, 0.3);
}

.search-icon {
  position: absolute;
  left: 0.9rem;
  color: #888;
  font-size: 0.95rem;
}

.search-box:focus-within .search-icon {
  color: #ff9000;
}

.search-input {
  width: 100%;
  padding: 0.6rem 2.5rem;
  font-size: 0.95rem;
  border: none;
  background: transparent;
  color: #fff;
  outline: none;
}

.clear-btn {
  position: absolute;
  right: 0.9rem;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 0.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  color: #fff;
}

.search-info {
  font-size: 0.8rem;
  color: #888;
}

.search-info span {
  color: #ff9000;
  font-weight: bold;
}

/* No Results Styles */
.no-results {
  text-align: center;
  padding: 3rem 1rem;
  background-color: #1a1a1a;
  border: 1px dashed #333;
  border-radius: 8px;
  margin: 2rem 0;
}

.no-results-icon {
  font-size: 2.5rem;
  color: #555;
  margin-bottom: 0.8rem;
}

.no-results p {
  color: #aaa;
  margin-bottom: 1.2rem;
}

.reset-btn {
  background-color: #ff9000;
  color: #000;
  border: none;
  padding: 0.4rem 1.2rem;
  border-radius: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.reset-btn:hover {
  opacity: 0.9;
}

/* Responsive Rules matching original exactly */
@media (max-width: 1200px) {
  main {
    padding: 1rem;
    max-width: 95%;
  }
}

@media (max-width: 768px) {
  html {
    font-size: 15px;
  }

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

  .link-card {
    padding: 1rem 0.6rem;
    min-height: 80px;
  }

  .link-card i {
    font-size: 1.6rem;
    margin-bottom: 0.5rem;
  }

  .link-card h3 {
    font-size: 0.8rem;
    height: 2.4em;
  }
}

@media (max-width: 480px) {
  html {
    font-size: 14px;
  }

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

  .link-card {
    padding: 0.8rem 0.5rem;
    min-height: 70px;
  }

  .link-card i {
    font-size: 1.4rem;
    margin-bottom: 0.4rem;
  }

  .link-card h3 {
    font-size: 0.75rem;
    padding: 0 0.2rem;
    height: 2.4em;
  }
}

@media (max-width: 360px) {
  html {
    font-size: 13px;
  }

  .link-grid {
    grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
    gap: 0.6rem;
  }

  header h1 {
    font-size: 1.4rem;
  }

  .link-card {
    padding: 0.8rem 0.5rem;
    min-height: 70px;
  }

  .link-card i {
    font-size: 1.3rem;
    margin-bottom: 0.3rem;
  }

  .link-card h3 {
    font-size: 0.7rem;
    padding: 0 0.15rem;
    height: 2.2em;
  }
}
</style>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import navData from '../navData.json'

// Search state
const searchQuery = ref('')
const searchInputRef = ref(null)

// Focus search input on "/" key press
const handleKeyDown = (e) => {
  if (e.key === '/' && document.activeElement !== searchInputRef.value) {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// Filter data based on search query
const filteredNavData = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return navData

  return navData.map(category => {
    const filteredItems = category.items.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.link.toLowerCase().includes(query)
    )
    return {
      ...category,
      items: filteredItems
    }
  }).filter(category => category.items.length > 0)
})

// Total count of matching items
const totalResultsCount = computed(() => {
  return filteredNavData.value.reduce((acc, cat) => acc + cat.items.length, 0)
})

// Clear search
const clearSearch = () => {
  searchQuery.value = ''
  searchInputRef.value?.focus()
}
</script>

<template>
  <div class="nav-container">
    <!-- Search Bar -->
    <div class="search-box-wrapper">
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="搜索站点名称或网址... (按 / 聚焦)"
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-btn" aria-label="Clear search">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="search-info" v-if="searchQuery">
        找到 <span>{{ totalResultsCount }}</span> 个相关站点
      </div>
    </div>

    <!-- No Results State -->
    <div v-if="filteredNavData.length === 0" class="no-results">
      <i class="fa-solid fa-face-frown no-results-icon"></i>
      <p>没有找到匹配的站点，请换个关键词试试。</p>
      <button @click="clearSearch" class="reset-btn">重置搜索</button>
    </div>

    <!-- Category Sections -->
    <div v-else class="nav-sections">
      <section 
        v-for="category in filteredNavData" 
        :key="category.id" 
        :id="category.id" 
        class="nav-section"
      >
        <h2 class="category-title">
          <i class="fa-solid fa-tags category-icon"></i>
          {{ category.title }}
          <span class="category-count">{{ category.items.length }}</span>
        </h2>
        
        <div class="link-grid">
          <div 
            v-for="item in category.items" 
            :key="item.link" 
            class="link-card"
          >
            <a :href="item.link" target="_blank" rel="noopener noreferrer" :aria-label="item.name">
              <div class="card-content">
                <i :class="item.icon" class="card-icon"></i>
                <h3>{{ item.name }}</h3>
              </div>
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.nav-container {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Search Box Styles */
.search-box-wrapper {
  margin: 2rem 0 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 600px;
  display: flex;
  align-items: center;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-box:focus-within {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px var(--vp-c-brand-soft), 0 0 0 2px rgba(255, 144, 0, 0.2);
  background-color: var(--vp-c-bg);
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: var(--vp-c-text-2);
  font-size: 1.1rem;
  transition: color 0.3s;
}

.search-box:focus-within .search-icon {
  color: var(--vp-c-brand-1);
}

.search-input {
  width: 100%;
  padding: 0.8rem 2.8rem 0.8rem 2.8rem;
  font-size: 1rem;
  border: none;
  background: transparent;
  color: var(--vp-c-text-1);
  outline: none;
}

.clear-btn {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  padding: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s, color 0.2s;
}

.clear-btn:hover {
  background-color: var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

.search-info {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.search-info span {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

/* Category Title Styles */
.category-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 3rem 0 1.2rem;
  color: var(--vp-c-text-1);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: none; /* override default h2 border */
  padding: 0;
}

.category-icon {
  color: var(--vp-c-brand-1);
  font-size: 1.1rem;
}

.category-count {
  font-size: 0.8rem;
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  padding: 0.1rem 0.6rem;
  border-radius: 20px;
  font-weight: 600;
}

/* Grid Layout */
.link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
}

/* Card Styles */
.link-card {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  position: relative;
}

.link-card a {
  display: block;
  padding: 1.2rem 0.6rem;
  text-decoration: none;
  height: 100%;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  gap: 0.7rem;
}

.card-icon {
  font-size: 1.8rem;
  color: var(--vp-c-brand-1);
  transition: transform 0.25s, color 0.25s;
}

.link-card h3 {
  font-size: 0.85rem;
  font-weight: 500;
  margin: 0;
  color: var(--vp-c-text-1);
  line-height: 1.3;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  height: 2.6em;
  padding: 0 0.2rem;
}

/* Hover States */
.link-card:hover {
  transform: translateY(-4px);
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 6px 18px var(--vp-c-brand-soft), 0 2px 6px rgba(0, 0, 0, 0.08);
  background-color: var(--vp-c-bg-elv);
}

.link-card:hover .card-icon {
  transform: scale(1.15);
  color: var(--vp-c-brand-2);
}

/* No Results State Styles */
.no-results {
  text-align: center;
  padding: 4rem 1rem;
  background-color: var(--vp-c-bg-soft);
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
  margin: 2rem 0;
}

.no-results-icon {
  font-size: 3rem;
  color: var(--vp-c-text-3);
  margin-bottom: 1rem;
}

.no-results p {
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
}

.reset-btn {
  background-color: var(--vp-c-brand-1);
  color: #fff;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reset-btn:hover {
  background-color: var(--vp-c-brand-2);
}

/* Responsive Media Queries */
@media (max-width: 768px) {
  .link-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 0.8rem;
  }
  
  .card-icon {
    font-size: 1.5rem;
  }
  
  .link-card h3 {
    font-size: 0.8rem;
  }
  
  .category-title {
    font-size: 1.25rem;
    margin: 2.2rem 0 1rem;
  }
}
</style>

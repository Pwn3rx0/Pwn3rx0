class FilterSystem {
  constructor() {
    this.base = (document.querySelector('meta[name="site-base"]')?.getAttribute('content')) || '/';
    this.posts = [];
    this.activeFilters = {
      tags: [],
      categories: [],
      search: ''
    };
    this.viewMode = localStorage.getItem('viewMode') || 'grid';
    this.init();
  }

  async init() {
    await this.loadPosts();
    this.renderFilterUI();
    this.setupEventListeners();
    this.loadFromURL();
    this.applyFilters();
  }

  async loadPosts() {
    const response = await fetch(`${this.base}assets/data/search-index.json`);
    this.posts = await response.json();
  }

  renderFilterUI() {
    const container = document.querySelector('.filter-bar');
    if (!container) return;
    
    // Tag cloud
    const tags = this.extractTags();
    const tagCloud = document.createElement('div');
    tagCloud.className = 'tag-cloud';
    tagCloud.innerHTML = `
      <h4>Filter by Tag</h4>
      <div class="filter-chips">
        ${tags.map(tag => `
          <span class="filter-chip tag-chip" data-tag="${tag.tag}">
            ${tag.tag}
            <span class="count">${tag.count}</span>
          </span>
        `).join('')}
      </div>
    `;
    
    // Categories
    const categories = this.extractCategories();
    const categoryList = document.createElement('div');
    categoryList.className = 'category-filters';
    categoryList.innerHTML = `
      <h4>Categories</h4>
      <div class="filter-chips">
        ${categories.map(cat => `
          <span class="filter-chip category-chip" data-category="${cat.category}">
            ${cat.category}
            <span class="count">${cat.count}</span>
          </span>
        `).join('')}
      </div>
    `;
    
    // Sort options
    const sortOptions = document.createElement('div');
    sortOptions.className = 'sort-options';
    sortOptions.innerHTML = `
      <h4>Sort by</h4>
      <select class="sort-select">
        <option value="date-desc">Newest First</option>
        <option value="date-asc">Oldest First</option>
        <option value="title-asc">Title A-Z</option>
        <option value="title-desc">Title Z-A</option>
      </select>
    `;
    
    // View mode toggle
    const viewToggle = document.createElement('div');
    viewToggle.className = 'view-toggle';
    viewToggle.innerHTML = `
      <button class="view-btn ${this.viewMode === 'grid' ? 'active' : ''}" data-view="grid">Grid</button>
      <button class="view-btn ${this.viewMode === 'list' ? 'active' : ''}" data-view="list">List</button>
      <button class="view-btn ${this.viewMode === 'compact' ? 'active' : ''}" data-view="compact">Compact</button>
    `;
    
    // Active filters display
    const activeFilters = document.createElement('div');
    activeFilters.className = 'active-filters';
    activeFilters.innerHTML = `
      <div class="active-filter-list"></div>
      <button class="clear-filters" style="display: none;">Clear all</button>
    `;
    
    container.innerHTML = `
      <div class="search-container">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" placeholder="Search writeups..." value="${this.activeFilters.search}">
        <span class="search-shortcut">⌘K</span>
      </div>
    `;
    
    container.appendChild(tagCloud);
    container.appendChild(categoryList);
    container.appendChild(sortOptions);
    container.appendChild(viewToggle);
    container.appendChild(activeFilters);
    
    this.updateActiveFiltersDisplay();
  }

  extractTags() {
    const tagCount = new Map();
    this.posts.forEach(post => {
      post.tags?.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(tagCount.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  extractCategories() {
    const categoryCount = new Map();
    this.posts.forEach(post => {
      const category = post.category.split('/').pop() || 'Uncategorized';
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });
    
    return Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  setupEventListeners() {
    // Search with debounce
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.activeFilters.search = e.target.value;
          this.applyFilters();
          this.updateURL();
        }, 300);
      });
    }
    
    // Tag chips
    document.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        const index = this.activeFilters.tags.indexOf(tag);
        
        if (index === -1) {
          this.activeFilters.tags.push(tag);
          chip.classList.add('active');
        } else {
          this.activeFilters.tags.splice(index, 1);
          chip.classList.remove('active');
        }
        
        this.applyFilters();
        this.updateActiveFiltersDisplay();
        this.updateURL();
      });
    });
    
    // Category chips
    document.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const category = chip.dataset.category;
        const index = this.activeFilters.categories.indexOf(category);
        
        if (index === -1) {
          this.activeFilters.categories.push(category);
          chip.classList.add('active');
        } else {
          this.activeFilters.categories.splice(index, 1);
          chip.classList.remove('active');
        }
        
        this.applyFilters();
        this.updateActiveFiltersDisplay();
        this.updateURL();
      });
    });
    
    // Sort
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.applyFilters();
        this.updateURL();
      });
    }
    
    // View mode
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.viewMode = btn.dataset.view;
        localStorage.setItem('viewMode', this.viewMode);
        
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.applyFilters();
      });
    });
    
    // Clear filters
    const clearBtn = document.querySelector('.clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.activeFilters.tags = [];
        this.activeFilters.categories = [];
        this.activeFilters.search = '';
        
        document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
        document.querySelector('.search-input').value = '';
        
        this.applyFilters();
        this.updateActiveFiltersDisplay();
        this.updateURL();
      });
    }
    
    // Keyboard shortcut (⌘K / Ctrl+K)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.search-input')?.focus();
      }
    });
  }

  applyFilters() {
    let filtered = [...this.posts];
    
    // Apply search
    if (this.activeFilters.search) {
      const searchTerm = this.activeFilters.search.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        post.category?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply tag filters
    if (this.activeFilters.tags.length > 0) {
      filtered = filtered.filter(post => 
        this.activeFilters.tags.every(tag => post.tags?.includes(tag))
      );
    }
    
    // Apply category filters
    if (this.activeFilters.categories.length > 0) {
      filtered = filtered.filter(post => {
        const postCategory = post.category.split('/').pop();
        return this.activeFilters.categories.includes(postCategory);
      });
    }
    
    // Apply sorting
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
      const [sortBy, sortOrder] = sortSelect.value.split('-');
      
      filtered.sort((a, b) => {
        if (sortBy === 'date') {
          return sortOrder === 'desc' ? 
            new Date(b.date) - new Date(a.date) : 
            new Date(a.date) - new Date(b.date);
        } else if (sortBy === 'title') {
          return sortOrder === 'asc' ? 
            a.title.localeCompare(b.title) : 
            b.title.localeCompare(a.title);
        }
      });
    }
    
    this.renderResults(filtered);
    this.updateResultCount(filtered.length);
  }

  renderResults(posts) {
    const container = document.querySelector('.posts-grid') || document.querySelector('.posts-list');
    if (!container) return;
    
    if (posts.length === 0) {
      container.innerHTML = '<div class="no-results">No writeups found matching your filters.</div>';
      return;
    }
    
    container.className = `posts-${this.viewMode}`;
    
    container.innerHTML = posts.map(post => `
      <article class="post-card" data-tags="${post.tags?.join(' ') || ''}">
        <h3><a href="${post.path}">${post.title}</a></h3>
        <div class="post-meta">
          <time datetime="${post.date}">${new Date(post.date).toLocaleDateString()}</time>
          ${post.tags ? post.tags.map(t => `<span class="tag">${t}</span>`).join('') : ''}
        </div>
        ${post.excerpt ? `<p class="excerpt">${post.excerpt}</p>` : ''}
      </article>
    `).join('');
  }

  updateResultCount(count) {
    const countEl = document.querySelector('.result-count');
    if (countEl) {
      countEl.textContent = `${count} writeup${count !== 1 ? 's' : ''}`;
    }
  }

  updateActiveFiltersDisplay() {
    const container = document.querySelector('.active-filter-list');
    const clearBtn = document.querySelector('.clear-filters');
    
    if (!container) return;
    
    const allFilters = [
      ...this.activeFilters.tags.map(tag => ({ type: 'tag', value: tag })),
      ...this.activeFilters.categories.map(cat => ({ type: 'category', value: cat }))
    ];
    
    if (allFilters.length === 0) {
      container.innerHTML = '';
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }
    
    container.innerHTML = allFilters.map(filter => `
      <span class="filter-chip active" data-type="${filter.type}" data-value="${filter.value}">
        ${filter.value}
        <span class="remove-filter">✕</span>
      </span>
    `).join('');
    
    if (clearBtn) clearBtn.style.display = 'inline-block';
    
    // Add remove handlers
    container.querySelectorAll('.remove-filter').forEach((btn, index) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const filter = allFilters[index];
        
        if (filter.type === 'tag') {
          const chip = document.querySelector(`.tag-chip[data-tag="${filter.value}"]`);
          if (chip) chip.classList.remove('active');
          this.activeFilters.tags = this.activeFilters.tags.filter(t => t !== filter.value);
        } else {
          const chip = document.querySelector(`.category-chip[data-category="${filter.value}"]`);
          if (chip) chip.classList.remove('active');
          this.activeFilters.categories = this.activeFilters.categories.filter(c => c !== filter.value);
        }
        
        this.applyFilters();
        this.updateActiveFiltersDisplay();
        this.updateURL();
      });
    });
  }

  updateURL() {
    const url = new URL(window.location);
    
    if (this.activeFilters.search) {
      url.searchParams.set('q', this.activeFilters.search);
    } else {
      url.searchParams.delete('q');
    }
    
    if (this.activeFilters.tags.length > 0) {
      url.searchParams.set('tags', this.activeFilters.tags.join(','));
    } else {
      url.searchParams.delete('tags');
    }
    
    if (this.activeFilters.categories.length > 0) {
      url.searchParams.set('categories', this.activeFilters.categories.join(','));
    } else {
      url.searchParams.delete('categories');
    }
    
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect && sortSelect.value !== 'date-desc') {
      url.searchParams.set('sort', sortSelect.value);
    } else {
      url.searchParams.delete('sort');
    }
    
    window.history.replaceState({}, '', url);
  }

  loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    // Load search
    const search = params.get('q');
    if (search) {
      this.activeFilters.search = search;
      const input = document.querySelector('.search-input');
      if (input) input.value = search;
    }
    
    // Load tags
    const tags = params.get('tags');
    if (tags) {
      this.activeFilters.tags = tags.split(',');
      this.activeFilters.tags.forEach(tag => {
        const chip = document.querySelector(`.tag-chip[data-tag="${tag}"]`);
        if (chip) chip.classList.add('active');
      });
    }
    
    // Load categories
    const categories = params.get('categories');
    if (categories) {
      this.activeFilters.categories = categories.split(',');
      this.activeFilters.categories.forEach(cat => {
        const chip = document.querySelector(`.category-chip[data-category="${cat}"]`);
        if (chip) chip.classList.add('active');
      });
    }
    
    // Load sort
    const sort = params.get('sort');
    if (sort) {
      const select = document.querySelector('.sort-select');
      if (select) select.value = sort;
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.filter-bar')) {
    window.filterSystem = new FilterSystem();
  }
});

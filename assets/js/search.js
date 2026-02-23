class SearchEngine {
  constructor() {
    this.base = (document.querySelector('meta[name="site-base"]')?.getAttribute('content')) || '/';
    this.searchData = null;
    this.navData = null;
    this.searchInput = document.getElementById('search-input');
    this.searchButton = document.getElementById('search-button');
    this.searchResults = document.getElementById('search-results');
    this.keywordFilters = document.getElementById('keyword-filters');
    this.categoryFilters = document.getElementById('category-filters');
    this.activeFilters = new Set();
    this.activeCategories = new Set();
    
    this.init();
  }

  async init() {
    await Promise.all([this.loadSearchData(), this.loadNavData()]);
    this.setupEventListeners();
    this.setupFilters();
  }

  async loadSearchData() {
    try {
      const response = await fetch(`${this.base}assets/data/search-index.json`);
      const data = await response.json();
      this.searchData = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to load search data:', err);
      this.searchData = [];
    }
  }

  async loadNavData() {
    try {
      const response = await fetch(`${this.base}assets/data/navigation.json`);
      this.navData = await response.json();
    } catch (err) {
      console.error('Failed to load navigation data:', err);
      this.navData = null;
    }
  }

  setupEventListeners() {
    if (this.searchButton) {
      this.searchButton.addEventListener('click', () => this.performSearch());
    }
    
    if (this.searchInput) {
      this.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });
      
      this.searchInput.addEventListener('input', () => {
        if (this.searchInput.value.length > 2) {
          this.performSearch();
        }
      });
    }
  }

  setupFilters() {
    // Populate keyword tags dynamically
    if (this.keywordFilters) {
      this.populateKeywordFilters();
      this.keywordFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tag')) {
          const filter = e.target.dataset.filter;
          e.target.classList.toggle('active');
          
          if (e.target.classList.contains('active')) {
            this.activeFilters.add(filter);
          } else {
            this.activeFilters.delete(filter);
          }
          
          this.performSearch();
        }
      });
    }

    // Populate top-level category checkboxes dynamically
    if (this.categoryFilters) {
      this.populateCategoryFilters();
      this.categoryFilters.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
          const category = e.target.value;
          
          if (e.target.checked) {
            this.activeCategories.add(category);
          } else {
            this.activeCategories.delete(category);
          }
          
          this.performSearch();
        }
      });
    }
  }

  populateKeywordFilters() {
    if (!this.keywordFilters) return;
    let tags = [];
    if (this.navData && this.navData.tags) {
      tags = Object.keys(this.navData.tags);
    } else if (Array.isArray(this.searchData)) {
      const tagSet = new Set();
      this.searchData.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
      tags = Array.from(tagSet);
    }
    tags.sort((a, b) => a.localeCompare(b));
    this.keywordFilters.innerHTML = tags.map(tag => 
      `<span class="filter-tag" data-filter="${tag}">${tag}</span>`
    ).join('');
  }

  populateCategoryFilters() {
    if (!this.categoryFilters) return;
    const categories = this.getTopCategories();
    this.categoryFilters.innerHTML = categories.map(cat => `
      <label class="filter-checkbox">
        <input type="checkbox" value="${cat}"> ${cat}
      </label>
    `).join('');
  }

  getTopCategories() {
    // Prefer navData categories (top-level directories)
    if (this.navData && this.navData.categories) {
      return Object.keys(this.navData.categories);
    }
    // Fallback: derive from search index post.category first segment
    if (Array.isArray(this.searchData)) {
      const set = new Set();
      this.searchData.forEach(p => {
        if (p.category) {
          const top = String(p.category).split('/')[0].trim();
          if (top) set.add(top);
        }
      });
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }
    return [];
    }

  performSearch() {
    const query = this.searchInput.value.toLowerCase().trim();
    
    if (!query && this.activeFilters.size === 0 && this.activeCategories.size === 0) {
      this.showPlaceholder();
      return;
    }

    let results = Array.isArray(this.searchData) ? this.searchData : (this.searchData.posts || []);

    // Filter by search query
    if (query) {
      results = results.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(query);
        const excerptMatch = post.excerpt && post.excerpt.toLowerCase().includes(query);
        const tagsMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(query));
        const categoryMatch = post.category && post.category.toLowerCase().includes(query);
        
        return titleMatch || excerptMatch || tagsMatch || categoryMatch;
      });
    }

    // Filter by active keyword filters
    if (this.activeFilters.size > 0) {
      results = results.filter(post => {
        return post.tags && Array.from(this.activeFilters).some(filter => 
          post.tags.some(tag => tag.toLowerCase() === filter.toLowerCase())
        );
      });
    }

    // Filter by active categories
    if (this.activeCategories.size > 0) {
      results = results.filter(post => {
        return post.category && Array.from(this.activeCategories).some(category =>
          post.category.toLowerCase().includes(category.toLowerCase())
        );
      });
    }

    this.displayResults(results);
  }

  displayResults(results) {
    if (!this.searchResults) return;

    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="search-placeholder">
          <h3>No results found</h3>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      `;
      return;
    }

    const resultsHTML = results.map(post => {
      const img = post.image ? `<div class="post-card-image-modern"><img src="${post.image}" alt=""></div>` : '';
      const tags = post.tags && post.tags.length > 0
        ? `<div class="category-tags">${post.tags.map(t => `<span class="category-tag">${t}</span>`).join('')}</div>` : '';
      return `
        <article class="post-card-modern">
          ${img}
          <div class="post-card-content" style="padding:1.25rem;">
            <div class="post-card-category">${post.category || ''}</div>
            <h3 style="margin: 0.5rem 0 0.5rem;"><a href="${post.path}" style="color:inherit;text-decoration:none;">${post.title}</a></h3>
            <p style="color: var(--text-secondary);">${post.excerpt || ''}</p>
            ${tags}
          </div>
        </article>
      `;
    }).join('');

    this.searchResults.innerHTML = resultsHTML;
  }

  showPlaceholder() {
    if (!this.searchResults) return;
    
    this.searchResults.innerHTML = `
      <div class="search-placeholder">
        <h3>Start typing to search writeups</h3>
        <p>Use keywords, categories, or content to find what you're looking for.</p>
      </div>
    `;
  }
}

// Initialize search when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.searchEngine = new SearchEngine();
  });
} else {
  window.searchEngine = new SearchEngine();
}

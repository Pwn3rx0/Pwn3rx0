class ModernHomePage {
  constructor() {
    this.base = (document.querySelector('meta[name="site-base"]')?.getAttribute('content')) || '/';
    this.postsContainer = document.querySelector('.posts-grid-modern');
    this.categoriesContainer = document.querySelector('.categories-grid-modern');
    this.tagsContainer = document.querySelector('.tag-cloud-modern');
    this.navigationData = null;
    this.postsData = null;
    this.init();
  }

  async init() {
    await this.loadData();
    this.renderRecentPosts();
    this.renderCategories();
    this.renderTags();
  }

  async loadData() {
    try {
      // Load navigation data
      const navResponse = await fetch(`${this.base}assets/data/navigation.json`);
      this.navigationData = await navResponse.json();
      
      // Use recent posts from navigation data
      if (this.navigationData.recentPosts) {
        this.postsData = { posts: this.navigationData.recentPosts };
      } else {
        this.postsData = this.generateMockPosts();
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      this.navigationData = { categories: {} };
      this.postsData = this.generateMockPosts();
    }
  }

  generateMockPosts() {
    // Generate mock posts based on categories
    const posts = [];
    const categories = Object.keys(this.navigationData?.categories || {});
    const sampleTags = ['red-team', 'pentesting', 'malware', 'forensics', 'reversing', 'exploit', 'vulnerability', 'analysis'];
    
    for (let i = 0; i < 6; i++) {
      const category = categories[i % categories.length] || 'general';
      posts.push({
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Security Assessment #${i + 1}`,
        excerpt: `Comprehensive analysis of ${category} security vulnerabilities and exploitation techniques. This writeup covers advanced attack vectors and defensive strategies.`,
        category: category,
        tags: [sampleTags[i % sampleTags.length], sampleTags[(i + 1) % sampleTags.length]],
        date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        url: `${this.base}writeups/${category}/post-${i + 1}.html`
      });
    }
    
    return { posts };
  }



  renderRecentPosts() {
    const posts = this.postsData?.posts?.slice(0, 6) || [];
    
    this.postsContainer.innerHTML = posts.map(post => `
      <article class="post-card-modern">
        <div class="post-card-header">
          <span class="post-card-date">${this.formatDate(post.date)}</span>
        </div>
        <h3 class="post-card-title">${post.title}</h3>
        <p class="post-card-excerpt">${post.excerpt}</p>
        <div class="post-card-tags">
          ${(post.tags || []).map(tag => `<span class="post-card-tag">${tag}</span>`).join('')}
        </div>
        <a href="${post.path || post.url || '#'}" class="post-card-link">Read More →</a>
      </article>
    `).join('');
  }

  renderCategories() {
    const categories = Object.keys(this.navigationData?.categories || {});
    const categoryIcons = {
      'red-team': '🔴',
      'pentesting': '🔍',
      'malware': '🦠',
      'forensics': '🔬',
      'reversing': '⚙️',
      'exploit': '💥',
      'vulnerability': '🛡️',
      'analysis': '📊',
      'general': '🔧'
    };

    this.categoriesContainer.innerHTML = categories.slice(0, 6).map(category => `
      <a href="${this.base}category/${category}.html" class="category-card-modern">
        <span class="category-icon">${categoryIcons[category] || '📝'}</span>
        <div class="category-name">${this.formatCategoryName(category)}</div>
        <div class="category-count">${this.getPostCountForCategory(category)} posts</div>
      </a>
    `).join('');
  }

  renderTags() {
    const allTags = new Set(this.postsData?.posts?.flatMap(post => post.tags || []) || []);
    const tags = Array.from(allTags).slice(0, 12);

    this.tagsContainer.innerHTML = tags.map(tag => `
      <a href="${this.base}search.html?q=${encodeURIComponent(tag)}" class="tag-cloud-item">
        <span>${tag}</span>
      </a>
    `).join('');
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatCategoryName(category) {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getPostCountForCategory(category) {
    return this.postsData?.posts?.filter(post => post.category === category).length || 0;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.hero-section')) {
    new ModernHomePage();
  }
});

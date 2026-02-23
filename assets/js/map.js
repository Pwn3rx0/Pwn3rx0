class SiteMap {
  constructor() {
    this.mapContainer = document.getElementById('map-tree');
    this.navigationData = null;
    this.base = (document.querySelector('meta[name="site-base"]')?.getAttribute('content')) || '/';
    this.init();
  }

  async init() {
    await this.loadNavigationData();
    this.renderSiteMap();
  }

  async loadNavigationData() {
    try {
      const response = await fetch(`${this.base}assets/data/navigation.json`);
      this.navigationData = await response.json();
    } catch (err) {
      console.error('Failed to load navigation data:', err);
      this.navigationData = { categories: {} };
    }
  }

  renderSiteMap() {
    if (!this.mapContainer || !this.navigationData) return;

    const categories = this.navigationData.categories;
    if (!categories || Object.keys(categories).length === 0) {
      this.mapContainer.innerHTML = '<div class="no-content">No content available</div>';
      return;
    }

    const mapHTML = this.buildMapTree(categories, 0);
    this.mapContainer.innerHTML = mapHTML;
  }

  buildMapTree(data, level = 0) {
    let html = '<ul>';
    
    for (const [key, node] of Object.entries(data)) {
      const indentClass = `tree-level-${level}`;
      
      if (node.type === 'directory') {
        // Directory node
        const path = node.path ? `${this.base}category/${node.path}.html` : '#';
        const postCount = node.postCount ? `<span class="post-count">(${node.postCount})</span>` : '';
        
        html += `
          <li class="${indentClass}">
            <a href="${path}">${key}</a> ${postCount}
        `;
        
        // Recursively render children
        if (node.children && Object.keys(node.children).length > 0) {
          html += this.buildMapTree(node.children, level + 1);
        }
        
        html += '</li>';
      } else if (node.type === 'file') {
        // File node (individual post)
        html += `
          <li class="${indentClass}">
            <a href="${node.path}">${node.title || key}</a>
          </li>
        `;
      }
    }
    
    html += '</ul>';
    return html;
  }

  // Alternative method to show a more visual tree structure
  renderVisualMap() {
    if (!this.mapContainer || !this.navigationData) return;

    const categories = this.navigationData.categories;
    let html = '<div class="tree-visual">';
    
    for (const [categoryName, categoryData] of Object.entries(categories)) {
      html += this.renderCategoryBranch(categoryName, categoryData, 0);
    }
    
    html += '</div>';
    this.mapContainer.innerHTML = html;
  }

  renderCategoryBranch(name, data, level) {
    const indent = '  '.repeat(level);
    const connector = level === 0 ? '┌' : '├';
    let html = `${indent}${connector} <a href="${this.base}category/${data.path}.html">${name}</a>`;
    
    if (data.postCount) {
      html += ` <span class="post-count">(${data.postCount})</span>`;
    }
    html += '<br>';
    
    if (data.children && Object.keys(data.children).length > 0) {
      for (const [childName, childData] of Object.entries(data.children)) {
        if (childData.type === 'directory') {
          html += this.renderCategoryBranch(childName, childData, level + 1);
        } else if (childData.type === 'file') {
          html += `${'  '.repeat(level + 1)}└ <a href="${childData.path}">${childData.title}</a><br>`;
        }
      }
    }
    
    return html;
  }
}

// Initialize map when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.siteMap = new SiteMap();
  });
} else {
  window.siteMap = new SiteMap();
}

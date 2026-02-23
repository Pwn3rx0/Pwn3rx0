class CategoryNavigation {
  constructor() {
    this.tree = null;
    this.base = (document.querySelector('meta[name="site-base"]')?.getAttribute('content')) || '/';
    this.currentPath = window.location.pathname;
    this.init();
  }

  async init() {
    await this.loadNavigationData();
    this.renderCategoryTree();
    this.renderBreadcrumbs();
    this.setupEventListeners();
    this.highlightCurrentPath();
  }

  async loadNavigationData() {
    try {
      const response = await fetch(`${this.base}assets/data/navigation.json`);
      this.data = await response.json();
      this.tree = this.data.categories;
    } catch (err) {
      console.error('Failed to load navigation data:', err);
    }
  }

  renderCategoryTree(container = document.querySelector('.category-tree'), parent = null, level = 0) {
    if (!container) return;
    
    const treeData = parent ? parent.children : this.tree;
    if (!treeData) return;
    
    const ul = document.createElement('ul');
    ul.className = 'tree-root';
    
    for (const [key, node] of Object.entries(treeData)) {
      const li = document.createElement('li');
      li.className = 'tree-node';
      li.dataset.path = node.path || '';
      
      const content = document.createElement('div');
      content.className = 'tree-node-content';
      
      if (node.type === 'directory') {
        // Directory node - only show main categories (level 0)
        if (level === 0) {
          const label = document.createElement('a');
          label.className = 'tree-label';
          label.href = `${this.base}category/${node.path}.html`;
          label.textContent = key;
          label.setAttribute('title', key);
          
          const badge = document.createElement('span');
          badge.className = 'post-count-badge';
          badge.textContent = node.postCount;
          
          content.appendChild(label);
          content.appendChild(badge);
          li.appendChild(content);
          ul.appendChild(li);
        }
      }
    }
    
    if (parent) {
      container.appendChild(ul);
    } else {
      container.innerHTML = '';
      container.appendChild(ul);
    }
  }

  highlightCurrentPath() {
    const currentPath = window.location.pathname;
    
    // Remove active class from all
    document.querySelectorAll('.tree-node-content').forEach(el => {
      el.classList.remove('active');
    });
    
    // Find and highlight current node
    document.querySelectorAll('.tree-label').forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        const content = link.closest('.tree-node-content');
        if (content) {
          content.classList.add('active');
          
          // Expand all parents
          let parent = link.closest('.tree-node');
          while (parent) {
            const childrenContainer = parent.querySelector('.tree-children');
            const toggle = parent.querySelector('.tree-toggle');
            if (childrenContainer) {
              childrenContainer.style.display = 'block';
            }
            if (toggle) {
              toggle.innerHTML = '▼';
              toggle.classList.add('expanded');
            }
            parent = parent.parentElement?.closest('.tree-node');
          }
        }
      }
    });
  }

  toggleNode(node) {
    const children = node.querySelector('.tree-children');
    const toggle = node.querySelector('.tree-toggle');
    
    if (children && toggle) {
      if (children.style.display === 'none' || !children.style.display) {
        children.style.display = 'block';
        toggle.innerHTML = '▼';
        toggle.classList.add('expanded');
      } else {
        children.style.display = 'none';
        toggle.innerHTML = '▶';
        toggle.classList.remove('expanded');
      }
    }
  }

  renderBreadcrumbs() {
    const container = document.querySelector('.breadcrumbs');
    if (!container) return;
    
    const p = this.currentPath;
    const isTopTabPage =
      p === this.base ||
      p.endsWith('/index.html') ||
      p.endsWith('/search.html') ||
      p.endsWith('/map.html') ||
      p.endsWith('/about.html');
      
    if (isTopTabPage) {
      container.innerHTML = `
        <a href="${this.base}" class="nav-tab" data-tab="home">Home</a>
        <a href="${this.base}search.html" class="nav-tab" data-tab="search">Search</a>
        <a href="${this.base}map.html" class="nav-tab" data-tab="map">Map</a>
        <a href="${this.base}about.html" class="nav-tab" data-tab="about">About</a>
      `;
      return;
    }
    
    const pathSegments = this.currentPath.replace(/\.html$/, '').split('/').filter(Boolean);
    let breadcrumbs = [{ name: 'Home', path: this.base }];
    let cumulativePath = '';
    
    for (const segment of pathSegments) {
      if (segment === 'writeups' || segment === 'category') continue;
      
      cumulativePath = cumulativePath ? `${cumulativePath}/${segment}` : segment;
      
      // Format name
      const name = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // Determine path
      let path;
      if (cumulativePath.includes('writeups/')) {
        path = `${this.base}${cumulativePath}.html`;
      } else {
        path = `${this.base}category/${cumulativePath}.html`;
      }
      
      breadcrumbs.push({
        name: name,
        path: path,
        active: false
      });
    }
    
    // If we're on a post page, the last segment is the post title
    if (this.currentPath.includes('/writeups/') && !this.currentPath.endsWith('writeups.html')) {
      const lastSegment = breadcrumbs[breadcrumbs.length - 1];
      if (lastSegment) {
        lastSegment.active = true;
      }
    }
    
    container.innerHTML = breadcrumbs.map((crumb, i) => {
      if (i === 0) {
        return `<a href="${crumb.path}">${crumb.name}</a>`;
      }
      
      return `
        <span class="separator">/</span>
        ${crumb.active ? 
          `<span class="current">${crumb.name}</span>` : 
          `<a href="${crumb.path}">${crumb.name}</a>`
        }
      `;
    }).join('');
  }

  setupEventListeners() {
    // Tree toggle clicks
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('.tree-toggle');
      if (toggle) {
        e.preventDefault();
        const node = toggle.closest('.tree-node');
        if (node) {
          this.toggleNode(node);
        }
      }
    });
    
    // Mobile menu toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
      // Accessibility hooks
      if (!sidebar.id) sidebar.id = 'sidebar';
      menuToggle.setAttribute('aria-controls', sidebar.id);
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Toggle sidebar');

      const toggle = (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        // Guard against duplicate touch/click firing
        if (menuToggle.dataset.toggling === '1') return;
        menuToggle.dataset.toggling = '1';
        const doToggle = () => {
          sidebar.classList.toggle('active');
          menuToggle.classList.toggle('active');
          menuToggle.setAttribute('aria-expanded', menuToggle.classList.contains('active') ? 'true' : 'false');
          menuToggle.dataset.toggling = '0';
        };
        if (window.requestAnimationFrame) {
          requestAnimationFrame(doToggle);
        } else {
          doToggle();
        }
      };

      menuToggle.addEventListener('click', toggle);
      // Add touch/pointer handlers for better mobile reliability
      menuToggle.addEventListener('touchend', toggle, { passive: false });
      menuToggle.addEventListener('pointerup', toggle);
      
      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
          }
        }
      });
      
      // Close sidebar when clicking a link on mobile
      sidebar.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          if (e.target.tagName === 'A') {
            setTimeout(() => {
              sidebar.classList.remove('active');
              menuToggle.classList.remove('active');
            }, 100);
          }
        }
      });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        if (sidebar && sidebar.classList.contains('active')) {
          sidebar.classList.remove('active');
          menuToggle?.classList.remove('active');
        }
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      const sidebar = document.querySelector('.sidebar');
      const menuToggle = document.querySelector('.mobile-menu-toggle');
      
      if (window.innerWidth > 768) {
        if (sidebar) sidebar.classList.remove('active');
        if (menuToggle) menuToggle.classList.remove('active');
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.categoryNav = new CategoryNavigation();
  });
} else {
  window.categoryNav = new CategoryNavigation();
}

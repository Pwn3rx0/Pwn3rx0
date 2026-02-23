class App {
  constructor() {
    this.base = (document.querySelector('meta[name="site-base"]')?.getAttribute('content')) || '/';
    this.init();
  }

  init() {
    this.setupMobileMenu();
    this.setupSmoothScroll();
    this.setupImageLightbox();
    this.setupTableOfContents();
    this.updateHomeStats();
  }

  async updateHomeStats() {
    // Only run on home page
    if (!document.querySelector('.hero-stats')) return;
    
    try {
      const response = await fetch(`${this.base}assets/data/navigation.json`);
      const data = await response.json();
      
      // Update stats
      const totalPosts = data.totalPosts || 0;
      const totalCategories = Object.keys(data.categories || {}).length;
      const totalTags = Object.keys(data.tags || {}).length;
      
      const statNumbers = document.querySelectorAll('.stat-number');
      if (statNumbers.length >= 3) {
        statNumbers[0].textContent = totalPosts;
        statNumbers[1].textContent = totalCategories;
        statNumbers[2].textContent = totalTags;
      }
    } catch (err) {
      console.error('Failed to update home stats:', err);
    }
  }

  setupMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        toggle.classList.toggle('active');
      });
    }
  }

  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  setupImageLightbox() {
    document.querySelectorAll('.writeup-image').forEach(img => {
      img.addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        overlay.innerHTML = `
          <div class="lightbox-content">
            <img src="${img.src}" alt="${img.alt}">
            <button class="lightbox-close">✕</button>
          </div>
        `;
        
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay || e.target.classList.contains('lightbox-close')) {
            overlay.remove();
          }
        });
      });
    });
  }

  setupTableOfContents() {
    const content = document.querySelector('.post-content');
    const tocContainer = document.querySelector('.table-of-contents');
    
    if (content && tocContainer) {
      const headings = content.querySelectorAll('h2, h3');
      
      if (headings.length > 0) {
        const toc = document.createElement('ul');
        toc.className = 'toc-list';
        
        headings.forEach((heading, i) => {
          const id = `heading-${i}`;
          heading.id = id;
          
          const li = document.createElement('li');
          li.className = `toc-${heading.tagName.toLowerCase()}`;
          li.innerHTML = `<a href="#${id}">${heading.textContent}</a>`;
          
          toc.appendChild(li);
        });
        
        tocContainer.innerHTML = '<h3>Contents</h3>';
        tocContainer.appendChild(toc);
        
        // Highlight active heading on scroll
        window.addEventListener('scroll', () => {
          let current = '';
          headings.forEach(heading => {
            const rect = heading.getBoundingClientRect();
            if (rect.top <= 100) {
              current = heading.id;
            }
          });
          
          tocContainer.querySelectorAll('a').forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === `#${current}`) {
              a.classList.add('active');
            }
          });
        });
      }
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

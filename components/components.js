class ComponentLoader {
    constructor() {
        this.components = new Map();
    }

    async loadComponent(id, filePath) {
        if (this.components.has(id)) {
            return this.components.get(id);
        }

        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`Failed to load ${filePath}`);
            
            const html = await response.text();
            this.components.set(id, html);
            return html;
        } catch (error) {
            console.error(`Error loading ${filePath}:`, error);
            return `<div class="component-error">Error loading component: ${id}</div>`;
        }
    }

    async renderComponent(elementId, filePath) {
        const html = await this.loadComponent(elementId, filePath);
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
            
            // Restore event handlers for the back button
            if (elementId === 'header-component') {
                const backLink = element.querySelector('.back-link');
                if (backLink) {
                    backLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        history.back();
                    });
                }
            }
        }
    }
}

// Initialize and load components on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    const loader = new ComponentLoader();
    
    // Load components in parallel
    await Promise.all([
        loader.renderComponent('header-component', '/components/header.html'),
        loader.renderComponent('footer-component', '/components/footer.html'),
        loader.renderComponent('project-nav-component', '/components/project-nav.html')
    ]);
    
    // Show content after components load
    document.body.style.opacity = 1;
});

// After header load
fetch('../components/header.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('header-component').innerHTML = data;
    initBackButton(); // Initialize back button
  });

function initBackButton() {
  const backLink = document.getElementById('back-link');
  if (!backLink) {
    console.log('Back link not found, retrying...');
    setTimeout(initBackButton, 100); // Retry after a short delay
    return;
  }
  
  backLink.addEventListener('click', function(event) {
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get('referrer');
    
    if (referrer) {
      window.location.href = decodeURIComponent(referrer);
      return;
    }
    
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    
    window.location.href = '../index.html';
  });
  
  console.log('Back button initialized');
}
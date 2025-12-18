// ==========================
// 0. КОНФИГУРАЦИЯ С ОПТИМИЗАЦИЯМИ
// ==========================
const CONFIG = {
  Z_GAP: 200,
  START_OFFSET: 0,
  DEPTH: 4000,
  BG_FADE_DURATION: 1,
  BG_OPACITY: 0.2,
  MOBILE_BG_OPACITY: 0.08, // Еще ниже для мобилок
  MOUSE_SENSITIVITY: { X: 5, Y: 3, ROTATION: 5 },
  MOBILE_SENSITIVITY: { X: 1.5, Y: 1, ROTATION: 1 }, // Уменьшено для мобилок
  GRID: {
    HORIZONTAL_SIZE: 200,
    VERTICAL_SIZE: 300,
    VERTICAL_COUNT: 4,
    LINE_OPACITY: 0.15,
    FADE_RANGE: 4000,
    MOBILE_OPACITY: 0.08 // Уменьшенная opacity для мобилок
  },
  LENIS: {
    LERP: 0.1,
    SMOOTH_WHEEL: true,
    TOUCH_MULTIPLIER: 2,
    WHEEL_MULTIPLIER: {
      MIN: 0.15,
      MAX: 0.8,
      BASE: 0.2
    }
  },
  
  // Система порядка проектов
  PROJECTS_ORDER: [
    "project-2", "project-7-copy", "project-50", "project-accemedin",
    "project-amoxlocated", "project-art-01", "project-biomass", "project-delfast",
    "project-dobro", "project-egg", "project-frame-1225", "project-frame-1283",
    "project-gogo-bot-avatar", "project-hmelisoneli", "project-hram-located",
    "project-iii3-cover", "project-jernov", "project-k19-dase", "project-liminal",
    "project-manifest", "project-martini", "project-mitus", "project-mock-recovered",
    "project-mockup", "project-nigredo", "project-plate-alt", "project-plate",
    "project-pmkit", "project-prodj-2019", "project-roma-yurchak", "project-saenkoharenko",
    "project-screen-shot-2019", "project-screenshot-2024-07-10-00:16",
    "project-screenshot-2024-07-10-00:16:28", "project-screenshot-2024-07-10-00:16:51",
    "project-sharespot", "project-shm-poster", "project-shmalgauzen",
    "project-sinners", "project-slice-8", "project-sof-brama", "project-son",
    "project-triple-we", "project-tube-mock", "project-twog", "project-vartis",
    "project-x4"
  ],
  
  // Оптимизации
  IS_MOBILE: window.innerWidth <= 768,
  USE_STATIC_BG: true, // Использовать статичные бэкграунды
  DISABLE_COMPLEX_EFFECTS: window.innerWidth <= 768, // Отключить сложные эффекты на мобилках
  
  // Настройки производительности
  MAX_FPS: 60,
  MOBILE_MAX_FPS: 30,
  FRAME_SKIP_MOBILE: 2, // Пропускать кадры на мобилках
  DISABLE_GRID_ON_MOBILE: false
};

// ==========================
// 1. ГЛОБАЛЬНОЕ СОСТОЯНИЕ (ОБНОВЛЕНО)
// ==========================
class AppState {
  constructor() {
    this.mouse = { nx: 0, ny: 0, targetX: 0, targetY: 0, angle: 0 };
    this.scroll = { pos: 0, z: 0, max: 1 };
    this.view = 'slides';
    this.filter = 'allworks';
    this.bg = { active: 0, currentIndex: -1 };
    this.isLoading = true;
    this.currentPage = 'home';
    
    this.filteredData = [];
    this.sortedData = []; // Данные отсортированные по порядку
    this.slides = { elements: [], state: [] };
    this.gridLines = this.generateGridLines();
    this.imagesLoaded = 0;
    this.totalImages = 0;
    this.preloadedStaticImages = new Set();
    this.staticBgCache = new Map(); // Кэш для статичных бэкграундов
    
    // Для мобильной оптимизации
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.isLowPowerMode = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  generateGridLines() {
    const lines = [];
    const step = CONFIG.IS_MOBILE ? CONFIG.GRID.HORIZONTAL_SIZE * 2 : CONFIG.GRID.HORIZONTAL_SIZE;
    for (let z = 0; z < CONFIG.DEPTH; z += step) {
      lines.push(z);
    }
    return lines;
  }
  
  getCurrentMouseSensitivity() {
    return CONFIG.IS_MOBILE ? CONFIG.MOBILE_SENSITIVITY : CONFIG.MOUSE_SENSITIVITY;
  }
}

// ==========================
// 2. ДОМ КЭШ С ОПТИМИЗАЦИЯМИ
// ==========================
class DOMCache {
  constructor() {
    this.elements = {};
  }
  
  init() {
    this.elements = {
      root: document.documentElement,
      canvas: document.getElementById('gridCanvas'),
      context: document.getElementById('gridCanvas')?.getContext('2d'),
      slider: document.querySelector('.slider'),
      gallery: document.getElementById('gallery'),
      navLinks: document.querySelectorAll('.nav a'),
      viewBtns: document.querySelectorAll('.view-btn'),
      viewSwitcher: document.querySelector('.view-switcher'),
      header: document.querySelector('.header'),
      footer: document.querySelector('.footer'),
      body: document.body,
      scrollContainer: document.querySelector('.scroll-container')
    };
    
    this.initStaticBackgroundLayers();
    this.initMobileOptimizations();
    this.initLoader();
    return this;
  }
  
  initStaticBackgroundLayers() {
    // Удаляем старые blur слои
    const oldBgWrap = document.querySelector('.bg-blur-wrap');
    if (oldBgWrap) oldBgWrap.remove();
    
    // Создаем статичные бэкграунды
    const staticBgContainer = document.createElement('div');
    staticBgContainer.className = 'static-bg-container';
    
    this.elements.staticBgA = document.createElement('div');
    this.elements.staticBgB = document.createElement('div');
    this.elements.staticBgA.className = 'static-bg-layer layer-a';
    this.elements.staticBgB.className = 'static-bg-layer layer-b';
    
    // Упрощаем стили для мобилок
    if (CONFIG.IS_MOBILE) {
      this.elements.staticBgA.style.filter = 'saturate(1)';
      this.elements.staticBgB.style.filter = 'saturate(1)';
    }
    
    staticBgContainer.appendChild(this.elements.staticBgA);
    staticBgContainer.appendChild(this.elements.staticBgB);
    
    const scene = document.getElementById('scene');
    if (scene) {
      scene.parentNode.insertBefore(staticBgContainer, scene.nextSibling);
    }
    
    this.elements.staticBgContainer = staticBgContainer;
  }
  
  initMobileOptimizations() {
    if (CONFIG.IS_MOBILE) {
      // Отключаем сложные эффекты
      this.elements.body.classList.add('mobile-optimized');
      
      // Уменьшаем качество canvas
      if (this.elements.canvas) {
        this.elements.canvas.style.imageRendering = 'pixelated';
      }
      
      // Упрощаем header
      const header = this.elements.header;
      if (header) {
        header.style.backdropFilter = 'none';
        header.style.backgroundColor = 'rgba(0,0,0,0.95)';
      }
    }
  }
  
  initLoader() {
    // Упрощенный лоадер для мобилок
    const loader = document.createElement('div');
    loader.className = 'loader';
    
    if (CONFIG.IS_MOBILE) {
      loader.innerHTML = `
        <div class="loader-content">
          <div class="loader-spinner-mobile"></div>
          <div class="loader-progress">0%</div>
        </div>
      `;
      // Добавляем стили для мобильного лоадера
      const style = document.createElement('style');
      style.textContent = `
        .loader-spinner-mobile {
          width: 40px;
          height: 40px;
          border: 2px solid #333;
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `;
      document.head.appendChild(style);
    } else {
      loader.innerHTML = `
        <div class="loader-content">
          <div class="loader-spinner"></div>
          <div class="loader-progress">0%</div>
        </div>
      `;
    }
    
    this.elements.loader = loader;
    document.body.appendChild(loader);
  }
  
  updateLoaderProgress(percentage) {
    if (this.elements.loader) {
      const progress = this.elements.loader.querySelector('.loader-progress');
      if (progress) {
        progress.textContent = `${Math.round(percentage)}%`;
      }
    }
  }
  
  hideLoader() {
    if (this.elements.loader) {
      this.elements.loader.style.opacity = '0';
      setTimeout(() => {
        if (this.elements.loader.parentNode) {
          this.elements.loader.parentNode.removeChild(this.elements.loader);
        }
      }, 300);
    }
  }
}

// ==========================
// 3. МЕНЕДЖЕР ДАННЫХ С ГОДАМИ И ПОРЯДКОМ
// ==========================
class DataManager {
  constructor() {
    this.allData = this.createEnhancedData();
    this.sortProjectsByOrder();
  }
  
  createEnhancedData() {
    // Базовая структура с годами, порядком и ссылками на проекты
    return [
      { 
        id: "project-2",
        title: "2", 
        img: "./images/2.jpg", 
        bg_static: "./images/static/2-bg.jpg", // Статичное изображение вместо blur
        categories: ["interfaces"], 
        year: 2023,
        order: this.getOrder("project-2"),
        project_page: "project-2.html",
        description: "Interface design project"
      },
      { 
        id: "project-7-copy",
        title: "7 Copy", 
        img: "./images/7 copy.jpg", 
        bg_static: "./images/static/7-copy-bg.jpg",
        categories: ["interfaces"], 
        year: 2023,
        order: this.getOrder("project-7-copy"),
        project_page: "project-7-copy.html"
      },
      { 
        id: "project-50",
        title: "50", 
        img: "./images/50.jpg", 
        bg_static: "./images/static/50-bg.jpg",
        categories: ["interfaces"], 
        year: 2022,
        order: this.getOrder("project-50"),
        project_page: "project-50.html"
      },
      { 
        id: "project-accemedin",
        title: "Accemedin", 
        img: "./images/accemedin.jpg", 
        bg_static: "./images/static/accemedin-bg.jpg",
        categories: ["interfaces"], 
        year: 2023,
        order: this.getOrder("project-accemedin"),
        project_page: "project-accemedin.html"
      },
      { 
        id: "project-amoxlocated",
        title: "AMOxLOCATED T-Shirt Mockup", 
        img: "./images/AMOxLOCATED_tshitmockup_3new copy.jpg", 
        bg_static: "./images/static/amoxlocated-bg.jpg",
        categories: ["branding", "art"], 
        year: 2024,
        order: this.getOrder("project-amoxlocated"),
        project_page: "project-amoxlocated.html"
      },
      // Продолжите для всех проектов...
      // Для примера добавлю еще несколько
      { 
        id: "project-art-01",
        title: "Art 01", 
        img: "./images/art-01.jpg", 
        bg_static: "./images/static/art-01-bg.jpg",
        categories: ["art"], 
        year: 2023,
        order: this.getOrder("project-art-01"),
        project_page: "project-art-01.html"
      },
      { 
        id: "project-biomass",
        title: "Biomass", 
        img: "./images/biomass.jpg", 
        bg_static: "./images/static/biomass-bg.jpg",
        categories: ["branding"], 
        year: 2022,
        order: this.getOrder("project-biomass"),
        project_page: "project-biomass.html"
      }
    ];
  }
  
  getOrder(projectId) {
    const index = CONFIG.PROJECTS_ORDER.indexOf(projectId);
    return index !== -1 ? index + 1 : 999;
  }
  
  sortProjectsByOrder() {
    this.allData.sort((a, b) => a.order - b.order);
  }
  
  filterData(filter) {
    if (filter === "allworks") {
      return [...this.allData];
    }
    return this.allData.filter(item => item.categories.includes(filter));
  }
  
  getProjectById(id) {
    return this.allData.find(item => item.id === id);
  }
  
  getProjectsForGallery(filter) {
    const data = this.filterData(filter);
    
    // Для allworks можем добавить дополнительные превью
    if (filter === "allworks") {
      const extraPreviews = [];
      data.forEach(project => {
        // Добавляем второе превью если проект в нескольких категориях
        if (project.categories.length > 1) {
          const preview = {
            ...project,
            is_preview: true,
            preview_category: project.categories[1]
          };
          extraPreviews.push(preview);
        }
      });
      return [...data, ...extraPreviews];
    }
    
    return data;
  }
  
  preloadImages(images, onProgress) {
    return new Promise((resolve) => {
      if (!images || images.length === 0) {
        resolve();
        return;
      }
      
      let loaded = 0;
      const total = images.length;
      
      images.forEach((src) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loaded++;
          if (onProgress) {
            onProgress(loaded / total);
          }
          
          if (loaded === total) {
            setTimeout(resolve, 100); // Маленькая задержка для стабильности
          }
        };
        img.src = src;
        
        // Таймаут для зависших загрузок
        setTimeout(() => {
          if (!img.complete) {
            loaded++;
            if (onProgress) {
              onProgress(loaded / total);
            }
            if (loaded === total) {
              setTimeout(resolve, 100);
            }
          }
        }, 5000);
      });
    });
  }
  
  preloadStaticBackgrounds() {
    const bgImages = this.allData
      .filter(item => item.bg_static)
      .map(item => item.bg_static);
    
    return this.preloadImages(bgImages);
  }
}

// ==========================
// 4. ЛЕНИС МЕНЕДЖЕР С ОПТИМИЗАЦИЯМИ
// ==========================
class LenisManager {
  constructor() {
    this.lenis = null;
    this.currentView = null;
  }
  
  init(viewType, itemCount) {
    if (this.lenis) {
      this.lenis.destroy();
    }
    
    const config = {
      lerp: CONFIG.IS_MOBILE ? 0.15 : CONFIG.LENIS.LERP,
      smoothWheel: CONFIG.LENIS.SMOOTH_WHEEL,
      touchMultiplier: CONFIG.IS_MOBILE ? 1.5 : CONFIG.LENIS.TOUCH_MULTIPLIER,
      wheelMultiplier: this.getWheelMultiplier(viewType, itemCount),
      duration: CONFIG.IS_MOBILE ? 1.2 : 1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    };
    
    this.lenis = new Lenis(config);
    this.currentView = viewType;
    
    if (viewType === 'slides') {
      this.lenis.on("scroll", (e) => {
        appState.scroll.pos = e.scroll;
        appState.scroll.max = e.limit;
        appState.scroll.z = (appState.scroll.pos / appState.scroll.max) * CONFIG.DEPTH * 2;
      });
    }
    
    return this.lenis;
  }
  
  getWheelMultiplier(viewType, itemCount) {
    if (CONFIG.IS_MOBILE) {
      return 0.25; // Меньшая чувствительность на мобилках
    }
    
    if (viewType === 'slides') {
      if (itemCount <= 5) return CONFIG.LENIS.WHEEL_MULTIPLIER.MAX;
      if (itemCount >= 20) return CONFIG.LENIS.WHEEL_MULTIPLIER.MIN;
      
      const ratio = itemCount / 20;
      return CONFIG.LENIS.WHEEL_MULTIPLIER.MIN + 
             (CONFIG.LENIS.WHEEL_MULTIPLIER.MAX - CONFIG.LENIS.WHEEL_MULTIPLIER.MIN) * (1 - ratio);
    }
    
    return CONFIG.LENIS.WHEEL_MULTIPLIER.BASE;
  }
  
  start() {
    if (this.lenis) {
      this.lenis.start();
    }
  }
  
  destroy() {
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
  }
}

// ==========================
// 5. МЕНЕДЖЕР ВИДОВ С ВСЕМИ ОБНОВЛЕНИЯМИ
// ==========================
class ViewManager {
  constructor(state, dom, dataManager) {
    this.state = state;
    this.dom = dom;
    this.dataManager = dataManager;
    this.lenisManager = new LenisManager();
    this.lazyObserver = null;
    this.resizeTimeout = null;
    this.bgChangeTimeout = null;
    this.rafId = null;
    this.isAnimating = false;
    this.staticBgManager = new StaticBackgroundManager(dom);
    this.orderManager = new ProjectOrderManager(dataManager);
    
    this.preloadedBackgrounds = new Set();
    this.mobileTouchStart = { x: 0, y: 0 };
  }
  
  // ==========================
  // 5.1 ИНИЦИАЛИЗАЦИЯ МЫШИ/ТАЧА
  // ==========================
  initMouse() {
    if (CONFIG.IS_MOBILE) {
      this.initTouch();
    } else {
      window.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    }
    
    this.initKeyboard();
  }
  
  initTouch() {
    let touchStartTime = 0;
    
    window.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      this.mobileTouchStart = { x: touch.clientX, y: touch.clientY };
      touchStartTime = Date.now();
      
      if (this.state.view === "gallery") {
        // Отключаем скролл при таче на галерее
        e.preventDefault();
      }
    });
    
    window.addEventListener("touchmove", (e) => {
      if (this.state.view === "gallery" || CONFIG.DISABLE_COMPLEX_EFFECTS) return;
      
      const touch = e.touches[0];
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      
      this.state.mouse.nx = (touch.clientX - cx) / cx * 0.5; // Уменьшенный эффект
      this.state.mouse.ny = (touch.clientY - cy) / cy * 0.5;
      
      this.dom.elements.root.style.setProperty("--mx", this.state.mouse.nx.toFixed(3));
      this.dom.elements.root.style.setProperty("--my", this.state.mouse.ny.toFixed(3));
    });
    
    window.addEventListener("touchend", (e) => {
      const touchEndTime = Date.now();
      const duration = touchEndTime - touchStartTime;
      
      // Быстрый тап - возможно клик
      if (duration < 200) {
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - this.mobileTouchStart.x);
        const deltaY = Math.abs(touch.clientY - this.mobileTouchStart.y);
        
        if (deltaX < 10 && deltaY < 10) {
          // Обработка тапа (можно использовать для открытия проектов)
        }
      }
    });
  }
  
  handleMouseMove(e) {
    if (this.state.view === "gallery") return;
    
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    
    this.state.mouse.nx = (e.clientX - cx) / cx;
    this.state.mouse.ny = (e.clientY - cy) / cy;
    this.state.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 200;
    this.state.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 200;
    this.state.mouse.angle = (Math.atan2(this.state.mouse.ny, this.state.mouse.nx) * 180 / Math.PI + 360) % 360;
    
    this.dom.elements.root.style.setProperty("--mx", this.state.mouse.nx.toFixed(3));
    this.dom.elements.root.style.setProperty("--my", this.state.mouse.ny.toFixed(3));
    this.dom.elements.root.style.setProperty("--angle", this.state.mouse.angle.toFixed(1) + "deg");
  }
  
  initKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (this.lenisManager.lenis) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          this.lenisManager.lenis.scrollBy(200, { duration: 0.8 });
          e.preventDefault();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          this.lenisManager.lenis.scrollBy(-200, { duration: 0.8 });
          e.preventDefault();
        } else if (e.key === 'g' || e.key === 'G') {
          this.setView(this.state.view === 'slides' ? 'gallery' : 'slides');
        } else if (e.key === 'f' || e.key === 'F') {
          this.setFilter(this.state.filter === 'allworks' ? 'interfaces' : 'allworks');
        }
      }
    });
  }
  
  // ==========================
  // 5.2 РЕСАЙЗ С ОПТИМИЗАЦИЯМИ
  // ==========================
  initResize() {
    this.resizeCanvas();
    
    const optimizedResize = () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        CONFIG.IS_MOBILE = window.innerWidth <= 768;
        CONFIG.DISABLE_COMPLEX_EFFECTS = CONFIG.IS_MOBILE;
        
        this.resizeCanvas();
        if (this.lenisManager.lenis) {
          this.lenisManager.lenis.resize();
        }
        
        if (this.state.view === 'slides') {
          this.state.slides.elements.forEach((slide, i) => {
            gsap.set(slide, {
              left: (i % 2 === 0 ? 35 : 50) + "%"
            });
          });
        }
        
        // Обновляем мобильные оптимизации
        if (CONFIG.IS_MOBILE) {
          this.applyMobileOptimizations();
        }
      }, 250);
    };
    
    window.addEventListener("resize", optimizedResize);
    window.addEventListener("orientationchange", () => {
      setTimeout(optimizedResize, 100);
    });
  }
  
  resizeCanvas() {
    if (!this.dom.elements.canvas || !this.dom.elements.context) return;
    
    const dpr = CONFIG.IS_MOBILE ? 1 : window.devicePixelRatio || 1;
    const rect = this.dom.elements.canvas.getBoundingClientRect();
    
    this.dom.elements.canvas.width = rect.width * dpr;
    this.dom.elements.canvas.height = rect.height * dpr;
    
    this.dom.elements.context.scale(dpr, dpr);
    
    if (CONFIG.IS_MOBILE) {
      this.dom.elements.context.imageSmoothingEnabled = false;
    }
  }
  
  applyMobileOptimizations() {
    // Упрощаем сетку
    this.state.gridLines = this.state.generateGridLines();
    
    // Отключаем сложные эффекты
    if (CONFIG.DISABLE_COMPLEX_EFFECTS) {
      document.documentElement.style.setProperty('--bg-blur', '20px');
      if (this.dom.elements.staticBgA) {
        this.dom.elements.staticBgA.style.filter = 'none';
        this.dom.elements.staticBgB.style.filter = 'none';
      }
    }
  }
  
  // ==========================
  // 5.3 СЛАЙДЫ С ГОДАМИ И ПОРЯДКОМ
  // ==========================
  buildSlides() {
    if (this.state.view !== "slides") return;
    if (!this.dom.elements.slider) return;
    
    this.dom.elements.slider.innerHTML = "";
    this.state.slides.elements = [];
    this.state.slides.state = [];
    
    // Используем отсортированные данные
    this.state.sortedData = this.orderManager.getSortedProjects(this.state.filter);
    
    if (this.state.sortedData.length === 0) {
      const emptySlide = this.createEmptySlide();
      this.dom.elements.slider.appendChild(emptySlide);
      return;
    }
    
    this.state.sortedData.forEach((data, i) => {
      const slide = this.createSlideElement(data, i);
      this.dom.elements.slider.appendChild(slide);
      this.state.slides.elements.push(slide);
      this.state.slides.state.push({
        baseZ: i * CONFIG.Z_GAP,
        scale: 1,
        opacity: 1,
        parallaxX: 0,
        parallaxY: 0
      });
      
      this.positionSlide(slide, i);
    });
    
    this.state.scroll.max = (this.state.sortedData.length - 1) * CONFIG.Z_GAP;
    
    this.lenisManager.init('slides', this.state.sortedData.length);
    this.lenisManager.start();
    
    // Устанавливаем первый фон
    if (this.state.sortedData.length > 0) {
      requestAnimationFrame(() => {
        this.setBackgroundImage(0, true);
      });
    }
  }
  
  createSlideElement(data, index) {
    const template = document.getElementById('slide-template');
    if (!template) return this.createSlideFallback(data, index);
    
    const slide = template.content.cloneNode(true).querySelector('.slide');
    slide.dataset.projectId = data.id;
    slide.dataset.index = index;
    slide.dataset.baseZ = index * CONFIG.Z_GAP;
    
    // Заполняем данные
    const img = slide.querySelector('img');
    img.src = data.img;
    img.alt = data.title || '';
    img.loading = "lazy";
    
    slide.querySelector('.project-title').textContent = data.title || '';
    slide.querySelector('.project-year').textContent = data.year || '2023';
    slide.querySelector('.project-categories').textContent = data.categories?.join(", ") || '';
    
    // Ссылка на страницу проекта
    const link = slide.querySelector('.project-link');
    if (link && data.project_page) {
      link.href = data.project_page;
      slide.addEventListener('click', (e) => {
        if (!e.target.closest('a')) {
          window.open(data.project_page, '_blank');
        }
      });
    } else {
      slide.addEventListener('click', (e) => {
        if (!e.target.closest('a')) {
          window.open(data.img, '_blank');
        }
      });
    }
    
    // Оптимизация для мобилок
    if (CONFIG.IS_MOBILE) {
      slide.style.willChange = 'transform, opacity';
    }
    
    return slide;
  }
  
  createSlideFallback(data, index) {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.dataset.index = index;
    slide.dataset.projectId = data.id || `project-${index}`;
    
    slide.innerHTML = `
      <div class="slide-img">
        <img src="${data.img}" alt="${data.title}" loading="lazy">
      </div>
      <div class="slide-copy">
        <p class="card-title">
          <span>${data.title || ''}</span>
        </p>
        <p class="card-subtitle">
          <span>${data.year || '2023'}</span> • <span>${data.categories?.join(", ") || ''}</span>
        </p>
      </div>
    `;
    
    if (data.project_page) {
      slide.addEventListener('click', () => {
        window.open(data.project_page, '_blank');
      });
    } else {
      slide.addEventListener('click', () => {
        window.open(data.img, '_blank');
      });
    }
    
    return slide;
  }
  
  positionSlide(slide, index) {
    gsap.set(slide, {
      position: "absolute",
      top: "30%",
      left: (index % 2 === 0 ? 35 : 50) + "%",
      xPercent: 20,
      yPercent: -50,
      transformStyle: "preserve-3d",
      willChange: CONFIG.IS_MOBILE ? "transform, opacity" : "transform, opacity, filter"
    });
  }
  
  // ==========================
  // 5.4 ГАЛЕРЕЯ С ОПТИМИЗАЦИЯМИ
  // ==========================
  buildGallery() {
    if (this.state.view !== "gallery") return;
    if (!this.dom.elements.gallery) return;
    
    this.dom.elements.gallery.innerHTML = "";
    
    // Используем отсортированные данные
    this.state.sortedData = this.orderManager.getSortedProjects(this.state.filter);
    
    if (this.state.sortedData.length === 0) {
      const emptyMessage = this.createEmptyGalleryMessage();
      this.dom.elements.gallery.appendChild(emptyMessage);
      return;
    }
    
    const grid = document.createElement("div");
    grid.className = "gallery-grid";
    
    // Оптимизация для мобилок: меньше колонок
    if (CONFIG.IS_MOBILE) {
      grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(150px, 1fr))";
    }
    
    this.state.sortedData.forEach((data, i) => {
      const item = this.createGalleryItem(data, i);
      grid.appendChild(item);
    });
    
    this.dom.elements.gallery.appendChild(grid);
    this.initLazyLoading();
    
    this.lenisManager.init('gallery', this.state.sortedData.length);
    this.lenisManager.start();
  }
  
  createGalleryItem(data, index) {
    const template = document.getElementById('gallery-item-template');
    if (!template) return this.createGalleryItemFallback(data, index);
    
    const item = template.content.cloneNode(true).querySelector('.gallery-item');
    item.dataset.projectId = data.id;
    item.dataset.index = index;
    item.style.setProperty("--item-index", index);
    
    // Заполняем данные
    const img = item.querySelector('img');
    img.dataset.src = data.img;
    img.alt = data.title || '';
    
    item.querySelector('.project-title').textContent = data.title || '';
    item.querySelector('.project-year').textContent = data.year || '2023';
    item.querySelector('.project-categories').textContent = data.categories?.join(", ") || '';
    
    // Ссылка на страницу проекта
    const link = item.querySelector('.project-link');
    if (link && data.project_page) {
      link.href = data.project_page;
      item.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(data.project_page, '_blank');
      });
    } else {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(data.img, '_blank');
      });
    }
    
    // Оптимизация анимации для мобилок
    if (CONFIG.IS_MOBILE) {
      item.style.animationDelay = `${index * 0.01}s`;
      item.style.willChange = 'transform, opacity';
    }
    
    return item;
  }
  
  createGalleryItemFallback(data, index) {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.style.setProperty("--item-index", index);
    item.dataset.index = index;
    
    item.innerHTML = `
      <div class="gallery-thumb">
        <img data-src="${data.img}" alt="${data.title}" class="lazy-img">
      </div>
      <div class="gallery-caption">
        <div class="g-title">${data.title}</div>
        <div class="g-sub">
          <span>${data.year || '2023'}</span> • <span>${data.categories?.join(", ") || ''}</span>
        </div>
      </div>
    `;
    
    if (data.project_page) {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(data.project_page, '_blank');
      });
    } else {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(data.img, '_blank');
      });
    }
    
    return item;
  }
  
  initLazyLoading() {
    if (this.lazyObserver) {
      this.lazyObserver.disconnect();
    }
    
    const options = {
      rootMargin: CONFIG.IS_MOBILE ? '100px' : '50px',
      threshold: CONFIG.IS_MOBILE ? 0.05 : 0.1
    };
    
    this.lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target.querySelector('.lazy-img');
          if (img && img.dataset.src) {
            img.src = img.dataset.src;
            img.onload = () => {
              img.classList.add('loaded');
            };
            img.onerror = () => {
              img.src = './images/fallback.jpg';
              img.alt = 'Image not loaded';
              img.classList.add('loaded');
            };
            img.removeAttribute('data-src');
            img.classList.remove('lazy-img');
          }
          this.lazyObserver.unobserve(entry.target);
        }
      });
    }, options);
    
    document.querySelectorAll('.gallery-item').forEach(item => {
      this.lazyObserver.observe(item);
    });
  }
  
  // ==========================
  // 5.5 СТАТИЧНЫЕ БЭКГРАУНДЫ (замена blur)
  // ==========================
  setBackgroundImage(index, immediate = false) {
    if (this.state.view === "gallery") return;
    if (index < 0 || index >= this.state.sortedData.length) return;
    if (index === this.state.bg.currentIndex && !immediate) return;
    
    this.state.bg.currentIndex = index;
    const project = this.state.sortedData[index];
    
    // Используем статичное изображение если есть
    const bgUrl = project.bg_static || project.img;
    const opacity = CONFIG.IS_MOBILE ? CONFIG.MOBILE_BG_OPACITY : CONFIG.BG_OPACITY;
    
    const activeIdx = this.state.bg.active;
    const nextIdx = 1 - activeIdx;
    const activeEl = activeIdx === 0 ? this.dom.elements.staticBgA : this.dom.elements.staticBgB;
    const nextEl = nextIdx === 0 ? this.dom.elements.staticBgA : this.dom.elements.staticBgB;
    
    // Останавливаем предыдущие анимации
    gsap.killTweensOf([activeEl, nextEl]);
    
    if (immediate) {
      nextEl.style.backgroundImage = `url("${bgUrl}")`;
      nextEl.style.opacity = opacity.toString();
      activeEl.style.opacity = '0';
      this.state.bg.active = nextIdx;
      return;
    }
    
    // Плавная смена
    const img = new Image();
    
    const applyTransition = () => {
      nextEl.style.backgroundImage = `url("${bgUrl}")`;
      
      gsap.to(activeEl, {
        opacity: 0,
        duration: CONFIG.BG_FADE_DURATION * 0.7,
        ease: "power2.in",
        overwrite: true
      });
      
      gsap.to(nextEl, {
        opacity: opacity,
        duration: CONFIG.BG_FADE_DURATION,
        ease: "power2.out",
        delay: 0.05,
        overwrite: true,
        onComplete: () => {
          this.state.bg.active = nextIdx;
        }
      });
    };
    
    if (img.complete) {
      applyTransition();
    } else {
      img.onload = applyTransition;
      img.onerror = () => {
        console.warn(`Не удалось загрузить фон: ${bgUrl}`);
        applyTransition();
      };
      img.src = bgUrl;
    }
  }
  
  // ==========================
  // 5.6 ОБНОВЛЕНИЕ СЛАЙДОВ (ОПТИМИЗИРОВАНО)
  // ==========================
  updateSlides() {
    if (this.state.view !== "slides") return;
    if (this.state.slides.elements.length === 0) return;
    
    // Оптимизация для мобилок: пропускаем кадры
    if (CONFIG.IS_MOBILE && this.state.frameCount % CONFIG.FRAME_SKIP_MOBILE !== 0) {
      return;
    }
    
    const progress = this.snappedProgress(this.state.scroll.pos / this.state.scroll.max, 0.1);
    const totalDepth = (this.state.sortedData.length - 1) * CONFIG.Z_GAP;
    const cameraZ = -CONFIG.START_OFFSET + progress * (totalDepth + CONFIG.START_OFFSET);
    
    let bestIdx = -1;
    let bestDist = Infinity;
    
    const sensitivity = this.state.getCurrentMouseSensitivity();
    
    this.state.slides.elements.forEach((slide, idx) => {
      const baseZ = this.state.slides.state[idx].baseZ;
      const relativeZ = baseZ - cameraZ;
      const dist = Math.abs(relativeZ);
      
      if (dist < bestDist) { 
        bestDist = dist; 
        bestIdx = idx; 
      }
      
      if (relativeZ < -110 || relativeZ > 2000) { 
        slide.style.opacity = 0; 
        slide.style.pointerEvents = "none"; 
        return; 
      }
      
      // Упрощаем вычисления для мобилок
      const opacity = Math.max(0, Math.min(1, 1 - dist / 380));
      const scale = CONFIG.IS_MOBILE ? 
        Math.max(0.4, Math.min(1.0, 1.0 - (dist / 400) * 0.6)) :
        Math.max(0.4, Math.min(1.2, 1.2 - (dist / 400) * 0.8));
      
      this.state.slides.state[idx].opacity = opacity;
      this.state.slides.state[idx].scale = scale;
      
      // Упрощаем параллакс на мобилках
      if (CONFIG.IS_MOBILE) {
        this.state.slides.state[idx].parallaxX = this.state.mouse.nx * sensitivity.X * 0.5;
        this.state.slides.state[idx].parallaxY = this.state.mouse.ny * sensitivity.Y * 0.5;
      } else {
        this.state.slides.state[idx].parallaxX = this.state.mouse.nx * sensitivity.X;
        this.state.slides.state[idx].parallaxY = this.state.mouse.ny * sensitivity.Y;
      }
      
      slide.style.transform = `
        translate3d(${this.state.slides.state[idx].parallaxX}vw, ${this.state.slides.state[idx].parallaxY}vh, ${-relativeZ}px)
        rotateY(${this.state.mouse.nx * sensitivity.ROTATION}deg)
        rotateX(${this.state.mouse.ny * -3}deg)
        scale(${this.state.slides.state[idx].scale})
      `;
      slide.style.opacity = this.state.slides.state[idx].opacity;
      slide.style.pointerEvents = 'auto';
    });
    
    if (bestIdx !== -1 && bestDist < 220 && bestIdx !== this.state.bg.currentIndex) {
      this.setBackgroundImage(bestIdx);
    }
  }
  
  // ==========================
  // 5.7 СЕТКА (УПРОЩЕННАЯ ДЛЯ МОБИЛОК)
  // ==========================
  drawGrid() {
    if (!this.dom.elements.context || !this.dom.elements.canvas) return;
    if (CONFIG.IS_MOBILE && CONFIG.DISABLE_GRID_ON_MOBILE) return;
    
    const ctx = this.dom.elements.context;
    const canvas = this.dom.elements.canvas;
    
    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Упрощаем движение мыши для сетки
    this.state.mouse.targetX += (this.state.mouse.nx * 100 - this.state.mouse.targetX) * 0.2;
    this.state.mouse.targetY += (this.state.mouse.ny * 100 - this.state.mouse.targetY) * 0.2;
    
    const mx = this.state.mouse.targetX;
    const my = this.state.mouse.targetY;
    const lineOpacity = CONFIG.IS_MOBILE ? CONFIG.GRID.MOBILE_OPACITY : CONFIG.GRID.LINE_OPACITY;
    
    // Рисуем только каждую вторую линию на мобилках
    const linesToDraw = CONFIG.IS_MOBILE ? 
      this.state.gridLines.filter((_, i) => i % 2 === 0) : 
      this.state.gridLines;
    
    linesToDraw.forEach(z => {
      let zOffset = (z - this.state.scroll.z % CONFIG.DEPTH + CONFIG.DEPTH) % CONFIG.DEPTH + 50;
      const fade = 1 - zOffset / CONFIG.GRID.FADE_RANGE;
      const opacity = lineOpacity * fade;
      
      if (opacity < 0.01) return;
      
      // Верхняя линия
      const p1t = this.project3D(-1500, -800, zOffset, mx, my);
      const p2t = this.project3D(1500, -800, zOffset, mx, my);
      
      ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
      ctx.lineWidth = CONFIG.IS_MOBILE ? 0.5 : 1;
      
      ctx.beginPath();
      ctx.moveTo(p1t.x, p1t.y);
      ctx.lineTo(p2t.x, p2t.y);
      ctx.stroke();
      
      // Нижняя линия
      const p1b = this.project3D(-1500, 800, zOffset, mx, my);
      const p2b = this.project3D(1500, 800, zOffset, mx, my);
      
      ctx.beginPath();
      ctx.moveTo(p1b.x, p1b.y);
      ctx.lineTo(p2b.x, p2b.y);
      ctx.stroke();
    });
    
    // Вертикальные линии - меньше на мобилках
    const verticalCount = CONFIG.IS_MOBILE ? 3 : CONFIG.GRID.VERTICAL_COUNT;
    for (let i = -verticalCount; i <= verticalCount; i++) {
      const x = i * CONFIG.GRID.VERTICAL_SIZE;
      this.drawVerticalLine(ctx, x, mx, my, lineOpacity);
    }
  }
  
  project3D(x, y, z, mx, my) {
    const fov = 950;
    const scale = fov / (fov + z);
    return { 
      x: x * scale + this.dom.elements.canvas.width / (2 * window.devicePixelRatio) + mx, 
      y: y * scale + this.dom.elements.canvas.height / (2 * window.devicePixelRatio) + my, 
      scale 
    };
  }
  
  drawVerticalLine(ctx, x, mx, my, baseOpacity) {
    const zNear = 50;
    const zFar = CONFIG.DEPTH;
    
    // Верхняя часть
    const pNearTop = this.project3D(x, -800, zNear, mx, my);
    const pFarTop = this.project3D(x, -800, zFar, mx, my);
    
    const gradientTop = ctx.createLinearGradient(0, pNearTop.y, 0, pFarTop.y);
    gradientTop.addColorStop(0, `rgba(255,255,255,${baseOpacity * 0.8})`);
    gradientTop.addColorStop(0.6, `rgba(255,255,255,${baseOpacity * 0.3})`);
    gradientTop.addColorStop(1, `rgba(255,255,255,0)`);
    
    ctx.strokeStyle = gradientTop;
    ctx.beginPath();
    ctx.moveTo(pNearTop.x, pNearTop.y);
    ctx.lineTo(pFarTop.x, pFarTop.y);
    ctx.stroke();
    
    // Нижняя часть
    const pNearBot = this.project3D(x, 800, zNear, mx, my);
    const pFarBot = this.project3D(x, 800, zFar, mx, my);
    
    const gradientBot = ctx.createLinearGradient(0, pNearBot.y, 0, pFarBot.y);
    gradientBot.addColorStop(0, `rgba(255,255,255,${baseOpacity * 0.8})`);
    gradientBot.addColorStop(0.4, `rgba(255,255,255,${baseOpacity * 0.3})`);
    gradientBot.addColorStop(1, `rgba(255,255,255,0)`);
    
    ctx.strokeStyle = gradientBot;
    ctx.beginPath();
    ctx.moveTo(pNearBot.x, pNearBot.y);
    ctx.lineTo(pFarBot.x, pFarBot.y);
    ctx.stroke();
  }
  
  // ==========================
  // 5.8 УПРАВЛЕНИЕ ВИДАМИ И ФИЛЬТРАМИ
  // ==========================
  setFilter(filter) {
    if (this.state.filter === filter) return;
    
    // Сбрасываем скролл
    if (this.lenisManager.lenis) {
      this.lenisManager.lenis.scrollTo(0, { immediate: true });
    }
    
    this.state.filter = filter;
    this.state.sortedData = this.orderManager.getSortedProjects(filter);
    
    // Обновляем активные ссылки
    this.dom.elements.navLinks.forEach(link => {
      link.classList.toggle('active-filter', link.dataset.filter === filter);
    });
    
    // Перестраиваем текущий вид
    this.rebuildCurrentView();
    this.updateURL();
  }
  
  setView(view) {
    if (this.state.view === view) return;
    
    // Сбрасываем скролл
    if (this.lenisManager.lenis) {
      this.lenisManager.lenis.scrollTo(0, { immediate: true });
    }
    
    // Останавливаем предыдущий вид
    if (this.state.view === "slides") {
      this.state.slides.elements = [];
      this.state.slides.state = [];
    } else if (this.state.view === "gallery" && this.lazyObserver) {
      this.lazyObserver.disconnect();
      this.lazyObserver = null;
    }
    
    this.state.view = view;
    
    // Обновляем UI
    this.dom.elements.viewBtns.forEach(btn => {
      btn.classList.toggle('active-view', btn.dataset.view === view);
    });
    
    if (this.dom.elements.viewSwitcher) {
      this.dom.elements.viewSwitcher.setAttribute('data-active-view', view);
    }
    
    // Управляем классами body
    if (view === "gallery") {
      this.dom.elements.body.classList.add('gallery-active');
      if (this.dom.elements.canvas) {
        this.dom.elements.canvas.style.display = 'none';
      }
    } else {
      this.dom.elements.body.classList.remove('gallery-active');
      if (this.dom.elements.canvas) {
        this.dom.elements.canvas.style.display = 'block';
        this.resizeCanvas();
      }
    }
    
    // Перестраиваем вид
    this.rebuildCurrentView();
    this.updateURL();
  }
  
  rebuildCurrentView() {
    if (this.state.view === "slides") {
      if (this.dom.elements.gallery) {
        this.dom.elements.gallery.innerHTML = '';
      }
      this.buildSlides();
    } else {
      this.buildGallery();
    }
  }
  
  // ==========================
  // 5.9 ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ==========================
  snappedProgress(progressRaw, stickiness = 0.7) {
    const total = this.state.sortedData.length - 1;
    if (total <= 0) return 0;
    
    const idxFloat = progressRaw * total;
    const idxNearest = Math.round(idxFloat);
    const dist = idxFloat - idxNearest;
    const absDist = Math.abs(dist);
    
    let snappedIdxFloat;
    if (absDist < stickiness / 2) {
      const localT = absDist / (stickiness / 2);
      const pull = 1 - (localT * localT * (3 - 2 * localT));
      snappedIdxFloat = idxNearest + dist * (1 - pull);
    } else {
      snappedIdxFloat = idxFloat;
    }
    
    return Math.min(1, Math.max(0, snappedIdxFloat / total));
  }
  
  updateURL() {
    let hash = '';
    
    if (this.state.filter !== 'allworks') {
      hash += this.state.filter;
    }
    
    if (this.state.view === 'gallery') {
      hash += '-gallery';
    } else if (this.state.filter !== 'allworks' || this.state.view !== 'slides') {
      hash += '-slides';
    }
    
    if (this.state.filter === 'allworks' && this.state.view === 'slides') {
      hash = '';
    }
    
    try {
      history.replaceState(null, '', window.location.pathname + (hash ? `#${hash}` : ''));
    } catch (e) {
      console.warn('Could not update URL:', e);
    }
  }
  
  createEmptySlide() {
    const slide = document.createElement("div");
    slide.className = "slide-empty";
    slide.innerHTML = `<p>No works found in this category</p>`;
    return slide;
  }
  
  createEmptyGalleryMessage() {
    const message = document.createElement("div");
    message.className = "gallery-empty";
    message.innerHTML = `
      <h3>No works found</h3>
      <p>Try selecting a different category or switch to "all works"</p>
    `;
    return message;
  }
  
  // ==========================
  // 5.10 ИНИЦИАЛИЗАЦИЯ
  // ==========================
  async init() {
    this.initMouse();
    this.initResize();
    
    this.state.isLoading = true;
    
    try {
      // 1. Предзагружаем основные изображения
      const allImages = this.dataManager.allData.map(item => item.img);
      await this.dataManager.preloadImages(allImages, (progress) => {
        this.dom.updateLoaderProgress(progress * 100);
      });
      
      // 2. Предзагружаем статичные бэкграунды
      if (CONFIG.USE_STATIC_BG) {
        await this.dataManager.preloadStaticBackgrounds();
      }
      
      // 3. Парсим URL
      this.parseInitialState();
      
      // 4. Применяем начальное состояние UI
      this.applyInitialUIState();
      
      // 5. Применяем мобильные оптимизации
      if (CONFIG.IS_MOBILE) {
        this.applyMobileOptimizations();
      }
      
      // 6. Скрываем лоадер
      this.state.isLoading = false;
      setTimeout(() => {
        this.dom.hideLoader();
      }, 300);
      
      // 7. Биндим события
      this.initEventListeners();
      
      // 8. Строим текущий вид
      this.rebuildCurrentView();
      
      // 9. Форсируем первый фон для слайдов
      if (this.state.view === 'slides' && this.state.sortedData.length > 0) {
        requestAnimationFrame(() => {
          this.setBackgroundImage(0, true);
        });
      }
      
    } catch (error) {
      console.error('Initialization error:', error);
      this.state.isLoading = false;
      this.dom.hideLoader();
    }
  }
  
  parseInitialState() {
    const hash = window.location.hash.replace('#', '');
    
    let filter = 'allworks';
    let view = 'slides';
    
    if (!hash) {
      this.state.filter = filter;
      this.state.view = view;
      this.state.sortedData = this.orderManager.getSortedProjects(filter);
      return;
    }
    
    const parts = hash.split('-');
    
    if (parts.includes('gallery')) {
      view = 'gallery';
    }
    
    if (parts.includes('slides')) {
      view = 'slides';
    }
    
    const possibleFilter = parts[0];
    if (possibleFilter && possibleFilter !== 'gallery' && possibleFilter !== 'slides') {
      filter = possibleFilter;
    }
    
    this.state.filter = filter;
    this.state.view = view;
    this.state.sortedData = this.orderManager.getSortedProjects(filter);
  }
  
  applyInitialUIState() {
    // NAV FILTERS
    this.dom.elements.navLinks.forEach(link => {
      link.classList.toggle(
        'active-filter',
        link.dataset.filter === this.state.filter
      );
    });
    
    // VIEW SWITCHER
    this.dom.elements.viewBtns.forEach(btn => {
      btn.classList.toggle(
        'active-view',
        btn.dataset.view === this.state.view
      );
    });
    
    if (this.dom.elements.viewSwitcher) {
      this.dom.elements.viewSwitcher.setAttribute(
        'data-active-view',
        this.state.view
      );
    }
    
    // BODY + CANVAS
    if (this.state.view === 'gallery') {
      this.dom.elements.body.classList.add('gallery-active');
      if (this.dom.elements.canvas) {
        this.dom.elements.canvas.style.display = 'none';
      }
    } else {
      this.dom.elements.body.classList.remove('gallery-active');
      if (this.dom.elements.canvas) {
        this.dom.elements.canvas.style.display = 'block';
        this.resizeCanvas();
      }
    }
  }
  
  initEventListeners() {
    // Навигация
    this.dom.elements.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.setFilter(link.dataset.filter);
      });
    });
    
    // Переключатель видов
    this.dom.elements.viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.setView(btn.dataset.view);
      });
    });
  }
  
  // ==========================
  // 5.11 ГЛАВНЫЙ ЦИКЛ (ОПТИМИЗИРОВАННЫЙ)
  // ==========================
  mainLoop(time) {
    if (this.state.isLoading) {
      this.rafId = requestAnimationFrame((t) => this.mainLoop(t));
      return;
    }
    
    // Оптимизация FPS для мобилок
    const delta = time - this.lastFrameTime;
    const targetInterval = CONFIG.IS_MOBILE ? 
      1000 / CONFIG.MOBILE_MAX_FPS : 
      1000 / CONFIG.MAX_FPS;
    
    if (delta < targetInterval) {
      this.rafId = requestAnimationFrame((t) => this.mainLoop(t));
      return;
    }
    
    this.lastFrameTime = time;
    this.state.frameCount++;
    
    // Обновляем Lenis
    if (this.lenisManager.lenis) {
      this.lenisManager.lenis.raf(time);
    }
    
    // Обновляем визуализацию
    if (this.state.view === "slides") {
      this.updateSlides();
      
      // Рисуем сетку реже на мобилках
      if (!CONFIG.IS_MOBILE || this.state.frameCount % 2 === 0) {
        this.drawGrid();
      }
    }
    
    this.rafId = requestAnimationFrame((t) => this.mainLoop(t));
  }
  
  start() {
    this.rafId = requestAnimationFrame((t) => this.mainLoop(t));
  }
  
  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.lazyObserver) {
      this.lazyObserver.disconnect();
    }
    this.lenisManager.destroy();
  }
}

// ==========================
// 6. ДОПОЛНИТЕЛЬНЫЕ КЛАССЫ
// ==========================
class StaticBackgroundManager {
  constructor(dom) {
    this.dom = dom;
  }
  
  init() {
    // Уже инициализировано в DOMCache
    return this;
  }
}

class ProjectOrderManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.customOrder = this.loadCustomOrder();
  }
  
  loadCustomOrder() {
    try {
      const saved = localStorage.getItem('project-order');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
  
  saveCustomOrder() {
    try {
      localStorage.setItem('project-order', JSON.stringify(this.customOrder));
    } catch (e) {
      console.warn('Could not save project order:', e);
    }
  }
  
  getSortedProjects(filter) {
    let projects = this.dataManager.filterData(filter);
    
    // Если есть кастомный порядок, используем его
    if (this.customOrder.length > 0) {
      projects = this.sortByCustomOrder(projects);
    } else {
      // Используем порядок из CONFIG
      projects = this.sortByConfigOrder(projects);
    }
    
    return projects;
  }
  
  sortByCustomOrder(projects) {
    const orderMap = new Map();
    this.customOrder.forEach((id, index) => {
      orderMap.set(id, index);
    });
    
    return [...projects].sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? 9999;
      const orderB = orderMap.get(b.id) ?? 9999;
      return orderA - orderB;
    });
  }
  
  sortByConfigOrder(projects) {
    return [...projects].sort((a, b) => {
      const orderA = CONFIG.PROJECTS_ORDER.indexOf(a.id) + 1 || 9999;
      const orderB = CONFIG.PROJECTS_ORDER.indexOf(b.id) + 1 || 9999;
      return orderA - orderB;
    });
  }
  
  updateProjectOrder(projectId, newPosition) {
    const currentIndex = this.customOrder.indexOf(projectId);
    
    if (currentIndex !== -1) {
      this.customOrder.splice(currentIndex, 1);
    }
    
    this.customOrder.splice(newPosition, 0, projectId);
    this.saveCustomOrder();
    
    return this.customOrder;
  }
  
  setCustomOrder(orderArray) {
    this.customOrder = [...orderArray];
    this.saveCustomOrder();
    return this.customOrder;
  }
  
  resetToDefault() {
    this.customOrder = [];
    localStorage.removeItem('project-order');
    return [];
  }
}

// ==========================
// 7. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ==========================
let appState, domCache, dataManager, viewManager;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Обновляем конфиг при загрузке
    CONFIG.IS_MOBILE = window.innerWidth <= 768;
    CONFIG.DISABLE_COMPLEX_EFFECTS = CONFIG.IS_MOBILE;
    
    // Создаем экземпляры
    appState = new AppState();
    domCache = new DOMCache().init();
    dataManager = new DataManager();
    viewManager = new ViewManager(appState, domCache, dataManager);
    
    // Инициализируем
    await viewManager.init();
    
    // Запускаем главный цикл
    viewManager.start();
    
    console.log('Portfolio initialized successfully');
    console.log('Mobile mode:', CONFIG.IS_MOBILE);
    console.log('Projects count:', dataManager.allData.length);
    
  } catch (error) {
    console.error('Failed to initialize portfolio:', error);
    if (domCache && domCache.hideLoader) {
      domCache.hideLoader();
    }
    
    // Fallback: показываем простую галерею
    showFallbackGallery();
  }
});

// Fallback функция на случай ошибки
function showFallbackGallery() {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;
  
  gallery.innerHTML = `
    <div style="padding: 40px; text-align: center; color: #888;">
      <h3>Something went wrong</h3>
      <p>Please refresh the page or check console for errors</p>
      <button onclick="window.location.reload()" style="
        margin-top: 20px;
        padding: 10px 20px;
        background: #333;
        color: white;
        border: none;
        cursor: pointer;
      ">Refresh Page</button>
    </div>
  `;
  gallery.style.display = 'block';
}

// ==========================
// 8. ГЛОБАЛЬНЫЕ МЕТОДЫ
// ==========================
window.App = {
  getState: () => appState,
  getViewManager: () => viewManager,
  getDataManager: () => dataManager,
  getOrderManager: () => viewManager?.orderManager,
  
  switchToGallery: () => viewManager?.setView('gallery'),
  switchToTunnel: () => viewManager?.setView('slides'),
  setFilter: (filter) => viewManager?.setFilter(filter),
  
  // Методы для управления порядком проектов (админ)
  setProjectOrder: (orderArray) => {
    if (viewManager?.orderManager) {
      const newOrder = viewManager.orderManager.setCustomOrder(orderArray);
      console.log('Project order updated:', newOrder);
      window.location.reload();
      return newOrder;
    }
    return null;
  },
  
  resetProjectOrder: () => {
    if (viewManager?.orderManager) {
      viewManager.orderManager.resetToDefault();
      console.log('Project order reset to default');
      window.location.reload();
    }
  },
  
  getCurrentOrder: () => {
    if (viewManager?.orderManager) {
      return viewManager.orderManager.customOrder;
    }
    return [];
  },
  
  // Генерация страниц проектов (для админ-панели)
  generateProjectPages: () => {
    console.log('Project pages generation would start here');
    console.log('Total projects:', dataManager?.allData.length);
    // Здесь можно добавить логику генерации HTML файлов
  }
};

// ==========================
// 9. ОБРАБОТЧИКИ ОШИБОК И ПРОИЗВОДИТЕЛЬНОСТИ
// ==========================
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// Мониторинг производительности
if (typeof PerformanceObserver !== 'undefined') {
  const perfObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 100) {
        console.warn('Long task detected:', entry);
      }
    }
  });
  
  perfObserver.observe({ entryTypes: ['longtask'] });
}

// Оптимизация для слабых устройств
if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
  console.log('Low-end device detected, applying additional optimizations');
  CONFIG.DISABLE_COMPLEX_EFFECTS = true;
  CONFIG.FRAME_SKIP_MOBILE = 3;
  CONFIG.DISABLE_GRID_ON_MOBILE = true;
}

// Оптимизация для режима энергосбережения
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  console.log('Reduced motion preference detected');
  CONFIG.DISABLE_COMPLEX_EFFECTS = true;
  CONFIG.BG_FADE_DURATION = 0.5;
}
// ==========================
// 0. Configuration
// ==========================
const CONFIG = {
  Z_GAP: 200,
  START_OFFSET: 0,
  DEPTH: 4000,
  BG_FADE_DURATION: 1,
  BG_OPACITY: 0.4,
  MOUSE_SENSITIVITY: { X: 5, Y: 3, ROTATION: 5 },
  GRID: {
    HORIZONTAL_SIZE: 200,
    VERTICAL_SIZE: 300,
    VERTICAL_COUNT: 4,
    LINE_OPACITY: 0.15,
    FADE_RANGE: 4000
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
  PERFORMANCE: {
    GRID_UPDATE_INTERVAL: 2,
    SLIDE_UPDATE_INTERVAL: 1,
    LAZY_LOAD_OFFSET: 300,
    MAX_CANVAS_SIZE: 1920,
    LOW_FPS_MODE: 30,
    CACHE_SIZE: 50
  }
};

// ==========================
// 1. Global Application State
// ==========================
class AppState {
  constructor() {
    this.mouse = { nx: 0, ny: 0, targetX: 0, targetY: 0, angle: 0 };
    this.scroll = { pos: 0, z: 0, max: 1 };
    this.view = 'slides';
    this.filter = 'allworks';
    this.bg = { active: 0, currentIndex: -1 };
    this.isLoading = true;
    this.fps = 60;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.isInitialized = false;
    
    this.filteredData = [];
    this.slides = { elements: [], state: [] };
    this.gridLines = this.generateGridLines();
    
    this.isMobile = window.innerWidth <= 768;
  }
  
  generateGridLines() {
    const lines = [];
    for (let z = 0; z < CONFIG.DEPTH; z += CONFIG.GRID.HORIZONTAL_SIZE) {
      lines.push(z);
    }
    return lines;
  }

  updateFPS() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.fps = Math.round(1000 / delta);
    this.lastFrameTime = now;
    this.frameCount++;
  }

  shouldUpdateGrid() {
    if (this.fps < CONFIG.PERFORMANCE.LOW_FPS_MODE) {
      return this.frameCount % 3 === 0;
    }
    return this.frameCount % CONFIG.PERFORMANCE.GRID_UPDATE_INTERVAL === 0;
  }
}

// ==========================
// 2. DOM Cache
// ==========================
class DOMCache {
  constructor() {
    this.elements = {};
    this.observers = [];
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
    this.elements.glitchCursor = document.getElementById('glitch-cursor');

    this.initBackgroundLayers();
    this.initLoader();
    this.initPageTransition(); 
    return this;
  }
  
  initBackgroundLayers() {
    const bgWrap = document.createElement('div');
    bgWrap.className = 'bg-blur-wrap';
    
    this.elements.bgA = document.createElement('div');
    this.elements.bgB = document.createElement('div');
    this.elements.bgA.className = 'bg-blur-layer bg-blur-a';
    this.elements.bgB.className = 'bg-blur-layer bg-blur-b';
    
    bgWrap.appendChild(this.elements.bgA);
    bgWrap.appendChild(this.elements.bgB);
    document.body.insertBefore(bgWrap, document.body.firstChild);
    
    this.elements.bgA.style.opacity = '0';
    this.elements.bgB.style.opacity = '0';
    this.elements.bgA.style.backgroundColor = '#0b0b0b';
    this.elements.bgB.style.backgroundColor = '#0b0b0b';
    this.elements.bgA.style.background = 'radial-gradient(circle at center, #0b0b0b 0%, #1a1a1a 100%)';
    this.elements.bgB.style.background = 'radial-gradient(circle at center, #0b0b0b 0%, #1a1a1a 100%)';
  }
  
  initLoader() {
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader-spinner"></div>
        <div class="loader-progress">0%</div>
      </div>
    `;
    
    this.elements.loader = loader;
    document.body.appendChild(loader);
  }

  initPageTransition() {
    const transition = document.createElement('div');
    transition.className = 'page-transition is-entering';
    this.elements.pageTransition = transition;
    document.body.appendChild(transition);
  }

  showBackgroundBlur() {
    if (!this.elements.bgA || !this.elements.bgB) return;

    gsap.to([this.elements.bgA, this.elements.bgB], {
      opacity: CONFIG.BG_OPACITY,
      duration: 0.6,
      ease: "power2.out"
    });
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

        const transition = this.elements.pageTransition;
        if (transition) {
          transition.addEventListener('transitionend', () => {
            this.showBackgroundBlur();
          }, { once: true });
        } else {
          this.showBackgroundBlur();
        }
      }, 300);
    }
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// ==========================
// 3. Data Manager with LRU Cache
// ==========================
class LRUCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }
}

class DataManager {
  constructor() {
    this.allData = [
      {
        id: "project-1",
        title: "SCHMALGAUZEN",
        year: "2025",
        img: "/images/SC/SCHM-cover.jpg",
        categories: ["Graphic"],
        projectUrl: "/projects/SCHMALGAUZEN.html",
        gradientColors: ["#ff2200ff", "#232347"]
      },
      {
        id: "project-3",
        title: "K19",
        year: "2025",
        img: "./images/k19/k19-sign-transparent.png",
        categories: ["Branding"],
        projectUrl: "./projects/k19.html",
        gradientColors: ["#1a1a2e", "#ffa600ff"]
      },
      {
        id: "project-4",
        title: "oO_series",
        year: "2024",
        img: "./images/OO/OO-logo-animation.webp",
        categories: ["Interfaces", "Branding", "Graphic"],
        projectUrl: "/projects/o0series.html",
        gradientColors: ["#777777ff", "#33af61ff"]
      },
      {
        id: "project-21",
        title: "easymeets",
        year: "2023",
        img: "./images/SD/SD-03.png",
        categories: ["Interfaces"],
        projectUrl: "/projects/easymeets.html",
        gradientColors: ["rgb(193, 246, 70)", "#e08448"]
      },
      {
        id: "project-9",
        title: "Located",
        year: "2023",
        img: "./images/LC/LC-logo-anim.gif",
        categories: ["Graphic"],
        projectUrl: "./projects/LOCATED.html",
        gradientColors: ["#f51212ff", "#000000ff"]
      },
      {
        id: "project-18",
        title: "TRADEMOTIONS",
        year: "2022",
        img: "./images/TM/trademotions.webp",
        categories: ["Interfaces", "Branding"],
        projectUrl: "/projects/trademotions.html",
        gradientColors: ["#c72626ff", "#f55f08ff"]
      },
      {
        id: "project-5",
        title: "X4 CLUB",
        year: "2024",
        img: "./images/x4/x4-present.webp",
        categories: ["Branding"],
        projectUrl: "./projects/x4.html",
        gradientColors: ["#1a1a2e", "#2d2d4d"]
      },
      {
        id: "project-20",
        title: "INPUT SOFT",
        year: "2023",
        img: "./images/IS/IS-main.jpg",
        categories: ["Interfaces"],
        projectUrl: "/projects/input-soft.html",
        gradientColors: ["#ffe066ff", "#4a2c5e"]
      },
      {
        id: "project-2",
        title: "Mitus",
        year: "2024",
        img: "./images/MI/MI-logo.png",
        categories: ["Interfaces", "Branding"],
        projectUrl: "./projects/mitus.html",
        gradientColors: ["rgb(186, 188, 188)", "#9595f2"]
      },
      {
        id: "project-6",
        title: "Lettering",
        year: "2024",
        img: "./images/LT/LT-kyiv.gif",
        categories: ["Graphic"],
        projectUrl: "./projects/Lettering.html",
        gradientColors: ["rgb(220, 42, 6)", "#232347"]
      },
      {
        id: "project-8",
        title: "iii3",
        year: "2024",
        img: "./images/iii3/iii3-cover.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/iii3.html",
        gradientColors: ["rgb(39, 111, 255)", "#0f0fed"]
      },
      {
        id: "project-15",
        title: "Tripple We",
        year: "2023",
        img: "./images/TW/TW-sign.png",
        categories: ["Branding"],
        projectUrl: "./projects/tripple-we.html",
        gradientColors: ["rgb(37, 128, 255)", "rgb(45, 53, 69)"]
      },
      {
        id: "project-16",
        title: "X-plane",
        year: "2023",
        img: "./images/XP/XP-cover.jpg",
        categories: ["Interfaces", "Branding"],
        projectUrl: "./projects/x-plane.html",
        gradientColors: ["rgb(255, 111, 28)", "#9595f2"]
      },
      {
        id: "project-10",
        title: "Binary Cases",
        year: "2022",
        img: "./images/BN/BN-case-01.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/Binary.html",
        gradientColors: ["#010101", "#ffa21f"]
      },
      {
        id: "project-14",
        title: "Dr. Gavrylin",
        year: "2023",
        img: "./images/DG/DG-cover.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/Dr-Gavrylin.html",
        gradientColors: ["#e9d1a6ff", "#524c40ff"]
      },
      {
        id: "project-12",
        title: "The I-Ching",
        year: "2023",
        img: "./images/Vibe-Coding-5.webp",
        categories: ["Interfaces"],
        projectUrl: "./projects/The-I-Ching.html",
        gradientColors: ["#badc5bff", "#232347"]
      },
      {
        id: "project-13",
        title: "Snedeker Yoga",
        year: "2023",
        img: "./images/Vibe-Coding-2.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/Snedeker-Yoga.html",
        gradientColors: ["#e9d1a6ff", "#524c40ff"]
      },
      {
        id: "project-7",
        title: "Art",
        year: "2024",
        img: "./images/art/Art-02.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/Art.html",
        gradientColors: ["rgb(39, 111, 255)", "#0f0fed"]
      },
      {
        id: "project-11",
        title: "RACONTEUR",
        year: "2022",
        img: "./images/Vibe-Coding-4.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/Raconteur.html",
        gradientColors: ["#0f0f23", "#232347"]
      },
      {
        id: "project-17",
        title: "Fundraising",
        year: "2022",
        img: "./images/FD/FD-zbir.gif",
        categories: ["Graphic"],
        projectUrl: "./projects/Fundraising.html",
        gradientColors: ["rgb(0, 174, 255)", "#0f0fed"]
      },
      {
        id: "project-19",
        title: "My Startup",
        year: "2023",
        img: "./images/other/gogo-bot.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/gogo-bot.html",
        gradientColors: ["#010101", "#ff890a"]
      },
      {
        id: "project-23",
        title: "Dobro",
        year: "2018",
        img: "./images/DO/DO-logo.png",
        categories: ["Branding"],
        projectUrl: "./projects/dobro.html",
        gradientColors: ["rgb(0, 174, 255)", "#0f0fed"]
      },
      {
        id: "project-22",
        title: "Khmeli Suneli",
        year: "2016",
        img: "./images/HS/HS-logo.jpg",
        categories: ["Branding"],
        projectUrl: "./projects/khmeli-suneli.html",
        gradientColors: ["#ffe066ff", "#4a2c5e"]
      },
      {
        id: "project-24",
        title: "SAYENKO&KHARENKO",
        year: "2017",
        img: "./images/SK/SK-mock.jpg",
        categories: ["Branding"],
        projectUrl: "./projects/SAYENKO&KHARENKO.html",
        gradientColors: ["#919191ff", "#232347"]
      },
      {
        id: "project-26",
        title: "E-commerce App",
        year: "2017",
        img: "./images/other/E-commerce-App.jpg",
        categories: ["Interfaces"],
        projectUrl: "/projects/e-commerce-app.html",
        gradientColors: ["rgb(219, 15, 165)", "#111112"]
      },
      {
        id: "project-28",
        title: "Jernov Jewellery",
        year: "2016",
        img: "./images/JE/JE-broushure-cover.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/jernov.html",
        gradientColors: ["#010101", "rgb(240, 235, 235)"]
      },
      {
        id: "project-27",
        title: "Vognyar",
        year: "2016",
        img: "./images/VG/vognyar-souses-07.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/Vognyar.html",
        gradientColors: ["#010101", "#ff0a0a"]
      },
      {
        id: "project-29",
        title: "50 inventions",
        year: "2015",
        img: "./images/50/50-cover.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/50inventions.html",
        gradientColors: ["#d53939", "#6fcd26"]
      },
      {
        id: "project-25",
        title: "Accemedin",
        year: "2017",
        img: "./images/other/accemedin.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/accemedin.html",
        gradientColors: ["rgb(220, 42, 6)", "#232347"]
      },
      {
        id: "project-30",
        title: "Symerio",
        year: "2014",
        img: "./images/SM/SM-logo-visitcard.jpg",
        categories: ["Branding"],
        projectUrl: "./projects/symerio.html",
        gradientColors: ["rgb(231, 146, 28)", "#232347"]
      }
    ];
    
    this.imageCache = new LRUCache(CONFIG.PERFORMANCE.CACHE_SIZE);
    this.loadingPromises = new Map();
  }
  
  filterData(filter) {
    if (filter === "allworks") {
      return [...this.allData];
    }
    return this.allData.filter(item => item.categories.includes(filter));
  }
  
  async preloadImagesWithCache(images, onProgress) {
    const total = images.length;
    let loaded = 0;
    
    if (total === 0) return;
    
    if (onProgress) onProgress(0);
    
    const loadPromises = images.map(src => 
      this.loadImage(src).then(() => {
        loaded++;
        if (onProgress) onProgress(loaded / total);
      }).catch(() => {
        loaded++;
        if (onProgress) onProgress(loaded / total);
      })
    );
    
    await Promise.all(loadPromises);
    
    if (onProgress) onProgress(1);
  }
  
  async loadImage(src) {
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }
    
    if (this.imageCache.has(src)) {
      return Promise.resolve();
    }
    
    const loadPromise = new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        this.imageCache.set(src, img);
        this.loadingPromises.delete(src);
        resolve();
      };
      
      img.onerror = () => {
        console.warn(`Failed to load image: ${src}`);
        this.loadingPromises.delete(src);
        resolve();
      };
      
      img.src = src;
    });
    
    this.loadingPromises.set(src, loadPromise);
    return loadPromise;
  }
  
  getCachedImage(src) {
    const cached = this.imageCache.get(src);
    if (cached) {
      const newImg = new Image();
      newImg.src = cached.src;
      return newImg;
    }
    
    const img = new Image();
    img.src = src;
    return img;
  }

  getImageElement(src) {
    const cached = this.imageCache.get(src);
    if (cached) {
      const clone = cached.cloneNode(false);
      clone.src = cached.src;
      return clone;
    }
    return null;
  }
}

// ==========================
// 4. Lenis Manager
// ==========================
class LenisManager {
  constructor() {
    this.lenis = null;
    this.currentView = null;
  }
  
  init(viewType, itemCount) {
    this.destroy();
    
    const config = {
      lerp: CONFIG.LENIS.LERP,
      smoothWheel: CONFIG.LENIS.SMOOTH_WHEEL,
      touchMultiplier: CONFIG.LENIS.TOUCH_MULTIPLIER
    };
    
    if (viewType === 'slides') {
      let wheelMultiplier;
      if (itemCount <= 5) {
        wheelMultiplier = CONFIG.LENIS.WHEEL_MULTIPLIER.MAX;
      } else if (itemCount >= 20) {
        wheelMultiplier = CONFIG.LENIS.WHEEL_MULTIPLIER.MIN;
      } else {
        const ratio = itemCount / 20; 
        wheelMultiplier = CONFIG.LENIS.WHEEL_MULTIPLIER.MIN + 
                         (CONFIG.LENIS.WHEEL_MULTIPLIER.MAX - CONFIG.LENIS.WHEEL_MULTIPLIER.MIN) * (1 - ratio);
      }
      config.wheelMultiplier = wheelMultiplier;
    } else {
      config.wheelMultiplier = CONFIG.LENIS.WHEEL_MULTIPLIER.BASE;
    }
    
    this.lenis = new Lenis(config);
    this.currentView = viewType;
    
    if (viewType === 'slides') {
      this.lenis.on("scroll", (e) => {
        if (window.appState) {
          window.appState.scroll.pos = e.scroll;
          window.appState.scroll.max = e.limit;
          window.appState.scroll.z = (e.scroll / e.limit) * 4000 * 2;
        }
      });
    }
    
    return this.lenis;
  }
  
  start() {
    if (this.lenis) this.lenis.start();
  }
  
  stop() {
    if (this.lenis) this.lenis.stop();
  }
  
  destroy() {
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
  }
}

// ==========================
// 5. View Manager
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
    this.isAnimating = false;
    
    this.mainLoop = this.mainLoop.bind(this);
    
    this.checkMobileDevice();
  }
  




  
  initGlitchCursor() {
    if (this.isTouchDevice) return;
    const cursor = this.dom.elements.glitchCursor;
    if (!cursor) return;

    let rafId = null;
    let mouseX = 0, mouseY = 0;
    
    const updateCursor = () => {
      cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      rafId = null;
    };

    window.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(updateCursor);
      }
    });
  }

  initCursorHoverTargets() {
    const cursor = this.dom.elements.glitchCursor;
    if (!cursor) return;

    const targets = '.slide, .gallery-item, .myhead, .view-btn, a';
    
    document.addEventListener('mouseover', e => {
      if (e.target.closest(targets)) {
        cursor.style.opacity = 1;
        cursor.style.display = 'block';
        document.body.style.cursor = 'none';
      }
    });

    document.addEventListener('mouseout', e => {
      if (e.target.closest(targets)) {
        cursor.style.opacity = 0;
        cursor.style.display = 'none';
        document.body.style.cursor = 'auto';
      }
    });
  }

  checkMobileDevice() {
    this.isTouchDevice = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );

    this.isSmallScreen = window.innerWidth <= 768;

    if (this.isSmallScreen) {
      CONFIG.GRID.LINE_OPACITY = 0.08;
      CONFIG.GRID.VERTICAL_COUNT = 2;
      if (this.state.view !== 'gallery') {
        this.setView('gallery', true);
      }
    }
  }

  initMouse() {
    if (this.isTouchDevice) return;

    let rafId = null;
    
    window.addEventListener("mousemove", (e) => {
      if (this.state.view === "gallery") return;
      
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      
      this.state.mouse.nx = (e.clientX - cx) / cx;
      this.state.mouse.ny = (e.clientY - cy) / cy;
      this.state.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 200;
      this.state.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 200;
      this.state.mouse.angle =
        (Math.atan2(this.state.mouse.ny, this.state.mouse.nx) * 180 / Math.PI + 360) % 360;
      
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          this.dom.elements.root.style.setProperty("--mx", this.state.mouse.nx.toFixed(3));
          this.dom.elements.root.style.setProperty("--my", this.state.mouse.ny.toFixed(3));
          this.dom.elements.root.style.setProperty("--angle", this.state.mouse.angle.toFixed(1) + "deg");
          rafId = null;
        });
      }
    });

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
        }
      }
    });
  }
  
  initResize() {
    this.resizeCanvas();
    
    const optimizedResize = () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.resizeCanvas();
        if (this.lenisManager.lenis) {
          this.lenisManager.lenis.resize();
        }
        
        const wasMobile = this.state.isMobile;
        this.state.isMobile = window.innerWidth <= 768;
        
        if (this.state.isMobile && !wasMobile) {
          CONFIG.GRID.LINE_OPACITY = 0.08;
          CONFIG.GRID.VERTICAL_COUNT = 2;
        } else if (!this.state.isMobile && wasMobile) {
          CONFIG.GRID.LINE_OPACITY = 0.15;
          CONFIG.GRID.VERTICAL_COUNT = 4;
        }
        
        if (this.state.isMobile && !wasMobile && this.state.view !== 'gallery') {
          this.setView('gallery', true);
        }
        else if (!this.state.isMobile && wasMobile && this.state.view === 'gallery') {
          this.setView('slides', true);
        }
        
        if (this.state.view === 'slides') {
          this.state.slides.elements.forEach((slide, i) => {
            gsap.set(slide, {
              left: (i % 2 === 0 ? 35 : 50) + "%"
            });
          });
        }
      }, 150);
    };
    
    window.addEventListener("resize", optimizedResize);
    window.addEventListener("orientationchange", optimizedResize);
  }
  
  resizeCanvas() {
    if (!this.dom.elements.canvas) return;
    
    const maxSize = CONFIG.PERFORMANCE.MAX_CANVAS_SIZE;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    if (width > maxSize) {
      height = Math.round(height * (maxSize / width));
      width = maxSize;
    }
    
    this.dom.elements.canvas.width = width;
    this.dom.elements.canvas.height = height;
  }
  
  reinitializeAfterReturn() {
    console.log('Reinitializing after return');
    
    this.state.scroll.pos = 0;
    this.state.scroll.z = 0;
    
    if (this.lenisManager.lenis) {
      this.lenisManager.destroy();
    }
    
    setTimeout(() => {
      this.rebuildCurrentView();
      
      this.lenisManager.init(this.state.view, this.state.filteredData.length);
      this.lenisManager.start();
      
      if (this.state.view === 'slides' && this.state.filteredData.length > 0) {
        this.setBackgroundImage(0, true);
      }
    }, 50);
  }
  
  buildSlides() {
    if (this.state.view !== "slides") return;
    if (!this.dom.elements.slider) return;
    
    this.dom.elements.slider.innerHTML = "";
    this.state.slides.elements = [];
    this.state.slides.state = [];
    
    if (this.state.filteredData.length === 0) {
      const emptySlide = document.createElement("div");
      emptySlide.className = "slide-empty";
      emptySlide.innerHTML = `<p>No works in this category yet</p>`;
      this.dom.elements.slider.appendChild(emptySlide);
      return;
    }
    
    const fragment = document.createDocumentFragment();
    
    this.state.filteredData.forEach((data, i) => {
      const slide = this.createSlideElement(data, i);
      fragment.appendChild(slide);
      this.state.slides.elements.push(slide);
      this.state.slides.state.push({
        baseZ: i * CONFIG.Z_GAP,
        scale: 1,
        opacity: 1,
        parallaxX: 0,
        parallaxY: 0
      });
    });
    
    this.dom.elements.slider.appendChild(fragment);
    
    const updates = this.state.slides.elements.map((slide, i) => ({
      element: slide,
      left: (i % 2 === 0 ? 35 : 50) + "%"
    }));
    
    gsap.set(updates.map(u => u.element), {
      position: "absolute",
      top: "30%",
      xPercent: 20,
      yPercent: -50,
      transformStyle: "preserve-3d",
      willChange: "transform, opacity, filter"
    });
    
    updates.forEach(u => {
      u.element.style.left = u.left;
    });
    
    this.state.scroll.max = (this.state.filteredData.length - 1) * CONFIG.Z_GAP;
    
    this.lenisManager.init('slides', this.state.filteredData.length);
    this.lenisManager.start();
  }
  
  createSlideElement(data, index) {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.dataset.index = index;
    slide.dataset.baseZ = index * CONFIG.Z_GAP;
    slide.dataset.projectId = data.id;
    
    const img = this.dataManager.getImageElement(data.img) || new Image();
    if (!img.src) img.src = data.img;
    
    img.alt = data.title || '';
    img.loading = "eager";
    img.onerror = () => {
      img.remove();
      slide.classList.add('image-error');
    };
    
    slide.innerHTML = `
      <div class="slide-img"></div>
      <div class="slide-copy">
        <p class="card-title">
          <span>${data.title || ''}</span>
        </p>
        <p class="card-subtitle">
          <span class="card-category">${data.categories.join(", ")}</span>
          <span class="card-year">${data.year || '2024'}</span>
        </p>
      </div>
    `;
    
    slide.querySelector('.slide-img').appendChild(img);
    
    const transition = this.dom.elements.pageTransition;

    slide.addEventListener('click', e => {
      e.preventDefault();
      
      sessionStorage.setItem('gallery_return', 'true');
      sessionStorage.setItem('gallery_path', window.location.pathname);
      sessionStorage.setItem('gallery_hash', window.location.hash);
      
      window.location.href = data.projectUrl;
    });
    
    return slide;
  }
  
  buildGallery() {
    if (this.state.view !== "gallery") return;
    if (!this.dom.elements.gallery) return;
    
    this.dom.elements.gallery.innerHTML = "";
    
    if (this.state.filteredData.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "gallery-empty";
      emptyMessage.innerHTML = `
        <h3>No works found</h3>
        <p>Try selecting a different category</p>
      `;
      this.dom.elements.gallery.appendChild(emptyMessage);
      return;
    }
    
    const grid = document.createElement("div");
    grid.className = "gallery-grid";
    
    const fragment = document.createDocumentFragment();
    
    this.state.filteredData.forEach((data, i) => {
      const item = this.createGalleryItem(data, i);
      fragment.appendChild(item);
    });
    
    grid.appendChild(fragment);
    this.dom.elements.gallery.appendChild(grid);
    this.initLazyLoading();
    
    this.lenisManager.init('gallery', this.state.filteredData.length);
    this.lenisManager.start();
  }
  
  createGalleryItem(data, index) {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.style.setProperty("--item-index", index);
    item.dataset.index = index;
    item.dataset.projectId = data.id;
    
    item.innerHTML = `
      <div class="gallery-thumb">
        <img data-src="${data.img}" alt="${data.title}" class="lazy-img" loading="lazy">
      </div>
      <div class="gallery-caption">
        <div class="g-title">${data.title}</div>
        <div class="g-meta">
          <span class="g-category">${data.categories.join(", ")}</span>
          <span class="g-year">${data.year || '2024'}</span>
        </div>
      </div>
    `;
    
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      sessionStorage.setItem('gallery_return', 'true');
      sessionStorage.setItem('gallery_path', window.location.pathname);
      sessionStorage.setItem('gallery_hash', window.location.hash);
      
      window.location.href = data.projectUrl;
    });
    
    return item;
  }
  
  initLazyLoading() {
    if (this.lazyObserver) {
      this.lazyObserver.disconnect();
    }
    
    this.lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target.querySelector('.lazy-img');
          if (img && img.dataset.src) {
            const cachedImg = this.dataManager.getImageElement(img.dataset.src);
            if (cachedImg) {
              img.src = cachedImg.src;
            } else {
              img.src = img.dataset.src;
            }
            img.removeAttribute('data-src');
            img.classList.remove('lazy-img');
          }
          this.lazyObserver.unobserve(entry.target);
        }
      });
    }, { 
      rootMargin: `${CONFIG.PERFORMANCE.LAZY_LOAD_OFFSET}px`,
      threshold: 0.01 
    });
    
    document.querySelectorAll('.gallery-item').forEach(item => {
      this.lazyObserver.observe(item);
    });
    
    this.dom.observers.push(this.lazyObserver);
  }
  
  setBackgroundImage(index, immediate = false) {
    if (this.state.view === "gallery") return;
    if (index < 0 || index >= this.state.filteredData.length) return;
    if (index === this.state.bg.currentIndex && !immediate) return;
    
    if (this.bgChangeTimeout) {
      clearTimeout(this.bgChangeTimeout);
      this.bgChangeTimeout = null;
    }
    
    this.state.bg.currentIndex = index;
    const data = this.state.filteredData[index];
    
    const activeIdx = this.state.bg.active;
    const nextIdx = 1 - activeIdx;
    const activeEl = activeIdx === 0 ? this.dom.elements.bgA : this.dom.elements.bgB;
    const nextEl = nextIdx === 0 ? this.dom.elements.bgA : this.dom.elements.bgB;
    
    gsap.killTweensOf([this.dom.elements.bgA, this.dom.elements.bgB]);

    const gradient = this.createGradient(data.gradientColors);
    
    if (immediate) {
      nextEl.style.backgroundImage = gradient;
      nextEl.style.opacity = CONFIG.BG_OPACITY.toString();
      activeEl.style.opacity = '0';
      this.state.bg.active = nextIdx;
      return;
    }
    
    nextEl.style.backgroundImage = gradient;

    gsap.to(activeEl, {
      opacity: 0,
      duration: CONFIG.BG_FADE_DURATION * 0.7,
      ease: "power2.in",
      overwrite: true
    });
    
    gsap.to(nextEl, {
      opacity: CONFIG.BG_OPACITY,
      duration: CONFIG.BG_FADE_DURATION,
      ease: "power2.out",
      delay: 0.05,
      overwrite: true,
      onComplete: () => {
        this.state.bg.active = nextIdx;
      }
    });
    
    this.preloadAdjacentImages(index);
  }
  
  preloadAdjacentImages(currentIdx) {
    const indices = [
      currentIdx - 1,
      currentIdx + 1
    ].filter(idx => idx >= 0 && idx < this.state.filteredData.length);
    
    indices.forEach(idx => {
      const data = this.state.filteredData[idx];
      this.dataManager.loadImage(data.img);
    });
  }
  
  createGradient(colors) {
    const [color1, color2] = colors;
    return `radial-gradient(circle at center, ${color1} 0%, ${color2} 100%)`;
  }
  
  updateSlides() {
    if (this.state.view !== "slides") return;
    if (this.state.slides.elements.length === 0) return;
    
    this.state.updateFPS();
    
    const progress = this.snappedProgress(this.state.scroll.pos / this.state.scroll.max, 0.1);
    const totalDepth = (this.state.filteredData.length - 1) * CONFIG.Z_GAP;
    const cameraZ = -CONFIG.START_OFFSET + progress * (totalDepth + CONFIG.START_OFFSET);
    
    let bestIdx = -1;
    let bestDist = Infinity;
    
    const mouseNX = this.state.mouse.nx;
    const mouseNY = this.state.mouse.ny;
    
    this.state.slides.elements.forEach((slide, idx) => {
      const baseZ = this.state.slides.state[idx].baseZ;
      const relativeZ = baseZ - cameraZ;
      const dist = Math.abs(relativeZ);
      
      if (dist < bestDist) { 
        bestDist = dist; 
        bestIdx = idx; 
      }
      
      if (relativeZ < -110 || relativeZ > 300) { 
        slide.style.opacity = 0; 
        slide.style.pointerEvents = "none"; 
        return; 
      }
      
      this.state.slides.state[idx].opacity = Math.max(0, Math.min(1, 1 - dist / 380));
      this.state.slides.state[idx].scale = Math.max(0.4, Math.min(1.2, 1.2 - (dist / 400) * 0.8));
      this.state.slides.state[idx].parallaxX = mouseNX * CONFIG.MOUSE_SENSITIVITY.X;
      this.state.slides.state[idx].parallaxY = mouseNY * CONFIG.MOUSE_SENSITIVITY.Y;
      
      const transform = `translate3d(${this.state.slides.state[idx].parallaxX}vw, ${this.state.slides.state[idx].parallaxY}vh, ${-relativeZ}px) rotateY(${mouseNX * CONFIG.MOUSE_SENSITIVITY.ROTATION}deg) rotateX(${mouseNY * -3}deg) scale(${this.state.slides.state[idx].scale})`;
      
      if (slide.style.transform !== transform) {
        slide.style.transform = transform;
      }
      
      const opacity = this.state.slides.state[idx].opacity;
      if (slide.style.opacity !== String(opacity)) {
        slide.style.opacity = opacity;
      }
      
      slide.style.pointerEvents = 'auto';
    });
    
    if (bestIdx !== -1 && bestDist < 220 && bestIdx !== this.state.bg.currentIndex) {
      this.setBackgroundImage(bestIdx);
    }
  }
  
  snappedProgress(progressRaw, stickiness = 0.7) {
    const total = this.state.filteredData.length - 1;
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
  
  drawGrid() {
    if (!this.dom.elements.context || !this.dom.elements.canvas) return;
    
    const ctx = this.dom.elements.context;
    const canvas = this.dom.elements.canvas;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.state.mouse.targetX += (this.state.mouse.nx * 100 - this.state.mouse.targetX) * 0.2;
    this.state.mouse.targetY += (this.state.mouse.ny * 100 - this.state.mouse.targetY) * 0.2;
    
    const mx = this.state.mouse.targetX;
    const my = this.state.mouse.targetY;
    
    this.state.gridLines.forEach(z => {
      let zOffset = (z - this.state.scroll.z % CONFIG.DEPTH + CONFIG.DEPTH) % CONFIG.DEPTH + 50;
      const fade = 1 - zOffset / CONFIG.GRID.FADE_RANGE;
      
      const p1t = this.project3D(-1500, -800, zOffset, mx, my);
      const p2t = this.project3D(1500, -800, zOffset, mx, my);
      
      const gradTop = ctx.createLinearGradient(p1t.x, 0, p2t.x, 0);
      gradTop.addColorStop(0, `rgba(255,255,255,0)`);
      gradTop.addColorStop(0.05, `rgba(255,255,255,${CONFIG.GRID.LINE_OPACITY * fade})`);
      gradTop.addColorStop(0.95, `rgba(255,255,255,${CONFIG.GRID.LINE_OPACITY * fade})`);
      gradTop.addColorStop(1, `rgba(255,255,255,0)`);
      
      ctx.strokeStyle = gradTop;
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(p1t.x, p1t.y);
      ctx.lineTo(p2t.x, p2t.y);
      ctx.stroke();
      
      const p1b = this.project3D(-1500, 800, zOffset, mx, my);
      const p2b = this.project3D(1500, 800, zOffset, mx, my);
      
      const gradBottom = ctx.createLinearGradient(p1b.x, 0, p2b.x, 0);
      gradBottom.addColorStop(0, `rgba(255,255,255,0)`);
      gradBottom.addColorStop(0.05, `rgba(255,255,255,${CONFIG.GRID.LINE_OPACITY * fade})`);
      gradBottom.addColorStop(0.95, `rgba(255,255,255,${CONFIG.GRID.LINE_OPACITY * fade})`);
      gradBottom.addColorStop(1, `rgba(255,255,255,0)`);
      
      ctx.strokeStyle = gradBottom;
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(p1b.x, p1b.y);
      ctx.lineTo(p2b.x, p2b.y);
      ctx.stroke();
    });
    
    for (let i = -CONFIG.GRID.VERTICAL_COUNT; i <= CONFIG.GRID.VERTICAL_COUNT; i++) {
      const x = i * CONFIG.GRID.VERTICAL_SIZE;
      this.drawVerticalLine(ctx, x, mx, my);
    }
  }

  project3D(x, y, z, mx, my) {
    const fov = 950;
    const scale = fov / (fov + z);
    return { 
      x: x * scale + this.dom.elements.canvas.width / 2 + mx, 
      y: y * scale + this.dom.elements.canvas.height / 2 + my, 
      scale 
    };
  }

  drawVerticalLine(ctx, x, mx, my) {
    const zNear = 50;
    const zFar = CONFIG.DEPTH;

    const pNearTop = this.project3D(x, -800, zNear, mx, my);
    const pFarTop = this.project3D(x, -800, zFar, mx, my);
    
    const gradTop = ctx.createLinearGradient(0, pNearTop.y, 0, pFarTop.y);
    gradTop.addColorStop(0, `rgba(255,255,255,0.18)`);
    gradTop.addColorStop(0.6, `rgba(255,255,255,0.08)`);
    gradTop.addColorStop(1, `rgba(255,255,255,0)`);
    
    ctx.strokeStyle = gradTop;
    ctx.beginPath();
    ctx.moveTo(pNearTop.x, pNearTop.y);
    ctx.lineTo(pFarTop.x, pFarTop.y);
    ctx.stroke();
    
    const pNearBot = this.project3D(x, 800, zNear, mx, my);
    const pFarBot = this.project3D(x, 800, zFar, mx, my);
    
    const gradBot = ctx.createLinearGradient(0, pNearBot.y, 0, pFarBot.y); 
    gradBot.addColorStop(0, `rgba(255,255,255,0.18)`); 
    gradBot.addColorStop(0.4, `rgba(255,255,255,0.08)`);
    gradBot.addColorStop(1, `rgba(255,255,255,0)`); 
    
    ctx.strokeStyle = gradBot;
    ctx.beginPath();
    ctx.moveTo(pNearBot.x, pNearBot.y);
    ctx.lineTo(pFarBot.x, pFarBot.y);
    ctx.stroke();
  }
  
  setFilter(filter) {
    if (this.state.filter === filter) return;
    
    if (this.lenisManager.lenis) {
      this.lenisManager.lenis.scrollTo(0, { immediate: true });
    }
    
    this.state.filter = filter;
    this.state.filteredData = this.dataManager.filterData(filter);
    
    this.state.scroll.pos = 0;
    this.state.scroll.z = 0;
    
    this.dom.elements.navLinks.forEach(link => {
      link.classList.toggle('active-filter', link.dataset.filter === filter);
    });
    
    this.rebuildCurrentView();
    this.updateURL();
    
    document.dispatchEvent(
      new CustomEvent('filterchange', { detail: filter })
    );
  }
  
  setView(view, force = false) {
    if (this.state.view === view && !force) return;
    
    if (this.state.isMobile && view !== 'gallery' && !force) {
      view = 'gallery';
    }
    
    if (this.lenisManager.lenis) {
      this.lenisManager.lenis.scrollTo(0, { immediate: true });
    }
    
    this.state.scroll.pos = 0;
    this.state.scroll.z = 0;
    
    if (this.state.view === "slides") {
      this.state.slides.elements = [];
      this.state.slides.state = [];
    } else if (this.state.view === "gallery" && this.lazyObserver) {
      this.lazyObserver.disconnect();
      this.lazyObserver = null;
    }
    
    this.state.view = view;
    
    this.dom.elements.viewBtns.forEach(btn => {
      btn.classList.toggle('active-view', btn.dataset.view === view);
    });
    
    this.dom.elements.viewSwitcher.setAttribute('data-active-view', view);
    
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
    
    this.rebuildCurrentView();
    this.updateURL();
  }
  
  rebuildCurrentView() {
    if (this.state.view === "slides") {
      if (this.dom.elements.gallery) {
        this.dom.elements.gallery.innerHTML = '';
      }
      this.buildSlides();
      if (this.state.filteredData.length > 0) {
        requestAnimationFrame(() => {
          this.setBackgroundImage(0, true);
        });
      }
    } else {
      this.buildGallery();
    }
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
  
  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    const isReturning = urlParams.get('returning') === 'true';
    
    if (isReturning) {
      console.log('Returning from project');
      const url = new URL(window.location.href);
      url.searchParams.delete('returning');
      history.replaceState({}, '', url);
    }
    
    this.initMouse();
    this.initResize();
    
    this.initGlitchCursor();
    this.initCursorHoverTargets();
    this.state.isLoading = true;
    
    window.appState = this.state;
    
    const allImages = this.dataManager.allData.map(item => item.img);
    
    await this.dataManager.preloadImagesWithCache(allImages, (progress) => {
      this.dom.updateLoaderProgress(progress * 100);
    });
    
    this.parseInitialState();
    this.applyInitialUIState();
    
    this.state.isLoading = false;
    this.dom.hideLoader();

    requestAnimationFrame(() => {
      this.dom.elements.pageTransition?.classList.remove('is-entering');
      this.dom.elements.pageTransition?.classList.add('is-entered');

      setTimeout(() => {
        this.dom.elements.pageTransition?.classList.remove('is-entered');
      }, 500);
    });
    
    this.initEventListeners();
    this.rebuildCurrentView();
    
    if (this.state.view === 'slides' && this.state.filteredData.length > 0) {
      requestAnimationFrame(() => {
        this.setBackgroundImage(0, true);
      });
    }
    
    this.state.isInitialized = true;
    
    if (isReturning) {
      setTimeout(() => {
        this.reinitializeAfterReturn();
      }, 100);
    }
    
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.state.view === 'slides' && this.lenisManager.lenis) {
        this.lenisManager.lenis.resize();
      }
    });
  }
  
  parseInitialState() {
    const hash = window.location.hash.replace('#', '');
    
    let filter = 'allworks';
    let view = 'slides';
    
    if (!hash) {
      this.state.filter = filter;
      this.state.view = view;
      this.state.filteredData = this.dataManager.filterData(filter);
      
      setTimeout(() => {
        document.dispatchEvent(
          new CustomEvent('filterchange', { detail: filter })
        );
      }, 0);
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
    this.state.filteredData = this.dataManager.filterData(filter);
    
    setTimeout(() => {
      document.dispatchEvent(
        new CustomEvent('filterchange', { detail: filter })
      );
    }, 0);
  }
  
  initEventListeners() {
    this.dom.elements.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.setFilter(link.dataset.filter);
      });
    });
    
    this.dom.elements.viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.state.isMobile) {
          this.setView(btn.dataset.view);
        }
      });
    });
  }
  
  applyInitialUIState() {
    this.dom.elements.navLinks.forEach(link => {
      link.classList.toggle(
        'active-filter',
        link.dataset.filter === this.state.filter
      );
    });
    
    this.dom.elements.viewBtns.forEach(btn => {
      btn.classList.toggle(
        'active-view',
        btn.dataset.view === this.state.view
      );
    });
    
    this.dom.elements.viewSwitcher.setAttribute(
      'data-active-view',
      this.state.view
    );
    
    if (this.state.isMobile && this.dom.elements.viewSwitcher) {
      this.dom.elements.viewSwitcher.style.display = 'none';
    }
    
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
  
  mainLoop(time) {
    if (this.state.isLoading) {
      requestAnimationFrame(this.mainLoop);
      return;
    }
    
    if (this.lenisManager && this.lenisManager.lenis) {
      this.lenisManager.lenis.raf(time);
    }
    
    if (this.state.view === "slides") {
      this.updateSlides();
      this.drawGrid();
    }
    
    requestAnimationFrame(this.mainLoop);
  }
  
  start() {
    requestAnimationFrame(this.mainLoop);
  }

  destroy() {
    this.lenisManager.destroy();
    this.dom.cleanup();
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    if (this.bgChangeTimeout) clearTimeout(this.bgChangeTimeout);
  }
}

// ==========================
// 6. Initialization
// ==========================
let appState, domCache, dataManager, viewManager;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    appState = new AppState();
    domCache = new DOMCache().init();
    dataManager = new DataManager();
    viewManager = new ViewManager(appState, domCache, dataManager);

    await viewManager.init();
    viewManager.start();
    
    console.log('3D Gallery initialized successfully');
  } catch (error) {
    console.error('Failed to initialize gallery:', error);
    if (domCache) domCache.hideLoader();
  }
});

window.addEventListener('beforeunload', () => {
  if (viewManager) {
    viewManager.destroy();
  }
});

window.App = {
  getState: () => appState,
  getViewManager: () => viewManager,
  switchToGallery: () => viewManager?.setView('gallery'),
  switchToTunnel: () => viewManager?.setView('slides'),
  setFilter: (filter) => viewManager?.setFilter(filter)
};

window.addEventListener("pageshow", (event) => {
  if (event.persisted && viewManager) {
    console.log("Restored from bfcache");

    // Если lenis был уничтожен — пересоздаём
    if (!viewManager.lenisManager.lenis) {
      viewManager.lenisManager.init(
        appState.view,
        appState.filteredData.length
      );
    } else {
      viewManager.lenisManager.start();
    }

    requestAnimationFrame(viewManager.mainLoop);
  }
});

// ==========================
// 8. Mobile Filter Dropdown
// ==========================
function initMobileDropdown() {
  const dropdown = document.querySelector('[data-nav-dropdown]');
  if (!dropdown) return;

  const toggle = dropdown.querySelector('.nav-dropdown-toggle');
  const label  = dropdown.querySelector('.nav-dropdown-label');
  const items  = dropdown.querySelectorAll('[data-filter]');

  function setActive(filter) {
    items.forEach(i => i.classList.remove('active'));
    const active = dropdown.querySelector(`[data-filter="${filter}"]`);
    if (active) active.classList.add('active');
  }

  function syncUI(filter) {
    const item = dropdown.querySelector(`[data-filter="${filter}"]`);
    if (!item) return;

    label.textContent = item.textContent;
    setActive(filter);
  }

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  items.forEach(item => {
    item.addEventListener('click', e => {
      e.stopPropagation();
      const filter = item.dataset.filter;
      if (window.App && window.App.setFilter) {
        window.App.setFilter(filter);
        syncUI(filter);
      }
      dropdown.classList.remove('open');
    });
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });

  document.addEventListener('filterchange', e => {
    syncUI(e.detail);
  });

  function checkApp() {
    if (window.App && window.App.getState) {
      const state = window.App.getState();
      if (state && state.filter) {
        syncUI(state.filter);
      }
    } else {
      setTimeout(checkApp, 100);
    }
  }
  
  checkApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileDropdown);
} else {
  initMobileDropdown();
}


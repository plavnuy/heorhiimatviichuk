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
description: "Ongoing design collaboration with SCHMALGAUZEN, creating posters, tour graphics, merchandise, and lettering systems, blending concept development, visual consulting, and production supervision.",
        year: "2025",
        img: "/images/SC/SCHM-cover.jpg",
        categories: ["Graphic"],
        projectUrl: "/projects/SCHMALGAUZEN.html",
        gradientColors: ["#FF4D4D", "#1A1A2E"]
    },
    {
        id: "project-3",
        title: "K19",
description: "Ongoing design partnership with K19, developing brand identity, exhibition graphics, posters, and visual systems for contemporary art projects, blending concept development, art direction, and spatial design.",
        year: "2026",
        img: "./images/k19/k19-sign-transparent.png",
        categories: ["Branding"],
        projectUrl: "./projects/k19.html",
        gradientColors: ["#16213E", "#FFB347"]
    },
    {
        id: "project-4",
        title: "20ft radio / oO_series",
description: "Creative partnership on o0series, developing identity, logo system, symbolic research, website vibe-coding, 3D and motion integration, social visuals, and experiential storytelling for an interdisciplinary art and electronic music project.",
        year: "2024",
        img: "./images/OO/OO-logo-animation.webp",
        categories: ["Art-direction", "Interfaces"],
        projectUrl: "/projects/o0series.html",
        gradientColors: ["#2C3E50", "#27AE60"]
    },

        {
        id: "project-32",
        title: "Parking App",
description: "ShareSpot — UX/UI case study for a peer-to-peer parking exchange platform, focusing on decision-making under pressure, minimal cognitive load for urban drivers, and trust-driven marketplace interactions.",
        year: "2023",
        img: "./images/SS/SS-06.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/parking-app.html",
        gradientColors: ["#f2ff00", "#0217ff"]
    },

    {
        id: "project-21",
        title: "easymeets",
description: "End-to-end product design for EasyMeets, a web scheduling platform. Includes user research, UX architecture, wireframes, UI system, and interactive prototyping to streamline availability sharing, meeting coordination, and automation.",
        year: "2023",
        img: "./images/SD/SD-03.jpg",
        categories: ["Interfaces"],
        projectUrl: "/projects/easymeets.html",
        gradientColors: ["#B0F566", "#E67E22"]
    },

        {
        id: "project-2",
        title: "Mitus Platform",
description: "Mitus — product design case study for an Australian farm transition planning platform. Branding, UX/UI, dashboards, and CRM-like interfaces unify complex operational, legal, and financial processes into a structured, user-friendly system for farmers, advisors, and managers.",
        year: "2024",
        img: "./images/MI/MI-logo.png",
        categories: ["Interfaces", "Branding"],
        projectUrl: "./projects/mitus.html",
        gradientColors: ["#BDC3C7", "#8E9BFF"]
    },

    {
        id: "project-18",
        title: "TRADEMOTIONS",
description: "Redesigning Trademotions for fund managers: intuitive dashboards, responsive components, and a cohesive UI system to optimize trading efficiency and insight clarity.",
        year: "2022",
        img: "./images/TM/trademotions.webp",
        categories: ["Interfaces", "Branding", "Graphic"],
        projectUrl: "/projects/trademotions.html",
        gradientColors: ["#C0392B", "#F39C12"]
    },

    {
        id: "project-9",
        title: "Located",
description: "Ongoing design partnership with LOCATED, creating custom merchandise and graphics for Ukrainian brands, blending concept development, visual consulting, and production supervision.",
        year: "2024",
        img: "./images/LC/LC-logo-anim.gif",
        categories: ["Graphic"],
        projectUrl: "./projects/LOCATED.html",
        gradientColors: ["#E74C3C", "#2C3E50"]
    },

    {
        id: "project-31",
        title: "HRAM BAR",
description: "HRAM — design collaboration for a thematic bar, developing merchandise, tableware, and graphic concepts rooted in ritual symbolism, narrative atmosphere, and object-driven brand expression.",
        year: "2025",
        img: "./images/HR/HR-plate-01_small.png",
        categories: ["Graphic"],
        projectUrl: "./projects/HRAM.html",
        gradientColors: ["#ff3c00", "#000000"]
    },


    {
        id: "project-5",
        title: "X4 CLUB",
description: "X4 Club Madrid — concept-driven brand identity and spatial experience. Quaternity-inspired systems unify club, gallery, and cultural programming, combining minimalist visual language, immersive projection mapping, and adaptable materials to highlight artistic expression and community freedom.",
        year: "2024",
        img: "./images/x4/x4-present.webp",
        categories: ["Branding", "Art-direction"],
        projectUrl: "./projects/x4.html",
        gradientColors: ["#1A1A2E", "#4A4A6A"]
    },
    {
        id: "project-20",
        title: "INPUT SOFT",
description: "INPUT SOFT — UI/UX case study for an aviation operations platform. The design streamlines airport operations, optimizes resource management, supports real-time coordination, and provides intuitive dashboards and mobile tools for managers and ground staff.",
        year: "2023",
        img: "./images/IS/IS-main.jpg",
        categories: ["Interfaces"],
        projectUrl: "/projects/input-soft.html",
        gradientColors: ["#F1C40F", "#8E44AD"]
    },

    {
        id: "project-6",
        title: "Lettering",
description: "Lettering Experiments — explorations by Heorhii Matviichuk in gesture, form, and rhythm. Personal studies range from bold 'Thug Life' compositions to digital and hand-drawn Kyiv typography, bridging motion, spontaneity, and typographic structure.",
        year: "2024",
        img: "./images/LT/LT-kyiv.gif",
        categories: ["Graphic"],
        projectUrl: "./projects/Lettering.html",
        gradientColors: ["#E63946", "#1A1A2E"]
    },
    {
        id: "project-8",
        title: "iii3 cover",
description: "III3 — album cover and visual concept for an underground Ukrainian rap project by ron4ik x mxtixn, created during the war, reflecting struggle, immediacy, and raw musical expression.",
        year: "2024",
        img: "./images/iii3/iii3-cover-low.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/iii3.html",
        gradientColors: ["#2980B9", "#8E44AD"]
    },
    {
        id: "project-15",
        title: "Tripple We",
description: "Tripple We — branding and visual identity for a creative agency empowering emerging artists, featuring conceptual logo, color system, and flexible brand guidelines.",
        year: "2023",
        img: "./images/TW/TW-sign.png",
        categories: ["Branding"],
        projectUrl: "./projects/tripple-we.html",
        gradientColors: ["#3498DB", "#2C3E50"]
    },
    {
        id: "project-16",
        title: "X-plane",
description: "X-Plane — web design, brandbook, and e-commerce case study for a professional flight simulation platform, featuring cohesive visual identity, UI system, and online aircraft model store.",
        year: "2023",
        img: "./images/XP/XP-cover.jpg",
        categories: ["Interfaces", "Branding"],
        projectUrl: "./projects/x-plane.html",
        gradientColors: ["#E67E22", "#6C5B7B"]
    },
    {
        id: "project-10",
        title: "Binary Cases",
description: "Binary Studio — design collaboration with a boutique software agency, featuring over 30 PDF case studies, illustrations, and banners for digital and marketing materials.",        year: "2022",
        img: "./images/BN/BN-case-01.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/Binary.html",
        gradientColors: ["#2C3E50", "#F39C12"]
    },
    {
        id: "project-14",
        title: "Dr. Gavrylin",
        description: "Dr. Gavrylin — personal website case study for a psychology and consciousness blogger, featuring animated hero, vibe-driven front-end, long-form typography, and sleep supplement packaging & promotional visuals.",
        year: "2023",
        img: "./images/DG/DG-cover.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/Dr-Gavrylin.html",
        gradientColors: ["#F5E6CC", "#6B5E4A"]
    },
    {
        id: "project-12",
        title: "The I-Ching",
        description: "I Ching Digital Oracle — a minimal personal digital experiment inspired by Carl Jung and the Book of Changes, featuring a six-tap hexagram generation, reflective prompts, restrained interface, and vibe-driven interaction for moments of uncertainty.",
        year: "2023",
        img: "./images/IThiching.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/The-I-Ching.html",
        gradientColors: ["#A5D6A5", "#1A1A2E"]
    },
    {
        id: "project-13",
        title: "Snedeker Yoga",
        description: "Carly Snedeker Yoga — landing page and visual identity for a Zurich-based yoga teacher, featuring calm typography, modern layout, responsive front-end, SEO setup, printed flyer, and ongoing support.",
        year: "2023",
        img: "./images/Vibe-Coding-2.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/Snedeker-Yoga.html",
        gradientColors: ["#E8D5B5", "#8B7E6B"]
    },
    {
        id: "project-7",
        title: "Artworks",
        description: "Visual Works — personal visual archive by Heorhii Matviichuk, featuring abstract paintings, cyberpunk digital art, and alchemical illustrations exploring form, rhythm, atmosphere, and psychological transformation.",
        year: "2024",
        img: "./images/art/Art-02.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/Art.html",
        gradientColors: ["#2980B9", "#9B59B6"]
    },
    {
        id: "project-11",
        title: "RACONTEUR",
        description: "Raconteur Studio — minimal landing page for Ukrainian director Indy Hait’s creative studio, featuring custom typography, subtle animated interactions, and elegant front-end implementation.",
        year: "2022",
        img: "./images/Vibe-Coding-4.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/Raconteur.html",
        gradientColors: ["#1A1A2E", "#4A4A6A"]
    },
    {
        id: "project-17",
        title: "Fundraising",
        description: "Support Visuals — graphic design for military fundraising and a custom patch for Ukrainian defenders. Includes campaign assets, social visuals, and physical patch design for defense initiatives.",
        year: "2022",
        img: "./images/FD/patch.png",
        categories: ["Graphic"],
        projectUrl: "./projects/Fundraising.html",
        gradientColors: ["#79ff6a", "#ffffff"]
    },
    {
        id: "project-19",
        title: "GO-GO Bot",
        description: "GOGO Bot — startup case study for a Telegram bot designed to discover and create local events in Kyiv, exploring MVP design, user flows, and product insights before the full-scale war in Ukraine.",
        year: "2021",
        img: "./images/other/gogo-bot.jpg",
        categories: ["Interfaces", "Cusdev"],
        projectUrl: "./projects/gogo-bot.html",
        gradientColors: ["#2C3E50", "#E67E22"]
    },
    {
        id: "project-23",
        title: "Dobro",
        description: "DOBRO — logo design case study for a project and resource management SaaS product, focusing on brand strategy, emotional resonance, and a human-centered visual identity.",
        year: "2018",
        img: "./images/DO/DO-logo.png",
        categories: ["Branding"],
        projectUrl: "./projects/dobro.html",
        gradientColors: ["#3498DB", "#8E44AD"]
    },
    {
        id: "project-22",
        title: "Khmeli Suneli",
        description: "Khmeli-Suneli — logo design for a Georgian restaurant in Kyiv, featuring handwritten Georgian typography.",
        year: "2016",
        img: "./images/HS/HS-logo.jpg",
        categories: ["Branding"],
        projectUrl: "./projects/khmeli-suneli.html",
        gradientColors: ["#F1C40F", "#8E44AD"]
    },
    {
        id: "project-24",
        title: "SAYENKO&KHARENKO",
        description: "Sayenko & Kharenko — conceptual logo design for a leading Ukrainian law firm, combining the paragraph symbol with initials S and K to explore legal symbolism.",
        year: "2017",
        img: "./images/SK/SK-mock.jpg",
        categories: ["Branding"],
        projectUrl: "./projects/SAYENKO&KHARENKO.html",
        gradientColors: ["#BDC3C7", "#2C3E50"]
    },
    {
        id: "project-26",
        title: "E-commerce App",
        description: "PRODJ App — UX/UI case study of a mobile e-commerce application for professional DJ equipment, exploring user personas, UX goals, information architecture, and interface design.",
        year: "2020",
        img: "./images/other/E-commerce-App.jpg",
        categories: ["Interfaces"],
        projectUrl: "/projects/e-commerce-app.html",
        gradientColors: ["#E83E8C", "#2C3E50"]
    },
    {
        id: "project-28",
        title: "Jernov Jewellery",
        description: "Jernov Jewellery — brochure design highlighting editorial layout, and material-focused presentation, creating a luxurious and precise brand experience.",
        year: "2016",
        img: "./images/JE/JE-broushure-cover.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/jernov.html",
        gradientColors: ["#2C3E50", "#ECF0F1"]
    },
    {
        id: "project-27",
        title: "Vognyar",
        description: "Vognyar — brand identity and packaging design for a natural Ukrainian hot sauce, highlighting logo, label system, and scalable brand application, creating a consistent and production-ready visual experience since 2017.",
        year: "2016",
        img: "./images/VG/vognyar-souses-07.jpg",
        categories: ["Graphic", "Packaging"],
        projectUrl: "./projects/Vognyar.html",
        gradientColors: ["#2C3E50", "#E74C3C"]
    },
    {
        id: "project-29",
        title: "50 inventions",
        description: "50 Inventions Bestowed by Ukraine to the World — poster series highlighting Ukrainian scientific, engineering, and cultural achievements, translating complex technological accomplishments into bold, clear, and monumental graphic statements.",
        year: "2015",
        img: "./images/50/50-cover.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/50inventions.html",
        gradientColors: ["#C0392B", "#27AE60"]
    },
    {
        id: "project-25",
        title: "Accemedin",
        description: "Accemedin — UX/UI design case for an educational platform for Ukrainian medical professionals, focusing on intuitive course navigation, clear information hierarchy, and responsive web and mobile interfaces.",
        year: "2017",
        img: "./images/other/accemedin.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/accemedin.html",
        gradientColors: ["#E63946", "#1A1A2E"]
    },
    {
        id: "project-30",
        title: "Symerio",
        description: "Symerio — logo design for a data science consulting company, based on binary code and the concept of input/output (I/O), creating a precise, intelligent, and system-oriented visual identity.",
        year: "2014",
        img: "./images/SM/SM-logo-visitcard.jpg",
        categories: ["Branding"],
        projectUrl: "./projects/symerio.html",
        gradientColors: ["#E67E22", "#2C3E50"]
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
    this._loopRunning = false;
    
    this.mainLoop = this.mainLoop.bind(this);
    
    this.checkMobileDevice();
  }
  

applyTextDecodeOnSlides() {
  const slides = document.querySelectorAll('.slide');

  // ====== НАСТРОЙКИ ======
  const titleLetters = "/_+";
  const descLetters = "/";
  
  const titleSpeed = 10;
  const descSpeed = 1;

  const titleDecodeSpeed = 0.6;
  const descDecodeSpeed = 0.9;

  const delayBetween = 200; // пауза между title и desc

  // звук
 

  slides.forEach(slide => {

    const titleEl = slide.querySelector('.card-title span');
    const descEl = slide.querySelector('.card-description');

    if (!titleEl) return;

    const originalTitle = titleEl.textContent;
    const originalDesc = descEl ? descEl.textContent : null;

    let frame = null;
    let timeout = null;

    slide.addEventListener('mouseenter', () => {

      cancelAnimationFrame(frame);
      clearTimeout(timeout);

      let titleIteration = 0;
      let descIteration = 0;
      let descVisibleLength = 0;

      let lastTime = 0;
      let phase = "title";

      if (descEl) descEl.textContent = "";

      const animate = (time) => {
        if (!lastTime) lastTime = time;

        // ===== TITLE =====
        if (phase === "title" && time - lastTime > titleSpeed) {
          lastTime = time;

          titleEl.textContent = originalTitle
            .split("")
            .map((char, index) => {
              if (index < titleIteration) return originalTitle[index];
              if (char === " ") return " ";
              return titleLetters[Math.floor(Math.random() * titleLetters.length)];
            })
            .join("");

          titleIteration += titleDecodeSpeed;

          if (titleIteration > originalTitle.length) {
            titleEl.textContent = originalTitle;

            timeout = setTimeout(() => {
              phase = "desc";
              lastTime = 0;
            }, delayBetween);
          }
        }

        // ===== DESCRIPTION =====
// ===== DESCRIPTION =====
if (phase === "desc" && descEl && time - lastTime > descSpeed) {
  lastTime = time;

  // Быстрее печатаем текст
  if (descVisibleLength < originalDesc.length) {
    descVisibleLength += 3; // ← быстрее появление
  }

  const visible = originalDesc.slice(0, descVisibleLength);

  descEl.textContent = visible
    .split("")
    .map((char, index) => {
      if (index < descIteration) return visible[index];
      if (char === " ") return " ";
      return descLetters[Math.floor(Math.random() * descLetters.length)];
    })
    .join("");

  // Декодируем медленнее, чтобы шум был заметен
  descIteration += 3;

  if (descIteration >= originalDesc.length) {
    descEl.textContent = originalDesc;
  }
}


        if (
          titleIteration <= originalTitle.length ||
          (descEl && descIteration <= originalDesc.length)
        ) {
          frame = requestAnimationFrame(animate);
        }
      };

      frame = requestAnimationFrame(animate);
    });

    slide.addEventListener('mouseleave', () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      titleEl.textContent = originalTitle;
      if (descEl) descEl.textContent = originalDesc;
    });

  });
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
      if (this.isTouchDevice) return; // <--- добавили
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
     this.applyTextDecodeOnSlides();
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
  
  // Обновленная структура с выноской
  slide.innerHTML = `
    <div class="slide-img"></div>
    <div class="slide-content">
            

      <div class="slide-copy">
    <p class="card-subtitle">
                <span class="card-category">${data.categories.join(", ")}</span>
               
</p><div class="callout">
  <div class="horizontal-line"></div>
  <div class="diagonal-line"></div>
</div>

        <p class="card-title">
          <span>${data.title || ''}</span>
          
        </p>
        <p class="card-subtitle">
          <span class="card-year">${data.year || '2024'}</span>
        </p>
      </div>
      
          <span class="card-description">${data.description || '2024'}</span>
        
    </div>
  `;
  
  slide.querySelector('.slide-img').appendChild(img);
  
  // Сохраняем ссылки на элементы выноски
  slide.leaderLine = slide.querySelector('.slide-leader-line');
  slide.copyElement = slide.querySelector('.slide-copy');
  
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
this.lenisManager.destroy();
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
    if (this._loopRunning) return;
    this._loopRunning = true;
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

    // start() is guarded, so this won't spawn a second rAF loop if the
    // original chain is still alive (it resumes automatically after bfcache).
    viewManager.start();
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


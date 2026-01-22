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
    
    this.filteredData = [];
    this.slides = { elements: [], state: [] };
    this.gridLines = this.generateGridLines();
    this.imagesLoaded = 0;
    this.totalImages = 0;
    
    // Add mobile device state
    this.isMobile = window.innerWidth <= 768;
  }
  
  generateGridLines() {
    const lines = [];
    for (let z = 0; z < CONFIG.DEPTH; z += CONFIG.GRID.HORIZONTAL_SIZE) {
      lines.push(z);
    }
    return lines;
  }
}

// ==========================
// ==========================
// 2. DOM Cache
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
    
    this.initBackgroundLayers();
    this.initLoader();
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
    // Set base color for gradients before applying gradient backgrounds
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
// ==========================
// 3. Data Manager (UPDATED - gradients added)
// ==========================
class DataManager {
  constructor() {
    this.allData = [
                              { 
        id: "project-10", 
        title: "SCHMALGAUZEN", 
        year: "2025",
        img: "/images/SC/SCHM-cover.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Merch"],
        projectUrl: "/projects/SCHMALGAUZEN.html",
        gradientColors: ["#ff2200ff", "#232347"] 
      },

      { 
        id: "project-2", 
        title: "K19", 
        year: "2025",
        img: "./images/k19/k19-sign-transparent.png", 
        imgSecondary: "./images/7 copy.jpg",
        categories: ["Branding"],
        projectUrl: "./projects/k19.html",
        gradientColors: ["#1a1a2e", "#ffa600ff"] 
      },
                  { 
        id: "project-6", 
        title: "X4 CLUB", 
        year: "2024",
        img: "./images/x4/x4-present.webp", 
        imgSecondary: "./images/Graphic-01.jpg",
        categories: ["Branding"],
        projectUrl: "./projects/x4.html",
        gradientColors: ["#1a1a2e", "#2d2d4d"] 
      },
      { 
        id: "project-3", 
        title: "Located", 
        year: "2023",
        img: "./images/LC/LC-logo-anim.gif", 
        imgSecondary: "./images/50.jpg",
        categories: ["Merch"],
        projectUrl: "./projects/LOCATED.html",
        gradientColors: ["#f51212ff", "#000000ff"] 
      },
                        { 
        id: "project-7", 
        title: "oO_series", 
        year: "2024",
        img: "./images/OO/OO-logo-animation.webp", 
        imgSecondary: "./images/50.jpg",
        categories: ["Interfaces", "Branding", "Graphic"],
        projectUrl: "/projects/o0series.html",
        gradientColors: ["#777777ff", "#33af61ff"] 
      },

            { 
        id: "project-1", 
        title: "TRADEMOTIONS", 
        year: "2021",
        img: "./images/TM/trademotions.webp", 
        imgSecondary: "./images/k19/trademotions.jpg",
        categories: ["Interfaces", "Branding"],
        projectUrl: "https://www.behance.net/gallery/201256117/Trading-Platform-interface-design",
        gradientColors: ["#c72626ff", "#f55f08ff"] 
      },

                              { 
        id: "project-4", 
        title: "Binary", 
        year: "2023",
        img: "./images/BN/BN-case-01.jpg", 
        imgSecondary: "./images/other/accemedin.jpg",
        categories: ["Merch"],
        projectUrl: "./projects/Binary.html",
        gradientColors: ["#010101", "#ffa21f"] 
      },
            { 
        id: "project-4", 
        title: "Parking App", 
        year: "2023",
        img: "/images/other/sharespot.jpg", 
        imgSecondary: "./images/other/accemedin.jpg",
        categories: ["Interfaces"],
        projectUrl: "https://www.behance.net/gallery/214943165/App-for-Parking-Exchange",
        gradientColors: ["#3434ff", "#2424c2"] 
      },

                  { 
        id: "project-4", 
        title: "50 inventions", 
        year: "2015",
        img: "./images/50/50-cover.jpg", 
        imgSecondary: "./images/other/accemedin.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/50inventions.html",
        gradientColors: ["#d53939", "#6fcd26"] 
      },

                        { 
        id: "project-4", 
        title: "Vognyar", 
        year: "2016",
        img: "./images/VG/vognyar-souses-07.jpg", 
        imgSecondary: "./images/other/accemedin.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/Vognyar.html",
        gradientColors: ["#010101", "#ff0a0a"] 
      },

                             { 
        id: "project-4", 
        title: "Jernov Jewellery", 
        year: "2016",
        img: "./images/JE/JE-broushure-cover.jpg", 
        imgSecondary: "./images/JE/JE-broushure-cover.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/jernov.html",
        gradientColors: ["#010101", "rgb(240, 235, 235)"] 
      },

            { 
        id: "project-3", 
        title: "RACONTEUR", 
        year: "2023",
        img: "./images/Vibe-Coding-4.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/Raconteur.html",
        gradientColors: ["#0f0f23", "#232347"] 
      },
      { 
        id: "project-3", 
        title: "The I-Ching", 
        year: "2023",
        img: "./images/Vibe-Coding-5.webp", 
        imgSecondary: "./images/50.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/The-I-Ching.html",
        gradientColors: ["#badc5bff", "#232347"] 
      },

      { 
        id: "project-3", 
        title: "Snedeker Yoga", 
        year: "2023",
        img: "./images/Vibe-Coding-2.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/Snedeker-Yoga.html",
        gradientColors: ["#e9d1a6ff", "#524c40ff"] 
      },

            { 
        id: "project-3", 
        title: "Dr. Gavrylin", 
        year: "2023",
        img: "./images/DG/DG-cover.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/Dr-Gavrylin.html",
        gradientColors: ["#e9d1a6ff", "#524c40ff"] 
      },

                  { 
        id: "project-3", 
        title: "Tripple We", 
        year: "2023",
        img: "./images/TW/TW-sign.png", 
        imgSecondary: "./images/50.jpg",
        categories: ["Branding"],
        projectUrl: "./projects/tripple-we.html",
        gradientColors: ["rgb(37, 128, 255)", "rgb(45, 53, 69)"] 
      },

      { 
        id: "project-5", 
        title: "INUPT SOFT", 
        year: "2020",
        img: "./images/other/Airport-Operations-Platform.png", 
        imgSecondary: "./images/AMOxLOCATED_tshitmockup_3new copy.jpg",
        categories: ["Interfaces"],
        projectUrl: "https://www.behance.net/gallery/213908009/Airport-Operations-Platform-Design",
        gradientColors: ["#ffe066ff", "#4a2c5e"] 
      },

      { 
        id: "project-5", 
        title: "Khmeli Suneli", 
        year: "2020",
        img: "./images/HS/HS-logo.jpg", 
        imgSecondary: "./images/AMOxLOCATED_tshitmockup_3new copy.jpg",
        categories: ["Branding"],
        projectUrl: "./projects/khmeli-suneli.html",
        gradientColors: ["#ffe066ff", "#4a2c5e"] 
      },


  

                        { 
        id: "project-8", 
        title: "Symerio", 
        year: "2014",
        img: "./images/SM/SM-logo-visitcard.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Branding"],
        projectUrl: "./projects/symerio.html",
        gradientColors: ["rgb(231, 146, 28)", "#232347"] 
      },


        { 
        id: "project-9", 
        title: "SAYENKO&KHARENKO", 
        year: "2017",
        img: "./images/SK/SK-mock.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Branding"],
        projectUrl: "./projects/SAYENKO&KHARENKO.html",
        gradientColors: ["#919191ff", "#232347"] 
      },
                  { 
        id: "project-8", 
        title: "Accemedin", 
        year: "2017",
        img: "./images/other/accemedin.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Interfaces"],
        projectUrl: "./projects/accemedin.html",
        gradientColors: ["rgb(220, 42, 6)", "#232347"] 
      },

                       { 
        id: "project-8", 
        title: "Lettering", 
        year: "2024",
        img: "./images/LT/LT-cover.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/Lettering.html",
        gradientColors: ["rgb(220, 42, 6)", "#232347"] 
      },


           { 
        id: "project-8", 
        title: "Art", 
        year: "2024",
        img: "./images/art/art-cover.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/art.html",
        gradientColors: ["rgb(39, 111, 255)", "#0f0fed"] 
      },

      { 
        id: "project-8", 
        title: "iii3", 
        year: "2024",
        img: "./images/iii3/iii3-cover.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/iii3.html",
        gradientColors: ["rgb(39, 111, 255)", "#0f0fed"] 
      },

          { 
        id: "project-8", 
        title: "Fundraising", 
        year: "2022",
        img: "./images/FD/FD-cover.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/Fundraising.html.html",
        gradientColors: ["rgb(0, 174, 255)", "#0f0fed"] 
      },

                { 
        id: "project-8", 
        title: "Dobro", 
        year: "2019",
        img: "./images/DB/DB-cover.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/dobro.html",
        gradientColors: ["rgb(0, 174, 255)", "#0f0fed"] 
      },

          { 
        id: "project-8", 
        title: "iii3", 
        year: "2024",
        img: "./images/iii3/iii3-cover.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/iii3.html",
        gradientColors: ["rgb(0, 174, 255)", "#0f0fed"] 
      },


                        { 
        id: "project-9", 
        title: "E-commerce App", 
        year: "2017",
        img: "./images/other/E-commerce-App.jpg", 
        imgSecondary: "./images/50.jpg",
        categories: ["Interfaces"],
        projectUrl: "https://www.behance.net/gallery/75716697/E-commerce-App",
        gradientColors: ["#919191ff", "#232347"] 
      },
                                  { 
        id: "project-4", 
        title: "GOGO bot", 
        year: "2021",
        img: "./images/other/gogo-bot.jpg", 
        imgSecondary: "./images/other/accemedin.jpg",
        categories: ["Graphic"],
        projectUrl: "./projects/gogo-bot.html",
        gradientColors: ["#010101", "#ff890a"] 
      }
      
    ];
    
  
    this.addDuplicatePreviews();
  }
  
  addDuplicatePreviews() {

    const additionalPreviews = [



    ];
    
    this.allData = [...this.allData, ...additionalPreviews];
  }
  
  filterData(filter) {
    if (filter === "allworks") {
      return [...this.allData];
    }
    return this.allData.filter(item => item.categories.includes(filter));
  }
  
  preloadImages(images, onProgress) {
    return new Promise((resolve) => {
      let loaded = 0;
      const total = images.length;
      
      if (total === 0) {
        resolve();
        return;
      }
      
      images.forEach((src, index) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loaded++;
          if (onProgress) {
            onProgress(loaded / total);
          }
          
          if (loaded === total) {
            setTimeout(resolve, 500);
          }
        };
        img.src = src;
      });
    });
  }
}

// ==========================
// 4. Lnis Manager (UPDATED - dynamic wheelMultiplier)
// ==========================
class LenisManager {
  constructor() {
    this.lenis = null;
    this.currentView = null;
  }
  
  init(viewType, itemCount) {
    
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
    
    const config = {
      lerp: CONFIG.LENIS.LERP,
      smoothWheel: CONFIG.LENIS.SMOOTH_WHEEL,
      touchMultiplier: CONFIG.LENIS.TOUCH_MULTIPLIER
    };
    
    //wheelMultiplier adjustment based on view type and item count
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
      //
      config.wheelMultiplier = CONFIG.LENIS.WHEEL_MULTIPLIER.BASE;
    }
    
    this.lenis = new Lenis(config);
    this.currentView = viewType;
    
    if (viewType === 'slides') {
      this.lenis.on("scroll", (e) => {
        appState.scroll.pos = e.scroll;
        appState.scroll.max = e.limit;
        appState.scroll.z = (appState.scroll.pos / appState.scroll.max) * 4000 * 2;
      });
    }
    
    return this.lenis;
  }
  
  start() {
    if (this.lenis) {
      this.lenis.start();
    }
  }
  
  stop() {
    if (this.lenis) {
      this.lenis.stop();
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
// 5. Manager View (UPDATED - mobile check, gradient backgrounds, project links)
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
    
    
    this.checkMobileDevice();
  }
  
  
  checkMobileDevice() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && this.state.view !== 'gallery') {
      
      this.setView('gallery', true);
    }
  }
  
  // ==========================
  // 5.1 Mouse Move
  // ==========================
  initMouse() {
    window.addEventListener("mousemove", (e) => {
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
    });
    
    // Keyboard navigation
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
  
  // ==========================
  // 5.2 Resize
  // ==========================
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
      }, 250);
    };
    
    window.addEventListener("resize", optimizedResize);
    window.addEventListener("orientationchange", optimizedResize);
  }
  
  resizeCanvas() {
    if (!this.dom.elements.canvas) return;
    this.dom.elements.canvas.width = window.innerWidth;
    this.dom.elements.canvas.height = window.innerHeight;
  }
  
  // ==========================
  // 5.3 Slides 
  // ==========================
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
    
    this.state.filteredData.forEach((data, i) => {
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
      
      gsap.set(slide, {
        position: "absolute",
        top: "30%",
        left: (i % 2 === 0 ? 35 : 50) + "%",
        xPercent: 20,
        yPercent: -50,
        transformStyle: "preserve-3d",
        willChange: "transform, opacity, filter"
      });
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
    
    const img = new Image();
    img.src = data.img;
    img.alt = data.title || '';
    img.loading = "lazy";
    img.onerror = () => {
      img.src = './images/fallback.jpg';
      img.alt = 'Image not loaded';
    };
    
    //   <span class="card-category">${data.categories.join(", ")}</span>
    slide.innerHTML = `
      <div class="slide-img">
        <!-- Image will be inserted -->
      </div>
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
    

slide.addEventListener('click', (e) => {
  if (!e.target.closest('a')) {
    const currentUrl = window.location.href;
    const projectUrl = data.projectUrl;
    
    const separator = projectUrl.includes('?') ? '&' : '?';
    const finalUrl = projectUrl + separator + 'referrer=' + encodeURIComponent(currentUrl);
    
    window.open(finalUrl, '_blank');
  }
});
    
    return slide;
  }
  
  // ==========================
  // 5.4 Gallery
  // ==========================
  buildGallery() {
    if (this.state.view !== "gallery") return;
    if (!this.dom.elements.gallery) return;
    
    this.dom.elements.gallery.innerHTML = "";
    
    if (this.state.filteredData.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "gallery-empty";
      emptyMessage.innerHTML = `
        <h3>No works found</h3>
        <p>Try selecting a different category or switch to "all works"</p>
      `;
      this.dom.elements.gallery.appendChild(emptyMessage);
      return;
    }
    
    const grid = document.createElement("div");
    grid.className = "gallery-grid";
    
    this.state.filteredData.forEach((data, i) => {
      const item = this.createGalleryItem(data, i);
      grid.appendChild(item);
    });
    
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
        <img data-src="${data.img}" alt="${data.title}" class="lazy-img">
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
  

  const currentUrl = window.location.href;
  const projectUrl = data.projectUrl;
  

  const separator = projectUrl.includes('?') ? '&' : '?';
  const finalUrl = projectUrl + separator + 'referrer=' + encodeURIComponent(currentUrl);
  
  console.log('Opening project with referrer:', finalUrl);
window.location.href = finalUrl;
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
            img.src = img.dataset.src;
            img.onerror = () => {
              img.src = './images/fallback.jpg';
              img.alt = 'Image not loaded';
            };
            img.removeAttribute('data-src');
            img.classList.remove('lazy-img');
          }
          this.lazyObserver.unobserve(entry.target);
        }
      });
    }, { 
      rootMargin: '50px',
      threshold: 0.1 
    });
    
    document.querySelectorAll('.gallery-item').forEach(item => {
      this.lazyObserver.observe(item);
    });
  }
  
  // ==========================
  // 5.5 BG Image Management
  // ==========================
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
    

    const applyTransition = () => {

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
    };
    

    applyTransition();
  }
  
  createGradient(colors) {

    const [color1, color2] = colors;
    return `radial-gradient(circle at center, ${color1} 0%, ${color2} 100%)`;
  }
  
  // ==========================
  // 5.6 Update Slides
  // ==========================
  updateSlides() {
    if (this.state.view !== "slides") return;
    if (this.state.slides.elements.length === 0) return;
    
    const progress = this.snappedProgress(this.state.scroll.pos / this.state.scroll.max, 0.1);
    const totalDepth = (this.state.filteredData.length - 1) * CONFIG.Z_GAP;
    const cameraZ = -CONFIG.START_OFFSET + progress * (totalDepth + CONFIG.START_OFFSET);
    
    let bestIdx = -1;
    let bestDist = Infinity;
    
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
      
      this.state.slides.state[idx].opacity = Math.max(0, Math.min(1, 1 - dist / 380));
      this.state.slides.state[idx].scale = Math.max(0.4, Math.min(1.2, 1.2 - (dist / 400) * 0.8));
      this.state.slides.state[idx].parallaxX = this.state.mouse.nx * CONFIG.MOUSE_SENSITIVITY.X;
      this.state.slides.state[idx].parallaxY = this.state.mouse.ny * CONFIG.MOUSE_SENSITIVITY.Y;
      
      slide.style.transform = `
        translate3d(${this.state.slides.state[idx].parallaxX}vw, ${this.state.slides.state[idx].parallaxY}vh, ${-relativeZ}px)
        rotateY(${this.state.mouse.nx * CONFIG.MOUSE_SENSITIVITY.ROTATION}deg)
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
  
  // ==========================
  // 5.7 Grid Drawing
  // ==========================
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
  
  // ==========================
  // 5.8  Set Filter & View
  // ==========================
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
    // уведомляем UI (dropdown, future stuff)
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
  
  // ==========================
  // 5.9  Initialization
  // ==========================
  async init() {
    this.initMouse();
    this.initResize();
    
    this.state.isLoading = true;
    
    const allImages = this.dataManager.allData.map(item => item.img);
    await this.dataManager.preloadImages(allImages, (progress) => {
      this.dom.updateLoaderProgress(progress * 100);
    });
    
    this.parseInitialState();
    
    this.applyInitialUIState();
    
    this.state.isLoading = false;
    this.dom.hideLoader();
    
    this.initEventListeners();
    
    this.rebuildCurrentView();
    
    if (this.state.view === 'slides' && this.state.filteredData.length > 0) {
      requestAnimationFrame(() => {
        this.setBackgroundImage(0, true);
      });
    }
  }
  
  parseInitialState() {
    const hash = window.location.hash.replace('#', '');
    
    let filter = 'allworks';
    let view = 'slides';
    
    if (!hash) {
      this.state.filter = filter;
      this.state.view = view;
      this.state.filteredData = this.dataManager.filterData(filter);
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
    // Typed.js для описания дизайнера
/*let typedInstance;
const myhead = document.getElementById("myhead");
const autoTypeEl = myhead.querySelector(".auto-type");

myhead.addEventListener("mouseenter", () => {
  if (typedInstance) typedInstance.destroy();
  autoTypeEl.textContent = "";
  
  typedInstance = new Typed(".auto-type", {
    strings: [  "Product Designer",
  "Graphic Director",
  "Kyiv-based"],
    typeSpeed: 70,
    backSpeed: 30,
    showCursor: true,
    cursorChar: "|",
    loop: true
  });
});

myhead.addEventListener("mouseleave", () => {
  if (typedInstance) typedInstance.destroy();
  typedInstance = null;
  autoTypeEl.textContent = "";
}); */

}
  
  applyInitialUIState() {
    // === NAV FILTERS
    this.dom.elements.navLinks.forEach(link => {
      link.classList.toggle(
        'active-filter',
        link.dataset.filter === this.state.filter
      );
    });
    
    // === VIEW SWITCHER BUTTONS
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
    
    // === BODY + CANVAS
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
  
  // ==========================
  // 5.10 Main Loop
  // ==========================
  mainLoop(time) {
    if (this.state.isLoading) {
      requestAnimationFrame((t) => this.mainLoop(t));
      return;
    }
    
 
    if (this.lenisManager.lenis) {
      this.lenisManager.lenis.raf(time);
    }
    
    if (this.state.view === "slides") {
      this.updateSlides();
      this.drawGrid();
    }
    
    requestAnimationFrame((t) => this.mainLoop(t));
  }
  
  start() {
    requestAnimationFrame((t) => this.mainLoop(t));
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
    domCache.hideLoader();
  }
});

// ==========================
// 7. Global helpers
// ==========================
window.App = {
  getState: () => appState,
  getViewManager: () => viewManager,
  switchToGallery: () => viewManager.setView('gallery'),
  switchToTunnel: () => viewManager.setView('slides'),
  setFilter: (filter) => viewManager.setFilter(filter)
};

// ==========================
// 8. Mobile Filter Dropdown
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  const dropdown = document.querySelector('[data-nav-dropdown]');
  if (!dropdown) return;

  const toggle = dropdown.querySelector('.nav-dropdown-toggle');
  const label = dropdown.querySelector('.nav-dropdown-label');
  const items = dropdown.querySelectorAll('[data-filter]');

  toggle.addEventListener('click', () => {
    dropdown.classList.toggle('open');
  });

  items.forEach(item => {
    item.addEventListener('click', () => {
      const filter = item.dataset.filter;

      // 🔑 ВХОД В ТВОЮ СИСТЕМУ
      window.App.setFilter(filter);

      label.textContent = item.textContent;
      dropdown.classList.remove('open');
    });
  });

  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  // === начальная синхронизация
  const state = window.App.getState();
  const active = dropdown.querySelector(
    `[data-filter="${state.filter}"]`
  );
  if (active) label.textContent = active.textContent;

  // === синхронизация при изменении фильтра извне
  document.addEventListener('filterchange', e => {
    const filter = e.detail;
    const item = dropdown.querySelector(`[data-filter="${filter}"]`);
    if (item) label.textContent = item.textContent;
  });
});

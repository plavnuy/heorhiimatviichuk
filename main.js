// ==========================
// 0. Конфигурация
// ==========================
const CONFIG = {
  Z_GAP: 200,
  START_OFFSET: 0,
  DEPTH: 4000,
  BG_FADE_DURATION: 1,
  BG_OPACITY: 0.2,
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
const IS_MOBILE = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent) || 
                  window.innerWidth <= 768;
const MOBILE_ONLY_GALLERY = IS_MOBILE; // Флаг для принудительной галереи на мобильных
// ==========================
// 1. Глобальное состояние
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
// 2. Дом кэш
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
    this.elements.bgA.style.backgroundColor = '#0b0b0b';
    this.elements.bgB.style.backgroundColor = '#0b0b0b';
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
// 3. Менеджер данных
// ==========================
class DataManager {
  constructor() {
    this.allData = [
      { title: "2", img: "./images/2.jpg", categories: ["interfaces"] },
      { title: "7 Copy", img: "./images/7 copy.jpg", categories: ["interfaces"] },
      { title: "50", img: "./images/50.jpg", categories: ["interfaces"] },
      { title: "Accemedin", img: "./images/accemedin.jpg", categories: ["interfaces"] },
      { title: "AMOxLOCATED T-Shirt Mockup", img: "./images/AMOxLOCATED_tshitmockup_3new copy.jpg", categories: ["branding", "art"] },
      { title: "Art 01", img: "./images/art-01.jpg", categories: ["art"] },
      { title: "Biomass", img: "./images/biomass.jpg", categories: ["branding"] },
      { title: "Delfast", img: "./images/delfast.jpg", categories: ["branding"] },
      { title: "Dobro", img: "./images/dobro.jpg", categories: ["branding"] },
      { title: "Egg", img: "./images/egg.jpg", categories: ["art"] },
      { title: "Frame 1225", img: "./images/Frame 1225.jpg", categories: ["photo"] },
      { title: "Frame 1283", img: "./images/Frame 1283.png", categories: ["photo"] },
      { title: "Gogo Bot Avatar", img: "./images/gogo_bot_avatar.png", categories: ["art"] },
      { title: "Hmelisoneli", img: "./images/hmelisoneli.jpg", categories: ["branding"] },
      { title: "HRAM: LOCATED Color Reference", img: "./images/HRAM:LOCATED_color_reference.jpg", categories: ["branding"] },
      { title: "III3 Cover", img: "./images/iii3_cover.png", categories: ["branding"] },
      { title: "Jernov", img: "./images/jernov.jpg", categories: ["branding"] },
      { title: "K19 Dase A3 Poster", img: "./images/K19-Dase_a3_poster.jpg", categories: ["branding"] },
      { title: "Liminal", img: "./images/liminal.jpg", categories: ["art"] },
      { title: "Manifest", img: "./images/manifest.jpg", categories: ["art"] },
      { title: "Martini", img: "./images/martini.jpg", categories: ["branding"] },
      { title: "Mitus", img: "./images/mitus.jpg", categories: ["interfaces"] },
      { title: "Recovered Mock", img: "./images/mock-Recovered_.jpg", categories: ["branding"] },
      { title: "Mockup", img: "./images/Mockup.jpg", categories: ["branding"] },
      { title: "Nigredo", img: "./images/nigredo.png", categories: ["art"] },
      { title: "Plate (Alt)", img: "./images/plate copy.jpg", categories: ["branding"] },
      { title: "Plate", img: "./images/plate.jpg", categories: ["branding"] },
      { title: "PM Kit", img: "./images/pmkit.jpg", categories: ["interfaces"] },
      { title: "PRODJ 2019", img: "./images/PRODJ-2019.jpg", categories: ["branding"] },
      { title: "Roma Yurchak", img: "./images/roma_yurchak.jpg", categories: ["photo"] },
      { title: "Saenkoharenko", img: "./images/saenkoharenko.jpg", categories: ["photo"] },
      { title: "Screen Shot 2019", img: "./images/Screen Shot 2019-04-11 at 17.00.49.png", categories: ["photo"] },
      { title: "Screenshot 2024-07-10 00:16", img: "./images/Screenshot 2024-07-10 at 00.16.04.png", categories: ["photo"] },
      { title: "Screenshot 2024-07-10 00:16:28", img: "./images/Screenshot 2024-07-10 at 00.16.28.png", categories: ["photo"] },
      { title: "Screenshot 2024-07-10 00:16:51", img: "./images/Screenshot 2024-07-10 at 00.16.51.png", categories: ["photo"] },
      { title: "Sharespot", img: "./images/sharespot.jpg", categories: ["interfaces"] },
      { title: "Shm Poster A3 Print", img: "./images/Shm_poster_a3_print.jpg", categories: ["branding"] },
      { title: "Shmalgauzen Tviy Vill", img: "./images/Shmalgauzen_TviyVill_1350х1080.jpg", categories: ["art"] },
      { title: "Sinners", img: "./images/sinners.jpg", categories: ["art"] },
      { title: "Slice 8", img: "./images/Slice 8.png", categories: ["art"] },
      { title: "Sof Brama", img: "./images/sof_brama.jpg", categories: ["branding"] },
      { title: "Son", img: "./images/son.jpg", categories: ["art"] },
      { title: "Triple We", img: "./images/tripplewe.jpg", categories: ["branding"] },
      { title: "Tube Mock", img: "./images/Tube_mock.jpg", categories: ["branding", "art"] },
      { title: "Twog", img: "./images/twog.jpg", categories: ["branding"] },
      { title: "Vartis", img: "./images/vartis.jpg", categories: ["branding"] },
      { title: "X4", img: "./images/x4.jpg", categories: ["branding"] }
    ];
  }
  
  filterData(filter) {
    if (filter === "allworks") {
      return [...this.allData];
    }
    return this.allData.filter(item => item.categories.includes(filter));
  }
  
// В классе DataManager замените метод preloadImages:
preloadImages(images, onProgress) {
    return new Promise((resolve) => {
        if (images.length === 0) {
            resolve();
            return;
        }
        
        let loaded = 0;
        const total = images.length;
        
        // ⬇⬇⬇ ДОБАВЬТЕ: лимит одновременных загрузок для мобильных ⬇⬇⬇
        const MAX_CONCURRENT = navigator.userAgent.match(/mobile/i) ? 2 : 4;
        let active = 0;
        let index = 0;
        
        const loadNext = () => {
            while (active < MAX_CONCURRENT && index < total) {
                active++;
                const img = new Image();
                const src = images[index];
                index++;
                
                img.onload = img.onerror = () => {
                    loaded++;
                    active--;
                    
                    // Освобождаем память
                    img.src = '';
                    
                    if (onProgress) {
                        onProgress(loaded / total);
                    }
                    
                    if (loaded === total) {
                        setTimeout(resolve, 300);
                    } else if (index < total) {
                        loadNext();
                    }
                };
                
                // Добавляем timeout для избежания зависания
                setTimeout(() => {
                    if (img.complete === false) {
                        img.src = '';
                        img.onload = img.onerror = null;
                        active--;
                        loaded++;
                        if (onProgress) onProgress(loaded / total);
                        if (loaded === total) setTimeout(resolve, 300);
                        else loadNext();
                    }
                }, 10000); // 10 секунд таймаут
                
                img.src = src;
            }
        };
        
        loadNext();
        // ⬆⬆⬆ ДОБАВЬТЕ ЭТОТ БЛОК ⬆⬆⬆
    });
}
}

// ==========================
// 4. Ленис менеджер
// ==========================
class LenisManager {
  constructor() {
    this.lenis = null;
    this.currentView = null;
  }
  
  init(viewType, itemCount) {
    // Уничтожаем старый экземпляр
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
    
    const config = {
      lerp: CONFIG.LENIS.LERP,
      smoothWheel: CONFIG.LENIS.SMOOTH_WHEEL,
      touchMultiplier: CONFIG.LENIS.TOUCH_MULTIPLIER
    };
    
    // Настраиваем wheelMultiplier в зависимости от количества элементов
    if (viewType === 'slides') {
      let wheelMultiplier;
      if (itemCount <= 5) {
        wheelMultiplier = CONFIG.LENIS.WHEEL_MULTIPLIER.MAX;
      } else if (itemCount >= 20) {
        wheelMultiplier = CONFIG.LENIS.WHEEL_MULTIPLIER.MIN;
      } else {
        const ratio = itemCount / 20; // нормализуем к 20 элементам
        wheelMultiplier = CONFIG.LENIS.WHEEL_MULTIPLIER.MIN + 
                         (CONFIG.LENIS.WHEEL_MULTIPLIER.MAX - CONFIG.LENIS.WHEEL_MULTIPLIER.MIN) * (1 - ratio);
      }
      config.wheelMultiplier = wheelMultiplier;
    } else {
      // Для галереи используем стандартный множитель
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
// 5. Менеджер видов
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
  }
  
  // ==========================
  // 5.1 Мышь
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
  // 5.2 Ресайз
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
  // 5.3 Слайды
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
      emptySlide.innerHTML = `<p>No works found in this category</p>`;
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
    
    // Инициализируем Lenis для слайдов
    this.lenisManager.init('slides', this.state.filteredData.length);
    this.lenisManager.start();
    // форс первого фона



  }
  
  createSlideElement(data, index) {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.dataset.index = index;
    slide.dataset.baseZ = index * CONFIG.Z_GAP;
    
    const img = new Image();
    img.src = data.img;
    img.alt = data.title || '';
    img.loading = "lazy";
    img.onerror = () => {
      img.src = './images/fallback.jpg';
      img.alt = 'Image not loaded';
    };
    
    slide.innerHTML = `
      <div class="slide-img">
        <!-- Image will be inserted -->
      </div>
      <div class="slide-copy">
        <p class="card-title">
          <span>${data.title || ''}</span>
        </p>
        <p class="card-subtitle">
          <span>${data.categories.join(", ")}</span>
        </p>
      </div>
    `;
    
    slide.querySelector('.slide-img').appendChild(img);
    
    // Открытие в новой вкладке
    slide.addEventListener('click', (e) => {
      if (!e.target.closest('a')) {
        window.open(data.img, '_blank');
      }
    });
    
    return slide;
  }
  
  // ==========================
  // 5.4 Галерея
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
    
    // Инициализируем Lenis для галереи
    this.lenisManager.init('gallery', this.state.filteredData.length);
    this.lenisManager.start();
  }
  
  createGalleryItem(data, index) {
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
        <div class="g-sub">${data.categories.join(", ")}</div>
      </div>
    `;
    
    item.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(data.img, '_blank');
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
// 5.5 Фон (ИСПРАВЛЕННАЯ ВЕРСИЯ)
// ==========================
setBackgroundImage(index, immediate = false) {
    // 1. Проверяем возможность смены
    if (this.state.view === "gallery") return;
    if (index < 0 || index >= this.state.filteredData.length) return;
    if (index === this.state.bg.currentIndex && !immediate) return;
    
    // 2. Сбрасываем таймер (теперь не нужен)
    if (this.bgChangeTimeout) {
        clearTimeout(this.bgChangeTimeout);
        this.bgChangeTimeout = null;
    }
    
    // 3. Обновляем состояние
    this.state.bg.currentIndex = index;
    const src = this.state.filteredData[index].img;
    
    // 4. Определяем активный/неактивный слой
    const activeIdx = this.state.bg.active;
    const nextIdx = 1 - activeIdx;
    const activeEl = activeIdx === 0 ? this.dom.elements.bgA : this.dom.elements.bgB;
    const nextEl = nextIdx === 0 ? this.dom.elements.bgA : this.dom.elements.bgB;
    
    // 5. Останавливаем ВСЕ предыдущие анимации фона
    gsap.killTweensOf([this.dom.elements.bgA, this.dom.elements.bgB]);
    
    // 6. Быстрая установка для первого фона
    if (immediate) {
        nextEl.style.backgroundImage = `url("${src}")`;
        nextEl.style.opacity = CONFIG.BG_OPACITY.toString();
        activeEl.style.opacity = '0';
        this.state.bg.active = nextIdx;
        this.preloadNextBackground(index);
        return;
    }
    
    // 7. Плавная смена
    const img = new Image();
    
    const applyTransition = () => {
        // 7.1 Устанавливаем новое изображение в неактивный слой
        nextEl.style.backgroundImage = `url("${src}")`;
        
        // 7.2 Одновременная анимация обоих слоёв
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
                // 7.3 После завершения обновляем активный слой
                this.state.bg.active = nextIdx;
                this.preloadNextBackground(index);
            }
        });
    };
    
    // 8. Предзагрузка перед анимацией
    if (img.complete) {
        applyTransition();
    } else {
        img.onload = applyTransition;
        img.onerror = () => {
            console.warn(`Не удалось загрузить фоновое изображение: ${src}`);
            applyTransition(); // Показываем хотя бы чёрный фон
        };
        img.src = src;
    }
}
  
  // ==========================
  // 5.6 Обновление слайдов
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
// 5.7 Сетка (нижняя)
// ==========================
drawGrid() {
  if (!this.dom.elements.context || !this.dom.elements.canvas) return;
  
  const ctx = this.dom.elements.context;
  const canvas = this.dom.elements.canvas;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Плавное движение мыши для сетки
  this.state.mouse.targetX += (this.state.mouse.nx * 100 - this.state.mouse.targetX) * 0.2;
  this.state.mouse.targetY += (this.state.mouse.ny * 100 - this.state.mouse.targetY) * 0.2;
  
  const mx = this.state.mouse.targetX;
  const my = this.state.mouse.targetY;
  
  // ВЕРХНИЕ горизонтальные линии (y = -600)
  this.state.gridLines.forEach(z => {
    let zOffset = (z - this.state.scroll.z % CONFIG.DEPTH + CONFIG.DEPTH) % CONFIG.DEPTH + 50;
    const fade = 1 - zOffset / CONFIG.GRID.FADE_RANGE;
    
    // Верхняя линия
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
    
    // НИЖНЯЯ линия (y = 600) - добавлено
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
  
  // Вертикальные линии
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
  
  // Верхняя часть вертикальной линии (от -600 до 0)
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
  
  // Нижняя часть вертикальной линии (от 0 до 600) - исправлено
  const pNearBot = this.project3D(x, 800, zNear, mx, my);
  const pFarBot = this.project3D(x, 800, zFar, mx, my);
  
  const gradBot = ctx.createLinearGradient(0, pNearBot.y, 0, pFarBot.y); // исправлен порядок
  gradBot.addColorStop(0, `rgba(255,255,255,0.18)`); // исправлено: начинаем с 0.18
  gradBot.addColorStop(0.4, `rgba(255,255,255,0.08)`);
  gradBot.addColorStop(1, `rgba(255,255,255,0)`); // заканчиваем 0
  
  ctx.strokeStyle = gradBot;
  ctx.beginPath();
  ctx.moveTo(pNearBot.x, pNearBot.y);
  ctx.lineTo(pFarBot.x, pFarBot.y);
  ctx.stroke();
}
  
  // ==========================
  // 5.8 Управление видами
  // ==========================
setFilter(filter) {
    if (this.state.filter === filter) return;
    
    // СБРАСЫВАЕМ СКРОЛЛ ПЕРЕД СМЕНОЙ ФИЛЬТРА
    if (this.lenisManager.lenis) {
        this.lenisManager.lenis.scrollTo(0, { immediate: true });
    }
    
    this.state.filter = filter;
    this.state.filteredData = this.dataManager.filterData(filter);
    
    // Сбрасываем позицию скролла в состоянии
    this.state.scroll.pos = 0;
    this.state.scroll.z = 0;
    
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
    
    // СБРАСЫВАЕМ СКРОЛЛ ПЕРЕД СМЕНОЙ ВИДА
    if (this.lenisManager.lenis) {
        this.lenisManager.lenis.scrollTo(0, { immediate: true });
    }
    
    // Сбрасываем позицию скролла в состоянии
    this.state.scroll.pos = 0;
    this.state.scroll.z = 0;
    
    
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
    
    this.dom.elements.viewSwitcher.setAttribute('data-active-view', view);
    
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
  // 5.9 Инициализация
  // ==========================
async init() {
      const loadTimeout = setTimeout(() => {
        console.warn('Загрузка заняла слишком много времени, пропускаем...');
        this.state.isLoading = false;
        this.dom.hideLoader();
        this.rebuildCurrentView();
    }, 15000);
    this.initMouse();
    this.initResize();

    this.state.isLoading = true;


    // Новая версия: предзагружаем ТОЛЬКО необходимое для текущего вида
    if (this.state.view === 'slides') {
        // Для слайдов: только первые 5-7 изображений
        const firstImages = this.state.filteredData.slice(0, 7).map(item => item.img);
        await this.dataManager.preloadImages(firstImages, (progress) => {
            this.dom.updateLoaderProgress(progress * 100);
        });
    } else {
        // Для галереи: первые 10-12 изображений
        const firstImages = this.state.filteredData.slice(0, 12).map(item => item.img);
        await this.dataManager.preloadImages(firstImages, (progress) => {
            this.dom.updateLoaderProgress(progress * 100);
        });
    }

    // 2. парсим URL → state
    this.parseInitialState();

    // 3. синхронизируем UI ← state
    this.applyInitialUIState();

    // 4. скрываем лоадер
    this.state.isLoading = false;
    this.dom.hideLoader();

    // 5. биндим события
    this.initEventListeners();

    // 6. строим корректный view
    this.rebuildCurrentView();

    // 7. форс первого фона ТОЛЬКО для slides
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
  // 5.10 Главный цикл
  // ==========================
  mainLoop(time) {
    if (this.state.isLoading) {
      requestAnimationFrame((t) => this.mainLoop(t));
      return;
    }
    
    // Обновляем Lenis
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
// 6. Инициализация приложения
// ==========================
let appState, domCache, dataManager, viewManager;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Создаем экземпляры
    appState = new AppState();
    domCache = new DOMCache().init();
    dataManager = new DataManager();
    viewManager = new ViewManager(appState, domCache, dataManager);
    
    // Инициализируем
    await viewManager.init();
    
    // Запускаем главный цикл
    viewManager.start();
    
    console.log('3D Gallery initialized successfully');
  } catch (error) {
    console.error('Failed to initialize gallery:', error);
    domCache.hideLoader();
  }
});

// ==========================
// 7. Глобальные хелперы
// ==========================
window.App = {
  getState: () => appState,
  getViewManager: () => viewManager,
  switchToGallery: () => viewManager.setView('gallery'),
  switchToTunnel: () => viewManager.setView('slides'),
  setFilter: (filter) => viewManager.setFilter(filter)
};
// ==========================
// Component Loader
// ==========================
class ComponentLoader {
  constructor() {
    this.components = new Map();
  }

  async loadComponent(id, filePath) {
    if (this.components.has(id)) {
      return this.components.get(id);
    }

    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}`);
    }

    const html = await response.text();
    this.components.set(id, html);
    return html;
  }

async renderComponent(elementId, filePath) {
  const html = await this.loadComponent(elementId, filePath);
  const element = document.getElementById(elementId);
  if (!element) return;

  element.innerHTML = html;

  if (elementId === 'header-component') {
    initBackButton();

    // --- Добавляем трек кликов на контакты ---
    const contactLinks = element.querySelectorAll('.contact-icons a');
    contactLinks.forEach(link => {
      link.addEventListener('click', () => {
        const method = link.dataset.method || link.getAttribute('aria-label') || link.href;
        console.log('Contact clicked:', method);
        gtag('event', 'contact_click', { 'contact_method': method });
      });
    });
  }
}
}

// ==========================
// Global Variables
// ==========================
let pageTransition;

// ==========================
// Page Transition Functions
// ==========================
function enterPage() {
  if (!pageTransition) {
    pageTransition = document.getElementById('page-transition');
  }
  
  if (pageTransition) {
    // Убираем transition для моментального показа
    pageTransition.style.transition = 'none';
    pageTransition.classList.add('is-entering');
    
    // Даем браузеру время применить класс
    requestAnimationFrame(() => {
      // Возвращаем transition и запускаем анимацию
      pageTransition.style.transition = '';
      pageTransition.classList.remove('is-entering');
      pageTransition.classList.add('is-entered');
      
      // Через время убираем transition
      setTimeout(() => {
        pageTransition.classList.remove('is-entered');
      }, 550);
    });
  }
}

function leavePage({ url = null, historyBack = false } = {}) {
  if (!pageTransition) {
    pageTransition = document.getElementById('page-transition');
  }
  
  if (pageTransition) {
    pageTransition.classList.remove('is-entered');
    pageTransition.classList.add('is-leaving');
    
    setTimeout(() => {
      if (historyBack) {
        history.back();
      } else if (url) {
        window.location.href = url;
      }
    }, 550);
  } else {
    // Fallback если transition не найден
    if (historyBack) {
      history.back();
    } else if (url) {
      window.location.href = url;
    }
  }
}

// ==========================
// Init on load
// ==========================
document.addEventListener('DOMContentLoaded', async () => {
  const loader = new ComponentLoader();

  await Promise.all([
    loader.renderComponent('header-component', '/components/header.html'),
    loader.renderComponent('footer-component', '/components/footer.html'),
    loader.renderComponent('project-nav-component', '/components/project-nav.html')
  ]);

  // Инициализируем page transition
  pageTransition = document.getElementById('page-transition');

  // Инициализируем галерею
  await initProjectGallery();

  // Лоадер/скелетон
  initMediaLoader();

  // Плавное появление контента
  document.body.style.opacity = 1;

  // Запускаем анимацию входа
  enterPage();
});


// ==========================
// Back Button (header)
// ==========================
function initBackButton() {
  const backLink = document.getElementById('back-link');

  if (!backLink) {
    setTimeout(initBackButton, 100);
    return;
  }

  backLink.addEventListener('click', e => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const referrer = params.get('referrer');

    if (referrer) {
      leavePage({ url: decodeURIComponent(referrer) });
      return;
    }

    if (history.length > 1) {
      leavePage({ historyBack: true });
      return;
    }

    leavePage({ url: '../index.html' });
  });
}

// ==========================
// Intercept internal links
// ==========================
document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;

  const href = link.getAttribute('href');

  if (
    !href ||
    href.startsWith('#') ||
    link.target === '_blank' ||
    link.hasAttribute('data-no-transition')
  ) return;

  e.preventDefault();
  leavePage({ url: href });
});

// ==========================
// Typed.js
// ==========================
let typedInstance;

function initTypedJS() {
  const myhead = document.getElementById('myhead');
  
  if (myhead && typeof Typed !== 'undefined') {
    const autoTypeEl = myhead.querySelector('.auto-type');

    myhead.addEventListener('mouseenter', () => {
      if (typedInstance) typedInstance.destroy();
      if (autoTypeEl) autoTypeEl.textContent = '';

      typedInstance = new Typed('.auto-type', {
        strings: [
          'Product Designer',
          'Art Director',
          'Kyiv-based'
        ],
        typeSpeed: 70,
        backSpeed: 30,
        showCursor: true,
        cursorChar: '|',
        loop: true
      });
    });

    myhead.addEventListener('mouseleave', () => {
      if (typedInstance) typedInstance.destroy();
      typedInstance = null;
      if (autoTypeEl) autoTypeEl.textContent = '';
    });
  } else if (!myhead) {
    // Если myhead ещё не загружен, пробуем позже
    setTimeout(initTypedJS, 100);
  }
}

// Инициализируем Typed.js после загрузки компонентов
document.addEventListener('DOMContentLoaded', () => {
  // Ждем немного для гарантии загрузки компонентов
  setTimeout(initTypedJS, 500);
});

// ==========================
// PhotoSwipe Gallery
// ==========================
let PhotoSwipeModule;

function getImageDimensions(img) {
  return new Promise(resolve => {
    if (img.complete && img.naturalWidth) {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    } else {
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    }
  });
}

function getVideoDimensions(video) {
  if (video.videoWidth && video.videoHeight) {
    return Promise.resolve({ w: video.videoWidth, h: video.videoHeight });
  }

  const attrW = parseInt(video.getAttribute('width'));
  const attrH = parseInt(video.getAttribute('height'));
  if (attrW && attrH) {
    return Promise.resolve({ w: attrW, h: attrH });
  }

  return new Promise(resolve => {
    const timeout = setTimeout(() => resolve({ w: 1920, h: 1080 }), 300);
    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      resolve({ w: video.videoWidth, h: video.videoHeight });
    };
  });
}

async function buildItems(nodes) {
  return Promise.all(Array.from(nodes).map(async node => {
    if (node.tagName === 'IMG') {
      const { w, h } = await getImageDimensions(node);
      return { type: 'image', src: node.src, w, h, el: node };
    } else if (node.tagName === 'VIDEO') {
      const { w, h } = await getVideoDimensions(node);
      const videoSrc = node.querySelector('source')?.src || node.src;
      return {
        type: 'html', w, h,
        html: `<div class="pswp-video-wrapper">
          <video src="${videoSrc}" controls autoplay muted playsinline
            style="width:100%;height:100%;"></video>
        </div>`,
        el: node
      };
    }
  }));
}
async function initProjectGallery() {
  // --- Подключаем CSS PhotoSwipe ---
  if (!document.getElementById('photoswipe-css')) {
    const link = document.createElement('link');
    link.id = 'photoswipe-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/photoswipe@5/dist/photoswipe.css';
    document.head.appendChild(link);
  }

  // --- Импорт PhotoSwipe ESM ---
  if (!PhotoSwipeModule) {
    PhotoSwipeModule = (await import(
      'https://unpkg.com/photoswipe@5/dist/photoswipe.esm.js'
    )).default;
  }

  // --- Выбираем все медиа ---
  const nodes = document.querySelectorAll('.project-image img, .project-image video, .loop-video');
  if (!nodes.length) return;

  // --- Ждем загрузки изображений и видео для правильных размеров ---


  // --- Строим items ---
  const items = await buildItems(nodes);

  // --- Навешиваем клик для открытия PhotoSwipe ---
  nodes.forEach((node, index) => {
    node.style.cursor = 'zoom-in';
    node.addEventListener('click', () => {
      const pswp = new PhotoSwipeModule({
        dataSource: items,
        index,
        zoom: false,
        bgOpacity: 0.96,
        showHideAnimationType: 'fade',
        wheelToZoom: true
      });
      pswp.init();
    });
  });
}


// ==========================
// Controls Manager 
// ==========================

document.addEventListener('DOMContentLoaded', () => {

  const checkTyped = setInterval(() => {
    if (typeof Typed !== 'undefined') {
      clearInterval(checkTyped);
      initTypedJS();
    }
  }, 100);
  

  setTimeout(() => {
    if (typeof ControlsManager !== 'undefined') {
      window.controlsManager = new ControlsManager();
    }
  }, 600);
});


document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(
    ".project-article .content-section:not(:first-of-type) img"
  ).forEach(img => {
    if (!img.hasAttribute("loading")) {
      img.setAttribute("loading", "lazy");
    }
  });
});


function initMediaLoader() {
  const mediaNodes = document.querySelectorAll('.project-image img, .project-image video');


  let imgCount = 0;

  mediaNodes.forEach(node => {
    const wrapper = node.closest('.project-image');
    if (!wrapper) return;

    const markLoaded = () => wrapper.classList.add('loaded');

    if (node.tagName === 'IMG') {
      imgCount++;


      if (imgCount <= 3) {
        node.removeAttribute('loading');
        node.setAttribute('loading', 'eager');
        node.setAttribute('fetchpriority', 'high');
      }

      if (node.complete && node.naturalWidth) {
        markLoaded();
      } else {
        node.addEventListener('load', markLoaded);

        setTimeout(markLoaded, 4000);
      }
    }

    if (node.tagName === 'VIDEO') {

      markLoaded();
      node.addEventListener('loadeddata', () => wrapper.classList.add('loaded'));
    }
  });
}


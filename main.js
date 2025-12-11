



let mouseNX = 0, mouseNY = 0;
// ====== 0. Глобалка для корня (для CSS-переменных ховера / градиента)
const root = document.documentElement;

// ====== 1. Слушатель мыши (ОДИН раз)
window.addEventListener("mousemove", (e) => {
	const cx = window.innerWidth / 2;
	const cy = window.innerHeight / 2;

	mouseNX = (e.clientX - cx) / cx; // -1..1
	mouseNY = (e.clientY - cy) / cy; // -1..1

	// обновляем CSS custom properties для градиентов/рамок,
	// но не трогаем DOM для каждого слайда
	const angle = (Math.atan2(mouseNY, mouseNX) * 180 / Math.PI + 360) % 360;
	root.style.setProperty("--mx", mouseNX.toFixed(3));
	root.style.setProperty("--my", mouseNY.toFixed(3));
	root.style.setProperty("--angle", angle.toFixed(1) + "deg");
});


/* ============ 1. Конфиг ============ */
const slidesData = [
  { title:"2", img:"./images/2.jpg", categories:["interfaces"] },
  { title:"7 Copy", img:"./images/7 copy.jpg", categories:["interfaces"] },
  { title:"50", img:"./images/50.jpg", categories:["interfaces"] },

  { title:"Accemedin", img:"./images/accemedin.jpg", categories:["interfaces"] },
  { title:"AMOxLOCATED T-Shirt Mockup", img:"./images/AMOxLOCATED_tshitmockup_3new copy.jpg", categories:["branding","art"] },

  { title:"Art 01", img:"./images/art-01.jpg", categories:["art"] },
  { title:"Biomass", img:"./images/biomass.jpg", categories:["branding"] },
  { title:"Delfast", img:"./images/delfast.jpg", categories:["branding"] },
  { title:"Dobro", img:"./images/dobro.jpg", categories:["branding"] },
  { title:"Egg", img:"./images/egg.jpg", categories:["art"] },

  { title:"Frame 1225", img:"./images/Frame 1225.jpg", categories:["photo"] },
  { title:"Frame 1283", img:"./images/Frame 1283.png", categories:["photo"] },

  { title:"Gogo Bot Avatar", img:"./images/gogo_bot_avatar.png", categories:["art"] },
  { title:"Hmelisoneli", img:"./images/hmelisoneli.jpg", categories:["branding"] },

  { title:"HRAM: LOCATED Color Reference", img:"./images/HRAM:LOCATED_color_reference.jpg", categories:["branding"] },
  { title:"III3 Cover", img:"./images/iii3_cover.png", categories:["branding"] },

  { title:"Jernov", img:"./images/jernov.jpg", categories:["branding"] },
  { title:"K19 Dase A3 Poster", img:"./images/K19-Dase_a3_poster.jpg", categories:["branding"] },

  { title:"Liminal", img:"./images/liminal.jpg", categories:["art"] },
  { title:"Manifest", img:"./images/manifest.jpg", categories:["art"] },
  { title:"Martini", img:"./images/martini.jpg", categories:["branding"] },

  { title:"Mitus", img:"./images/mitus.jpg", categories:["interfaces"] },

  { title:"Recovered Mock", img:"./images/mock-Recovered_.jpg", categories:["branding"] },
  { title:"Mockup", img:"./images/Mockup.jpg", categories:["branding"] },

  { title:"Nigredo", img:"./images/nigredo.png", categories:["art"] },

  { title:"Plate (Alt)", img:"./images/plate copy.jpg", categories:["branding"] },
  { title:"Plate", img:"./images/plate.jpg", categories:["branding"] },

  { title:"PM Kit", img:"./images/pmkit.jpg", categories:["interfaces"] },
  { title:"PRODJ 2019", img:"./images/PRODJ-2019.jpg", categories:["branding"] },

  { title:"Roma Yurchak", img:"./images/roma_yurchak.jpg", categories:["photo"] },
  { title:"Saenkoharenko", img:"./images/saenkoharenko.jpg", categories:["photo"] },

  // все скриншоты — это PHOTO
  { title:"Screen Shot 2019", img:"./images/Screen Shot 2019-04-11 at 17.00.49.png", categories:["photo"] },
  { title:"Screenshot 2024-07-10 00:16", img:"./images/Screenshot 2024-07-10 at 00.16.04.png", categories:["photo"] },
  { title:"Screenshot 2024-07-10 00:16:28", img:"./images/Screenshot 2024-07-10 at 00.16.28.png", categories:["photo"] },
  { title:"Screenshot 2024-07-10 00:16:51", img:"./images/Screenshot 2024-07-10 at 00.16.51.png", categories:["photo"] },

  { title:"Sharespot", img:"./images/sharespot.jpg", categories:["interfaces"] },
  { title:"Shm Poster A3 Print", img:"./images/Shm_poster_a3_print.jpg", categories:["branding"] },
  { title:"Shmalgauzen Tviy Vill", img:"./images/Shmalgauzen_TviyVill_1350х1080.jpg", categories:["art"] },
  { title:"Sinners", img:"./images/sinners.jpg", categories:["art"] },

  { title:"Slice 8", img:"./images/Slice 8.png", categories:["art"] },
  { title:"Sof Brama", img:"./images/sof_brama.jpg", categories:["branding"] },
  { title:"Son", img:"./images/son.jpg", categories:["art"] },

  { title:"Triple We", img:"./images/tripplewe.jpg", categories:["branding"] },
  { title:"Tube Mock", img:"./images/Tube_mock.jpg", categories:["branding","art"] },

  { title:"Twog", img:"./images/twog.jpg", categories:["branding"] },
  { title:"Vartis", img:"./images/vartis.jpg", categories:["branding"] },
  { title:"X4", img:"./images/x4.jpg", categories:["branding"] }
];


// расстояние между карточками в глубину
const Z_GAP = 200;
// камера должна проехать весь коридор
const START_OFFSET = 0; // насколько "перед первой" стартуем
let scrollPos = 0;
let slidesEls = [];
let maxScroll = 1; // чтобы не делить на 0 потом
let filteredData = [];
/* ============ 2. Создаём карточки ============ */
function buildSlides() {
    const slider = document.querySelector(".slider");
    slider.innerHTML = "";
    slidesEls = [];

    filteredData.forEach((data, i) => {
        // создаём слайд и его содержимое
        const slide = document.createElement("div");
        slide.className = "slide";
        slide.dataset.baseZ = i * Z_GAP;

        slide.innerHTML = `
            <div class="slide-img">
                <img src="${data.img}" alt="${data.title ?? ''}">
            </div>
            <div class="slide-copy">
                <p class="card-title" data-final="${data.title ?? ''}">
                    <span>${data.title ?? ''}</span>
                </p>
                <p class="card-subtitle" data-final="${data.categories.join(", ")}">
                    <span>${data.categories.join(", ")}</span>
                </p>
            </div>
        `;

        slider.appendChild(slide);
        slidesEls.push(slide);

        // позиционирование через gsap
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

    // пересчёт прокрутки
    maxScroll = (filteredData.length - 1) * Z_GAP;
    scrollPos = 0;
    scrollZ = 0;
}




/* ============ 3. Lenis smooth scroll ============ */
const lenis = new Lenis({
  lerp: 0.01,
  smoothWheel: true,
  wheelMultiplier: 0.1 // стартовое значение
});

lenis.on("scroll", ({ scroll, limit }) => {
  scrollPos = scroll;
  maxScroll = limit;
});




// будем хранить активные рафы, чтобы не накладывать анимации друг на друга
const activeAnims = new WeakMap();

/**
 * Анимация "дешифровка": шум -> финальный текст
 */
// глобальная Map (если ещё нет)
if (typeof activeAnims === 'undefined') window.activeAnims = new Map();

// ---- Helper: decode/encode one element, возвращают Promise ----


function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

function snappedProgress(progressRaw, stickiness = 0.7) {
    const total = filteredData.length - 1;
    if (total <= 0) return 0;

    const idxFloat = progressRaw * total;
    const idxNearest = Math.round(idxFloat);
    const dist = idxFloat - idxNearest; // -0.5 .. 0.5
    const absDist = Math.abs(dist);

    let snappedIdxFloat;

    if (absDist < stickiness / 2) {
        // ближе к центру карточки — держим её
        const localT = absDist / (stickiness / 2); // 0..1
        const pull = 1 - smoothstep(localT);       // 1..0
        snappedIdxFloat = idxNearest + dist * (1 - pull);
    } else {
        // далеко — свободный дрейф
        snappedIdxFloat = idxFloat;
    }

    let snapped = snappedIdxFloat / total;
    if (snapped < 0) snapped = 0;
    if (snapped > 1) snapped = 1;
    return snapped;
}


/* ============ 4. Рендер цикла полёта ============ */
function renderFrame() {
    // прогресс прокрутки [0..1]
    const progressRaw = maxScroll > 0 ? scrollPos / maxScroll : 0;
    const progress = snappedProgress(progressRaw, 0.1);

    const totalDepth = (filteredData.length - 1) * Z_GAP;
    const cameraZ = -START_OFFSET + progress * (totalDepth + START_OFFSET);

    let bestIdx = -1;
    let bestDist = Infinity;

    const PARALLAX_POWER_X = 5; // vw
    const PARALLAX_POWER_Y = 3; // vh

    slidesEls.forEach((slide, idx) => {
        const baseZ = parseFloat(slide.dataset.baseZ);
        const relativeZ = baseZ - cameraZ;
        const dist = Math.abs(relativeZ);

        // track nearest slide
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
        }

        // скрываем слишком дальние слайды
        if (relativeZ < -110 || relativeZ > 2000) {
            slide.style.opacity = 0;
            slide.style.pointerEvents = "none";
            return;
        }

        // opacity и scale
        const vis = Math.max(0, Math.min(1, 1 - dist / 380));
        let sc = 1.2 - (dist / 400) * 0.8;
        sc = Math.max(0.4, Math.min(1.2, sc));

        // параллакс от мыши
        const parallaxXvw = mouseNX * PARALLAX_POWER_X;
        const parallaxYvh = mouseNY * PARALLAX_POWER_Y;

        // поворот камеры
        const rotY = mouseNX * 5;
        const rotX = mouseNY * -3;

        slide.style.transform = `
            translate3d(${parallaxXvw}vw, ${parallaxYvh}vh, ${-relativeZ}px)
            rotateY(${rotY}deg)
            rotateX(${rotX}deg)
            scale(${sc})
        `;
        slide.style.opacity = vis;
        slide.style.pointerEvents = 'auto';
    });

    // обновляем фон ближайшей карточки
    if (bestIdx !== -1 && bestDist < 220) {
        setBgImageByIndex(bestIdx);
    }

    requestAnimationFrame(renderFrame);
}


  const gridTop = document.querySelector(".grid-top");
  const gridBottom = document.querySelector(".grid-bottom");
/* ============ 5. фон-туннель сетки ============ */






// ====== Background layers ======
const bgWrap = document.createElement('div');
bgWrap.className = 'bg-blur-wrap';
const bgA = document.createElement('div');
const bgB = document.createElement('div');
bgA.className = 'bg-blur-layer bg-blur-a';
bgB.className = 'bg-blur-layer bg-blur-b';
bgWrap.appendChild(bgA);
bgWrap.appendChild(bgB);
document.body.insertBefore(bgWrap, document.body.firstChild);

// state
let bgActive = 0;
let currentBgIndex = -1;

// fade constants
const BG_FADE_OUT = 1;
const BG_FADE_IN = 0.5;
const BG_EASE = "power2.out";

// init first background
function initBgFirst(idx = 0) {
    if (!filteredData[idx]) return;
    bgA.style.backgroundImage = `url("${filteredData[idx].img}")`;
    bgA.style.opacity = 0.2;
    currentBgIndex = idx;
    bgActive = 0;
}
initBgFirst(0);

// fast crossfade function
function setBgImageByIndex(idx) {
    if (idx == null || idx < 0 || idx >= filteredData.length) return;
    if (idx === currentBgIndex) return;
    currentBgIndex = idx;

    const src = filteredData[idx].img;
    const inactiveEl = bgActive === 0 ? bgB : bgA;
    const activeEl = bgActive === 0 ? bgA : bgB;

    gsap.killTweensOf([bgA, bgB]);

    const img = new Image();
    img.src = src;

    const applyFade = () => {
        inactiveEl.style.backgroundImage = `url("${src}")`;

        // fade out active layer
        gsap.to(activeEl, {
            opacity: 0,
            duration: BG_FADE_OUT,
            ease: BG_EASE
        });

        // fade in new layer
        gsap.to(inactiveEl, {
            opacity: 0.2,
            duration: BG_FADE_IN,
            ease: BG_EASE,
            onComplete: () => bgActive = 1 - bgActive
        });
    };

    if (img.complete) {
        applyFade();
    } else {
        img.onload = img.onerror = applyFade;
    }
}

// initial invisible placeholders
bgA.style.opacity = '0';
bgB.style.opacity = '0';
bgA.style.backgroundColor = '#0b0b0b';
bgB.style.backgroundColor = '#0b0b0b';





function raf(time) {
	lenis.raf(time);
	ScrollTrigger.update();
	requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

requestAnimationFrame(renderFrame);

// пересчитать maxScroll на ресайзе
window.addEventListener("resize", () => {
	maxScroll = (filteredData.length - 1) * Z_GAP;
});
/* 
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav a');

  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      link.classList.add('glitch3');
    });

    link.addEventListener('mouseleave', () => {
      link.classList.remove('glitch3');
    });
  });
});

*/

slidesEls.forEach(slide => {
  const slideImg = slide.querySelector('.slide-img');
  const title = slide.querySelector('.card-title');
  const subtitle = slide.querySelector('.card-subtitle');
  if (!slideImg) return;

  slide.addEventListener('mouseenter', () => {
    // --- Глитч на изображение ---
 /*   if (!slideImg.classList.contains('glitch-active')) {
      slideImg.classList.add('glitch-active');

      const img = slideImg.children[0];
      const cloneBefore = img.cloneNode();
      const cloneAfter = img.cloneNode();
      cloneBefore.classList.add('img__glitch_before');
      cloneAfter.classList.add('img__glitch_after');
      slideImg.appendChild(cloneBefore);
      slideImg.appendChild(cloneAfter);
    }

    slideImg.classList.add('glitch', 'glitch2', 'glitch_img');
*/
    // --- Глитч на текст ---
    if (title) title.classList.add('glitch3');
    if (subtitle) subtitle.classList.add('glitch3');
  });

  slide.addEventListener('mouseleave', () => {
    // --- Очистка изображения ---
   /* slideImg.classList.remove('glitch', 'glitch2', 'glitch_img', 'glitch-active');
    const clones = slideImg.querySelectorAll('.img__glitch_before, .img__glitch_after');
    clones.forEach(clone => clone.remove());
*/
    // --- Очистка текста ---
    if (title) title.classList.remove('glitch3');
    if (subtitle) subtitle.classList.remove('glitch3');
  });
});


const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// параметры сетки
const horizontalGridSize = 200; // шаг горизонтальных линий
const gridSize = 150;
const depth = 4000; // глубина тоннеля
const lineColor = "rgba(255,255,255,0.4)";

// параллакс мыши
let mx = 0, my = 0;

// скролл вперёд
let scrollZ = 0;

// плавность
let targetMX = 0, targetMY = 0;

// ловим мышь
document.addEventListener("mousemove", (e) => {
  targetMX = (e.clientX / window.innerWidth - 0.5) * 200;
  targetMY = (e.clientY / window.innerHeight - 0.5) * 200;
});

// ловим скролл
lenis.on("scroll", (e) => {
  const p = e.scroll / maxScroll;
  scrollZ = p * depth * 2;
});

function project3D(x, y, z) {
  const fov = 950; // сила перспективы
  const scale = fov / (fov + z);

  return {
    x: x * scale + canvas.width / 2 + mx,
    y: y * scale + canvas.height / 2 + my,
    scale
  };
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // плавная мышь
  mx += (targetMX - mx) * 0.2;
  my += (targetMY - my) * 0.2;

  ctx.lineWidth = 1;

 const zMin = 50; // минимальная глубина чтобы не исчезало

for (let z = 0; z < depth; z += horizontalGridSize) {

    let zOffset = (z - scrollZ % depth + depth) % depth;
    zOffset = zMin + zOffset; 

    if (zOffset > depth) zOffset -= depth; // безопасность

    const fade = 1 - zOffset / depth;

    const yTop = -600;
    const yBottom = 600;

    // top line
    const p1 = project3D(-1500, yTop, zOffset);
    const p2 = project3D(1500, yTop, zOffset);

    const gradTop = ctx.createLinearGradient(p1.x, 0, p2.x, 0);
    gradTop.addColorStop(0, `rgba(255,255,255,0)`);
    gradTop.addColorStop(0.05, `rgba(255,255,255,${0.15 * fade})`);
    gradTop.addColorStop(0.95, `rgba(255,255,255,${0.15 * fade})`);
    gradTop.addColorStop(1, `rgba(255,255,255,0)`);

    ctx.strokeStyle = gradTop;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // bottom line
    const p3 = project3D(-1500, yBottom, zOffset);
    const p4 = project3D(1500, yBottom, zOffset);

    const gradBottom = ctx.createLinearGradient(p3.x, 0, p4.x, 0);
    gradBottom.addColorStop(0, `rgba(255,255,255,0)`);
    gradBottom.addColorStop(0.05, `rgba(255,255,255,${0.15 * fade})`);
    gradBottom.addColorStop(0.95, `rgba(255,255,255,${0.15 * fade})`);
    gradBottom.addColorStop(1, `rgba(255,255,255,0)`);

    ctx.strokeStyle = gradBottom;
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.stroke();
}






ctx.strokeStyle = "rgba(255, 255, 255, 0.07)"; // базовый цвет

for (let x = -1500; x <= 1500; x += gridSize * 3) {
    const xx = x;

    const yTop = -800 + my * 0.15;
    const yBottom = 800 + my * 0.15;

    const zNear = 0;
    const zFar = depth;

    // ближняя точка
    const pNearTop = project3D(xx, yTop, zNear);
    const pNearBottom = project3D(xx, yBottom, zNear);

    // дальняя точка
    const pFarTop = project3D(xx, yTop, zFar);
    const pFarBottom = project3D(xx, yBottom, zFar);

    // прозрачность для ближней и дальней точки
    const fadeNear = 1;                   // полностью видна
    const fadeFar  = 0;                   // полностью прозрачна
     
    // левая грань линии
    let gradLeft = ctx.createLinearGradient(pNearTop.x, pNearTop.y, pFarTop.x, pFarTop.y);
    gradLeft.addColorStop(0, `rgba(255,255,255,${fadeNear * 0.12})`);
    gradLeft.addColorStop(1, `rgba(255,255,255,${fadeFar  * 0.12})`);
    ctx.strokeStyle = gradLeft;
    ctx.beginPath();
    ctx.moveTo(pNearTop.x, pNearTop.y);
    ctx.lineTo(pFarTop.x, pFarTop.y);
    ctx.stroke();

    // правая грань линии
    let gradRight = ctx.createLinearGradient(pNearBottom.x, pNearBottom.y, pFarBottom.x, pFarBottom.y);
    gradRight.addColorStop(0, `rgba(255,255,255,${fadeNear * 0.12})`);
    gradRight.addColorStop(1, `rgba(255,255,255,${fadeFar  * 0.12})`);
    ctx.strokeStyle = gradRight;
    ctx.beginPath();
    ctx.moveTo(pNearBottom.x, pNearBottom.y);
    ctx.lineTo(pFarBottom.x, pFarBottom.y);
    ctx.stroke();
}


  requestAnimationFrame(draw);
}


draw();




document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav a');

  // ==== ИЗНАЧАЛЬНО — полный список ====
  filteredData = [...slidesData];

  // ==== ФИЛЬТРЫ ====
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const filter = link.textContent
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');

      // Активный класс
      navLinks.forEach(l => l.classList.remove('active-filter'));
      link.classList.add('active-filter');

      // Хеш
      if (filter === 'allworks') {
        history.replaceState(null, '', window.location.pathname);
      } else {
        history.replaceState(null, '', `#${filter}`);
      }

      // ==== ФИЛЬТРАЦИЯ ====
      if (filter === 'allworks') {
        filteredData = [...slidesData];
      } else {
        filteredData = slidesData.filter(slide =>
          slide.categories.includes(filter)
        );
      }

// ==== Перестройка слайдов ====
buildSlides(); // buildSlides использует глобальный filteredData



  });
  });

  // ==== Обработка hash при загрузке ====
  const hash = window.location.hash.replace('#','');

  if (hash) {
    const linkToClick = Array.from(navLinks).find(a =>
      a.textContent.trim().toLowerCase().replace(/\s+/g,'') === hash
    );
    if (linkToClick) linkToClick.click();
  } else {
    buildSlides(filteredData);
  }

  // ==== Начальный запуск ====

  renderFrame();



});









// новая функция для rebuild слайдов с фильтром


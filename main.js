


// новая функция для rebuild слайдов с фильтром

// ==========================
// 0. Глобальные переменные
// ==========================
let mouseNX = 0, mouseNY = 0;
let targetMX = 0, targetMY = 0;

const root = document.documentElement;
const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

const Z_GAP = 200;
const START_OFFSET = 0;

let scrollPos = 0;
let scrollZ = 0;
let maxScroll = 1;

let filteredData = [];
let slidesEls = [];
let slidesState = [];

// ==========================
// 1. Данные слайдов
// ==========================
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

// ==========================
// 2. Инициализация мыши
// ==========================
window.addEventListener("mousemove", (e) => {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  mouseNX = (e.clientX - cx) / cx;
  mouseNY = (e.clientY - cy) / cy;

  targetMX = (e.clientX / window.innerWidth - 0.5) * 200;
  targetMY = (e.clientY / window.innerHeight - 0.5) * 200;

  const angle = (Math.atan2(mouseNY, mouseNX) * 180 / Math.PI + 360) % 360;
  root.style.setProperty("--mx", mouseNX.toFixed(3));
  root.style.setProperty("--my", mouseNY.toFixed(3));
  root.style.setProperty("--angle", angle.toFixed(1) + "deg");
});

// ==========================
// 3. Canvas resize
// ==========================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ==========================
// 4. Lenis smooth scroll (динамический)
// ==========================
let lenis;
let currentFilteredCount = slidesData.length;

function initLenis() {
  // Рассчитываем множитель на основе количества слайдов
  // Базовое значение для максимального количества слайдов
  const baseMultiplier = 0.2;
  // Минимальный множитель при максимальном количестве слайдов
  const minMultiplier = 0.15;
  // Максимальный множитель при минимальном количестве слайдов
  const maxMultiplier = 0.8;
  
  // Расчет: меньше слайдов = больше скорость
  let wheelMultiplier;
  if (currentFilteredCount <= 5) {
    wheelMultiplier = maxMultiplier;
  } else if (currentFilteredCount >= slidesData.length) {
    wheelMultiplier = minMultiplier;
  } else {
    // Плавное изменение между min и max
    const ratio = currentFilteredCount / slidesData.length;
    wheelMultiplier = minMultiplier + (maxMultiplier - minMultiplier) * (1 - ratio);
  }
  
  console.log(`Количество слайдов: ${currentFilteredCount}, WheelMultiplier: ${wheelMultiplier.toFixed(3)}`);
  
  // Создаем новый экземпляр Lenis с обновленным множителем
  if (lenis) {
    lenis.destroy();
  }
  
  lenis = new Lenis({ 
    lerp: 0.1, 
    smoothWheel: true, 
    wheelMultiplier: wheelMultiplier
  });
  
  lenis.on("scroll", (e) => {
    scrollPos = e.scroll;
    maxScroll = e.limit;
    scrollZ = (scrollPos / maxScroll) * 4000 * 2;
  });
}

// Инициализируем Lenis при загрузке
initLenis();


// ==========================
// 5. Build slides
// ==========================
// ==========================
// 5. Build slides (обновленная функция)
// ==========================
function buildSlides() {
  const slider = document.querySelector(".slider");
  slider.innerHTML = "";
  slidesEls = [];
  slidesState = [];

  filteredData.forEach((data, i) => {
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

    slidesState.push({
      baseZ: i * Z_GAP,
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

  maxScroll = (filteredData.length - 1) * Z_GAP;
  
  // Обновляем Lenis после перестройки слайдов
  if (lenis) {
    lenis.resize();
  }
}

// ==========================
// 6. Filter slides (обновленная функция)
// ==========================
function setFilter(filter) {
  if (filter === "allworks") filteredData = [...slidesData];
  else filteredData = slidesData.filter(s => s.categories.includes(filter));
  
  // Обновляем количество отфильтрованных слайдов
  currentFilteredCount = filteredData.length;
  
  // Перестраиваем слайды
  buildSlides();
  
  // Переинициализируем Lenis с новым множителем
  initLenis();
  
  // Сбрасываем позицию скролла
  if (lenis) {
    lenis.scrollTo(0, { immediate: true });
    scrollPos = 0;
    scrollZ = 0;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav a');
  filteredData = [...slidesData];
  buildSlides();

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active-filter'));
      link.classList.add('active-filter');
      const filter = link.textContent.trim().toLowerCase().replace(/\s+/g,'');
      setFilter(filter);
      history.replaceState(null, '', filter === 'allworks' ? window.location.pathname : `#${filter}`);
    });
  });

  // hash on load
  const hash = window.location.hash.replace('#','');
  if(hash) {
    const link = Array.from(navLinks).find(a =>
      a.textContent.trim().toLowerCase().replace(/\s+/g,'') === hash
    );
    if(link) link.click();
  }
});

// ==========================
// 7. Background
// ==========================
const bgWrap = document.createElement('div');
bgWrap.className = 'bg-blur-wrap';
const bgA = document.createElement('div');
const bgB = document.createElement('div');
bgA.className = 'bg-blur-layer bg-blur-a';
bgB.className = 'bg-blur-layer bg-blur-b';
bgWrap.appendChild(bgA);
bgWrap.appendChild(bgB);
document.body.insertBefore(bgWrap, document.body.firstChild);

let bgActive = 0;
let currentBgIndex = -1;

function setBgImageByIndex(idx) {
  if(idx === currentBgIndex || idx < 0 || idx >= filteredData.length) return;
  currentBgIndex = idx;

  const src = filteredData[idx].img;
  const inactiveEl = bgActive === 0 ? bgB : bgA;
  const activeEl = bgActive === 0 ? bgA : bgB;

  gsap.killTweensOf([bgA, bgB]);
  const img = new Image(); img.src = src;

  const applyFade = () => {
    inactiveEl.style.backgroundImage = `url("${src}")`;
    gsap.to(activeEl, { opacity: 0, duration: 1, ease: "power2.out" });
    gsap.to(inactiveEl, { opacity: 0.2, duration: 0.5, ease: "power2.out", onComplete: () => bgActive = 1 - bgActive });
  };

  if(img.complete) applyFade();
  else img.onload = img.onerror = applyFade;
}

bgA.style.opacity = '0'; bgB.style.opacity = '0';
bgA.style.backgroundColor = '#0b0b0b'; bgB.style.backgroundColor = '#0b0b0b';
setBgImageByIndex(0);

// ==========================
// 8. Slides update
// ==========================
function snappedProgress(progressRaw, stickiness = 0.7) {
  const total = filteredData.length - 1;
  if(total <= 0) return 0;
  const idxFloat = progressRaw * total;
  const idxNearest = Math.round(idxFloat);
  const dist = idxFloat - idxNearest;
  const absDist = Math.abs(dist);
  let snappedIdxFloat;
  if(absDist < stickiness/2){
    const localT = absDist / (stickiness/2);
    const pull = 1 - (localT*localT*(3-2*localT));
    snappedIdxFloat = idxNearest + dist*(1-pull);
  } else snappedIdxFloat = idxFloat;
  return Math.min(1, Math.max(0, snappedIdxFloat/total));
}

function updateSlides() {
  const progress = snappedProgress(scrollPos / maxScroll, 0.1);
  const totalDepth = (filteredData.length-1)*Z_GAP;
  const cameraZ = -START_OFFSET + progress * (totalDepth + START_OFFSET);

  let bestIdx = -1;
  let bestDist = Infinity;

  slidesEls.forEach((slide, idx) => {
    const baseZ = slidesState[idx].baseZ;
    const relativeZ = baseZ - cameraZ;
    const dist = Math.abs(relativeZ);

    if(dist < bestDist){ bestDist = dist; bestIdx = idx; }
    if(relativeZ < -110 || relativeZ > 2000){ slide.style.opacity = 0; slide.style.pointerEvents = "none"; return; }

    slidesState[idx].opacity = Math.max(0, Math.min(1, 1 - dist / 380));
    slidesState[idx].scale = Math.max(0.4, Math.min(1.2, 1.2 - (dist / 400) * 0.8));
    slidesState[idx].parallaxX = mouseNX*5;
    slidesState[idx].parallaxY = mouseNY*3;

    slide.style.transform = `
      translate3d(${slidesState[idx].parallaxX}vw, ${slidesState[idx].parallaxY}vh, ${-relativeZ}px)
      rotateY(${mouseNX*5}deg)
      rotateX(${mouseNY*-3}deg)
      scale(${slidesState[idx].scale})
    `;
    slide.style.opacity = slidesState[idx].opacity;
    slide.style.pointerEvents = 'auto';
  });

  if(bestIdx!==-1 && bestDist<220) setBgImageByIndex(bestIdx);
}

// ==========================
// 9. Grid draw
// ==========================
const horizontalGridSize = 200;
const gridSize = 150;
const depth = 4000;
const verticalGridSize = 300;
const verticalCount = 4; // по обе стороны

const gridLines = [];
for(let z=0; z<depth; z+=horizontalGridSize) gridLines.push(z);

let mx = 0, my = 0;

function project3D(x,y,z){
  const fov = 950;
  const scale = fov/(fov+z);
  return { x: x*scale+canvas.width/2+mx, y: y*scale+canvas.height/2+my, scale };
}

function drawGrid(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  mx += (targetMX-mx)*0.2; my += (targetMY-my)*0.2;

  ctx.lineWidth = 1;

gridLines.forEach(z=>{
  let zOffset = (z - scrollZ % depth + depth) % depth + 50;
  const fade = 1 - zOffset / depth;

  const yTop = -700;
  const yBottom = 700;

  const p1t = project3D(-1500, yTop, zOffset);
  const p2t = project3D(1500,  yTop, zOffset);

  const p1b = project3D(-1500, yBottom, zOffset);
  const p2b = project3D(1500,  yBottom, zOffset);

  const grad = ctx.createLinearGradient(p1t.x, 0, p2t.x, 0);
  grad.addColorStop(0,   `rgba(255,255,255,0)`);
  grad.addColorStop(0.05,`rgba(255,255,255,${0.15 * fade})`);
  grad.addColorStop(0.95,`rgba(255,255,255,${0.15 * fade})`);
  grad.addColorStop(1,   `rgba(255,255,255,0)`);

  ctx.strokeStyle = grad;

  // верх
  ctx.beginPath();
  ctx.moveTo(p1t.x, p1t.y);
  ctx.lineTo(p2t.x, p2t.y);
  ctx.stroke();

  // низ (зеркало)
  ctx.beginPath();
  ctx.moveTo(p1b.x, p1b.y);
  ctx.lineTo(p2b.x, p2b.y);
  ctx.stroke();
});

for (let i = -verticalCount; i <= verticalCount; i++) {
  const x = i * verticalGridSize;

  const zNear = 50;
  const zFar  = depth;

  // ===== TOP =====
  const pNearTop = project3D(x, -800, zNear);
  const pFarTop  = project3D(x, -600, zFar);

  const gradTop = ctx.createLinearGradient(
    0,
    pNearTop.y,
    0,
    pFarTop.y
  );

  gradTop.addColorStop(0,   `rgba(255,255,255,0.18)`);
  gradTop.addColorStop(0.6, `rgba(255,255,255,0.08)`);
  gradTop.addColorStop(1,   `rgba(255,255,255,0)`);

  ctx.strokeStyle = gradTop;

  ctx.beginPath();
  ctx.moveTo(pNearTop.x, pNearTop.y);
  ctx.lineTo(pFarTop.x,  pFarTop.y);
  ctx.stroke();

  // ===== BOTTOM (зеркало) =====
  const pNearBot = project3D(x, 900, zNear);
  const pFarBot  = project3D(x, 600, zFar);

  const gradBot = ctx.createLinearGradient(
    0,
    pFarBot.y,
    0,
    pNearBot.y
  );

  gradBot.addColorStop(0,   `rgba(255,255,255,0)`);
  gradBot.addColorStop(0.4, `rgba(255,255,255,0.08)`);
  gradBot.addColorStop(1,   `rgba(255,255,255,0.18)`);

  ctx.strokeStyle = gradBot;

  ctx.beginPath();
  ctx.moveTo(pNearBot.x, pNearBot.y);
  ctx.lineTo(pFarBot.x,  pFarBot.y);
  ctx.stroke();
}



}

// ==========================
// 10. Main loop
// ==========================
function mainLoop(time){
  lenis.raf(time);
  ScrollTrigger.update();
  updateSlides();
  drawGrid();
  requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);

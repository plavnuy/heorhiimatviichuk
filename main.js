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
	{ id:"visual", title:"2", img:"./images/2.jpg" },
	{ id:"visual", title:"7 Copy", img:"./images/7 copy.jpg" },
	{ id:"visual", title:"50", img:"./images/50.jpg" },
	{ id:"accemedin", title:"Accemedin", img:"./images/accemedin.jpg" },
	{ id:"t-shirt mockup", title:"AMOxLOCATED T-Shirt Mockup", img:"./images/AMOxLOCATED_tshitmockup_3new copy.jpg" },
	{ id:"art", title:"Art 01", img:"./images/art-01.jpg" },
	{ id:"biomass", title:"Biomass", img:"./images/biomass.jpg" },
	{ id:"delfast", title:"Delfast", img:"./images/delfast.jpg" },
	{ id:"dobro", title:"Dobro", img:"./images/dobro.jpg" },
	{ id:"egg", title:"Egg", img:"./images/egg.jpg" },
	{ id:"frame", title:"Frame 1225", img:"./images/Frame 1225.jpg" },
	{ id:"frame", title:"Frame 1283", img:"./images/Frame 1283.png" },
	{ id:"avatar", title:"Gogo Bot Avatar", img:"./images/gogo_bot_avatar.png" },
	{ id:"hmelisoneli", title:"Hmelisoneli", img:"./images/hmelisoneli.jpg" },
	{ id:"hram:located", title:"HRAM: LOCATED Color Reference", img:"./images/HRAM:LOCATED_color_reference.jpg" },
	{ id:"iii3 cover", title:"III3 Cover", img:"./images/iii3_cover.png" },
	{ id:"jernov", title:"Jernov", img:"./images/jernov.jpg" },
	{ id:"k19 dase poster", title:"K19 Dase A3 Poster", img:"./images/K19-Dase_a3_poster.jpg" },
	{ id:"liminal", title:"Liminal", img:"./images/liminal.jpg" },
	{ id:"manifest", title:"Manifest", img:"./images/manifest.jpg" },
	{ id:"martini", title:"Martini", img:"./images/martini.jpg" },
	{ id:"mitus", title:"Mitus", img:"./images/mitus.jpg" },
	{ id:"mock", title:"Recovered Mock", img:"./images/mock-Recovered_.jpg" },
	{ id:"mockup", title:"Mockup", img:"./images/Mockup.jpg" },
	{ id:"nigredo", title:"Nigredo", img:"./images/nigredo.png" },
	{ id:"plate", title:"Plate (Alt)", img:"./images/plate copy.jpg" },
	{ id:"plate", title:"Plate", img:"./images/plate.jpg" },
	{ id:"pmkit", title:"PM Kit", img:"./images/pmkit.jpg" },
	{ id:"prodj", title:"PRODJ 2019", img:"./images/PRODJ-2019.jpg" },
	{ id:"roma yurchak", title:"Roma Yurchak", img:"./images/roma_yurchak.jpg" },
	{ id:"saenkoharenko", title:"Saenkoharenko", img:"./images/saenkoharenko.jpg" },
	{ id:"screenshot", title:"Screen Shot 2019-04-11 17:00", img:"./images/Screen Shot 2019-04-11 at 17.00.49.png" },
	{ id:"screenshot", title:"Screenshot 2024-07-10 00:16:04", img:"./images/Screenshot 2024-07-10 at 00.16.04.png" },
	{ id:"screenshot", title:"Screenshot 2024-07-10 00:16:28", img:"./images/Screenshot 2024-07-10 at 00.16.28.png" },
	{ id:"screenshot", title:"Screenshot 2024-07-10 00:16:51", img:"./images/Screenshot 2024-07-10 at 00.16.51.png" },
	{ id:"screenshot", title:"Screenshot 2025-10-24 14:36:21", img:"./images/Screenshot 2025-10-24 at 14.36.21.png" },
	{ id:"screenshot", title:"Screenshot 2025-10-24 15:16:46", img:"./images/Screenshot 2025-10-24 at 15.16.46.png" },
	{ id:"screenshot", title:"Screenshot 2025-10-24 15:18:37", img:"./images/Screenshot 2025-10-24 at 15.18.37.png" },
	{ id:"screenshot", title:"Screenshot 2025-10-24 15:28:32", img:"./images/Screenshot 2025-10-24 at 15.28.32.png" },
	{ id:"screenshot", title:"Screenshot 2025-10-24 15:29:04", img:"./images/Screenshot 2025-10-24 at 15.29.04.png" },
	{ id:"screenshot", title:"Screenshot 2025-10-24 15:29:40", img:"./images/Screenshot 2025-10-24 at 15.29.40.png" },
	{ id:"screenshot", title:"Screenshot 2025-10-24 15:30:22", img:"./images/Screenshot 2025-10-24 at 15.30.22.png" },
	{ id:"screenshot", title:"Screenshot 2025-10-24 15:45:31", img:"./images/Screenshot 2025-10-24 at 15.45.31.png" },
	{ id:"screenshot", title:"Screenshot 2025-10-24 15:45:58", img:"./images/Screenshot 2025-10-24 at 15.45.58.png" },
	{ id:"screenshot", title:"Screenshot 2025-10-24 15:46:21", img:"./images/Screenshot 2025-10-24 at 15.46.21.png" },
	{ id:"sharespot", title:"Sharespot", img:"./images/sharespot.jpg" },
	{ id:"poster", title:"Shm Poster A3 Print", img:"./images/Shm_poster_a3_print.jpg" },
	{ id:"tviy vill", title:"Shmalgauzen Tviy Vill", img:"./images/Shmalgauzen_TviyVill_1350х1080.jpg" },
	{ id:"sinners", title:"Sinners", img:"./images/sinners.jpg" },
	{ id:"slice", title:"Slice 8", img:"./images/Slice 8.png" },
	{ id:"sof brama", title:"Sof Brama", img:"./images/sof_brama.jpg" },
	{ id:"son", title:"Son", img:"./images/son.jpg" },
	{ id:"triple we", title:"Triple We", img:"./images/tripplewe.jpg" },
	{ id:"tube mock", title:"Tube Mock", img:"./images/Tube_mock.jpg" },
	{ id:"twog", title:"Twog", img:"./images/twog.jpg" },
	{ id:"vartis", title:"Vartis", img:"./images/vartis.jpg" },
	{ id:"x4", title:"X4", img:"./images/x4.jpg" }
];

// расстояние между карточками в глубину
const Z_GAP = 200;

// камера должна проехать весь коридор
const START_OFFSET = 0; // насколько "перед первой" стартуем
let scrollPos = 0;
let slidesEls = [];
let maxScroll = 1; // чтобы не делить на 0 потом

/* ============ 2. Создаём карточки ============ */
function buildSlides() {
	const slider = document.querySelector(".slider");
	slider.innerHTML = "";
	slidesEls = [];

	slidesData.forEach((data, i) => {
		const slide = document.createElement("div");
		slide.className = "slide";

		const slideImg = document.createElement("div");
		slideImg.className = "slide-img";

		const img = document.createElement("img");
		img.src = data.img;
		img.alt = data.title || "";
		slideImg.appendChild(img);

const slideCopy = document.createElement("div");
slideCopy.className = "slide-copy";
slideCopy.innerHTML = `
  <p class="card-title" data-final="${data.title ?? ""}">
    <span class="hack-current"></span>
    <span class="hack-final">${data.title ?? ""}</span>
  </p>
  <p class="card-subtitle" data-final="${data.id ?? ""}">
    <span class="hack-current"></span>
    <span class="hack-final">${data.id ?? ""}</span>
  </p>
`;

// новое:
slide.dataset.state = "encoded";


// флаг, чтобы не перезапускать анимацию много раз
slide.dataset.hackDone = "0";


		slide.appendChild(slideImg);
		slide.appendChild(slideCopy);
		slider.appendChild(slide);

		const xPercent = (i % 2 === 0) ? 35 : 50;

		gsap.set(slide, {
			position: "absolute",
			top: "30%",      // линия полёта чуть выше центра
			left: xPercent + "%",
			xPercent: 20,
			yPercent: -50,
			transformStyle: "preserve-3d",
			willChange: "transform, opacity, filter"
		});

		const baseZ = i * Z_GAP;
		slide.dataset.baseZ = baseZ;
		slidesEls.push(slide);
	});

	// считаем максимальный скролл
	maxScroll = document.body.scrollHeight - window.innerHeight;
}


/* ============ 3. Lenis smooth scroll ============ */
const lenis = new Lenis({
	lerp: 0.02,
	smoothWheel: true,
	wheelMultiplier: 0.5
});

lenis.on("scroll", (e) => {
	scrollPos = e.scroll;
});

// будем хранить активные рафы, чтобы не накладывать анимации друг на друга
const activeAnims = new WeakMap();

/**
 * Анимация "дешифровка": шум -> финальный текст
 */
// глобальная Map (если ещё нет)
if (typeof activeAnims === 'undefined') window.activeAnims = new Map();

// ---- Helper: decode/encode one element, возвращают Promise ----
function decodeElement(el, opts = {}) {
  // el: контейнер, внутри .hack-current и .hack-final
  // opts: { chars, chanceScale, frameMs } - можно не передавать
  return new Promise((resolve) => {
    if (!el) return resolve();

    const curr = el.querySelector('.hack-current');
    const fin = el.querySelector('.hack-final');
    const finalText = el.getAttribute('data-final') || fin?.textContent || '';

    if (!curr || !fin) {
      // nothing to animate
      if (fin) fin.style.display = 'inline-block';
      return resolve();
    }

    // cancel prev raf for this element (if any)
    const key = el;
    if (activeAnims.has(key)) {
      const prev = activeAnims.get(key);
      cancelAnimationFrame(prev);
      activeAnims.delete(key);
    }

    curr.style.display = 'inline-block';
    fin.style.display = 'none';
    curr.classList.remove('hack-hidden');
    fin.classList.add('hack-hidden');

    const chars = opts.chars || "!<>-_\\/[]{}#%&$?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const chanceScale = opts.chanceScale || 20;

    const letters = finalText.split("").map(ch => ({ final: ch, done: ch === " " }));

    let frame = 0;

    function tick() {
      let out = "";
      let complete = 0;

      for (let i = 0; i < letters.length; i++) {
        if (letters[i].done) {
          out += letters[i].final;
          complete++;
        } else {
          out += chars[Math.floor(Math.random() * chars.length)];
          if (Math.random() < frame / chanceScale) {
            letters[i].done = true;
          }
        }
      }

      curr.textContent = out;
      frame++;

      if (complete < letters.length) {
        const rafId = requestAnimationFrame(tick);
        activeAnims.set(key, rafId);
      } else {
        // show final
        curr.style.display = 'none';
        fin.style.display = 'inline-block';
        curr.classList.add('hack-hidden');
        fin.classList.remove('hack-hidden');
        activeAnims.delete(key);
        resolve();
      }
    }

    tick();
  });
}

function encodeElement(el, opts = {}) {
  return new Promise((resolve) => {
    if (!el) return resolve();

    const curr = el.querySelector('.hack-current');
    const fin = el.querySelector('.hack-final');
    const finalText = el.getAttribute('data-final') || fin?.textContent || '';

    if (!curr || !fin) {
      // nothing to animate
      if (fin) fin.style.display = 'none';
      return resolve();
    }

    // cancel prev raf for this element (if any)
    const key = el;
    if (activeAnims.has(key)) {
      const prev = activeAnims.get(key);
      cancelAnimationFrame(prev);
      activeAnims.delete(key);
    }

    curr.style.display = 'inline-block';
    fin.style.display = 'none';
    curr.classList.remove('hack-hidden');

    const chars = opts.chars || "!<>-_\\/[]{}#%&$?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let frame = 0;
    const maxFrames = opts.maxFrames || 20;

    function tick() {
      let out = "";
      for (let i = 0; i < finalText.length; i++) {
        const ch = finalText[i];
        out += (ch === " ") ? " " : chars[Math.floor(Math.random() * chars.length)];
      }
      curr.textContent = out;
      frame++;

      if (frame < maxFrames) {
        const rafId = requestAnimationFrame(tick);
        activeAnims.set(key, rafId);
      } else {
        // hide noise layer (assume .hack-hidden has CSS transition if desired)
        curr.classList.add('hack-hidden');
        setTimeout(() => {
          curr.style.display = 'none';
          // keep fin hidden (since encode means disappear)
          activeAnims.delete(key);
          resolve();
        }, opts.fadeDelay || 160);
      }
    }

    tick();
  });
}

// ---- animateDecode: title -> subtitle ----
async function animateDecode(cardEl) {
  const st = cardEl.dataset.state;
  if (st === "decoding" || st === "decoded") return;
  cardEl.dataset.state = "decoding";

  // cancel any previous rafs for card-level keys
  if (activeAnims.has(cardEl)) {
    const prev = activeAnims.get(cardEl);
    if (Array.isArray(prev)) prev.forEach(id => cancelAnimationFrame(id));
    else cancelAnimationFrame(prev);
    activeAnims.delete(cardEl);
  }

  const titleEl = cardEl.querySelector('.card-title');
  const subtitleEl = cardEl.querySelector('.card-subtitle');

  if (!titleEl) {
    cardEl.dataset.state = 'decoded';
    return;
  }

  // decode title first
  await decodeElement(titleEl, { chanceScale: 20 });

  // then decode subtitle (if exists)
  if (subtitleEl) {
    // ensure subtitle has proper spans; if not, skip
    const subCurr = subtitleEl.querySelector('.hack-current');
    const subFin = subtitleEl.querySelector('.hack-final');
    if (subCurr && subFin) {
      await decodeElement(subtitleEl, { chanceScale: 16, chars: "!<>-_\\/[]{}#%&$?abcdefghijklmnopqrstuvwxyz0123456789" });
    }
  }

  cardEl.dataset.state = 'decoded';
}

// ---- animateEncode: subtitle -> title ----
async function animateEncode(cardEl) {
  const st = cardEl.dataset.state;
  if (st === "encoding" || st === "encoded") return;
  cardEl.dataset.state = "encoding";

  // cancel any previous rafs for card-level keys
  if (activeAnims.has(cardEl)) {
    const prev = activeAnims.get(cardEl);
    if (Array.isArray(prev)) prev.forEach(id => cancelAnimationFrame(id));
    else cancelAnimationFrame(prev);
    activeAnims.delete(cardEl);
  }

  const titleEl = cardEl.querySelector('.card-title');
  const subtitleEl = cardEl.querySelector('.card-subtitle');

  // encode subtitle first (if exists)
  if (subtitleEl) {
    const subCurr = subtitleEl.querySelector('.hack-current');
    const subFin = subtitleEl.querySelector('.hack-final');
    if (subCurr && subFin) {
      await encodeElement(subtitleEl, { maxFrames: 14, fadeDelay: 140 });
    }
  }

  // then encode title
  if (titleEl) {
    const tCurr = titleEl.querySelector('.hack-current');
    const tFin = titleEl.querySelector('.hack-final');
    if (tCurr && tFin) {
      await encodeElement(titleEl, { maxFrames: 20, fadeDelay: 180 });
    }
  }

  cardEl.dataset.state = 'encoded';
}

function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

function snappedProgress(progressRaw, stickiness = 0.7) {
    const total = slidesData.length - 1;
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
const progressRaw = maxScroll > 0 ? (scrollPos / maxScroll) : 0;
const progress = snappedProgress(progressRaw, 0); // 0.7 = сколько "липнет"

// дальше как раньше:
const totalDepth = (slidesData.length - 1) * Z_GAP;
const cameraZ = -START_OFFSET + progress * (totalDepth + START_OFFSET);


	// сила параллакса
	const PARALLAX_POWER_X = 5; // vw
	const PARALLAX_POWER_Y = 3; // vh

slidesEls.forEach(slide => {
  const baseZ = parseFloat(slide.dataset.baseZ);
  const relativeZ = baseZ - cameraZ;

  // если слайд слишком позади или слишком впереди — прячем и делаем неинтерактивным
  if (relativeZ < -300 || relativeZ > 2000) {
    slide.style.opacity = 0;
    slide.style.filter = "none";
    slide.style.pointerEvents = "none"; // <-- ОСТАВЛЯЕМ none для скрытых слайдов
    return;
  }

  // видимая ветка — сначала вычисления...
  const dist = Math.abs(relativeZ);

  // opacity
  let vis = 1 - dist / 300;
  vis = Math.max(0, Math.min(1, vis));

  // scale
  let sc = 1.2 - (dist / 400) * 0.8;
  if (sc < 0) sc = 0.4;
  if (sc > 1.2) sc = 1.2;

  
  // параллакс от мыши
  const parallaxXvw = mouseNX * PARALLAX_POWER_X;
  const parallaxYvh = mouseNY * PARALLAX_POWER_Y;

  // поворот камеры
  const rotY = mouseNX * 5;   // deg
  const rotX = mouseNY * -3;  // deg

  // depth of field blur
  const FOCUS_DISTANCE = 30;
  const SHARP_RANGE = 30;
  const d = Math.abs(dist - FOCUS_DISTANCE);

  let blurPx = 0;
  if (d > SHARP_RANGE) {
    blurPx = (d - SHARP_RANGE) / 20;
    if (blurPx > 30) blurPx = 40;
  }

  // применяем трансформы и визуальные свойства
  slide.style.transform = `
    translate3d(${parallaxXvw}vw, ${parallaxYvh}vh, ${-relativeZ}px)
    rotateY(${rotY}deg)
    rotateX(${rotX}deg)
    scale(${sc})
  `;
  slide.style.opacity = vis;
  slide.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : "none";

  // **ВАЖНО: явно включаем pointer-events для видимого слайда**
  // делаем это после того, как применили transform/opacity — так точно не останется старое значение
  slide.style.pointerEvents = 'auto';

  // логика дешифровки/зашифровки (как у тебя)
  if (sc >= 1.1) {
    const st = slide.dataset.state;
    if (st === "encoded" || st === "encoding") {
      animateDecode(slide);
    }
  } else if (sc < 1.05) { // порог подбери по вкусу (не sc < 2)
    const st = slide.dataset.state;
    if (st === "decoded" || st === "decoding") {
      animateEncode(slide);
    }
  }
});


	requestAnimationFrame(renderFrame);
}


/* ============ 5. фон-туннель сетки ============ */
gsap.registerPlugin(ScrollTrigger);

function animateTunnelGrid() {
  const gridTop = document.querySelector(".grid-top");
  const gridBottom = document.querySelector(".grid-bottom");

  let scrollYTop = 0;
  let scrollYBottom = 0;
  let mouseX = 0;
  let mouseY = 0;

  // Скролл-анимация
  ScrollTrigger.create({
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      scrollYTop = -window.innerHeight * 2 * self.progress;
      scrollYBottom = window.innerHeight * 2 * self.progress;
      updateGrid();
    }
  });

  // Параллакс по мыши
  const parallaxStrength = 50;
  document.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2 * parallaxStrength;
    mouseY = (e.clientY / window.innerHeight - 0.1) * 1.5 * parallaxStrength;
    updateGrid();
  });

  function updateGrid() {
    gsap.set(gridTop, {
      backgroundPosition: `${mouseX}px ${scrollYTop + mouseY}px`
    });
    gsap.set(gridBottom, {
      backgroundPosition: `${mouseX}px ${scrollYBottom + mouseY}px`
    });
  }
}

buildSlides();
animateTunnelGrid();


buildSlides();
animateTunnelGrid();


function raf(time) {
	lenis.raf(time);
	ScrollTrigger.update();
	requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

requestAnimationFrame(renderFrame);

// пересчитать maxScroll на ресайзе
window.addEventListener("resize", () => {
	maxScroll = document.body.scrollHeight - window.innerHeight;
});

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



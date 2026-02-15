
const navLinks = document.querySelectorAll('.nav a, .view-btn, .card-title');


const letters = "/_+";
const speed = 10;         // меньше = быстрее
const decodeSpeed = 0.6;  // скорость восстановления букв

navLinks.forEach(link => {
  const originalText = link.textContent;
  let frame = null;
  let iteration = 0;
  let lastTime = 0;

  link.addEventListener('mouseenter', () => {
    cancelAnimationFrame(frame);

    iteration = 0;
    lastTime = 0;

    // фиксируем ширину чтобы строка не прыгала
    const width = link.offsetWidth;
    link.style.display = "inline-block";
    link.style.width = width + "px";

    const animate = (time) => {
      if (!lastTime) lastTime = time;

      if (time - lastTime > speed) {
        lastTime = time;

        link.textContent = originalText
          .split("")
          .map((char, index) => {
            if (index < iteration) return originalText[index];
            if (char === " ") return " ";
            return letters[Math.floor(Math.random() * letters.length)];
          })
          .join("");

        iteration += decodeSpeed;
      }

      if (iteration <= originalText.length) {
        frame = requestAnimationFrame(animate);
      } else {
        link.textContent = originalText;
        link.style.width = "";
      }
    };

    frame = requestAnimationFrame(animate);
  });

  link.addEventListener('mouseleave', () => {
    cancelAnimationFrame(frame);
    link.textContent = originalText;
    link.style.width = "";
  });
});

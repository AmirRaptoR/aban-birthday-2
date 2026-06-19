// Self-contained celebratory confetti burst on page load.
// No dependencies; respects prefers-reduced-motion; cleans itself up.
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const COLORS = ["#f29a72", "#7cc0a0", "#8aa6c0", "#f4c14e", "#f49ac0", "#ffffff"];

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed", inset: "0", width: "100%", height: "100%",
    pointerEvents: "none", zIndex: "9999",
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let W, H, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.floor(innerWidth * dpr);
    H = canvas.height = Math.floor(innerHeight * dpr);
  }
  resize();
  window.addEventListener("resize", resize);

  const rand = (a, b) => a + Math.random() * (b - a);
  const particles = [];

  // Two side cannons firing toward the centre, like a party popper.
  function burst(originX, angleDeg, count) {
    const angle = (angleDeg * Math.PI) / 180;
    for (let i = 0; i < count; i++) {
      const spread = rand(-0.45, 0.45);
      const speed = rand(9, 17) * dpr;
      particles.push({
        x: originX * W,
        y: H * 0.62,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        size: rand(6, 12) * dpr,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: rand(0, Math.PI * 2),
        vrot: rand(-0.3, 0.3),
        wobble: rand(0, Math.PI * 2),
        life: 0,
        ttl: rand(110, 170),
      });
    }
  }

  burst(0.0, -65, 90);   // left cannon, up-right
  burst(1.0, -115, 90);  // right cannon, up-left
  setTimeout(() => { burst(0.5, -90, 70); }, 250); // centre pop a beat later

  const GRAVITY = 0.32 * dpr;
  const DRAG = 0.985;

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= DRAG;
      p.vy = p.vy * DRAG + GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.wobble += 0.1;
      p.life++;
      if (p.life > p.ttl || p.y > H + 40) { particles.splice(i, 1); continue; }

      const fade = Math.max(0, 1 - p.life / p.ttl);
      ctx.save();
      ctx.translate(p.x + Math.sin(p.wobble) * 6, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      // little rectangular ribbons that flutter (squash on the wobble)
      const w = p.size, h = p.size * 0.5 * (0.6 + 0.4 * Math.abs(Math.cos(p.wobble)));
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }
    if (particles.length) {
      requestAnimationFrame(frame);
    } else {
      window.removeEventListener("resize", resize);
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
})();

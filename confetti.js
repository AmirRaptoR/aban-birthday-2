// Looping celebratory confetti from the two sides.
// Cycle: emit for 10s, pause 20s, repeat (forever).
// No dependencies; respects prefers-reduced-motion.
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ON_MS = 10000;   // confetti running
  const OFF_MS = 20000;  // pause between bursts
  const EMIT_EVERY_MS = 200; // how often a batch leaves each side cannon
  const PER_SIDE = 12;   // particles per side, per batch

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

  // Fire one batch from a side cannon toward the centre.
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

  function emitSides() {
    burst(0.0, -65, PER_SIDE);   // left cannon, up-right
    burst(1.0, -115, PER_SIDE);  // right cannon, up-left
  }

  const GRAVITY = 0.32;
  const DRAG = 0.985;
  let rafId = null;

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= DRAG;
      p.vy = p.vy * DRAG + GRAVITY * dpr;
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
      const w = p.size, h = p.size * 0.5 * (0.6 + 0.4 * Math.abs(Math.cos(p.wobble)));
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }
    if (particles.length || emitting) {
      rafId = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, W, H);
      rafId = null; // idle: stop drawing until the next cycle
    }
  }

  function ensureRaf() { if (rafId == null) rafId = requestAnimationFrame(frame); }

  // ---- the loop: 10s emitting, 20s pause, forever ----
  let emitting = false;
  function activePhase() {
    emitting = true;
    ensureRaf();
    emitSides();
    const interval = setInterval(emitSides, EMIT_EVERY_MS);
    setTimeout(() => {
      clearInterval(interval);
      emitting = false;          // existing particles finish falling, then rAF idles
      setTimeout(activePhase, OFF_MS);
    }, ON_MS);
  }
  activePhase();
})();

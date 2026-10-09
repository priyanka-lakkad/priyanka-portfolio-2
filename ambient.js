// Ambient network behind the page as you scroll: a few faint dots drift slowly
// and connect with hairlines when they come near each other. Deliberately
// sparse and light so it never competes with the content. On the homepage it
// fades in after the landing screen (which has its own network).
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isHome = document.documentElement.classList.contains("is-home");
  const COLORS = ["#5a2d4c", "#a3506a", "#3c4766", "#9a9298"];
  const TAU = Math.PI * 2;

  const canvas = document.createElement("canvas");
  canvas.className = "ambient-net";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let W, H, nodes = [];
  const LINK = 120;

  function setup() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Keep the network mostly in the side margins, outside the content column
    const content = document.querySelector(".container");
    const box = content ? content.getBoundingClientRect() : { left: W * 0.12, right: W * 0.88 };
    const side = Math.max(W * 0.1, box.left + 30);
    const bands = [[0, side], [W - side, W]];
    const count = Math.round(Math.min(110, Math.max(50, H / 9)));
    nodes = Array.from({ length: count }, (_, i) => {
      const inSide = Math.random() < 0.68;
      const band = bands[i % 2];
      const x = inSide ? band[0] + Math.random() * (band[1] - band[0]) : Math.random() * W;
      return {
        x,
        y: Math.random() * H,
        band: inSide ? band : null,
        // Dots in the middle stay as loose single dots (no lines)
        loose: !inSide,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() < 0.15 ? 2.2 : 1 + Math.random() * 0.9,
        // Depth: how fast the dot slides as you scroll (parallax)
        depth: 0.08 + Math.random() * 0.32,
        phase: Math.random() * TAU,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });
  }

  // On the homepage, stay hidden over the landing screen and fade in after it
  function visibility() {
    if (!isHome) return 1;
    const v = (window.scrollY - window.innerHeight * 0.45) / (window.innerHeight * 0.4);
    return Math.max(0, Math.min(1, v));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const vis = visibility();
    canvas.style.opacity = vis;
    if (vis === 0) return;

    // As you scroll, dots slide at different speeds (parallax) and gently
    // shimmer in size and strength, so the field keeps shifting subtly
    const sy = window.scrollY;
    const pts = nodes.map((n) => {
      const y = (((n.y - sy * n.depth) % (H + 40)) + H + 40) % (H + 40) - 20;
      const pulse = 0.5 + 0.5 * Math.sin(sy * 0.004 + n.phase);
      return { n, x: n.x, y, a: 0.3 + 0.35 * pulse, r: n.r * (0.85 + 0.3 * pulse) };
    });

    // Nearby dots connect; each dot links to at most two others
    ctx.lineWidth = 0.5;
    const links = new Map();
    const full = (k) => (links.get(k) || 0) >= 2;
    for (let i = 0; i < pts.length; i++) {
      if (full(i) || pts[i].n.loose) continue;
      for (let j = i + 1; j < pts.length; j++) {
        if (full(j) || pts[j].n.loose) continue;
        const a = pts[i], b = pts[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > LINK) continue;
        ctx.globalAlpha = 0.17 * (1 - d / LINK);
        ctx.strokeStyle = a.n.color;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        links.set(i, (links.get(i) || 0) + 1);
        links.set(j, (links.get(j) || 0) + 1);
        if (full(i)) break;
      }
    }
    for (const p of pts) {
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.n.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function step() {
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      // Side nodes bounce within their margin so they stay at the edges
      if (n.band && (n.x < n.band[0] || n.x > n.band[1])) n.vx *= -1;
      if (n.x < -20) n.x = W + 20;
      if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20;
      if (n.y > H + 20) n.y = -20;
    }
  }

  let running = true;
  function frame() {
    if (!running) return;
    step();
    draw();
    requestAnimationFrame(frame);
  }

  setup();
  window.addEventListener("resize", () => { setup(); draw(); });
  window.addEventListener("scroll", () => { if (reduceMotion) draw(); }, { passive: true });

  if (reduceMotion) {
    draw();
  } else {
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });
    requestAnimationFrame(frame);
  }
})();

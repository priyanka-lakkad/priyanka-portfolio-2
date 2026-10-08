// Hero intro: scattered dots gather into a ring around the video circle, the
// circle pops in, and curves flow from every dot into its edge, where they stay.
(() => {
  const canvas = document.getElementById("intro-canvas");
  const card = document.getElementById("player");
  const controls = document.getElementById("video-controls");
  const reveal = () => {
    card.classList.add("is-in");
    controls.classList.add("is-in");
  };
  if (!canvas.getContext) {
    reveal();
    return;
  }

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Deep plum, rosewood, slate blue, warm gray
  const COLORS = ["#5a2d4c", "#a3506a", "#3c4766", "#9a9298"];
  const COUNT = 150;

  // Timeline (ms)
  const GATHER_START = 900;
  const GATHER_LEN = 1000;
  const POP_AT = 2000;
  const LINES_START = 1950;
  const LINES_LEN = 1000;
  const END_AT = 3400;

  const TAU = Math.PI * 2;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // Mostly small dots with a few large ones, like a scatter plot
  const dots = Array.from({ length: COUNT }, () => {
    const big = Math.random() < 0.12;
    return {
      sx: Math.random(),
      sy: Math.random(),
      r: big ? 6 + Math.random() * 7 : 1.5 + Math.random() * 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      appearDelay: Math.random() * 600,
      gatherDelay: Math.random() * 250,
      lineDelay: Math.random() * 400,
      band: Math.floor(Math.random() * 4),
      // How far the line swirls around the circle before it plugs in
      twist: (Math.random() - 0.5) * 0.9,
      phase: Math.random() * TAU,
    };
  });

  // Each dot takes a spot on the ring in the same direction it was scattered,
  // so dots travel the shortest way and lines don't tangle
  dots
    .slice()
    .sort((a, b) => Math.atan2(a.sy - 0.5, a.sx - 0.5) - Math.atan2(b.sy - 0.5, b.sx - 0.5))
    .forEach((d, i) => {
      d.angle = (TAU * i) / COUNT + (Math.random() - 0.5) * 0.03;
    });

  let W, H, cx, cy, R, S;

  function layout() {
    const r = canvas.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width;
    H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cx = c.left - r.left + c.width / 2;
    cy = c.top - r.top + c.height / 2;
    R = c.width / 2;
    // Scale dots and lines with the circle so they hold up on big monitors
    S = Math.min(1.6, Math.max(0.85, R / 150));
  }

  // Ring position for a dot: four bands just outside the circle
  const ringRadius = (d) => R * (1.24 + d.band * 0.08);
  const polar = (angle, radius) => ({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });

  function bezierPoint(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // Lines first, so dots sit on top of them
    ctx.lineWidth = 0.8 * Math.sqrt(S);
    for (const d of dots) {
      const p = easeOut(clamp((t - LINES_START - d.lineDelay) / LINES_LEN));
      if (p <= 0) continue;
      const rd = ringRadius(d);
      const end = d.angle + d.twist;
      const p0 = polar(d.angle, rd);
      const p1 = polar(d.angle + d.twist * 0.15, lerp(rd, R, 0.45));
      const p2 = polar(end - d.twist * 0.1, lerp(rd, R, 0.8));
      const p3 = polar(end, R);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      const steps = 24;
      for (let i = 1; i <= steps * p; i++) {
        const q = bezierPoint(p0, p1, p2, p3, i / steps);
        ctx.lineTo(q.x, q.y);
      }
      ctx.strokeStyle = d.color;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
    }

    for (const d of dots) {
      const a = easeOut(clamp((t - d.appearDelay) / 400));
      if (a <= 0) continue;
      const g = easeInOut(clamp((t - GATHER_START - d.gatherDelay) / GATHER_LEN));
      const target = polar(d.angle, ringRadius(d));
      // Gentle drift while scattered, settles as the dots gather
      const drift = (1 - g) * 6;
      const x = lerp(d.sx * W, target.x, g) + Math.sin(t / 500 + d.phase) * drift;
      const y = lerp(d.sy * H, target.y, g) + Math.cos(t / 600 + d.phase) * drift;
      // Big dots shrink as they join the ring
      const r = lerp(d.r, Math.min(d.r, 3.2), g) * a * S;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = d.color;
      ctx.globalAlpha = 0.85 * a;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  let start = null;
  let elapsed = 0;

  function frame(now) {
    if (start === null) start = now;
    elapsed = Math.min(now - start, END_AT);
    draw(elapsed);
    if (elapsed >= POP_AT) reveal();
    if (elapsed < END_AT) requestAnimationFrame(frame);
  }

  layout();
  // Redraw the current (or finished) state if the window changes size
  window.addEventListener("resize", () => {
    layout();
    draw(elapsed);
  });

  if (reduceMotion) {
    elapsed = END_AT;
    draw(elapsed);
    reveal();
  } else {
    requestAnimationFrame(frame);
  }
})();

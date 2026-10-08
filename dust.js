// Landing-screen particle field: when the page opens, tiny dots are scattered
// across the whole landing screen; most of them then drift in and gather into
// a soft, crescent-weighted ring around the video, while the rest stay
// scattered. The ring then holds still. Colors match the site's network.
(() => {
  const canvas = document.getElementById("dust");
  const card = document.getElementById("player");
  if (!canvas || !card || !canvas.getContext) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Plum, rose, slate, warm gray (same as the network), weighted toward plum/rose
  const COLORS = ["#5a2d4c", "#a3506a", "#a3506a", "#3c4766", "#9a9298", "#7d4a6d"];

  const TAU = Math.PI * 2;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const gauss = () => {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  };

  const GATHER_START = 400;
  const GATHER_LEN = 1800;

  let W, H, cx, cy, R, dots = [];
  // Network layer: a subset of dots become "nodes", linked to their nearest
  // neighbours by hairlines, with small signals travelling along the links
  let nodes = [], links = [], pulses = [];
  const LINKS_IN = GATHER_START + GATHER_LEN;

  function build() {
    const isSmall = W < 700;
    const count = Math.round(Math.min(2400, (W * H) / (isSmall ? 260 : 420)));
    dots = Array.from({ length: count }, () => {
      const inRing = Math.random() < 0.72;
      let angle, radius;
      if (inRing) {
        // Heavier on the lower-left side, like a crescent of light
        do { angle = Math.random() * TAU; }
        while (Math.random() > 0.45 + 0.55 * (0.5 + 0.5 * Math.cos(angle - 2.35)));
        radius = 1.42 + gauss() * 0.13 + (Math.random() < 0.25 ? Math.random() * 0.45 : 0);
      }
      return {
        inRing,
        angle,
        radius,
        // Where it starts: anywhere on the landing screen
        sx: Math.random(),
        sy: Math.random(),
        // Where scattered dots stay (they drift gently around it)
        fx: Math.random(),
        fy: Math.random(),
        size: Math.random() < 0.12 ? 2.6 : 1.4 + Math.random() * 0.9,
        alpha: inRing ? 0.35 + Math.random() * 0.5 : 0.18 + Math.random() * 0.32,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 500,
        phase: Math.random() * TAU,
        x: 0,
        y: 0,
      };
    });
    buildNetwork();
  }

  // Pick nodes and connect each to its 2-3 nearest nodes (based on where the
  // dots end up), so the ring and the scattered field read as one AI network
  function buildNetwork() {
    const isSmall = W < 700;
    const ringDots = dots.filter((d) => d.inRing);
    const fieldDots = dots.filter((d) => !d.inRing);
    const pick = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
    nodes = [...pick(ringDots, isSmall ? 70 : 130), ...pick(fieldDots, isSmall ? 18 : 40)];
    nodes.forEach((n) => {
      n.node = true;
      n.size = 2.4 + Math.random() * 1.6;
      n.alpha = Math.max(n.alpha, 0.7);
    });
    const pos = (d) => d.inRing
      ? [cx + Math.cos(d.angle) * R * d.radius, cy + Math.sin(d.angle) * R * d.radius]
      : [d.fx * W, d.fy * H];
    const seen = new Set();
    links = [];
    nodes.forEach((a, i) => {
      const [ax, ay] = pos(a);
      const near = nodes
        .map((b, j) => {
          const [bx, by] = pos(b);
          return { j, dist: Math.hypot(ax - bx, ay - by) };
        })
        .filter((o) => o.j !== i)
        .sort((p, q) => p.dist - q.dist)
        .slice(0, a.inRing ? 3 : 2);
      near.forEach(({ j, dist }) => {
        const key = i < j ? i + "-" + j : j + "-" + i;
        if (seen.has(key) || dist > R * 0.9) return;
        seen.add(key);
        links.push({ a, b: nodes[j], delay: Math.random() * 900 });
      });
    });
    pulses = [];
  }

  function layout() {
    const r = canvas.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const changed = Math.round(r.width) !== W || Math.round(r.height) !== H;
    W = Math.round(r.width);
    H = Math.round(r.height);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = c.left - r.left + c.width / 2;
    cy = c.top - r.top + c.height / 2;
    R = c.width / 2;
    if (changed || !dots.length) build();
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (const d of dots) {
      const g = d.inRing ? easeInOut(clamp((t - GATHER_START - d.delay) / GATHER_LEN)) : 0;
      let x, y;
      if (d.inRing) {
        const a = d.angle;
        const tx = cx + Math.cos(a) * R * d.radius;
        const ty = cy + Math.sin(a) * R * d.radius;
        x = d.sx * W + (tx - d.sx * W) * g;
        y = d.sy * H + (ty - d.sy * H) * g;
      } else {
        // Scattered dots: a slow, small drift around their spot
        x = d.fx * W + Math.sin(t / 3000 + d.phase) * 6;
        y = d.fy * H + Math.cos(t / 3600 + d.phase) * 6;
      }
      d.x = x;
      d.y = y;
      // Fade dots in as the page opens
      ctx.globalAlpha = d.alpha * clamp((t - d.delay * 0.4) / 500);
      ctx.fillStyle = d.color;
      if (d.node) {
        // Nodes are round, with a faint halo ring
        ctx.beginPath();
        ctx.arc(x, y, d.size / 2 + 0.4, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, d.size, d.size);
      }
    }

    // Links fade in once the dots have gathered
    ctx.lineWidth = 0.6;
    for (const l of links) {
      const k = clamp((t - LINKS_IN - l.delay) / 700);
      if (k <= 0) continue;
      ctx.globalAlpha = 0.22 * k;
      ctx.strokeStyle = l.a.color;
      ctx.beginPath();
      ctx.moveTo(l.a.x, l.a.y);
      ctx.lineTo(l.a.x + (l.b.x - l.a.x) * k, l.a.y + (l.b.y - l.a.y) * k);
      ctx.stroke();
    }

    // Signals: small bright dots that travel along a link, now and then
    if (t > LINKS_IN + 900 && links.length) {
      if (pulses.length < 6 && Math.random() < 0.06) {
        pulses.push({ link: links[Math.floor(Math.random() * links.length)], born: t });
      }
      pulses = pulses.filter((p) => t - p.born < 900);
      for (const p of pulses) {
        const k = (t - p.born) / 900;
        const { a, b } = p.link;
        const x = a.x + (b.x - a.x) * k;
        const y = a.y + (b.y - a.y) * k;
        ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
        ctx.fillStyle = "#a3506a";
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, TAU);
        ctx.fill();
        // Light up the receiving node when the signal arrives
        if (k > 0.85) {
          ctx.globalAlpha = (1 - k) * 4;
          ctx.strokeStyle = b.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 6 + (k - 0.85) * 40, 0, TAU);
          ctx.stroke();
          ctx.lineWidth = 0.6;
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  let start = null;
  let running = false;
  let elapsed = 0;

  function frame(now) {
    if (!running) return;
    if (start === null) start = now - elapsed;
    elapsed = now - start;
    draw(elapsed);
    requestAnimationFrame(frame);
  }

  layout();
  window.addEventListener("resize", () => {
    layout();
    draw(elapsed);
  });

  if (reduceMotion) {
    elapsed = GATHER_START + GATHER_LEN + 600;
    draw(elapsed);
    return;
  }

  const play = () => {
    if (running) return;
    running = true;
    start = null;
    requestAnimationFrame(frame);
  };
  const pause = () => { running = false; };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause())).observe(canvas);
  } else {
    play();
  }
})();

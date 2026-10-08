// Clicking the PL logo: the letters pop up slightly and a tiny network flicks
// out around them in a loose, uneven web (kept inside the header), then it
// goes home, or back to the top on the homepage.
(() => {
  const logo = document.querySelector(".logo");
  if (!logo) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const accent = getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#5a2d4c";
  // Same palette as the dots around the video circle, plus this page's project color
  const COLORS = [accent, "#5a2d4c", "#a3506a", "#3c4766", "#9a9298"];
  const COUNT = 5;
  const DURATION = 300;
  const GROW = 220;

  const TAU = Math.PI * 2;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const isHome = () => {
    const target = new URL(logo.href, location.href);
    return target.pathname === location.pathname;
  };

  let running = false;

  function burst(done) {
    const canvas = document.createElement("canvas");
    canvas.className = "logo-burst";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    // The burst lives inside the header strip only
    const header = document.querySelector(".header");
    const W = window.innerWidth;
    const H = header ? header.offsetHeight : 72;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const r = logo.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    // Lines start just outside the letters; R sets the overall size
    const INNER = 16;
    const R = Math.min(28, H / 2 - 6);

    // Messier than an even ring: jittered angles, mixed lengths and sizes,
    // slight bends, and a few dot-to-dot links like the hero network
    const dots = Array.from({ length: COUNT }, (_, i) => ({
      angle: (TAU * i) / COUNT + (Math.random() - 0.5) * 0.9,
      reach: 0.4 + Math.random() * 0.2,
      bend: (Math.random() - 0.5) * 4,
      size: 0.8 + Math.random() * 0.6,
      delay: Math.random() * 80,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    const links = Array.from({ length: 0 }, () => [
      Math.floor(Math.random() * COUNT),
      Math.floor(Math.random() * COUNT),
    ]).filter(([a, b]) => a !== b);

    let start = null;
    function frame(now) {
      if (start === null) start = now;
      const t = now - start;
      ctx.clearRect(0, 0, W, H);

      // Fade out over the last 40%
      const fade = 1 - clamp((t - DURATION * 0.6) / (DURATION * 0.4));

      for (const d of dots) {
        const p = easeOut(clamp((t - d.delay) / GROW));
        const ux = Math.cos(d.angle);
        const uy = Math.sin(d.angle);
        // Wider sideways than up/down so it stays inside the header
        const dist = INNER + (R * 1.7 * d.reach - INNER) * p;
        d.x = cx + ux * dist;
        d.y = Math.max(3, Math.min(H - 3, cy + uy * dist * 0.75));
        const x = d.x;
        const y = d.y;

        const sx = cx + ux * INNER;
        const sy = cy + uy * INNER * 0.75;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo((sx + x) / 2 - uy * d.bend, (sy + y) / 2 + ux * d.bend, x, y);
        ctx.strokeStyle = d.color;
        ctx.globalAlpha = 0.18 * fade;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, d.size, 0, TAU);
        ctx.fillStyle = d.color;
        ctx.globalAlpha = 0.45 * fade;
        ctx.fill();
      }
      // Faint cross-links between some of the dots
      ctx.lineWidth = 0.5;
      for (const [a, b] of links) {
        ctx.beginPath();
        ctx.moveTo(dots[a].x, dots[a].y);
        ctx.lineTo(dots[b].x, dots[b].y);
        ctx.strokeStyle = dots[a].color;
        ctx.globalAlpha = 0.18 * fade;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (t < DURATION) {
        requestAnimationFrame(frame);
      } else {
        canvas.remove();
        running = false;
        done();
      }
    }
    requestAnimationFrame(frame);
  }

  logo.addEventListener("click", (e) => {
    // Let cmd/ctrl-click open a new tab as usual
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (running) return;

    const home = isHome();
    const go = () => {
      if (home) {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      } else {
        window.location.href = logo.href;
      }
    };

    if (reduceMotion) return go();
    running = true;
    logo.classList.add("is-bursting");
    setTimeout(() => logo.classList.remove("is-bursting"), 340);
    burst(go);
  });
})();

// Click-through prototype: hotspots on each screen advance to the next one.
// The step tabs, arrows and arrow keys also move between screens, and the
// caption under the frame updates to describe the current step.
(() => {
  document.querySelectorAll("[data-proto]").forEach((proto) => {
    const screens = [...proto.querySelectorAll(".proto-screen")];
    const steps = [...proto.querySelectorAll(".proto-step")];
    const caption = proto.querySelector(".proto-caption");
    const captions = [...(proto.querySelector("[data-captions]")?.content.querySelectorAll("p") || [])].map((p) => p.textContent);
    const prev = proto.querySelector('[data-dir="-1"]');
    const next = proto.querySelector('[data-dir="1"]');
    const count = proto.querySelector("[data-current]");
    let current = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Live screens: real prototype pages in iframes, rendered at 1440×900 and
    // scaled to the frame. Hotspots use page coordinates (data-x / data-y).
    const frames = [...proto.querySelectorAll(".proto-screen iframe[data-src]")];
    if (frames.length) {
      const stage = proto.querySelector(".proto-screens");
      screens.forEach((s) => {
        if (s.dataset.h) s.style.setProperty("--h", `${s.dataset.h}px`);
        if (s.dataset.pan) s.style.setProperty("--pan", s.dataset.pan);
        s.querySelectorAll(".proto-hot[data-x]").forEach((hot) => {
          const pan = +s.dataset.pan || 0;
          hot.style.setProperty("--x", `${(hot.dataset.x / 1440) * 100}%`);
          hot.style.setProperty("--y", `${((hot.dataset.y - pan) / 900) * 100}%`);
          // The whole target (a row or button) is clickable, not just the ring
          if (hot.dataset.zone) {
            const [x, y, w, zh] = hot.dataset.zone.split(",").map(Number);
            const zone = document.createElement("span");
            zone.className = "proto-zone";
            zone.setAttribute("aria-hidden", "true");
            zone.style.cssText = `left:${(x / 1440) * 100}%;top:${((y - pan) / 900) * 100}%;width:${(w / 1440) * 100}%;height:${(zh / 900) * 100}%`;
            zone.addEventListener("click", () => hot.click());
            zone.addEventListener("mouseenter", () => hot.classList.add("is-hover"));
            zone.addEventListener("mouseleave", () => hot.classList.remove("is-hover"));
            if (hot.hasAttribute("data-check")) zone.classList.add("for-check");
            else if (s.querySelector("[data-check]")) zone.classList.add("for-next");
            hot.before(zone);
          }
        });
        // A checkbox step: ticking it reveals the next action on the same screen
        const check = s.querySelector("[data-check]");
        if (check) check.addEventListener("click", () => s.classList.add("is-checked"));
      });
      const fit = () => stage.style.setProperty("--s", (stage.clientWidth / 1440).toFixed(4));
      fit();
      if ("ResizeObserver" in window) new ResizeObserver(fit).observe(stage); else window.addEventListener("resize", fit);
      const load = () => frames.forEach((f) => { if (!f.src) f.src = f.dataset.src; });
      // Clicking inside a frame moves focus into it; remember that it may have navigated
      window.addEventListener("blur", () => setTimeout(() => {
        if (frames.includes(document.activeElement)) document.activeElement._dirty = true;
      }));
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: "600px 0px" });
        io.observe(stage);
      } else load();
    }

    const go = (i) => {
      current = Math.max(0, Math.min(screens.length - 1, i));
      screens.forEach((s, j) => s.classList.toggle("is-active", j === current));
      steps.forEach((s, j) => {
        s.setAttribute("aria-selected", String(j === current));
        s.tabIndex = j === current ? 0 : -1;
      });
      if (caption) caption.textContent = captions[current] || "";
      if (count) count.textContent = current + 1;
      if (prev) prev.disabled = current === 0;
      if (next) next.disabled = current === screens.length - 1;
      // A live screen someone clicked around in goes back to its own link
      // once they leave it, so each tab always shows the right screen
      screens.forEach((s, j) => {
        const f = s.querySelector("iframe[data-src]");
        if (f && f._dirty && j !== current) { f._dirty = false; f.src = f.dataset.src; }
      });
      // Screens with data-pan scroll down to the part that matters after a beat
      screens.forEach((s, j) => {
        clearTimeout(s._pan);
        if (j !== current) s.classList.remove("is-checked");
        s.classList.remove("is-panned");
        if (j === current && s.dataset.pan) s._pan = setTimeout(() => s.classList.add("is-panned"), reduceMotion ? 0 : +(s.dataset.panDelay || 700));
      });
    };

    proto.querySelectorAll("[data-next]").forEach((hot) => {
      hot.addEventListener("click", () => {
        hot.classList.add("is-pressed");
        setTimeout(() => {
          hot.classList.remove("is-pressed");
          go(current + 1);
        }, 220);
      });
    });
    proto.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(+b.dataset.go)));
    if (prev) prev.addEventListener("click", () => go(current - 1));
    if (next) next.addEventListener("click", () => go(current + 1));
    steps.forEach((s) => s.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(current + 1); steps[current].focus(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(current - 1); steps[current].focus(); }
    }));
    // While a screen still shows the placeholder sketch, place its hotspot on
    // the highlighted (.target) element. Real screenshots keep the --x/--y set
    // in the HTML.
    const placeHotspots = () => {
      screens.forEach((screen) => {
        const hot = screen.querySelector(".proto-hot");
        const target = screen.querySelector(".sk .target");
        if (!hot || !target || screen.querySelector("img")) return;
        const was = screen.classList.contains("is-active");
        const box = screen.getBoundingClientRect();
        const t = target.getBoundingClientRect();
        if (!box.width) return;
        hot.style.setProperty("--x", `${((t.left + t.width / 2 - box.left) / box.width) * 100}%`);
        hot.style.setProperty("--y", `${((t.top + t.height / 2 - box.top) / box.height) * 100}%`);
        void was;
      });
    };
    // Expand into a large overlay and back; Esc or the backdrop closes it
    const expandBtn = proto.querySelector("[data-expand]");
    let backdrop = null;
    const setExpanded = (open) => {
      proto.classList.toggle("is-expanded", open);
      document.body.classList.toggle("proto-open", open);
      if (expandBtn) {
        expandBtn.setAttribute("aria-label", open ? "Close expanded prototype" : "Expand prototype");
      }
      if (open) {
        backdrop = document.createElement("div");
        backdrop.className = "proto-backdrop";
        backdrop.addEventListener("click", () => setExpanded(false));
        proto.before(backdrop);
        expandBtn && expandBtn.focus();
      } else if (backdrop) {
        backdrop.remove();
        backdrop = null;
      }
      requestAnimationFrame(placeHotspots);
      setTimeout(placeHotspots, 350);
    };
    if (expandBtn) expandBtn.addEventListener("click", () => setExpanded(!proto.classList.contains("is-expanded")));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && proto.classList.contains("is-expanded")) setExpanded(false);
    });
    go(0);
    placeHotspots();
    window.addEventListener("resize", placeHotspots);
  });
})();

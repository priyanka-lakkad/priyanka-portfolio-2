// Solutions stepper: click a step, use the previous/next arrows, or the
// left/right arrow keys to move between the four screens. No auto-advance;
// the line under the steps fills up to the one you're viewing.
(() => {
  document.querySelectorAll("[data-stepper]").forEach((stepper) => {
    const tabs = [...stepper.querySelectorAll(".stepper-tab")];
    const panels = [...stepper.querySelectorAll(".stepper-panel")];
    const prev = stepper.querySelector('[data-dir="-1"]');
    const next = stepper.querySelector('[data-dir="1"]');
    const count = stepper.querySelector("[data-current]");
    let current = 0;

    const select = (i, focus = false) => {
      current = Math.max(0, Math.min(tabs.length - 1, i));
      tabs.forEach((t, j) => {
        t.setAttribute("aria-selected", String(j === current));
        t.tabIndex = j === current ? 0 : -1;
        t.classList.toggle("is-done", j < current);
      });
      panels.forEach((p, j) => p.classList.toggle("is-active", j === current));
      if (count) count.textContent = current + 1;
      if (prev) prev.disabled = current === 0;
      if (next) next.disabled = current === tabs.length - 1;
      if (focus) tabs[current].focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i));
      tab.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); select(current + 1, true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); select(current - 1, true); }
      });
    });
    if (prev) prev.addEventListener("click", () => select(current - 1));
    if (next) next.addEventListener("click", () => select(current + 1));
    select(0);

    // Live screens: real prototype pages rendered at 1440×900 and scaled to
    // the frame, loaded once the stepper is near the viewport
    const frames = [...stepper.querySelectorAll(".stepper-screen iframe[data-src]")];
    if (frames.length) {
      const screens = [...stepper.querySelectorAll(".stepper-screen.is-live")];
      // Scrollable screens: a sizer gives the frame the scaled page height to scroll through
      stepper.querySelectorAll(".stepper-screen.is-scroll").forEach((el) => {
        el.style.setProperty("--h", `${el.dataset.h}px`);
        const sizer = document.createElement("span");
        sizer.className = "stepper-sizer";
        el.append(sizer);
        el.addEventListener("scroll", () => el.classList.toggle("is-scrolled", el.scrollTop > 8), { passive: true });
      });
      const fit = () => screens.forEach((el) => { if (el.clientWidth) el.style.setProperty("--s", (el.clientWidth / 1440).toFixed(4)); });
      fit();
      if ("ResizeObserver" in window) { const ro = new ResizeObserver(fit); screens.forEach((el) => ro.observe(el)); } else window.addEventListener("resize", fit);
      const load = () => frames.forEach((f) => { if (!f.src) f.src = f.dataset.src; });
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: "1500px 0px" });
        io.observe(stepper);
      } else load();
    }
  });
})();

// Validation compare: each screen renders a 1440×900 prototype page scaled to
// its frame. Frames without a link keep their placeholder.
(() => {
  document.querySelectorAll("[data-compare]").forEach((compare) => {
    const screens = [...compare.querySelectorAll(".compare-screen")];
    const fit = () => screens.forEach((el) => { if (el.clientWidth) el.style.setProperty("--s", (el.clientWidth / 1440).toFixed(4)); });
    fit();
    if ("ResizeObserver" in window) { const ro = new ResizeObserver(fit); screens.forEach((el) => ro.observe(el)); } else window.addEventListener("resize", fit);
    const load = () => screens.forEach((el) => {
      const f = el.querySelector("iframe");
      if (f && f.dataset.src && !f.src) { f.src = f.dataset.src; el.classList.add("is-loaded"); }
    });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: "1500px 0px" });
      io.observe(compare);
    } else load();

    // Expand a screen into a large overlay and back; Esc or the backdrop closes it
    let backdrop = null;
    const close = () => {
      const open = compare.querySelector(".compare-item.is-expanded");
      if (!open) return;
      open.classList.remove("is-expanded");
      open.querySelector("[data-expand]").setAttribute("aria-label", "Expand screen");
      document.body.classList.remove("proto-open");
      if (backdrop) { backdrop.remove(); backdrop = null; }
    };
    compare.querySelectorAll("[data-expand]").forEach((btn) => btn.addEventListener("click", () => {
      const item = btn.closest(".compare-item");
      if (item.classList.contains("is-expanded")) { close(); return; }
      close();
      backdrop = document.createElement("div");
      backdrop.className = "proto-backdrop";
      backdrop.addEventListener("click", close);
      compare.before(backdrop);
      item.classList.add("is-expanded");
      btn.setAttribute("aria-label", "Close expanded screen");
      document.body.classList.add("proto-open");
      btn.focus();
    }));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  });
})();

// Live prototype embeds: the iframe renders the site at full desktop size
// (1440×900) and is scaled down to fit its frame, so it looks like the real
// screen. The expand button opens it in a large overlay (Esc closes).
(() => {
  document.querySelectorAll("[data-live]").forEach((live) => {
    const stage = live.querySelector(".live-stage");
    const frame = stage.querySelector("iframe");
    // Load the site when the frame comes near the screen (or right away if the
    // browser can't tell), and hide the loading note once it has loaded
    const load = () => {
      if (frame.src || !frame.dataset.src) return;
      frame.addEventListener("load", () => live.classList.add("is-loaded"), { once: true });
      frame.src = frame.dataset.src;
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { load(); io.disconnect(); }
      }, { rootMargin: "600px 0px" });
      io.observe(stage);
    } else {
      load();
    }
    const fit = () => stage.style.setProperty("--s", (stage.clientWidth / 1440).toFixed(4));
    fit();
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(stage);
    else window.addEventListener("resize", fit);

    const btn = live.querySelector("[data-expand]");
    let backdrop = null;
    const setOpen = (open) => {
      live.classList.toggle("is-expanded", open);
      document.body.classList.toggle("proto-open", open);
      btn.setAttribute("aria-label", open ? "Close expanded prototype" : "Expand prototype");
      if (open) {
        backdrop = document.createElement("div");
        backdrop.className = "proto-backdrop";
        backdrop.addEventListener("click", () => setOpen(false));
        live.before(backdrop);
      } else if (backdrop) {
        backdrop.remove();
        backdrop = null;
      }
      requestAnimationFrame(fit);
    };
    btn.addEventListener("click", () => setOpen(!live.classList.contains("is-expanded")));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && live.classList.contains("is-expanded")) setOpen(false);
    });
  });
})();

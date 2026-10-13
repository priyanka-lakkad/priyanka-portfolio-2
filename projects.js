// Project "app" cards: clicking a tab switches the panel. Tabs also advance on
// their own (the progress bar's animation ending moves to the next tab), which
// pauses on hover and stops for visitors who prefer reduced motion.
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-project]").forEach((project) => {
    const tabs = [...project.querySelectorAll('[role="tab"]')];
    const panels = [...project.querySelectorAll("[data-panel]")];

    const select = (tab) => {
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === tab.dataset.tab));
      // Restart the progress bar on the newly selected tab
      const bar = tab.querySelector(".tab-progress");
      bar.style.animation = "none";
      void bar.offsetWidth;
      bar.style.animation = "";
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.querySelector(".tab-progress").addEventListener("animationend", () => {
        if (!reduceMotion) select(tabs[(i + 1) % tabs.length]);
      });
    });

    // Clicking anywhere on the card opens its case study; the screen dots
    // and links keep their own behavior
    const link = project.querySelector(".app-link");
    const modal = link && link.dataset.modalOpen && document.getElementById(link.dataset.modalOpen);
    if (modal) project.addEventListener("click", (e) => {
      // A project without a case study page opens its summary dialog instead
      if (e.target.closest('a, [role="tab"]')) return;
      modal.showModal();
    });
    else if (link) project.addEventListener("click", (e) => {
      if (e.target.closest('a, button, [role="tab"]')) return;
      if (e.metaKey || e.ctrlKey) window.open(link.href, "_blank");
      else window.location.href = link.href;
    });

    // Live screens: scale each 1440×900 page to the card and load it once
    // the card is near the viewport
    const live = [...project.querySelectorAll(".screen.is-live")];
    if (live.length) {
      const showcase = project.querySelector(".showcase");
      const fit = () => live.forEach((el) => el.style.setProperty("--s", (showcase.clientWidth / 1440).toFixed(4)));
      fit();
      if ("ResizeObserver" in window) new ResizeObserver(fit).observe(showcase); else window.addEventListener("resize", fit);
      const load = () => project.querySelectorAll(".screen iframe[data-src]").forEach((f) => { if (!f.src) f.src = f.dataset.src; });
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: "600px 0px" });
        io.observe(project);
      } else load();
    }

    // Hovering or focusing the card previews its case study colors (styles.css)
    const preview = () => {
      const root = document.documentElement.style;
      const accent = project.style.getPropertyValue("--accent");
      root.setProperty("--project-accent", accent);
      // Contact band: the case study's own colors, or a dark shade of the accent
      root.setProperty("--project-cta-bg", project.style.getPropertyValue("--cta-bg") || `color-mix(in srgb, ${accent} 22%, #0a0a0d)`);
      root.setProperty("--project-cta-highlight", project.style.getPropertyValue("--cta-highlight") || `color-mix(in srgb, ${accent} 45%, white)`);
    };
    project.addEventListener("pointerenter", preview);
    project.addEventListener("focusin", preview);

    if (reduceMotion) project.classList.add("is-paused");

    // Only auto-advance while the project is on screen
    if ("IntersectionObserver" in window && !reduceMotion) {
      project.classList.add("is-paused");
      new IntersectionObserver(([entry]) => {
        project.classList.toggle("is-paused", !entry.isIntersecting);
      }, { threshold: 0.4 }).observe(project);
    }
  });

  // Summary dialogs: close from the X or the contact link, or by clicking the
  // dimmed area outside (Escape closes them natively)
  document.querySelectorAll("dialog.project-modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.closest("[data-modal-close]")) modal.close();
    });
  });
})();

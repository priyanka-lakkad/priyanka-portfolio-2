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

    if (reduceMotion) project.classList.add("is-paused");

    // Only auto-advance while the project is on screen
    if ("IntersectionObserver" in window && !reduceMotion) {
      project.classList.add("is-paused");
      new IntersectionObserver(([entry]) => {
        project.classList.toggle("is-paused", !entry.isIntersecting);
      }, { threshold: 0.4 }).observe(project);
    }
  });
})();

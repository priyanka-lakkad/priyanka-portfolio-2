// Inline videos: load and play only while on screen, pause when scrolled
// away. Inside a stepper, only the open tab's video plays, and opening a tab
// starts its clip from the beginning. Visitors who prefer reduced motion get
// the poster and controls instead.
(() => {
  const videos = [...document.querySelectorAll("video[data-inview]")];
  if (!videos.length) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    videos.forEach((v) => { v.controls = true; v.preload = "metadata"; });
    return;
  }

  const onScreen = new Set();
  const panelOf = (v) => v.closest(".stepper-panel");
  const isOpen = (v) => !panelOf(v) || panelOf(v).classList.contains("is-active");
  const update = (v) => {
    if (onScreen.has(v) && isOpen(v)) v.play().catch(() => { v.controls = true; });
    else v.pause();
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) onScreen.add(v); else onScreen.delete(v);
      update(v);
    });
  }, { threshold: 0.25 });
  videos.forEach((v) => io.observe(v));

  // Tab switches: restart the newly opened clip, pause the others
  const mo = new MutationObserver((records) => {
    records.forEach(({ target: panel }) => {
      panel.querySelectorAll("video[data-inview]").forEach((v) => {
        if (isOpen(v)) v.currentTime = 0;
        update(v);
      });
    });
  });
  new Set(videos.map(panelOf).filter(Boolean)).forEach((p) => mo.observe(p, { attributes: true, attributeFilter: ["class"] }));
})();

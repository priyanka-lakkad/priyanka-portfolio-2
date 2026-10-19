// Scrollable screens (tall prototype pages and screenshots inside a frame):
// keep them from trapping the page scroll.
// - Scrolling the page and passing over a screen keeps scrolling the page;
//   the screen only scrolls when a scroll starts on it
// - At the top or bottom of a screen, the scroll carries on to the page
// Works for mouse wheels, trackpads and touch.
(() => {
  const screens = [...document.querySelectorAll(".stepper-screen.is-scroll, .shot-scroll")];
  if (!screens.length) return;

  const atEdge = (el, dy) =>
    (dy < 0 && el.scrollTop <= 0) ||
    (dy > 0 && Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight - 1);

  // ---- Wheel and trackpad ----
  // A scroll gesture is a run of wheel events with short gaps; remember
  // whether the current one belongs to the page or to a screen
  const GAP = 350;
  let lastWheel = 0;
  let owner = null; // the screen that owns the current gesture, or null for the page

  const lineHeight = 16;
  const toPixels = (e) => (e.deltaMode === 1 ? e.deltaY * lineHeight : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY);

  window.addEventListener("wheel", (e) => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // pinch-zoom or sideways
    const now = performance.now();
    const fresh = now - lastWheel > GAP;
    lastWheel = now;
    const screen = e.target.closest && e.target.closest(".stepper-screen.is-scroll, .shot-scroll");
    if (fresh) owner = screen || null;
    if (!screen) return; // over the page: nothing to do

    const dy = toPixels(e);
    // Passing over a screen mid page scroll, or at the screen's edge: scroll the page
    if (owner !== screen || atEdge(screen, dy)) {
      e.preventDefault();
      window.scrollBy(0, dy);
      if (owner === screen && atEdge(screen, dy)) owner = null; // hand the rest of the gesture to the page
    }
  }, { passive: false });

  // ---- Touch ----
  // At a screen's edge, keep moving the page with the finger
  screens.forEach((el) => {
    let lastY = 0;
    el.addEventListener("touchstart", (e) => { lastY = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchmove", (e) => {
      const y = e.touches[0].clientY;
      const dy = lastY - y;
      lastY = y;
      if (atEdge(el, dy)) {
        e.preventDefault();
        window.scrollBy(0, dy);
      }
    }, { passive: false });
  });
})();

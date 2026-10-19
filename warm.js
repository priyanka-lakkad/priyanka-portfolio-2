// Prototypes are separate apps on another site, so each one takes a moment to
// boot. Once the page has finished loading, start the first screen of each
// prototype in the background, one at a time, top to bottom. The first one
// also fills the browser cache, so every later screen of the same app opens
// almost instantly. The other scripts skip any frame that already has a src.
(() => {
  const groups = document.querySelectorAll("[data-stepper], [data-proto], [data-compare], .live, [data-project]");
  const queue = [];
  groups.forEach((g) => {
    const f = g.querySelector("iframe[data-src]");
    if (f && !queue.includes(f)) queue.push(f);
  });
  if (!queue.length) return;

  const start = (f) => new Promise((done) => {
    if (f.src) return done();
    const box = f.closest(".live, .compare-screen");
    f.addEventListener("load", () => { if (box) box.classList.add("is-loaded"); done(); }, { once: true });
    // Don't let one slow app hold up the rest
    setTimeout(done, 4000);
    f.src = f.dataset.src;
  });

  const run = async () => {
    for (const f of queue) await start(f);
  };

  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
  if (document.readyState === "complete") idle(run);
  else window.addEventListener("load", () => idle(run), { once: true });
})();

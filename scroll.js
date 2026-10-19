// Scroll effects: sections ease in as they enter the screen and back out as
// they leave (in both directions), plus a back-to-top button with a progress ring.
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Reveal on scroll ----
  const targets = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting));
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    targets.forEach((el) => observer.observe(el));
  }

  // ---- Back to top ----
  const root = document.documentElement;
  const workLink = document.querySelector('.header nav a[href="#work"]');
  const workSection = document.getElementById("work");
  const button = document.getElementById("to-top");
  const ring = button.querySelector(".to-top-progress");
  const circumference = 2 * Math.PI * 22;
  ring.style.strokeDasharray = circumference;

  const phone = window.matchMedia("(max-width: 900px)");
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    ring.style.strokeDashoffset = circumference * (1 - progress);
    // Homepage: header stays see-through over the landing dots until you
    // scroll past the first screen; on phones it turns glassy as soon as you scroll
    if (root.classList.contains("is-home")) {
      const at = phone.matches ? 4 : window.innerHeight * 0.6;
      root.classList.toggle("is-scrolled", window.scrollY > at);
    }
    // Homepage: mark Work as selected while the projects are on screen
    if (workLink && workSection) {
      const r = workSection.getBoundingClientRect();
      const mid = window.innerHeight / 2;
      if (r.top < mid && r.bottom > mid) workLink.setAttribute("aria-current", "location");
      else workLink.removeAttribute("aria-current");
    }
    // Show once the visitor has scrolled past most of the first screen
    button.classList.toggle("is-shown", window.scrollY > window.innerHeight * 0.6);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
})();

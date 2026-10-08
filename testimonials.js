// Testimonials: "Read more" expands a card's full text (and "Read less" folds
// it back). In the two-column layout, a card with a shorter pull quote shows a
// few more lines of text instead of a gap, so both "Read more" buttons still
// sit at the same point.
(() => {
  const cards = [...document.querySelectorAll(".testimonial")];
  if (!cards.length) return;

  const collapsedHeight = new Map();

  const layout = () => {
    const pulls = cards.map((c) => c.querySelector(".pull"));
    const bodies = cards.map((c) => c.querySelector(".t-body"));
    // Base collapsed height comes from the CSS (max-height on .t-body)
    bodies.forEach((b) => (b.style.maxHeight = ""));
    const base = parseFloat(getComputedStyle(bodies[0]).maxHeight);
    const sideBySide = cards.length > 1 && cards[0].offsetTop === cards[1].offsetTop;
    const tallest = Math.max(...pulls.map((p) => p.offsetHeight));
    cards.forEach((card, i) => {
      const extra = sideBySide ? tallest - pulls[i].offsetHeight : 0;
      const h = base + extra;
      collapsedHeight.set(card, h);
      bodies[i].style.maxHeight = card.classList.contains("is-open") ? `${bodies[i].scrollHeight}px` : `${h}px`;
    });
  };

  cards.forEach((card) => {
    const body = card.querySelector(".t-body");
    const button = card.querySelector(".t-more");
    button.addEventListener("click", () => {
      const open = !card.classList.contains("is-open");
      card.classList.toggle("is-open", open);
      body.style.maxHeight = open ? `${body.scrollHeight}px` : `${collapsedHeight.get(card)}px`;
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "Read less" : "Read more";
    });
  });

  layout();
  window.addEventListener("resize", layout);
  if (document.fonts) document.fonts.ready.then(layout);
})();

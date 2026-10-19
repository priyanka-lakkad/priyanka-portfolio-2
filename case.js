// Case study page: highlights the section you're reading in the section menu
// (main tabs and their subtabs), unfolds the subtabs of the current main tab,
// fills the menu's line down to the active item, and jumps to a section when
// its menu item is clicked.
(() => {
  const toc = document.getElementById("case-toc");
  if (!toc) return;

  const links = [...toc.querySelectorAll("a")];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
  const mainItemOf = (a) => a.closest("#case-toc > li");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pct = document.getElementById("toc-pct");
  const bar = document.getElementById("toc-bar");

  // Large monitors scale the page with CSS zoom (styles.css); offsets are in
  // unscaled pixels, so convert them to match scrollY and innerHeight
  const zoom = () => parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  // Position on the page, ignoring the slide-in offset of the scroll animation
  const pageTop = (el) => {
    let y = 0;
    for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y * zoom();
  };
  // Position of a menu link inside the menu list
  const offsetInMenu = (el) => {
    let y = 0;
    for (let n = el; n && n !== toc; n = n.offsetParent) y += n.offsetTop;
    return y;
  };

  let current = -1;
  let finished = false;
  const setActive = (i, complete = false) => {
    if (i === current && complete === finished) return;
    current = i;
    finished = complete;
    const active = links[i];
    const mainItem = mainItemOf(active);

    links.forEach((a, j) => {
      // At the end of the page every item is done; otherwise everything above the current one
      a.classList.toggle("is-active", !complete && a === active);
      a.classList.toggle("is-done", complete || j < i);
    });
    toc.querySelectorAll(":scope > li").forEach((li) => li.classList.toggle("is-current", li === mainItem));

    // Fill the line down to the middle of the active item (the line starts
    // 6px below the top of the list, matching the CSS)
    // At the end of the page the line is filled all the way down
    const fill = complete
      ? toc.offsetHeight - 12
      : Math.max(0, offsetInMenu(active) + active.offsetHeight / 2 - 6);
    toc.style.setProperty("--fill", `${fill}px`);
    // A solid marker on the line, the height of the item you're reading
    toc.style.setProperty("--mark-top", `${offsetInMenu(active)}px`);
    toc.style.setProperty("--mark-h", `${complete ? 0 : active.offsetHeight}px`);

    // On phones the menu is a sideways row of main tabs; keep the current one in view
    if (toc.scrollWidth > toc.clientWidth) {
      toc.scrollLeft = mainItem.offsetLeft - 16;
    }
  };

  const update = () => {
    // The active section is the last one whose top has passed a line a third
    // of the way down the screen; at the very bottom, the last section is active
    const line = window.innerHeight * 0.33;
    let index = 0;
    sections.forEach((s, i) => {
      if (pageTop(s) - window.scrollY <= line) index = i;
    });
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const lastTop = pageTop(sections[sections.length - 1]) - window.scrollY;
    // The story counts as complete once its end is on screen (while the menu
    // is still visible), or when the page can't scroll any further
    const content = document.querySelector(".case-content");
    const storyEnd = pageTop(content) + content.offsetHeight * zoom() - window.scrollY;
    const complete = storyEnd <= window.innerHeight * 0.85 || (atBottom && lastTop < window.innerHeight);
    if (complete) index = sections.length - 1;
    setActive(index, complete);

    // Percent read through the story, shown in the menu header and bar
    const story = document.querySelector(".case-content");
    if (story && pct) {
      const top = pageTop(story) - window.innerHeight * 0.33;
      const p = complete ? 1 : Math.min(1, Math.max(0, (window.scrollY - top) / (story.offsetHeight * zoom() - window.innerHeight * 0.5)));
      pct.textContent = `${Math.round(p * 100)}%`;
      if (bar) bar.parentElement.style.setProperty("--pct", p.toFixed(3));
    }
  };

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }
  }, { passive: true });
  window.addEventListener("resize", () => {
    current = -1;
    finished = false;
    update();
  });
  update();

  links.forEach((a, i) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      sections[i].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", a.getAttribute("href"));
    });
  });
})();

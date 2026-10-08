// "Rhythm is a system too": the drumming video and the equalizer beside it.
//
// Video: plays silently on loop (browsers only autoplay muted video). The
// sound button turns audio on and off. The video pauses while it's off screen,
// and sound switches back off when the visitor scrolls away.
//
// Equalizer: illustrates "many moving parts come together seamlessly". Bars
// drift independently, ease into one flowing wave on the beat, then drift
// apart again. It rests while the section is off screen.
(() => {
  const video = document.getElementById("drum-video");
  const button = document.getElementById("sound-toggle");
  const eq = document.getElementById("eq");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Video + sound ----------
  let soundOn = false;
  const setSound = (on) => {
    soundOn = on;
    if (!video || !button) return;
    video.muted = !on;
    button.setAttribute("aria-pressed", String(on));
    button.setAttribute("aria-label", on ? "Turn sound off" : "Turn sound on");
    button.querySelector(".sound-label").textContent = on ? "Sound on" : "Sound off";
  };

  if (video && button) {
    button.addEventListener("click", () => {
      const on = video.muted;
      setSound(on);
      // Turning sound on is a deliberate choice, so play even if paused
      if (on) video.play().catch(() => {});
    });

    // Visitors who prefer reduced motion get a still frame until they press play
    if (reduceMotion) {
      video.removeAttribute("autoplay");
      video.pause();
    }
  }

  // ---------- Equalizer: "many moving parts come together seamlessly" ----------
  // Each bar drifts on its own (moving parts), then they ease into one smooth
  // wave that flows across the row and pulses softly on the beat (together),
  // hold, loosen and drift apart again. Slow and low-key on purpose.
  const bars = eq ? [...eq.querySelectorAll(".eq-bar")] : [];
  const stateLabel = eq ? eq.querySelector(".eq-bpm") : null;
  const BEAT = 60 / 100; // seconds per beat at 100 BPM
  const CYCLE = 12;      // seconds for apart -> together -> apart

  const n = bars.length;
  const parts = bars.map(() => ({
    speed: 0.5 + Math.random() * 1.1,   // each part keeps its own time
    phase: Math.random() * Math.PI * 2,
    base: 0.18 + Math.random() * 0.3,
    level: 0.1,
  }));

  const smooth = (x) => x * x * (3 - 2 * x);
  // 0 = apart, 1 = together. Mostly together, with a slow drift apart.
  const togetherness = (t) => {
    const p = (t % CYCLE) / CYCLE;
    if (p < 0.2) return 0;                        // apart
    if (p < 0.38) return smooth((p - 0.2) / 0.18); // coming together
    if (p < 0.82) return 1;                       // in sync
    return 1 - smooth((p - 0.82) / 0.18);         // loosening
  };

  let running = false;
  let start = null;
  let lastState = "";

  function frame(now) {
    if (!running) return;
    if (start === null) start = now;
    const t = (now - start) / 1000;
    const w = togetherness(t);
    const gain = soundOn ? 1 : 0.85;

    // A gentle pulse on each beat, only felt once the parts are in sync
    const sinceBeat = (t % BEAT) / BEAT;
    const pulse = Math.exp(-sinceBeat * 4) * 0.18;

    parts.forEach((p, i) => {
      const x = n > 1 ? i / (n - 1) : 0;
      // Apart: every bar on its own slow rhythm
      const apart = p.base + 0.2 * Math.sin(t * p.speed + p.phase);
      // Together: one wave flowing left to right, all bars in step
      const wave = 0.42 + 0.26 * Math.sin(x * Math.PI * 2.2 - t * 2.1) + pulse;
      const target = gain * ((1 - w) * apart + w * wave);
      p.level += (target - p.level) * 0.12;
      bars[i].style.transform = `scaleY(${Math.max(0.06, p.level).toFixed(3)})`;
    });

    const state = w > 0.5 ? "In sync" : "Moving parts";
    if (stateLabel && state !== lastState) {
      lastState = state;
      stateLabel.textContent = state;
    }
    requestAnimationFrame(frame);
  }

  const startEq = () => {
    if (running || !bars.length || reduceMotion) return;
    running = true;
    start = null;
    requestAnimationFrame(frame);
  };
  const stopEq = () => { running = false; };

  // A calm, in-sync wave for visitors who prefer reduced motion
  if (reduceMotion) {
    bars.forEach((bar, i) => {
      const x = n > 1 ? i / (n - 1) : 0;
      bar.style.transform = `scaleY(${(0.42 + 0.26 * Math.sin(x * Math.PI * 2.2)).toFixed(3)})`;
    });
    if (stateLabel) stateLabel.textContent = "In sync";
  }

  // ---------- Play only while on screen ----------
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (video && (!reduceMotion || !video.muted)) video.play().catch(() => {});
        startEq();
      } else {
        if (video) video.pause();
        setSound(false);
        stopEq();
      }
    }, { threshold: 0.25 }).observe(eq || video);
  } else {
    startEq();
  }
})();

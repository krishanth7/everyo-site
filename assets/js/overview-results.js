/* Keep the reported value intact without scripts, offscreen, or with reduced motion. */
(function () {
  "use strict";
  const card = document.querySelector("[data-accuracy-card]");
  if (!card) return;
  const number = card.querySelector("[data-accuracy-number]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let started = false;
  let observer;
  function finish() {
    cancelAnimationFrame(frame);
    number.textContent = "99.3";
    card.classList.remove("is-counting");
    card.dataset.animation = "complete";
  }
  function animate() {
    if (started) return;
    started = true;
    observer?.disconnect();
    if (reduced.matches || document.hidden) {
      finish();
      return;
    }
    const start = performance.now();
    const duration = 1400;
    card.classList.add("is-counting");
    card.dataset.animation = "running";
    function tick(now) {
      const progress = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - progress, 4);
      number.textContent = (99.3 * eased).toFixed(1);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finish();
    }
    frame = requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window && !reduced.matches) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) animate();
      },
      { threshold: 0.15 },
    );
    observer.observe(card);
  } else {
    started = true;
    finish();
  }
  reduced.addEventListener("change", () => {
    if (reduced.matches) {
      observer?.disconnect();
      started = true;
      finish();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && started) finish();
  });
})();

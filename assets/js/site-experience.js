/* Native, optional enhancements for motion and documentation. No remote requests. */
(function () {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  const revealTargets = document.querySelectorAll(
    ".hero-copy, .page-hero, .docs-masthead, .section-heading, .card, .graph, .result-figure, .stack, .docs-overview, [data-doc-section], .docs-end, .cta-section h2",
  );
  let revealObserver;
  function configureMotion() {
    revealObserver?.disconnect();
    if (reduced.matches || !("IntersectionObserver" in window)) {
      revealTargets.forEach((element) =>
        element.classList.remove("motion-enter"),
      );
      return;
    }
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("motion-enter");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -24px 0px" },
    );
    revealTargets.forEach((element) => {
      // Do not replay sections already revealed after a preference change.
      if (!element.classList.contains("motion-enter"))
        revealObserver.observe(element);
    });
  }
  configureMotion();
  reduced.addEventListener("change", configureMotion);

  const header = document.querySelector(".site-header");
  const pageProgress = document.getElementById("page-progress-fill");
  const readingFill = document.getElementById("docs-reading-fill");
  const readingLabel = document.getElementById("docs-reading-label");
  const sections = [...document.querySelectorAll("[data-doc-section]")];
  const docLinks = [
    ...document.querySelectorAll('.docs-sidebar nav a[href^="#"]'),
  ];
  let queued = false;
  let activeId = "";
  function updatePosition() {
    queued = false;
    const maximum = document.documentElement.scrollHeight - innerHeight;
    const position =
      maximum > 0 ? Math.max(0, Math.min(1, scrollY / maximum)) : 0;
    if (pageProgress) pageProgress.style.transform = `scaleX(${position})`;
    header?.classList.toggle("is-scrolled", scrollY > 16);
    if (!sections.length) return;
    const offset = (header?.getBoundingClientRect().height || 88) + 45;
    let active = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= offset) active = section;
      else break;
    }
    const first = sections[0].getBoundingClientRect().top + scrollY;
    const last = sections.at(-1).getBoundingClientRect().bottom + scrollY;
    const progress = Math.max(
      0,
      Math.min(1, (scrollY + offset - first) / (last - first)),
    );
    if (readingFill) readingFill.style.transform = `scaleX(${progress})`;
    if (activeId !== active.id) {
      activeId = active.id;
      docLinks.forEach((link) => {
        if (link.hash === "#" + activeId)
          link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      if (readingLabel)
        readingLabel.textContent = active.querySelector("h2").textContent;
    }
  }
  function queuePosition() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(updatePosition);
    }
  }
  addEventListener("scroll", queuePosition, { passive: true });
  addEventListener("resize", queuePosition, { passive: true });
  addEventListener("pageshow", queuePosition);
  updatePosition();

  const osTabs = [...document.querySelectorAll(".install-tabs [role=tab]")];
  function selectOS(tab, focus = false) {
    osTabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute("aria-controls")).hidden =
        !selected;
    });
    if (focus) tab.focus();
    queuePosition();
  }
  osTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectOS(tab));
    tab.addEventListener("keydown", (event) => {
      const next =
        event.key === "ArrowRight"
          ? (index + 1) % osTabs.length
          : event.key === "ArrowLeft"
            ? (index + osTabs.length - 1) % osTabs.length
            : event.key === "Home"
              ? 0
              : event.key === "End"
                ? osTabs.length - 1
                : -1;
      if (next >= 0) {
        event.preventDefault();
        selectOS(osTabs[next], true);
      }
    });
  });
  if (osTabs.length) selectOS(osTabs[0]);

  // A real local search index, derived from visible documentation content.
  const dialog = document.getElementById("docs-search");
  if (dialog && typeof dialog.showModal === "function") {
    const open = document.getElementById("docs-search-open");
    const input = document.getElementById("docs-search-input");
    const list = document.getElementById("docs-search-results");
    const status = document.getElementById("docs-search-status");
    const localIndex = sections.map((section) => ({
      id: section.id,
      title: section.querySelector("h2").textContent.trim(),
      excerpt:
        section
          .querySelector("p:not(.eyebrow)")
          ?.textContent.replace(/\s+/g, " ")
          .trim() || "",
      text: section.textContent.toLowerCase().replace(/\s+/g, " "),
    }));
    const index = Array.isArray(window.EVERYO_DOC_INDEX)
      ? window.EVERYO_DOC_INDEX
      : localIndex;
    function renderResults() {
      const query = input.value.trim().toLowerCase();
      const words = query.split(/\s+/).filter(Boolean);
      const results = words.length
        ? index.filter((item) =>
            words.every((word) => item.text.includes(word)),
          )
        : index;
      list.replaceChildren();
      results.forEach((item) => {
        const li = document.createElement("li");
        const anchor = document.createElement("a");
        anchor.href = item.href || "#" + item.id;
        const title = document.createElement("strong");
        title.textContent = item.title;
        const excerpt = document.createElement("span");
        excerpt.textContent =
          item.excerpt.length > 160
            ? item.excerpt.slice(0, 157) + "…"
            : item.excerpt;
        if (item.guide) {
          const guide = document.createElement("small");
          guide.className = "search-guide-label";
          guide.textContent = item.guide;
          anchor.append(guide);
        }
        anchor.append(title, excerpt);
        li.append(anchor);
        list.append(li);
        anchor.addEventListener("click", () => {
          dialog.close();
          // Focus the destination for keyboard and screen-reader users.
          if (anchor.pathname === location.pathname) {
            const heading = document
              .getElementById(item.id)
              ?.querySelector("h2");
            if (heading) {
              heading.tabIndex = -1;
              heading.focus({ preventScroll: true });
            }
          }
        });
      });
      status.textContent = results.length
        ? `${results.length} section${results.length === 1 ? "" : "s"}${query ? " found" : " to explore"}.`
        : "No matching sections. Try “tensor”, “install”, or “save”.";
    }
    function openSearch() {
      if (!dialog.open) dialog.showModal();
      renderResults();
      input.focus();
    }
    open.addEventListener("click", openSearch);
    document
      .getElementById("docs-search-close")
      .addEventListener("click", () => dialog.close());
    input.addEventListener("input", renderResults);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const first = list.querySelector("a");
        if (first) {
          event.preventDefault();
          first.click();
        }
      }
      if (event.key === "ArrowDown") {
        const first = list.querySelector("a");
        if (first) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    });
    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    });
    root.classList.add("experience-ready");
  }
})();

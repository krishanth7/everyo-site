/* Native, dependency-free enhancement for the static EveryO site. */
(function () {
  "use strict";
  var root = document.documentElement;
  var header = document.querySelector(".reference-header");
  if (!header || header.dataset.ready === "true") return;
  header.dataset.ready = "true";
  root.classList.add("js");
  var theme = document.getElementById("theme-toggle");
  var system = window.matchMedia("(prefers-color-scheme: dark)");
  var mobile = window.matchMedia("(max-width: 1199px)");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var button = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");
  var mainLinks = Array.from(links.querySelectorAll(":scope > li > a"));
  var closeTimer = 0;
  var frame = 0;
  var preference = readPreference();

  function readPreference() {
    try {
      var saved = localStorage.getItem("everyo-theme");
      return saved === "light" || saved === "dark" ? saved : null;
    } catch (_) { return null; }
  }
  function applyTheme() {
    var dark = preference ? preference === "dark" : system.matches;
    root.dataset.theme = dark ? "dark" : "light";
    theme.setAttribute("aria-pressed", String(dark));
    theme.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    theme.title = theme.getAttribute("aria-label");
  }
  applyTheme();
  theme.addEventListener("click", function () {
    preference = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme();
    try { localStorage.setItem("everyo-theme", preference); } catch (_) {}
  });
  system.addEventListener("change", function () { if (!preference) applyTheme(); });
  window.addEventListener("storage", function (event) {
    if (event.key === "everyo-theme" || event.key === null) {
      preference = readPreference();
      applyTheme();
    }
  });

  function finishMenu() {
    clearTimeout(closeTimer);
    closeTimer = 0;
    links.dataset.state = links.dataset.open === "true" ? "open" : "closed";
  }
  function setMenu(open, restoreFocus) {
    open = Boolean(open && mobile.matches);
    var wasOpen = links.dataset.open === "true";
    clearTimeout(closeTimer);
    links.dataset.open = String(open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    links.inert = mobile.matches && !open;
    root.classList.toggle("mobile-menu-open", open);
    if (open) {
      links.dataset.state = reduced.matches ? "open" : "opening";
      if (!wasOpen) mainLinks[0].focus({ preventScroll: true });
    } else {
      links.dataset.state = wasOpen && !reduced.matches ? "closing" : "closed";
      if (restoreFocus || (mobile.matches && links.contains(document.activeElement))) button.focus({ preventScroll: true });
    }
    if (!reduced.matches && (open || wasOpen)) closeTimer = window.setTimeout(finishMenu, open ? 260 : 200);
  }
  setMenu(false, false);
  button.addEventListener("click", function () {
    setMenu(links.dataset.open !== "true", links.dataset.open === "true");
  });
  header.querySelector(".brand").addEventListener("click", function () { setMenu(false, false); });
  links.addEventListener("transitionend", function (event) {
    if (event.target === links && event.propertyName === "opacity") finishMenu();
  });
  links.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (!link) return;
    setMenu(false, false);
    var href = link.getAttribute("href");
    if (href && href.charAt(0) === "#") {
      var target = document.getElementById(href.slice(1));
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener("blur", function () { target.removeAttribute("tabindex"); }, { once: true });
      }
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && links.dataset.open === "true") {
      event.preventDefault();
      setMenu(false, true);
    }
  });
  document.addEventListener("click", function (event) {
    if (links.dataset.open === "true" && !header.contains(event.target)) setMenu(false, false);
  });
  header.addEventListener("focusout", function (event) {
    // A disclosure menu is not a modal. Tab can leave; closing releases scroll.
    if (links.dataset.open === "true" && event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false, false);
  });
  mobile.addEventListener("change", function () {
    var focusInside = links.contains(document.activeElement);
    setMenu(false, mobile.matches && focusInside);
    scheduleScroll();
  });
  reduced.addEventListener("change", finishMenu);

  function markActive() {
    var page = document.body.dataset.page || "overview";
    mainLinks.forEach(function (link) {
      if (link.dataset.page === page) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }
  function syncLocation() {
    markActive();
    if (links.dataset.open === "true") setMenu(false, links.contains(document.activeElement));
  }
  window.addEventListener("hashchange", syncLocation);
  window.addEventListener("popstate", syncLocation);
  window.addEventListener("pageshow", function () { setMenu(false, false); preference = readPreference(); applyTheme(); syncLocation(); scheduleScroll(); });
  function updateScroll() {
    frame = 0;
    header.dataset.scrolled = String(window.scrollY > 8);
    markActive();
  }
  function scheduleScroll() { if (!frame) frame = window.requestAnimationFrame(updateScroll); }
  window.addEventListener("scroll", scheduleScroll, { passive: true });
  syncLocation();
  scheduleScroll();

  var search = document.getElementById("site-search");
  var searchInput = document.getElementById("site-search-input");
  var results = document.getElementById("search-results");
  var searchStatus = document.getElementById("search-status");
  var searchOpen = document.getElementById("search-open");
  var sections = Array.from(document.querySelectorAll("main section[id]"));
  function showResults() {
    var query = searchInput.value.trim().toLowerCase();
    results.replaceChildren();
    sections.filter(function (section) { return !query || section.textContent.toLowerCase().includes(query); }).forEach(function (section) {
      var heading = section.querySelector("h1, h2, h3");
      if (!heading) return;
      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = "#" + section.id;
      link.textContent = heading.textContent.trim();
      link.addEventListener("click", function () { search.close(); });
      item.appendChild(link);
      results.appendChild(item);
    });
    searchStatus.textContent = results.children.length ? results.children.length + " sections found" : "No matching sections. Try another term.";
  }
  searchOpen.addEventListener("click", function () { setMenu(false, false); search.showModal(); showResults(); searchInput.focus(); });
  document.getElementById("search-close").addEventListener("click", function () { search.close(); });
  search.addEventListener("keydown", function (event) { if (event.key === "Escape") { event.preventDefault(); search.close(); } });
  search.addEventListener("close", function () { searchOpen.focus({ preventScroll: true }); });
  searchInput.addEventListener("input", showResults);
})();


/* Progressive enhancement only. No external scripts or telemetry. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var theme = document.getElementById("theme-toggle");
  var system = window.matchMedia("(prefers-color-scheme: dark)");
  function syncTheme() {
    var dark = root.dataset.theme ? root.dataset.theme === "dark" : system.matches;
    theme.setAttribute("aria-pressed", String(dark));
    theme.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    theme.title = dark ? "Switch to light mode" : "Switch to dark mode";
  }
  syncTheme();
  theme.addEventListener("click", function () {
    var next = theme.getAttribute("aria-pressed") === "true" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("everyo-theme", next); } catch (_) {}
    syncTheme();
  });
  function systemChanged() { if (!root.dataset.theme) syncTheme(); }
  if (system.addEventListener) system.addEventListener("change", systemChanged);
  else if (system.addListener) system.addListener(systemChanged);
  window.addEventListener("storage", function (event) {
    if (event.key !== "everyo-theme") return;
    root.dataset.theme = event.newValue === "light" || event.newValue === "dark" ? event.newValue : "";
    syncTheme();
  });
  var button = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");
  var mobile = window.matchMedia("(max-width: 1250px)");
  function setNav(open, focusButton) {
    links.dataset.open = String(open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    links.inert = mobile.matches && !open;
    root.classList.toggle("mobile-menu-open", mobile.matches && open);
    if (focusButton) button.focus();
  }
  setNav(false);
  button.addEventListener("click", function () { setNav(links.dataset.open !== "true"); });
  links.addEventListener("click", function (event) { if (event.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && links.dataset.open === "true") setNav(false, true); });
  document.addEventListener("click", function (event) { if (!event.target.closest(".nav")) setNav(false); });
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Tab" || !mobile.matches || links.dataset.open !== "true") return;
    var focusable = Array.from(document.querySelectorAll(".reference-header a, .reference-header button")).filter(function (el) { return el.getClientRects().length > 0 && !el.closest("[inert]"); });
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  function resized() { setNav(false); }
  if (mobile.addEventListener) mobile.addEventListener("change", resized);
  else if (mobile.addListener) mobile.addListener(resized);

  var search = document.getElementById("site-search");
  var searchInput = document.getElementById("site-search-input");
  var results = document.getElementById("search-results");
  var searchStatus = document.getElementById("search-status");
  var searchOpen = document.getElementById("search-open");
  var sections = Array.from(document.querySelectorAll("main section[id]"));
  function showResults() {
    var query = searchInput.value.trim().toLowerCase();
    results.replaceChildren();
    var matches = sections.filter(function (section) { return !query || section.textContent.toLowerCase().includes(query); });
    matches.forEach(function (section) {
      var heading = section.querySelector("h2, h3");
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
  searchOpen.addEventListener("click", function () { setNav(false); search.showModal(); showResults(); searchInput.focus(); });
  document.getElementById("search-close").addEventListener("click", function () { search.close(); });
  search.addEventListener("close", function () { searchOpen.focus(); });
  searchInput.addEventListener("input", showResults);
})();



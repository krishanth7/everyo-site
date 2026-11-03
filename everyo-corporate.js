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
  var mobile = window.matchMedia("(max-width: 1100px)");
  function setNav(open, focusButton) {
    links.dataset.open = String(open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    links.inert = mobile.matches && !open;
    if (focusButton) button.focus();
  }
  setNav(false);
  button.addEventListener("click", function () { setNav(links.dataset.open !== "true"); });
  links.addEventListener("click", function (event) { if (event.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && links.dataset.open === "true") setNav(false, true); });
  document.addEventListener("click", function (event) { if (!event.target.closest(".nav")) setNav(false); });
  function resized() { setNav(false); }
  if (mobile.addEventListener) mobile.addEventListener("change", resized);
  else if (mobile.addListener) mobile.addListener(resized);
})();

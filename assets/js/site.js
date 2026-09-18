/* EveryO site — the only JavaScript on the page.
   No analytics, no third-party scripts, no cookies. It does two things:
   toggle the mobile menu and remember a colour-theme preference. */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- Theme */
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var STORAGE_KEY = "everyo-theme";

  function stored() {
    // Storage throws in some privacy modes; the page must work regardless.
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function remember(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      /* A remembered preference is a convenience, never a requirement. */
    }
  }

  var saved = stored();
  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
  }

  function systemPrefersDark() {
    return (
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      var isDark = current ? current === "dark" : systemPrefersDark();
      var next = isDark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      remember(next);
      toggle.setAttribute(
        "aria-label",
        next === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    });
  }

  /* ----------------------------------------------------------- Mobile nav */
  var navToggle = document.getElementById("nav-toggle");
  var navLinks = document.getElementById("nav-links");

  function setNav(open) {
    if (!navLinks || !navToggle) return;
    navLinks.setAttribute("data-open", open ? "true" : "false");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      setNav(navLinks.getAttribute("data-open") !== "true");
    });

    // Following a link should close the menu, or the target scrolls in behind it.
    navLinks.addEventListener("click", function (event) {
      if (event.target.closest("a")) setNav(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setNav(false);
    });

    // Leaving the mobile breakpoint with the menu open would strand the state.
    var wide = window.matchMedia("(min-width: 901px)");
    var onChange = function (event) {
      if (event.matches) setNav(false);
    };
    if (wide.addEventListener) wide.addEventListener("change", onChange);
    else if (wide.addListener) wide.addListener(onChange);
  }
})();

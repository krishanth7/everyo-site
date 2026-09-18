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

  /* ------------------------------------------------------------ Motion
     Everything below is progressive enhancement. The page is complete and
     readable without it, so each feature checks for its own API and for the
     visitor's motion preference before doing anything. */

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Scroll reveal.
     The `is-ready` class is what actually hides the elements, and it is only
     added here — so if this script never runs, nothing is ever hidden. */
  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("is-ready");

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add("is-visible");
          // Drop the compositing hint once the transition has finished.
          window.setTimeout(function () {
            el.classList.add("is-settled");
          }, 900);
          revealObserver.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    var revealables = document.querySelectorAll(".reveal");
    Array.prototype.forEach.call(revealables, function (el, i) {
      // A short stagger within each group reads as one movement rather than
      // a dozen independent ones. Capped so nothing waits noticeably long.
      el.style.setProperty("--reveal-delay", Math.min(i % 4, 3) * 70 + "ms");
      revealObserver.observe(el);
    });
  }

  /* Count-up on the headline figures.
     The final value is already in the HTML, so a visitor without JavaScript —
     or with reduced motion — simply sees the correct number. */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    if (!isFinite(target)) return;
    var prefix = el.getAttribute("data-count-prefix") || "";
    var group = el.getAttribute("data-count-group") === "1";
    var duration = 1100;
    var started = null;

    function frame(now) {
      if (started === null) started = now;
      var p = Math.min((now - started) / duration, 1);
      // Ease-out cubic: fast first, settling gently on the real number.
      var eased = 1 - Math.pow(1 - p, 3);
      var value = Math.round(target * eased);
      el.textContent = prefix + (group ? value.toLocaleString("en-US") : value);
      if (p < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  var counters = document.querySelectorAll("[data-count-to]");
  if (!reduceMotion && counters.length && "IntersectionObserver" in window &&
      window.requestAnimationFrame) {
    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          countObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    Array.prototype.forEach.call(counters, function (el) {
      countObserver.observe(el);
    });
  }

  /* Scrollspy: mark the navigation link for the section in view.
     Purely a highlight — it never changes the URL or the scroll position. */
  var spyLinks = document.querySelectorAll('.nav__links a[href^="#"]');
  if (spyLinks.length && "IntersectionObserver" in window) {
    var linkFor = {};
    var sections = [];
    Array.prototype.forEach.call(spyLinks, function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      linkFor[id] = link;
      sections.push(section);
    });

    var visible = new Set();
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        // Highlight the topmost section currently on screen.
        var current = null;
        for (var i = 0; i < sections.length; i++) {
          if (visible.has(sections[i].id)) {
            current = sections[i].id;
            break;
          }
        }
        Object.keys(linkFor).forEach(function (id) {
          if (id === current) linkFor[id].setAttribute("aria-current", "true");
          else linkFor[id].removeAttribute("aria-current");
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    sections.forEach(function (s) {
      spy.observe(s);
    });
  }
})();

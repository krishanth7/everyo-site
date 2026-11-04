/* Progressive enhancements. Content and navigation remain usable without JavaScript. */
(function () {
  "use strict";
  const root = document.documentElement;
  const themeButton = document.getElementById("theme-toggle");
  const system = matchMedia("(prefers-color-scheme: dark)");
  let preference = null;
  function readPreference() {
    try {
      const value = localStorage.getItem("everyo-theme");
      return ["dark", "light"].includes(value) ? value : null;
    } catch (_) {
      return null;
    }
  }
  function applyTheme() {
    const dark = preference ? preference === "dark" : system.matches;
    root.dataset.theme = dark ? "dark" : "light";
    themeButton.setAttribute("aria-pressed", String(dark));
    themeButton.setAttribute(
      "aria-label",
      dark ? "Switch to light mode" : "Switch to dark mode",
    );
  }
  preference = readPreference();
  applyTheme();
  themeButton.addEventListener("click", () => {
    preference = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme();
    try {
      localStorage.setItem("everyo-theme", preference);
    } catch (_) {}
  });
  system.addEventListener("change", () => {
    if (!preference) applyTheme();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "everyo-theme" || event.key === null) {
      preference = readPreference();
      applyTheme();
    }
  });

  const menu = document.getElementById("nav-links");
  const menuButton = document.getElementById("nav-toggle");
  const mobile = matchMedia("(max-width: 800px)");
  function setMenu(open, restoreFocus = false) {
    open = Boolean(open && mobile.matches);
    menu.dataset.open = String(open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (restoreFocus) menuButton.focus();
  }
  // Without JavaScript the mobile menu is expanded via the class below being absent.
  root.classList.add("enhanced");
  setMenu(false);
  menuButton.addEventListener("click", () =>
    setMenu(menu.dataset.open !== "true"),
  );
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.dataset.open === "true") {
      event.preventDefault();
      setMenu(false, true);
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) setMenu(false);
  });
  document.addEventListener("focusin", (event) => {
    if (!event.target.closest(".site-header")) setMenu(false);
  });
  mobile.addEventListener("change", () => {
    const hadFocus = menu.contains(document.activeElement);
    setMenu(false, hadFocus && mobile.matches);
  });

  async function copy(text, status) {
    let copied = false;
    try {
      if (navigator.clipboard && isSecureContext) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (_) {}
    if (!copied) {
      const previous = document.activeElement;
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.setAttribute("aria-label", "Text to copy");
      field.style.cssText =
        "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0";
      document.body.appendChild(field);
      field.select();
      try {
        copied = document.execCommand("copy");
      } catch (_) {}
      field.remove();
      previous?.focus({ preventScroll: true });
    }
    status.textContent = copied
      ? "Copied to clipboard."
      : "Copy unavailable. Select and copy the text manually.";
    return copied;
  }
  function highlight(element) {
    const source = element.textContent;
    const pattern =
      /#[^\n]*|"[^"\n]*"|'[^'\n]*'|\b(?:import|as|from|with|for|in|def|class|return|True|False|None)\b|\b\d+(?:\.\d+)?\b/g;
    const fragment = document.createDocumentFragment();
    let start = 0;
    for (const match of source.matchAll(pattern)) {
      fragment.append(
        document.createTextNode(source.slice(start, match.index)),
      );
      const token = document.createElement("span");
      token.className =
        match[0][0] === "#"
          ? "tok-comment"
          : /^["']/.test(match[0])
            ? "tok-string"
            : /^\d/.test(match[0])
              ? "tok-number"
              : "tok-keyword";
      token.textContent = match[0];
      fragment.append(token);
      start = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(source.slice(start)));
    element.replaceChildren(fragment);
  }
  document.querySelectorAll(".codebox pre code").forEach(highlight);
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".copy-button, .copy-command");
    if (!button) return;
    const parent = button.closest(".codebox, .experiment");
    copy(
      button.dataset.command || parent.querySelector("pre code").textContent,
      parent.querySelector(".copy-status"),
    );
  });
  const samples = {
    gradients: {
      code: "import everyo as eo\n\nx = eo.tensor([2.0], requires_grad=True)\ny = x * x\ny.backward()\n\nprint(x.grad)  # [4.]",
      name: "first_gradient.py",
      caption: "Expected: [4.] — because d(x²)/dx = 2x",
    },
    networks: {
      code: "import everyo as eo\n\nmodel = eo.Sequential(\n    eo.Linear(4, 16, seed=0),\n    eo.ReLU(),\n    eo.Linear(16, 3, seed=1),\n)\n\nprint(model.num_parameters())  # 131",
      name: "first_network.py",
      caption:
        "Expected: 131 trainable parameters — (4 × 16 + 16) + (16 × 3 + 3)",
    },
  };
  document.querySelectorAll("[data-example]").forEach((button) =>
    button.addEventListener("click", () => {
      const sample = samples[button.dataset.example];
      document
        .querySelectorAll("[data-example]")
        .forEach((other) =>
          other.setAttribute("aria-pressed", String(other === button)),
        );
      const container = document.getElementById("interactive-code");
      const element = container.querySelector("pre code");
      element.textContent = sample.code;
      highlight(element);
      container.querySelector(".codebar>span").textContent = sample.name;
      container.querySelector(".copy-status").textContent = "";
      document.getElementById("example-caption").textContent = sample.caption;
    }),
  );
  function filterExamples(category) {
    const cards = [...document.querySelectorAll("[data-category]")];
    let count = 0;
    cards.forEach((card) => {
      card.hidden = category !== "all" && card.dataset.category !== category;
      if (!card.hidden) count++;
    });
    document
      .querySelectorAll("[data-filter]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.filter === category),
        ),
      );
    document.getElementById("filter-status").textContent =
      `Showing ${count} experiment${count === 1 ? "" : "s"}. Run commands from the EveryO framework repository root.`;
  }
  document
    .querySelectorAll("[data-filter]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        filterExamples(button.dataset.filter),
      ),
    );
  window.addEventListener("hashchange", () => {
    if (
      document.querySelector("[data-filter]") &&
      document.getElementById(location.hash.slice(1))?.hidden
    ) {
      filterExamples("all");
      document.getElementById(location.hash.slice(1)).scrollIntoView();
    }
  });
  const projectUrl = "https://krishanth7.github.io/everyo-site/";
  const shareStatus = document.getElementById("share-status");
  document
    .getElementById("copy-project")
    ?.addEventListener("click", () => copy(projectUrl, shareStatus));
  document
    .getElementById("share-project")
    ?.addEventListener("click", async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: "EveryO — Understand the intelligence you build.",
            text: "Explore a readable Python neural computing framework built on NumPy.",
            url: projectUrl,
          });
          shareStatus.textContent = "Share dialog completed.";
        } catch (error) {
          if (error.name !== "AbortError") await copy(projectUrl, shareStatus);
        }
      } else {
        await copy(projectUrl, shareStatus);
      }
    });
})();

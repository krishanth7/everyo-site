const vm = require("node:vm");
const fs = require("node:fs");
const source = fs.readFileSync(
  require("node:path").join(__dirname, "../assets/js/developer-site.js"),
  "utf8",
);
function setup({
  dark = false,
  saved = null,
  mobile = false,
  deniedStorage = false,
  deniedClipboard = false,
} = {}) {
  class Element {
    constructor() {
      this.events = {};
      this.attrs = {};
      this.dataset = {};
      this.textContent = "";
      this.hidden = false;
      this.style = {};
    }
    addEventListener(type, handler) {
      (this.events[type] ||= []).push(handler);
    }
    async fire(type, event = {}) {
      for (const handler of this.events[type] || [])
        await handler({ target: this, ...event });
    }
    setAttribute(key, value) {
      this.attrs[key] = value;
    }
    getAttribute(key) {
      return this.attrs[key];
    }
    focus() {
      document.activeElement = this;
    }
    contains(element) {
      return element === this;
    }
    closest() {
      return null;
    }
  }
  const root = new Element();
  root.classList = { add() {} };
  const ids = Object.fromEntries(
    [
      "theme-toggle",
      "nav-toggle",
      "nav-links",
      "interactive-code",
      "example-caption",
      "filter-status",
      "share-status",
      "copy-project",
      "share-project",
    ].map((id) => [id, new Element()]),
  );
  const sampleButtons = ["gradients", "networks"].map((value) => {
    const el = new Element();
    el.dataset.example = value;
    return el;
  });
  const filterButtons = ["all", "vision", "sequences"].map((value) => {
    const el = new Element();
    el.dataset.filter = value;
    return el;
  });
  const cards = ["vision", "vision", "sequences", "tools"].map((value) => {
    const el = new Element();
    el.dataset.category = value;
    return el;
  });
  const code = new Element();
  code.replaceChildren = () => {};
  const codebar = new Element();
  const status = new Element();
  ids["interactive-code"].querySelector = (selector) =>
    selector === "pre code"
      ? code
      : selector === ".codebar>span"
        ? codebar
        : status;
  const document = new Element();
  document.documentElement = root;
  let manualDialog = null;
  const manualField = new Element();
  manualField.select = () => {};
  const manualClose = new Element();
  document.getElementById = (id) =>
    id === "manual-copy-dialog" ? manualDialog : ids[id];
  document.querySelectorAll = (selector) =>
    ({
      "[data-example]": sampleButtons,
      "[data-filter]": filterButtons,
      "[data-category]": cards,
    })[selector] || [];
  document.createDocumentFragment = () => ({ append() {} });
  document.createTextNode = (text) => text;
  document.createElement = (tag) => {
    const element = new Element();
    element.select = () => {};
    element.remove = () => {};
    if (tag === "dialog") {
      element.querySelector = (selector) =>
        selector === "textarea" ? manualField : manualClose;
      element.showModal = () => { element.open = true; };
      element.close = () => { element.open = false; };
    }
    return element;
  };
  document.body = {
    appendChild(element) {
      if (element.id === "manual-copy-dialog") manualDialog = element;
    },
  };
  document.execCommand = () => false;
  const window = new Element();
  let stored = saved,
    clipboard = "";
  const media = {};
  const navigator = {
    clipboard: {
      writeText: async (text) => {
        if (deniedClipboard) throw Error("blocked");
        clipboard = text;
      },
    },
  };
  const localStorage = {
    getItem() {
      if (deniedStorage) throw Error("denied");
      return stored;
    },
    setItem(key, value) {
      if (deniedStorage) throw Error("denied");
      stored = value;
    },
  };
  vm.runInNewContext(source, {
    document,
    window,
    localStorage,
    navigator,
    isSecureContext: true,
    matchMedia(query) {
      if (!media[query]) {
        media[query] = new Element();
        media[query].matches = query.includes("800px") ? mobile : dark;
      }
      return media[query];
    },
  });
  return {
    root,
    ids,
    media,
    window,
    document,
    sampleButtons,
    filterButtons,
    cards,
    code,
    codebar,
    status,
    clipboard: () => clipboard,
    manualDialog: () => manualDialog,
    manualText: () => manualField.value,
    stored: () => stored,
    setStored(value) {
      stored = value;
    },
  };
}
module.exports = { setup };

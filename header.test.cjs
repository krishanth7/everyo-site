const { test } = require("node:test");
const assert = require("node:assert/strict");
const { setup } = require("./tests/site-fixture.cjs");
test("theme follows system, persists a choice and synchronizes storage changes", async () => {
  const x = setup({ dark: true });
  assert.equal(x.root.dataset.theme, "dark");
  await x.ids["theme-toggle"].fire("click");
  assert.equal(x.root.dataset.theme, "light");
  assert.equal(x.stored(), "light");
  x.setStored("dark");
  await x.window.fire("storage", { key: "everyo-theme" });
  assert.equal(x.root.dataset.theme, "dark");
  x.setStored(null);
  x.media["(prefers-color-scheme: dark)"].matches = false;
  await x.window.fire("storage", { key: null });
  assert.equal(x.root.dataset.theme, "light");
});
test("denied storage and invalid preferences preserve usable theme controls", async () => {
  const x = setup({ deniedStorage: true, dark: true });
  await x.ids["theme-toggle"].fire("click");
  assert.equal(x.root.dataset.theme, "light");
  assert.equal(
    setup({ saved: "invalid", dark: false }).root.dataset.theme,
    "light",
  );
});
test("mobile menu opens, closes with Escape and returns focus", async () => {
  const x = setup({ mobile: true });
  await x.ids["nav-toggle"].fire("click");
  assert.equal(x.ids["nav-links"].dataset.open, "true");
  await x.document.fire("keydown", { key: "Escape", preventDefault() {} });
  assert.equal(x.ids["nav-links"].dataset.open, "false");
  assert.equal(x.document.activeElement, x.ids["nav-toggle"]);
});
test("outside click and breakpoint changes close the menu", async () => {
  const x = setup({ mobile: true });
  await x.ids["nav-toggle"].fire("click");
  await x.document.fire("click");
  assert.equal(x.ids["nav-toggle"].getAttribute("aria-expanded"), "false");
  await x.ids["nav-toggle"].fire("click");
  x.media["(max-width: 800px)"].matches = false;
  await x.media["(max-width: 800px)"].fire("change");
  assert.equal(x.ids["nav-links"].dataset.open, "false");
});
test("clipboard refusal offers a selectable manual copy dialog", async () => {
  const x = setup({ deniedClipboard: true });
  await x.ids["copy-project"].fire("click");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(x.manualDialog().open, true);
  assert.equal(x.manualText(), "https://krishanth7.github.io/everyo-site/");
  assert.match(x.ids["share-status"].textContent, /blocked/);
});

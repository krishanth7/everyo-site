const { test } = require("node:test");
const assert = require("node:assert/strict");
const { setup } = require("./tests/site-fixture.cjs");
test("example switching updates actual copyable code, label and parameter explanation", async () => {
  const x = setup();
  await x.sampleButtons[1].fire("click");
  assert.match(x.code.textContent, /import everyo as eo/);
  assert.match(x.code.textContent, /eo.Linear\(4, 16, seed=0\)/);
  assert.match(x.code.textContent, /num_parameters\(\)/);
  assert.equal(x.codebar.textContent, "first_network.py");
  assert.match(x.ids["example-caption"].textContent, /131/);
  assert.equal(x.sampleButtons[1].getAttribute("aria-pressed"), "true");
  assert.equal(x.sampleButtons[0].getAttribute("aria-pressed"), "false");
  await x.sampleButtons[0].fire("click");
  assert.match(x.code.textContent, /y.backward\(\)/);
});
test("filtering hides unrelated experiments and reports the visible count", async () => {
  const x = setup();
  await x.filterButtons[1].fire("click");
  assert.equal(x.cards.filter((card) => !card.hidden).length, 2);
  assert.match(x.ids["filter-status"].textContent, /Showing 2 experiments/);
  await x.filterButtons[2].fire("click");
  assert.match(x.ids["filter-status"].textContent, /Showing 1 experiment\./);
  await x.filterButtons[0].fire("click");
  assert.equal(x.cards.filter((card) => !card.hidden).length, 4);
});
test("project sharing copies the canonical URL with feedback when native sharing is absent", async () => {
  const x = setup();
  await x.ids["copy-project"].fire("click");
  assert.equal(x.clipboard(), "https://krishanth7.github.io/everyo-site/");
  assert.equal(x.ids["share-status"].textContent, "Copied to clipboard.");
  await x.ids["share-project"].fire("click");
  assert.equal(x.clipboard(), "https://krishanth7.github.io/everyo-site/");
});

const path = require("node:path");
const os = require("node:os");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const file of [
    "index.html",
    "features.html",
    "documentation.html",
    "examples.html",
    "community.html",
  ]) {
    await page.goto((process.env.SITE_URL || "http://127.0.0.1:8000/") + file);
    await page.waitForLoadState("networkidle");
    if ((await page.locator("h1").count()) !== 1) throw Error(file + " h1");
    if (
      (await page
        .locator("nav[aria-label=Primary] [aria-current=page]")
        .count()) !== 1
    )
      throw Error(file + " active page");
    await page.evaluate(async () => {
      for (const img of document.images) {
        img.loading = "eager";
        await img.decode().catch(() => {});
      }
    });
    const bad = await page.evaluate(() =>
      [...document.images]
        .filter((i) => !i.complete || i.naturalWidth === 0)
        .map((i) => i.src),
    );
    if (bad.length) throw Error(JSON.stringify(bad));
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw Error(file + " desktop overflow");
    await page.screenshot({
      path: path.join(
        os.tmpdir(),
        "everyo-" + file.replace(".html", "") + "-desktop.png",
      ),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw Error(file + " mobile overflow");
    await page.locator("#nav-toggle").click();
    await page.locator("#nav-links a").first().focus();
    await page.keyboard.press("Escape");
    if (
      (await page.locator("#nav-toggle").getAttribute("aria-expanded")) !==
      "false"
    )
      throw Error("Escape menu");
    await page.screenshot({
      path: path.join(
        os.tmpdir(),
        "everyo-" + file.replace(".html", "") + "-mobile.png",
      ),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    console.log("PASS desktop/mobile:", file);
  }
  await page.goto(
    (process.env.SITE_URL || "http://127.0.0.1:8000/") + "index.html",
  );
  await page.locator("[data-example=networks]").click();
  if (
    !(await page.locator("#interactive-code").textContent()).includes(
      "num_parameters",
    )
  )
    throw Error("example switching");
  await page.locator("#interactive-code .copy-button").click();
  if (
    !(await page.evaluate(() => navigator.clipboard.readText())).includes(
      "num_parameters",
    )
  )
    throw Error("copy code");
  await page.locator("#theme-toggle").click();
  if ((await page.locator("html").getAttribute("data-theme")) !== "dark")
    throw Error("theme");
  await page.reload();
  if ((await page.locator("html").getAttribute("data-theme")) !== "dark")
    throw Error("theme persistence");
  await page.screenshot({
    path: path.join(os.tmpdir(), "everyo-dark.png"),
    fullPage: true,
  });
  await page.locator("#theme-toggle").click();
  await page.goto(
    (process.env.SITE_URL || "http://127.0.0.1:8000/") + "examples.html",
  );
  await page.locator("[data-filter=vision]").click();
  if ((await page.locator("[data-category]:visible").count()) !== 2)
    throw Error("filters");
  await page.locator("[data-category=vision] .copy-command").first().click();
  if (
    !(await page.evaluate(() => navigator.clipboard.readText())).includes(
      "neural_network.py",
    )
  )
    throw Error("copy command");
  await page.goto(
    (process.env.SITE_URL || "http://127.0.0.1:8000/") + "community.html",
  );
  await page.locator("#copy-project").click();
  if (
    !(await page.evaluate(() => navigator.clipboard.readText())).includes(
      "everyo-site",
    )
  )
    throw Error("share copy");
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const simple = await nojs.newPage();
  await simple.goto(
    (process.env.SITE_URL || "http://127.0.0.1:8000/") + "index.html",
  );
  if (!(await simple.locator("#nav-links").isVisible()))
    throw Error("no-js menu");
  await nojs.close();
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS code switching, copy code/command/link, filters, theme persistence, mobile menu, no-JS navigation; no browser errors",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

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
    "why-everyo.html",
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
  const learningLinks = page.locator("#why-everyo .card .text-link");
  const destinations = [
    "documentation.html#gradients",
    "examples.html",
    "features.html#validation",
  ];
  for (let index = 0; index < destinations.length; index++) {
    const link = learningLinks.nth(index);
    if (
      (await link.getAttribute("target")) !== "_blank" ||
      (await link.getAttribute("href")) !== destinations[index]
    )
      throw Error("learning card destination");
    const [tab] = await Promise.all([page.waitForEvent("popup"), link.click()]);
    await tab.waitForLoadState("domcontentloaded");
    if (
      !tab.url().endsWith(destinations[index]) ||
      !(await tab
        .locator('footer a[href="https://github.com/krishanth7/EveryO"]')
        .count())
    )
      throw Error("local tab content and footer source link");
    await tab.close();
  }
  await page.locator("[data-accuracy-card]").scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-accuracy-card]").dataset.animation ===
      "complete",
  );
  if ((await page.locator("[data-accuracy-number]").textContent()) !== "99.3")
    throw Error("final reported accuracy");
  if (
    !(await page.locator(".accuracy-accessible").textContent()).includes(
      "99.3 percent",
    )
  )
    throw Error("stable accessible metric");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  if (
    (await page
      .locator("[data-accuracy-card]")
      .getAttribute("data-animation")) !== "complete" ||
    (await page.locator(".accuracy-card.is-counting").count())
  )
    throw Error("accuracy reduced motion");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  console.log(
    "PASS learning cards open local pages in new tabs with footer source links; accuracy settles at 99.3 and respects reduced motion",
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
  await page.goto(
    (process.env.SITE_URL || "http://127.0.0.1:8000/") + "documentation.html",
  );
  await page.locator("#os-windows").click();
  if (
    !(await page.locator("#install-windows").isVisible()) ||
    (await page.locator("#install-unix").isVisible())
  )
    throw Error("platform panel visibility");
  await page.locator("#install-windows .copy-button").click();
  if (
    !(await page.evaluate(() => navigator.clipboard.readText())).includes(
      "Activate.ps1",
    )
  )
    throw Error("PowerShell installation copy");
  await page.locator("#os-windows").focus();
  await page.keyboard.press("ArrowLeft");
  if (!(await page.locator("#install-unix").isVisible()))
    throw Error("platform keyboard switching");
  await page.locator("#docs-search-open").click();
  await page.locator("#docs-search-input").fill("gradient");
  if ((await page.locator("#docs-search-results a").count()) < 1)
    throw Error("documentation search results");
  await page.locator("#docs-search-input").fill("xzznonexistentquery");
  if (
    !(await page.locator("#docs-search-status").textContent()).includes(
      "No matching",
    )
  )
    throw Error("search empty state");
  await page.locator("#docs-search-input").fill("pickle-free");
  await page.keyboard.press("Enter");
  if (
    (await page.locator("#docs-search").isVisible()) ||
    !page.url().endsWith("#serialization")
  )
    throw Error("search result navigation");
  await page.keyboard.press("Control+k");
  if (!(await page.locator("#docs-search").isVisible()))
    throw Error("search keyboard shortcut");
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.locator('.docs-sidebar a[href="#api"]').click();
  if (await page.locator(".motion-enter").count())
    throw Error("reduced-motion animation");
  await page.waitForFunction(
    () =>
      document
        .querySelector('.docs-sidebar a[href="#api"]')
        .getAttribute("aria-current") === "location",
  );
  const progress = await page
    .locator("#page-progress-fill")
    .evaluate((el) => el.style.transform);
  if (progress === "scaleX(0)") throw Error("reading progress");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const file of [
    "robots.txt",
    "ai.txt",
    "llms.txt",
    "llms-full.txt",
    "llm.txt",
    "documentation.md",
  ]) {
    const response = await page.request.get(
      (process.env.SITE_URL || "http://127.0.0.1:8000/") + file,
    );
    if (response.status() !== 200 || (await response.body()).length < 100)
      throw Error("AI/crawler resource " + file);
  }
  console.log(
    "PASS docs search, keyboard navigation, OS tabs and copy, reduced motion, reading progress, machine-readable resources",
  );
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const simple = await nojs.newPage();
  await simple.goto(
    (process.env.SITE_URL || "http://127.0.0.1:8000/") + "index.html",
  );
  if ((await simple.locator("[data-accuracy-number]").textContent()) !== "99.3")
    throw Error("no-JS reported accuracy");
  if (!(await simple.locator("#nav-links").isVisible()))
    throw Error("no-js menu");
  await simple.goto(
    (process.env.SITE_URL || "http://127.0.0.1:8000/") + "documentation.html",
  );
  if (
    !(await simple.locator("#install-unix").isVisible()) ||
    !(await simple.locator("#install-windows").isVisible())
  )
    throw Error("no-JS platform instructions");
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

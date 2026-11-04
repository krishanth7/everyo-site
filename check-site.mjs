import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root = fileURLToPath(new URL(".", import.meta.url));
const files = [
  "index.html",
  "documentation.html",
  "features.html",
  "examples.html",
  "community.html",
];
const docs = new Map(
  files.map((name) => {
    const text = readFileSync(root + name, "utf8").replace(/\s+/g, " ");
    return [
      name,
      {
        text,
        ids: [...text.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
      },
    ];
  }),
);
let links = 0,
  assets = new Set();
for (const [name, { text, ids }] of docs) {
  assert.equal(ids.length, new Set(ids).size, name + ": duplicate IDs");
  assert.equal((text.match(/<h1\b/g) || []).length, 1, name + ": one H1");
  assert.equal(
    (text.match(/aria-current="page"/g) || []).length,
    1,
    name + ": one current page",
  );
  assert.equal(
    (text.match(/<main\b/g) || []).length,
    1,
    name + ": one main landmark",
  );
  for (const [, id] of text.matchAll(/aria-controls="([^"]+)"/g))
    assert.ok(ids.includes(id), name + ": control " + id);
  for (const [, href] of text.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const url = new URL(href, "https://example.test/" + name);
    if (url.origin !== "https://example.test") continue;
    const path = decodeURIComponent(url.pathname.slice(1)) || "index.html";
    assert.ok(existsSync(root + path), name + ": missing local file " + href);
    if (docs.has(path)) {
      if (url.hash)
        assert.ok(
          docs.get(path).ids.includes(decodeURIComponent(url.hash.slice(1))),
          name + ": missing anchor " + href,
        );
      links++;
    } else assets.add(path);
  }
  assert.match(text, /<link rel="canonical"/);
  assert.match(text, /<meta name="description"/);
  assert.match(text, /<meta name="robots"/);
  assert.match(text, /property="og:image" content="[^\"]+social-card.png"/);
  assert.match(text, /name="twitter:card" content="summary_large_image"/);
  const schema = JSON.parse(
    text.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1],
  );
  assert.equal(schema.codeRepository, "https://github.com/krishanth7/EveryO");
  const structured = [
    ...text.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g),
  ].map((match) => JSON.parse(match[1]));
  const graph = structured.find((item) => Array.isArray(item["@graph"]))?.[
    "@graph"
  ];
  assert.ok(graph, name + ": page discovery graph");
  const page = graph.find(
    (item) =>
      item["@type"] ===
      (name === "documentation.html" ? "TechArticle" : "WebPage"),
  );
  const canonical = text.match(/<link rel="canonical" href="([^"]+)"/)[1];
  assert.equal(page.url, canonical, name + ": structured canonical URL");
  assert.equal(
    graph
      .find((item) => item["@type"] === "BreadcrumbList")
      .itemListElement.at(-1).item,
    canonical,
  );
  assert.match(text, /max-image-preview:large/);
  assert.match(text, /property="og:site_name" content="EveryO"/);
  assert.match(text, /name="twitter:image:alt"/);
  assert.match(
    text,
    /type="text\/plain" title="EveryO LLM index" href="llms.txt"/,
  );
}
const sitemap = readFileSync(root + "sitemap.xml", "utf8");
assert.equal((sitemap.match(/<loc>/g) || []).length, 5);
for (const file of files)
  assert.ok(
    sitemap.includes(
      "https://krishanth7.github.io/everyo-site/" +
        (file === "index.html" ? "" : file),
    ),
  );
assert.ok(
  existsSync(root + "assets/img/social-card.png"),
  "Social preview image exists",
);
assert.match(
  readFileSync(root + "assets/css/developer-site.css", "utf8"),
  /prefers-reduced-motion:\s*reduce/,
);
for (const file of [
  "llms.txt",
  "llms-full.txt",
  "llm.txt",
  "documentation.md",
]) {
  const content = readFileSync(root + file, "utf8");
  assert.ok(content.length > 100, file + ": readable machine documentation");
  for (const [, path] of content.matchAll(
    /https:\/\/krishanth7\.github\.io\/everyo-site\/([^\s)#]*)/g,
  )) {
    assert.ok(
      existsSync(root + path.replace(/[.,;:]+$/, "")),
      file + ": missing referenced local resource " + path,
    );
  }
}
const robotRules = readFileSync(root + "robots.txt", "utf8");
assert.match(robotRules, /User-agent: \*/);
assert.match(robotRules, /Allow: \/everyo-site\//);
assert.match(
  robotRules,
  /Sitemap: https:\/\/krishanth7\.github\.io\/everyo-site\/sitemap.xml/,
);
const sitemapURLs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
);
assert.equal(
  new Set(sitemapURLs).size,
  sitemapURLs.length,
  "unique sitemap URLs",
);
console.log(
  `PASS: ${docs.size} pages; ${links} internal links; ${assets.size} local assets; valid anchors, controls, landmarks, metadata, social previews, structured data, and sitemap.`,
);

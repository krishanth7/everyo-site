# EveryO — developer website

The public multipage website for [EveryO](https://github.com/krishanth7/EveryO), a Python neural computing framework built on NumPy for learning, teaching, and small-scale experiments.

**Website:** https://krishanth7.github.io/everyo-site/

## Develop locally

No build step, package manager, or application credentials are required. Serve the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Python 3 serves the site; Node.js 24 runs the dependency-free checks.

## Pages and assets

- `index.html`: overview, why-use positioning, computation graph, switchable code examples, architecture, and reproducible results.
- `why-everyo.html`: audience paths, use cases, practical benefits, fit guidance, and seven visible questions with matching FAQ structured data.
- `features.html`: tensors, autograd, network modules, training tools, and validation limits.
- `documentation.html`: searchable documentation workspace, keyboard-accessible platform tabs, reading progress, complete Python examples, serialization, troubleshooting, and API essentials.
- `examples.html`: 12 filterable experiments linked to the framework's actual scripts, with copyable commands.
- `community.html`: contribution paths, issue guidance, native sharing with clipboard fallback, and project policies.
- `assets/css/developer-site.css` and `assets/js/developer-site.js`: shared responsive design and progressive enhancements.
- `assets/img/social-card.png`: original 1200 × 630 social preview used by every page.
- `assets/css/documentation.css`: documentation layout and tools.
- `assets/css/site-experience.css` and `assets/js/site-experience.js`: finite entrance animations, reading navigation, platform tabs, and local documentation search.

The site supports light/dark modes, reduced motion, keyboard navigation, accessible status messages, and mobile navigation. Primary navigation and content remain available with JavaScript disabled. There are no external runtime scripts, analytics, tracking cookies, or font requests. The theme preference is stored locally in the browser.

## Validate

```sh
node --test --test-isolation=none header.test.cjs overview.test.cjs
node check-site.mjs
```

The unit tests exercise the actual shared JavaScript, including storage failures, theme persistence, menu controls, code switching, filtering, and sharing. The site checker validates local files, anchor targets, unique IDs, landmarks, metadata, structured data, social previews, and the sitemap.

An optional real-browser regression runner is in `tests/browser.cjs`. With Playwright available on Node's module path and Chromium at `/usr/bin/chromium`, start the local server and run:

```sh
node tests/browser.cjs
```

Set `CHROMIUM_PATH` for a different Chromium executable, and `SITE_URL` for a different server URL (include a trailing slash). Screenshots go to the operating system's temporary directory. The runner checks all six pages at desktop and mobile sizes, image loading, overflow, JavaScript errors, clipboard contents, filtering, theme persistence, Escape behavior, and navigation without JavaScript. It also covers documentation search, empty results, result navigation, platform tabs and copy, reading position, machine-readable resources, and reduced-motion behavior.

## Motion and documentation UX

Entrance animations are progressive enhancements applied when content enters the viewport. Content is visible before scripts run, and the reduced-motion preference disables reveal animations, animated scrolling, and page transitions. Graph highlights stop after three short pulses. Search derives its index from the actual document, uses no network service, and supports Ctrl/Command+K, Enter, Tab, and Escape. Installation tabs support Left/Right arrows and Home/End; both instruction sets remain visible without JavaScript.

## Search, social, and AI discovery

Every page has a canonical URL, distinct title and description, focused keywords, search directives, and Open Graph and Twitter previews. A connected JSON-LD graph describes the WebSite, SoftwareSourceCode, SoftwareApplication, WebPage/TechArticle, and BreadcrumbList entities. The Why EveryO page also has FAQPage markup matching its visible answers exactly. `robots.txt` declares the project path, sitemap, and explicit rules for Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, PerplexityBot, and Claude-SearchBot. Crawlers consult `/robots.txt` at the origin root; GitHub Pages serves this repository under `/everyo-site/`, so the project copy cannot override the domain-root policy. If the host-root site is managed separately, publish the matching rules there. The sitemap is also linked from every HTML head. `ai.txt` provides a concise purpose, audience, benefits, and documentation map; `llms.txt` indexes authoritative sources; `llms-full.txt` includes the reviewed guide, API, architecture, autograd, diagnostics, and example catalog. `documentation.md` is the downloadable Markdown quickstart. `llm.txt` is a convenience pointer to the canonical index, not a separate standard.

Regenerate the expanded AI reference from the selected framework checkout:

```sh
python3 scripts/build-ai-docs.py --source ../EveryO
python3 scripts/build-ai-docs.py --source ../EveryO --check
```

The generator requires the checkout to match the reviewed revision in `llms.txt`, so upstream changes must be reviewed before updating provenance. It resolves upstream relative links to immutable source URLs. Machine discovery uses canonical URLs, semantic content, source identity, linked text resources, and visible answers mirrored in schema. There is no universal “LLM Signal”, “LLM Scout”, or “AEO” meta tag, so the site does not invent provider endorsement tags or ranking instructions. Metadata and text resources do not guarantee indexing, AI citations, rich-result eligibility, rankings, or social reach.

## Content provenance

Content was checked against the framework README, `pyproject.toml`, guides in `docs/`, API reference, example scripts, and project policies at upstream commit `6c05a061eb62fa2646e726d15cac07053d04c79e`. All five documentation Python examples were executed against that source, including the 20-epoch classifier and a save/load/inference round trip.

Keep capabilities and validation limits aligned with upstream. The 99.3% digit result is a reported example-run measurement, not a performance guarantee. CUDA runtime tests require actual GPU hardware; CPU stand-ins validate the resident-buffer transfer design only. Multi-machine training remains unverified. Optional integrations are not part of the base CPU installation.

## Deployment

GitHub Pages serves the repository root of `main`; `.nojekyll` preserves static assets. No alternate hosting configuration or build service is required.

## License

MIT. See [LICENSE](LICENSE).

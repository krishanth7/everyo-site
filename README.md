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

- `index.html`: overview, computation graph, switchable code examples, architecture, and reproducible results.
- `features.html`: tensors, autograd, network modules, training tools, and validation limits.
- `documentation.html`: platform-specific installation, complete Python examples, training, and API essentials.
- `examples.html`: 12 filterable experiments linked to the framework's actual scripts, with copyable commands.
- `community.html`: contribution paths, issue guidance, native sharing with clipboard fallback, and project policies.
- `assets/css/developer-site.css` and `assets/js/developer-site.js`: shared responsive design and progressive enhancements.
- `assets/img/social-card.png`: original 1200 × 630 social preview used by every page.

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

Set `CHROMIUM_PATH` for a different Chromium executable, and `SITE_URL` for a different server URL (include a trailing slash). Screenshots go to the operating system's temporary directory. The runner checks all five pages at desktop and mobile sizes, image loading, overflow, JavaScript errors, clipboard contents, filtering, theme persistence, Escape behavior, and navigation without JavaScript.

## Content provenance

Content was checked against the framework README, `pyproject.toml`, guides in `docs/`, API reference, example scripts, and project policies at upstream commit `6c05a061eb62fa2646e726d15cac07053d04c79e`. All three complete documentation Python examples were executed against that source, including the 20-epoch classifier.

Keep capabilities and validation limits aligned with upstream. The 99.3% digit result is a reported example-run measurement, not a performance guarantee. CUDA runtime tests require actual GPU hardware; CPU stand-ins validate the resident-buffer transfer design only. Multi-machine training remains unverified. Optional integrations are not part of the base CPU installation.

## Deployment

GitHub Pages serves the repository root of `main`; `.nojekyll` preserves static assets. No alternate hosting configuration or build service is required.

## License

MIT. See [LICENSE](LICENSE).

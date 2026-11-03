# EveryO header engineering report

Date: 3 November 2026

## Architecture and scope

The repository is a static GitHub Pages site: HTML, one stylesheet, and one dependency-free JavaScript enhancement. It contains no package.json, React/Next.js framework, TypeScript configuration, lint configuration, or existing automated test suite. No dependencies or animation libraries were added.

Implementation files: `index.html`, `everyo-corporate.css`, and `everyo-corporate.js`. Regression checks: `header.test.cjs` and `check-site.mjs`. The main content and footer were compared with the pre-change source and are byte-for-byte unchanged.

## Confirmed issues and corrections

| Confirmed issue / root cause | Component and correction | Verification |
| --- | --- | --- |
| Documentation was permanently highlighted through a CSS class; there was no aria-current state. | Navigation now derives its active item from the current internal destination and visible section. Hash, popstate and pageshow events synchronize the state. External Documentation is not falsely marked current on the landing page. | PASS: Features click, browser back and forward, and initial Overview state. |
| Mobile closure switched to display:none, skipping the exit transition. | Disclosure remains rendered during its opacity/transform exit. Closed links become inert immediately; visibility and pointer-events prevent invisible interception. Explicit opening/open/closing/closed states and guarded completion timers handle interrupted transitions. | PASS: open, close, Escape, rapid reversal and final closed state. |
| Opening retained focus on the hamburger, and a global Tab handler trapped focus within ordinary navigation. | Opening focuses Overview. Escape restores the toggle. Internal links focus their destination. Tab can leave naturally, closing the disclosure. No dialog role or modal focus trap is applied to the menu. | PASS: first-link focus, Escape return, destination focus, Tab from the last menu link through theme/toggle into main content. |
| Theme and hamburger controls measured 34px and 40px high. | Header actions now have at least 44px touch targets; heights are 64/68/76px plus the 1px border. | PASS: visible control bounds at all requested widths. |
| Header/menu styling was split across conflicting 1150/1250px rules, with repeated reference overrides. | Consolidated the reference-header rules; CSS and JS now share the 1199px disclosure breakpoint. The desktop layout is verified at 1280px and above. | PASS: viewport matrix and open-menu resize to desktop and back. |
| The initial theme icon depended on deferred JavaScript, allowing the wrong selected icon before initialization. | Pre-paint initialization resolves stored or system theme. The runtime uses that same root attribute and synchronizes icons, labels, persistence and storage events. | PASS: browser toggle/reload/cross-tab synchronization; unit tests for system preference, explicit preference, preference clearing and denied storage. |
| Header colors and sizes differed from the approved tokens. | Reusable header tokens use the specified cream/charcoal, lime, border, hover and card colors. The header has a 1440px maximum width and stable spacing. | PASS: rendered light/dark inspection and computed dimensions. |
| Search Escape dismissal was inconsistent in browser testing. | Search now explicitly closes on Escape and restores its opener, while retaining the native dialog's modal semantics. | PASS: filtering, Escape dismissal, and focus restoration. |

## Animation and interaction design

- Menu entrance: opacity 0→1, translateY −8→0 and scale .99→1 over 240ms.
- Menu exit: opacity/transform over 180ms; links are inert immediately, visibility hides after exit.
- Hamburger: three SVG lines rotate/fade into an X over 200ms without resizing the button.
- Desktop underline: 200ms transform expansion, with a persistent active underline. Link weight stays constant to prevent text-width shifts.
- Get Started: stable dimensions, color transition and 3px arrow movement.
- Sticky header: passive scroll listener with one requestAnimationFrame update adds a subtle shadow; no blur or layout animation.
- Reduced motion: header transitions and animations are disabled. State completion does not wait for motion when the preference is active. Optional item staggering was deliberately omitted to keep navigation immediate.
- The menu locks page scrolling while expanded. Scrollbar gutter reservation preserves content width. In browser checks, the hero width stayed 378px and the logo x-position stayed 16px across opening/closing at a 390px viewport; scroll position stayed 0.

## Test results

| Check | Result | Actual evidence |
| --- | --- | --- |
| `node --check everyo-corporate.js` | PASS | Exit 0. |
| `node --test header.test.cjs` | PASS | 4 tests; 4 pass; 0 fail. Tests exercise the actual production script in an isolated DOM/media/storage environment. |
| `node check-site.mjs` | PASS | Unique IDs, all local targets, ARIA controls, one initial active link, three content sections, one footer, local application files, reduced-motion rules and breakpoint. |
| Main/footer preservation comparison | PASS | Byte-for-byte comparison against pre-change HTML. |
| Browser viewport widths | PASS | 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920px. No document overflow, overlapping header controls, clipped desktop controls or sub-44px visible header targets. |
| Desktop navigation and history | PASS | Overview/Features state; Features destination and focus; browser back/forward; Get Started hash and settled target below the sticky header; Documentation opens the repository docs page. |
| Search | PASS | “train” returns both relevant sections; Escape closes and returns focus to Search. |
| Mobile menu | PASS | Open, close, Escape, internal navigation, outside click, rapid reversal, focus return, Tab departure and breakpoint cleanup. |
| Theme | PASS | Both themes inspected; toggle works with menu open; explicit choice survives reload and synchronizes between open tabs. System/cleared/blocked-storage branches tested by unit tests. |
| Application console | PASS | No site-origin warnings/errors in the inspected log window. Browser-extension metadata errors were present and excluded from application errors. |
| Native mobile hardware, orientation sensor, Safari/Firefox | NOT RUN | Browser testing used Chromium iframe viewports and live desktop Chromium. Width/orientation-related layout changes were covered by resizing, not physical-device rotation. |
| Screen reader / full WCAG 2.2 audit | NOT RUN | Semantic landmarks, labels, current state, focus behavior, hidden links and keyboard paths were checked. This is not a formal accessibility certification. |
| Physical-device frame-rate profiling | NOT RUN | CSS state transitions were inspected; no lower-end phone or frame-rate trace was available. No 60fps claim is made. |
| npm lint / typecheck / local framework build | NOT RUN | No such scripts, dependencies, or framework configuration exist. Static checks above are the applicable local validation. |
| GitHub Pages production build | See Actions | Publication triggers the repository's native Pages build/deployment. The completion response records its final result and commit. |

## Production assessment

The desktop and mobile header passed the documented Chromium behavior and layout checks. The theme mechanism, accessible disclosure behavior, and restrained CSS animations are implemented without changing the page sections or adding dependencies. Cross-browser, screen-reader and physical-device performance checks remain the explicit verification limits listed above.

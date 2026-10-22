# Verification record

## Candidate status

The P0 implementation is present in the owner-selected existing Cloud workspace. It is an **implementation candidate with blocked browser verification**. The owner-approved Pages demonstration is published; this does not establish an accepted P0/product release. No separate environment or competing task was created. The environment's name and Only me metadata remain UNVERIFIED; the owner's explicit selection authorizes engineering in the existing workspace without changing access settings.

## Executed checks

| Check | Actual result | Scope |
| --- | --- | --- |
| Node / npm | PASS: 24.19.0 / 11.9.0 | Pinned in .nvmrc and package.json |
| Initial lock and npm ci | PASS | One npm v3 lockfile; registry.npmjs.org sources and three local workspaces |
| npm run build | PASS | Core/CLI compilation and all fifteen authored static routes, plus framework not-found output |
| npm run typecheck | PASS | Strict TypeScript in all three workspaces |
| npm run lint | PASS | ESLint application/packages/scripts/tests |
| npm test | PASS; exact final count in docs/evidence/checks.json | Core, CLI, content, source trust boundaries, indexing and static HTTP checks; no skipped tests |
| npm run check:seo | PASS: 3 tests | Fifteen distinct titles/descriptions, static headings/links, noindex defaults, no canonical or public sitemap |
| npm run check:licenses | PASS: 142 installed declarations | Inventory in THIRD-PARTY-NOTICES.md; not a legal certification |
| npm audit --json | PASS: zero reported advisories | Recorded installed lockfile graph; not a general security guarantee |
| npm run benchmark | PASS for the Node laboratory targets | Three small and three near-limit runs; see evidence/performance.json |
| Pinned Chromium install | BLOCKED | cdn.playwright.dev returned 403 Domain forbidden for Chromium 156.0.8078.4, Playwright build 1248 |
| bash scripts/environment-doctor.sh --browser | BLOCKED, exit 1 | Project browser binary unavailable; no sandbox weakening |
| npm run test:e2e -- --max-failures=1 | BLOCKED, exit 1 | 36 Chromium tests discovered; first browser launch failed, 35 did not run |
| Firefox / WebKit | NOT RUN | Neither pinned engine is installed; no coverage claimed |

The original archive's 24 preparation tests are historical packaging checks. They are not included as application evidence. Current core tests use the independent F1–F5 fixture oracle and separate security cases. CLI tests include real loopback redirect guards and a missing-browser error-output case; the latter proves failure behavior, not a successful nine-state capture.

## GitHub Pages publication

The project-path build and static artifact checks pass with `/a11y-workbench`: fifteen authored pages plus the framework 404, correctly mounted HTML/CSS/JS, both lazy worker chunks, `.nojekyll`, MIT and installed third-party license/NOTICE texts. Current non-browser tests total **52 PASS, 0 FAIL, 0 skipped**; prefix preview tests use real loopback HTTP, including deep links, assets, redirects and traversal/mount isolation. Default root hosting is checked separately after the project-path build.

`docs/evidence/pages.json` records the reviewed artifact counts and the owner-approved Pages publication at [A11y Workbench](https://kostrubin.github.io/a11y-workbench/). GitHub reports `built`, public visibility and enforced HTTPS; [native workflow `39716613430`](https://github.com/kostrubin/a11y-workbench/actions/runs/39716613430) completed successfully for exact artifact commit `f288edfc43e422b541cfd9b820d0b2f44eef65da`. Pages deployment `7242897689` also reports `success` with the expected site environment URL. These observations verify publication beyond a settings save. Direct public HTTPS checks from Cloud are BLOCKED at the outbound proxy: curl exit `56`, origin HTTP status `000`, CONNECT HTTP 403 and zero origin body bytes. This does not establish a site HTTP 403. The remote web reader could not access the URL, and browser panel opening/rendering was not confirmed. No direct body/assets/browser pass is claimed and no network/sandbox setting was changed. No custom workflow was created and indexing remains off. See GITHUB-PAGES.md for the completed scoped authorization and detailed publication evidence. Existing browser/axe/AT acceptance limitations still apply.

## Per-acceptance evidence

| ID | Status | Evidence and remaining limitation |
| --- | --- | --- |
| E2E-01 | BLOCKED | Sample and state/count UI implemented; browser execution unavailable |
| E2E-02 | BLOCKED | Core raw axe normalization/counts and hostile inputs pass; picker/drop/reload browser checks unavailable |
| E2E-03 | BLOCKED | Independent comparison oracle passes; UI filters/details browser execution unavailable |
| E2E-04 | BLOCKED | Incomplete/configuration/namespace/change tests pass; UI rationale not browser verified |
| E2E-05 | BLOCKED | Manual registry defaults and export contracts pass; manual UI interaction unavailable |
| E2E-06 | BLOCKED | Allowlisted JSON/escaped Markdown tests pass; browser preview/download/reimport unavailable |
| E2E-07 | BLOCKED | Form code and keyboard regression tests present; browser unavailable |
| E2E-08 | BLOCKED | Modal code and focus regression tests present; browser unavailable |
| E2E-09 | BLOCKED | Action menu code and keyboard regression tests present; browser unavailable |
| E2E-10 | BLOCKED | Controlled broken/corrected variants implemented; behavioral/axe tests unavailable |
| E2E-11 | BLOCKED | CLI guards and explicit nine-state failure output pass; positive real capture unavailable |
| E2E-12 | BLOCKED | Clear/key reset/reload cases implemented; browser unavailable |
| SEC-01 | BLOCKED | No runtime endpoints/persistence in source; actual browser network canary observation unavailable |
| SEC-02 | BLOCKED | Poison/XSS-like/URL inputs rejected or minimized by core tests; browser inert rendering unavailable |
| SEC-03 | BLOCKED | Byte/depth/string/node/count/timeout/cancel tests pass; UI preservation/recovery unavailable |
| SEC-04 | BLOCKED | JSON/Markdown omission and safe evidence tests pass; browser download path unavailable |
| SEC-05 | BLOCKED | Namespace/HMAC identity tests pass; UI warning behavior unavailable |
| SEC-06 | PASS | Reviewed synthetic repository, no credentials/user captures, lockfile/advisory/license inventory, no committed deployment credentials or custom workflows; native Pages deployment is separately approved |
| UX-01 | BLOCKED | Keyboard/focus tests registered, browser unavailable |
| UX-02 | BLOCKED | Reflow/reduced-motion/screenshot tests registered; no screenshot or actual browser zoom executed |
| UX-03 | BLOCKED | Scoped axe and corrected-pattern matrix registered; engines unavailable |
| PERF-01 | BLOCKED | Three Node small/near-limit runs measured; actual browser responsiveness and peak behavior remain unverified |
| PERF-02 | BLOCKED | Node laboratory inputs met 1s/5s targets; browser off-thread responsiveness not measured |
| SEO-01 | PASS | Production HTML contains all fifteen substantive authored routes, six guides and three pattern pages |
| SEO-02 | PASS | Default noindex metadata, absent canonical/sitemap; synthetic pure release-gate cases validated without activating release |
| SEO-03 | PASS | Static internal links, source/case/test manifest and loopback deep-link/refresh/not-found checks |

## Measured performance

The near-limit synthetic input is 9,979,048 bytes with 10,000 source nodes. Final Node normalization plus comparison totals were 2886.65, 2711.58 and 2448.00 ms. Small-report totals were 44.37, 7.42 and 5.94 ms. The benchmark records before/after RSS, not peak memory. These are laboratory measurements on Linux x64 / Node 24.19.0, not real-user Core Web Vitals or a browser responsiveness result.

Import and comparison execute in dedicated cancellable workers; comparison snapshots exclude manual-only edits. Export preview construction still needs browser timing at the largest input. No browser performance pass is inferred from Node timings.

## Human evaluation

Human assistive-technology sessions, real browser zoom, visual screenshot inspection and device-specific interactions are NOT RUN. Automated focus/axe code is not a human screen-reader assessment. No accessibility certification, complete WCAG conformance, SEO ranking, user interview or traffic result is claimed.

## Release and recovery

SITE_RELEASE_APPROVED remains false and SITE_PUBLIC_ORIGIN empty. The owner-approved in-development Pages demonstration is published through the native branch deployment workflow. No custom CI, other deployment target, GitHub Release, package publication, indexing activation or additional spending occurred. The custom CI file remains an inactive example under docs/ci; native Pages execution is recorded separately. No further approval for this same Pages publication is pending.

To complete the blocked gates, the existing environment needs its approved pinned Playwright artifacts and a sandbox-capable browser runtime. The observed download host is cdn.playwright.dev. Current continuation does not authorize changing the environment's network or sandbox settings. After a supported remedy, run the local pinned browser install, browser doctor, Chromium and available engine suites, actual CLI capture and browser performance/privacy checks. Preserve this candidate and continue; do not recreate the project.

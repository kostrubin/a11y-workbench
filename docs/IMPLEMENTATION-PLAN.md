# Autonomous implementation plan

## Completion target

Produce a finished, reproducible P0 implementation candidate and evidence for owner review. Reviewed source, documentation, tests and synthetic examples may be committed and pushed to the public `kostrubin/a11y-workbench` working branch, as authorized by the owner. The owner subsequently approved publication of the prepared in-development GitHub Pages candidate only; GITHUB-PAGES.md records the successful native deployment and verification limits. Other deployments/previews, GitHub Releases, packages, indexing and additional spending remain outside scope. This plan is an execution sequence, not a substitute for the complete contract in the six specification documents. Resolve routine implementation details autonomously. If evidence reveals a specification defect, make the smallest compatible correction, record the reason, and preserve scope and approval boundaries.

## Repository shape

Use a small npm workspace monorepo:

```text
apps/web/              Next.js static-export UI and authored pages
packages/core/         Pure TypeScript schema, normalization, diff, safe exports
packages/cli/          Local capture CLI using Playwright and axe
fixtures/synthetic/   Reviewed generated and hand-authored test fixtures
tests/                Cross-package and browser acceptance checks
docs/                 Contracts, decisions, evidence and contributor docs
scripts/              Reproducible setup and verification helpers
```

Keep data processing independent of React and browser globals. Place worker orchestration in the web layer. Do not add a separate content service, database, queue, vector store, agent framework, authentication platform or microservice. Do not add a second web framework. Use native controls where they meet the behavior contract.

## Milestones and exit evidence

| Milestone | Work | Exit evidence |
| --- | --- | --- |
| M0 — environment | Inspect the authorized repository; read contracts; select a compatible stable runtime/toolchain; initialize workspace and lockfile; verify local browser availability | `npm ci`, actual version log, minimal static build, actual headless browser launch; any unavailable prerequisite recorded |
| M1 — core | Executable schema, import limits, normalization, identity/evaluation coverage, comparison, manual states, minimized JSON/Markdown | Independent synthetic fixtures prove the expected comparison and hostile inputs cannot be accepted or exported unsafely |
| M2 — useful vertical slice | Sample → import → inspect → compare → manual result → export/reimport → clear; worker cancellation and accessible interaction | E2E-01–06 and E2E-12 work through the UI, with no report-dependent network request |
| M3 — executable examples | Three broken/corrected patterns and nine states; safe local runner; explanations and regression recipes | E2E-07–11, CLI failure behavior, keyboard focus behavior, scoped axe results |
| M4 — authored site | Exactly fifteen routes; six original guides; example/source/test links; responsive UI and indexing gate | Static HTML content, links and route manifest match; preview remains non-indexable |
| M5 — hardening | Actual hostile imports, local-CLI network boundaries, dependency/license review, browser matrix and performance measurements | Security, UX, performance and SEO acceptance entries have evidence or explicit blocked/not-run status |
| M6 — handoff | Correct stale README, record architecture choices and limitations, capture synthetic screenshots, prepare reviewable candidate | Reproduction instructions work; verification table is honest; owner sees one concrete release/budget/security decision if needed |

Complete and verify one slice before polishing optional features. If parallel agents exist, partition core/fixtures, UI/examples, and authored content/testing; share types first and review integrations. Do not run competing dependency edits or unreviewed merges. In a single-agent environment follow the same sequence.

## Toolchain and command contract

Use a supported Node LTS available in the cloud image and compatible with the chosen stable Next.js release. Record the actual exact Node/npm versions in the repository and an appropriate runtime file after testing. Select exact dependency versions using official project documentation and the registry. Commit one `package-lock.json`; after initial dependency resolution use `npm ci`. Dependency installation is not evidence that browser binaries or operating-system libraries are available.

Provide these root scripts as real commands, not echo-success placeholders:

| Command | Expected responsibility |
| --- | --- |
| `npm run dev` | Start local web development on a documented loopback port |
| `npm run build` | Build the pure core/CLI and production static website without deploying |
| `npm run typecheck` | Strict TypeScript across all packages |
| `npm run lint` | Actual maintained lint tooling; do not assume a removed framework command exists |
| `npm test` | Core schema, diff, normalization, exports and fixture contract tests |
| `npm run test:e2e` | Chromium user journeys and available browser smoke matrix |
| `npm run test:a11y` | Shell/corrected-example axe plus focused keyboard behavior, with broken fixtures explicitly separated |
| `npm run check:content` | Route/case manifest, source links syntax, example/test consistency and authored content checks |
| `npm run check:security` | Hostile imports, canaries, no network/persistence and CLI boundaries |
| `npm run check:seo` | Static HTML metadata, links, safe noindex defaults and public-origin gate |
| `npm run check` | The documented bounded required gate set; show exact subcommands and failures |

Choose and document a deterministic static-preview command and the actual CLI command after implementation. Avoid hidden background daemons and external test services. Do not infer success from a zero-exit placeholder, fixture-generating script, changed snapshot, or skipped test.

## SEO implementation inputs

The default build must set `SITE_RELEASE_APPROVED=false`; `SITE_PUBLIC_ORIGIN` is empty. Implement a validated build-time gate requiring both an approved production HTTPS origin and the release flag. A true flag never authorizes publishing by itself. Sensitive imported data cannot enter pages, routes, query strings, titles, metadata, logs or sitemap. `/workbench/` remains non-indexable in public mode. Offline generated static output is a review artifact; no access-controlled preview is promised unless actually available.

Build a small useful site: the fifteen routes and six original guides in `DESIGN-SEO.md`. Each guide must help complete a concrete task, demonstrate the working example where relevant, link the corresponding test and primary source, and accurately separate automation from human evaluation. Do not generate keyword permutations, city pages, fake statistics, reviews, certification marks or ranking promises. Search Console setup, traffic measurement and public indexing belong to a later approved release.

## Evidence and recovery

After each milestone, update `docs/PROGRESS.json` with completed IDs, current stage, next executable action, unresolved failures and decisions. Update `docs/VERIFICATION.md` from real results. Keep synthetic evidence under a documented directory; commit only appropriately small reviewed evidence, not entire browser traces or user reports. Inspect the exact staged files and prepared commits for secrets, personal data and sensitive logs before each source push. Use meaningful ordinary commits and pushes on the working branch; never force push or bypass branch protection. Use the cloud task's normal review mechanism when available; do not enable a publish workflow to deliver code. Safe source publication in the named public repository needs no further approval.

If the runtime approaches a limit, save work and an exact continuation command before finishing. Do not erase history or restart from scratch on resume. A missing browser binary or dependency network access is an environment blocker, not permission to disable tests. Complete independent work, explain the blocked check, and leave an executable recovery instruction. Do not claim a finished verified candidate while required checks failed or remain blocked.

## Final handoff format

Explain what works for the user, then give the commit/branch or local patch, setup/run/build/test commands, acceptance status table, actual dependency/runtime versions, synthetic screenshots where useful, performance measurements, limitations and owner decisions. Distinguish implementation complete, reviewable candidate, and release authorized. Human assistive-technology coverage that did not occur must remain `NOT RUN`; automated keyboard checks cannot replace it.

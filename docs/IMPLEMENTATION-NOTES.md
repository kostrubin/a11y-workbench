# Implementation notes

This document describes the implementation and reproducible workflow. It is not an acceptance certificate. The project remains in development; [VERIFICATION.md](VERIFICATION.md) owns the observed command results and per-acceptance limitations.

## Execution and publication boundary

The owner explicitly selected the existing Cloud workspace for direct engineering. Work continues in that selected executor without creating another environment, competing task or nested Codex process. The environment interface does not expose a verified name or an `Only me` label; those metadata remain **UNVERIFIED**. Missing display metadata is not treated as a new authorization gate after the owner’s selection. No private chat/runtime identifiers, credentials or runtime logs belong in the public source.

Reviewed source, project documentation, tests and synthetic examples may be committed and pushed normally to the public `work` branch. No force push, branch-protection bypass or visibility change is authorized. Source permission alone does not authorize deployment. The owner separately approved the prepared in-development GitHub Pages candidate; GITHUB-PAGES.md records its verified native publication and blocked direct Cloud/browser checks. Other deployments/previews, GitHub Releases, packages, indexing and additional spending remain unauthorized. Keep `SITE_RELEASE_APPROVED=false` and `SITE_PUBLIC_ORIGIN` empty.

## Structure and runtime

The repository is a small npm workspace rather than a collection of services:

- `apps/web` is a Next.js static export with React. Authored pages render useful HTML before hydration; the workbench and controlled pattern examples provide client interactions.
- `packages/core` contains the shared pure TypeScript schema, validation, normalization, identity, conservative comparison, manual-check registry and minimized exports.
- `packages/cli` contains the bounded local capture command. It uses the same canonical contract and runs only the bundled synthetic recipes.
- `fixtures/contract` contains hand-authored synthetic data and an independent expected comparison. These fixtures are not real engine captures.
- `tests` contains unit/contract, content, security, indexing and browser checks. Test results are kept distinct from test definitions.

The actual runtime is pinned to Node `24.19.0` and npm `11.9.0`, with a single root `package-lock.json`. Reviewed direct versions include Next.js `16.4.2`, React/React DOM `19.3.1`, TypeScript `6.0.3`, Playwright `1.64.1`, axe-core `4.14.0`, Ajv `8.20.0` and ajv-formats `3.0.1`. The committed manifests and lockfile are authoritative if a later reviewed change updates them.

The web build uses the explicit webpack build path. Core and CLI compile to ESM JavaScript and declarations before the web build consumes the shared package. Browser-only state and worker orchestration stay out of the domain layer. The Next configuration uses TypeScript 6 through its compiler API (`experimental.useTypeScriptCli: false`) because capture of the CLI child’s `--showConfig` output failed in the managed runner. Strict type checks remain enabled; `npm run typecheck` is an additional explicit gate.

## Reproduce the build and local workflow

From repository root:

```bash
npm ci
npm run build
npm run preview
```

The preview serves the completed static output on `127.0.0.1:4173` and binds only to loopback. The development command `npm run dev` uses `127.0.0.1:3000`. Neither command provisions hosting or exposes a public preview.

`npm run build` compiles the packages, exports the website and generates indexing artifacts. The default export must contain all fifteen approved routes, no public production canonicals or sitemap entries, and non-indexing metadata. `/workbench/` stays non-indexable even in separately approved release-configuration tests. A release flag is a configuration input, not authority for an agent to release the product.

Browser setup uses the installed, pinned local executable:

```bash
./node_modules/.bin/playwright install chromium
bash scripts/environment-doctor.sh --browser
```

The environment doctor requires Chromium sandboxing. A missing binary or operating-system prerequisite is reported as blocked. Disabling the sandbox is not an accepted remedy. Additional browser engines use the same pinned Playwright version when executable in the authorized environment.

## Import and comparison pipeline

The browser checks the selected file’s size before handing it to a worker. Strict UTF-8 parsing, poison-property rejection, bounded structural traversal, canonical schema checks and cross-field evidence validation precede acceptance. Processing is cancellable with a five-second watchdog; a failure keeps the previous valid workspace.

Input is limited to the documented raw axe JSON shape and canonical Workbench bundle `1.0`. A generic Playwright HTML report, trace ZIP, archive or unknown future schema is rejected. Canonical records use explicit allowlists and reject additional properties at their boundaries.

Violations, incomplete results, passes and inapplicable outcomes retain separate counts. Rule counts differ from affected-node counts. Exact evaluated pairs establish subject-level evidence; an executed-rule list and observed-subject list do not imply their Cartesian product was evaluated.

Stable explicit subject aliases are preferred for controlled synthetic captures. Raw imports can use namespace-scoped HMAC-SHA-256 fingerprints of full target arrays. Browser identity keys remain memory-only and are never exported. A changed selector or independent namespace cannot be repaired through fuzzy matching.

Comparison runs independently of React presentation. A state needs compatible capture metadata before a reliable conclusion is available. The output categories are `new`, `persisting`, `changed`, `not-detected` and `unassessable`. New/not-detected conclusions require an exact opposite-run pass for the rule/subject. Missing states, incomplete evidence and configuration changes remain visible as uncertainty.

Manual checklist results are user-reported. New checks start `not-run`; a non-default local edit requires an observation or not-applicable reason. Notes and tester context stay in session memory and are excluded from exports. Imported minimized statuses do not restore omitted observation details or independently verify a reviewer’s claim.

## Controlled patterns and traceability

The three corrected/default patterns cover local form validation, a modal edit dialog and a single-level action menu. Intentionally broken variants are entered deliberately and retain a dependable outside reset/exit path. They are tested separately from corrected fixtures and the application shell; no global axe suppression hides unexpected failures.

The nine named capture states are defined in `spec/states.json`. `apps/web/content/cases.json` connects all fifteen routes with case IDs, primary references, source files, fixtures, manual checks, acceptance IDs and test files. The six guides link maintained implementation/test source instead of duplicating code fragments that could drift. The import reference’s complete empty-bundle example is validated against the same core contract and explicitly claims no completed scan.

Automated focus/name/state assertions and axe results do not constitute a human screen-reader evaluation. An actual human session must retain the browser, operating system, assistive technology/version and observation separately; otherwise its status stays **NOT RUN**.

## Local capture

Build and serve the synthetic application first, then use a second terminal in the same development environment:

```bash
mkdir -p local-reports identity-keys
npm run capture -- --origin http://127.0.0.1:4173 --output local-reports/baseline.json --identity-file identity-keys/demo.json --variant broken
npm run capture -- --origin http://127.0.0.1:4173 --output local-reports/candidate.json --identity-file identity-keys/demo.json --variant corrected
```

The explicit output/identity parent directories must exist. Existing output files require `--overwrite`; symlink and unsafe-path cases are rejected. Reusing an explicitly selected identity file preserves a comparable namespace. Independent captures without one receive independent namespaces.

Only an explicit HTTP loopback origin with a port is accepted. The runner starts fresh ephemeral browser state, blocks cross-origin traffic, non-GET/HEAD methods, service workers, popups, downloads and WebSockets, and bounds navigation, state and total execution time. Blocked resources and failed captures produce partial/error evidence and a non-success result rather than an empty pass.

The runner is for a trusted operator-controlled application. Playwright routing is defense in depth and does not isolate arbitrary malicious websites at the operating-system level. It does not authenticate, reuse profiles, load arbitrary adapters, crawl, submit real user forms or collect screenshots/traces by default.

## Data and export decisions

The static runtime has no account, upload endpoint, telemetry SDK, runtime AI, database, remote font dependency or browser report persistence. Report-dependent network requests are forbidden; ordinary same-origin application assets may still load. A future static host can log ordinary page requests, which is a separate limitation.

JSON and Markdown exports are newly constructed minimized records. The allowlist excludes HTML, selectors, names, page text, input values, URLs, raw messages, notes, tester context, credentials and identity keys. JSON can be reimported; Markdown is a readable escaped summary. Aliases and fingerprints remain pseudonymous, not guaranteed anonymous.

Clear removes application-held reports, comparison state, annotations and identity material and revokes outstanding download URLs. It cannot erase downloaded files, guarantee forensic JavaScript-memory erasure or protect a compromised browser. Local reports, identity files and auth/trace artifacts remain excluded from Git.

## Observed checkpoint and unresolved verification

At this documentation checkpoint:

| Area | Observed status | Limit |
| --- | --- | --- |
| Root dependency installation | PASS with `npm ci` | A successful install does not prove a browser binary exists |
| Dependency audit | Zero reported vulnerabilities in the performed audit | An audit is not a general security guarantee |
| Focused core and CLI checks | 26 core and 13 CLI checks passed in the performed runs | Full integrated totals remain in `VERIFICATION.md` |
| Next production export | PASS for all fifteen authored routes plus the not-found page in the observed build | Rebuild after relevant source changes; final gate results remain in `VERIFICATION.md` |
| Pinned browser installation | BLOCKED by proxy `403` at `cdn.playwright.dev` | No download-policy bypass or sandbox-disabled workaround |
| Browser E2E/axe matrix, real captures and screenshots | An actual browser gate attempt stopped at the missing pinned binary; no successful browser execution, real captures or screenshots claimed | Downstream unexecuted checks stay NOT RUN |
| Human assistive-technology evaluation | NOT RUN | Automated focus/axe checks cannot substitute |

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run check:content`, `npm run check:security`, `npm run check:seo` and `npm run check:licenses` for the non-browser gates, after any required build. `npm run test:e2e`, `npm run test:a11y` and `npm run test:matrix` are real browser commands and may fail on the unresolved browser prerequisite. `npm run check` stops when a required gate fails; it does not convert blocked checks into success.

The optimized core was also measured in the Node reference runner with synthetic inputs. The near-limit input was 9,979,048 bytes with 10,000 source node occurrences; three measured normalization-plus-comparison runs took 2,886.65 ms, 2,711.58 ms and 2,448.00 ms. The small input was 2,020 bytes with 12 source node occurrences, and its measured totals ranged from 5.94 to 44.37 ms. RSS observations are before/after values rather than a measured peak. These are Node laboratory measurements, not browser responsiveness, real-user Core Web Vitals or a verified UI performance pass. The reproducible benchmark and its recorded artifact retain that distinction.

The original preparation validator and packaging checks describe the historical seed; they must not be used to claim application acceptance after manifests and implementation exist. Preserve their history, current source and the independent fixture oracle rather than restoring an older bootstrap over subsequent work.

## Dependency licenses and contribution

Original project work remains MIT licensed. Required third-party terms and notices remain applicable, including MPL-2.0 for axe, Apache-2.0 components and other transitive license terms. The installed-lockfile inventory is in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md); installed license/NOTICE files and applicable generated comments must be preserved on redistribution. No dependency source is represented as original MIT project code.

Use reviewed synthetic reproductions, meaningful ordinary commits and the existing `work` branch. Inspect prepared commits before public push. Never publish real reports, personal data, secrets, tokens, identity keys, browser storage states or sensitive logs. No private security-reporting channel is claimed to exist; check actual repository controls before sharing sensitive details.

Read [ACCEPTANCE.md](ACCEPTANCE.md), [VERIFICATION.md](VERIFICATION.md) and [PROGRESS.json](PROGRESS.json) together before reporting completion. An implementation in development, a verified candidate and an owner-approved website release are different states.

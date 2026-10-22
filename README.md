# A11y Workbench

An open-source accessibility workbench in development for inspecting automated findings, comparing compatible runs, recording manual checks and learning from executable form, dialog and menu examples.

**Status: implementation in development, with browser verification blocked.** Application code, a shared processing core, the capture CLI and tests are now present. This is not a released or fully accepted accessibility tool. Dependency installation, the fifteen-route static build, strict typing, lint and 49 non-browser tests passed in the selected Cloud workspace; exact acceptance results are tracked in [the verification record](docs/VERIFICATION.md). The pinned browser download currently fails with a proxy `403` from `cdn.playwright.dev`. No successful E2E run, real capture, screenshot or human assistive-technology session is claimed.

There is no deployed website. Public source publication does not authorize deployment, public previews, GitHub Releases, package publication, website indexing or additional spending.

## What the implementation contains

- A synthetic sample and a browser-session workflow for file import, inspection, conservative comparison, user-reported manual checks, minimized JSON/Markdown export and clearing.
- Separate violations, incomplete checks, passes and inapplicable outcome counts, with rule counts distinguished from affected-node counts.
- Corrected/default and intentionally broken form, modal-dialog and action-menu examples, with nine named capture states and bounded reset/exit controls.
- Fifteen static routes, including six original guides connecting a concrete problem to the maintained example, primary sources and regression tests.
- A local capture CLI restricted to an explicit trusted HTTP loopback origin and the repository’s bundled synthetic recipes.

A report with no automated findings is not proof of accessibility, WCAG conformance or successful human review. Missing or incompatible evidence remains visible as **Cannot assess**. User-reported manual checks start **not-run** and stay separate from automation.

## Install and run

Use the pinned **Node 24.19.0** and **npm 11.9.0** recorded in `.nvmrc` and `package.json`. The project is an npm workspace; use the single root lockfile.

```bash
npm ci
npm run build
npm run preview
```

The static preview binds to **http://127.0.0.1:4173** in the current development environment. It serves `apps/web/out/` after a successful build and adds non-indexing headers. It is a loopback development server, not public preview hosting. For development with rebuilding, run:

```bash
npm run dev
```

The development server uses **http://127.0.0.1:3000**. Build and runtime configuration keep `NEXT_TELEMETRY_DISABLED=1`, `SITE_RELEASE_APPROVED=false` and an empty `SITE_PUBLIC_ORIGIN`. Product runtime needs no API key, account, database or paid API.

For browser-dependent checks, install Chromium through the pinned local Playwright executable:

```bash
./node_modules/.bin/playwright install chromium
bash scripts/environment-doctor.sh --browser
```

Dependency installation alone does not prove browser availability. The current download is blocked; do not mark browser checks passed or disable sandbox controls to work around that result. Firefox and WebKit may be installed through the same pinned executable when the authorized environment supports their downloads and system dependencies.

## Try the workflow

After a successful local build and preview:

1. Open the workbench and inspect the labelled synthetic sample without supplying a file.
2. Read the selected state, engine declaration, capture scope and separate outcome counts.
3. Load the supplied sample comparison and inspect each finding’s category and reason. A missing menu state must remain unassessable.
4. Record a deliberate manual status with a local observation, inspect the export preview, and explicitly download minimized JSON or Markdown.
5. Clear the workspace and reload. Imported reports, notes and browser identity keys must not reappear.

The bundled contract samples are **hand-authored synthetic fixtures with sentinel engine versions**. They explain the independent comparison oracle; they are not real axe scans. Real generated captures must be recorded separately with the actual installed engine and browser. Notes and human checks in the UI do not imply that the project has performed a screen-reader evaluation.

## Capture the bundled local patterns

The CLI requires a completed static build, a running local preview and a working pinned browser. It does not scan arbitrary remote sites, authenticate or load executable adapters.

```bash
mkdir -p local-reports identity-keys
npm run capture -- --origin http://127.0.0.1:4173 --output local-reports/baseline.json --identity-file identity-keys/demo.json --variant broken
npm run capture -- --origin http://127.0.0.1:4173 --output local-reports/candidate.json --identity-file identity-keys/demo.json --variant corrected
```

The output and identity parent directories must already exist. Existing outputs require an explicit `--overwrite`; symlink destinations are rejected. Reuse the explicitly selected identity file for a comparable pair. A capture without a shared identity file receives a new namespace, so matching-looking subjects cannot silently become a trustworthy comparison.

The fixed recipes cover `forms.initial`, `forms.invalid`, `forms.success`, `dialog.closed`, `dialog.open`, `dialog.saved`, `menu.closed`, `menu.open` and `menu.selected`. An interrupted or blocked capture produces incomplete/error evidence and a failure status. Real broken/corrected captures need not have the hand-authored contract oracle’s exact finding totals.

The CLI is for a trusted application controlled by its operator. Playwright request routing is defense in depth, not an operating-system isolation guarantee for malicious websites.

## Verification commands

All commands below are implemented root scripts. They are reproduction commands, not claims that every check has passed.

| Command | Checks |
| --- | --- |
| `npm run build` | Compile core/CLI and export the static website, then generate indexing artifacts |
| `npm run typecheck` | Strict TypeScript across the workspaces |
| `npm run lint` | Maintained ESLint configuration across application, packages, scripts and tests |
| `npm test` | Core, CLI, content, security and indexing tests |
| `npm run test:e2e` | Chromium browser journeys |
| `npm run test:a11y` | Browser checks tagged for accessibility, including corrected patterns and controlled broken examples |
| `npm run test:matrix` | Firefox/WebKit coverage where those engines execute |
| `npm run check:content` | Route/case/source/fixture/test traceability and authored-content contracts |
| `npm run check:security` | Core input/export boundaries, CLI restrictions and repository/browser-source security checks |
| `npm run check:seo` | Static HTML, links and release-gated indexing configuration |
| `npm run check:licenses` | Installed dependency/license inventory |
| `npm run benchmark` | Synthetic small and near-limit processing measurements |
| `npm run check` | The required bounded gate sequence; failures stop the command |

A complete static export is a prerequisite for checks that inspect generated HTML or run the preview. Browser suites require an actual executable browser; a browser download failure does not become a skip/pass. Human assistive-technology assessment and real browser zoom remain separate recorded procedures. See [acceptance](docs/ACCEPTANCE.md) and [verification](docs/VERIFICATION.md) for exact statuses and limitations.

## Architecture and data handling

```text
apps/web/       Next.js static-export UI, import worker and authored routes
packages/core/  Shared types, strict validation, normalization, comparison and safe exports
packages/cli/   Bounded Playwright/axe capture of trusted loopback synthetic patterns
fixtures/       Independent synthetic contracts and expected observations
tests/          Core, CLI, content, security, indexing and browser checks
docs/           Contracts, implementation notes, decisions and observed evidence
```

The import worker enforces resource limits and cancellation; failed imports preserve the last valid workspace. Canonical records are built by allowlist. Comparison requires compatible per-state metadata and exact rule/subject evaluation evidence rather than approximate selector matching.

Reports and keys stay in session memory: P0 has no uploads, accounts, analytics, runtime AI, remote fonts, localStorage/IndexedDB report persistence or report service worker. Imported links and HTML do not become executable UI. Same-origin application assets can still load, and a future host could log ordinary page requests; local processing is not a promise that no data ever leaves a device.

Exports omit source HTML, selectors, page text, accessible names, form values, page URLs, literal messages, free-text notes, tester context and identity keys. Opaque aliases and fingerprints remain pseudonymous and may reveal structure or equality. Clear cannot delete previously downloaded files or guarantee forensic memory erasure. Read [security/privacy](docs/SECURITY-PRIVACY.md) and the in-app privacy page before sharing any report.

## Contributing and publication boundaries

Use only the existing public [kostrubin/a11y-workbench](https://github.com/kostrubin/a11y-workbench) repository and ordinary reviewed commits/pushes on `work`. Preserve subsequent work, branch protection and history; do not force push. Review files and commits for secrets, tokens, personal data, real reports and sensitive logs before every public push. Use small synthetic reproductions and keep expectations independent from fixture generation.

Do not publish customer captures, browser profiles, auth states, identity keys or sensitive traces. Local reports and identity files belong in the ignored directories above. This project does not claim a private security-reporting channel is configured; inspect the repository’s actual controls before sharing sensitive details.

The owner has selected the current existing Cloud workspace for direct engineering. No new environment, duplicate task or nested CLI launch is required to continue there. Source authorization does not authorize site deployment, public preview hosting, GitHub Releases, packages, indexing or new spending. The npm workspaces are marked private to prevent accidental package publication; the GitHub source repository remains public. `noindex` is not access control.

## License and documents

Original project work is [MIT licensed](LICENSE). Dependencies keep their own licenses, including applicable Apache-2.0, MPL-2.0 and other notices. See the installed-lockfile inventory in [THIRD-PARTY-NOTICES.md](docs/THIRD-PARTY-NOTICES.md); do not relicense third-party source or remove required notices.

- [Implementation notes](docs/IMPLEMENTATION-NOTES.md): architecture choices, reproducible workflow and current verification boundaries.
- [Product and architecture](docs/PRODUCT-SPEC.md), [architecture contract](docs/ARCHITECTURE.md): bounded P0 and serialized report/evidence model.
- [Design](docs/DESIGN-SEO.md), [research baseline](docs/RESEARCH-BASELINE.md): route/content contract and explicitly unproven product hypotheses.
- [Acceptance](docs/ACCEPTANCE.md), [verification](docs/VERIFICATION.md), [progress](docs/PROGRESS.json): required checks and observed continuation state.

No interviews, adoption, traffic, ranking gains, independent review or accessibility certification are claimed.

# A11y Workbench

An open-source accessibility workbench in development for understanding automated findings, comparing compatible runs, recording manual checks, and learning from executable form, dialog and menu examples.

**Current status: in development; preparation package only.** The application has not been implemented or tested yet. This repository contains the product contract, architecture, privacy requirements, acceptance scenarios and cloud-agent instructions. There is no deployed website or released accessibility tool.

## What the first implementation must deliver

Users can try synthetic reports, import axe JSON locally, inspect violations and incomplete results alongside passes and inapplicable counts, compare sufficiently documented runs, record clearly identified manual results, and export a minimized report. Three original interactive examples connect findings to fixes and regression tests. The application never presents an automated result as complete accessibility or WCAG conformance.

The runtime is a static website. Files stay in the browser session; there are no accounts, uploads, runtime AI calls, paid APIs, or persistence in P0. The companion capture CLI is restricted to a trusted explicit localhost origin and known synthetic capture recipes.

## Start autonomous implementation

1. Use the existing public [kostrubin/a11y-workbench](https://github.com/kostrubin/a11y-workbench) repository and its working branch. See `START-HERE-RU.md` for the cloud-only start. Inspect existing work before changing files; keep the seed at repository root, including dotfiles. Do not change repository visibility or use another project.
2. Follow [the cloud setup guide](docs/CLOUD-SETUP.md). The seed is allowed to have no `package.json` yet; the agent creates the application and lockfile during implementation.
3. Start a cloud task using `CODEX-IMPLEMENTATION-PROMPT.txt`. Read `AGENTS.md` and the documents it names. The separate downloadable self-contained prompt can reconstruct a missing seed in an empty authorized repository.

The preparation package itself requires no product API credentials. The environment and dependency installation must be ready before a session can perform browser verification. The owner controls spending, security, sensitive data and release. No deployment is authorized by this README.

## Documents

| Document | Purpose |
| --- | --- |
| [Product contract](docs/PRODUCT-SPEC.md) | Audience, useful workflow, P0 and P1 boundaries |
| [Architecture](docs/ARCHITECTURE.md) | Canonical reports, comparison evidence, import limits |
| [Security and privacy](docs/SECURITY-PRIVACY.md) | Untrusted imports, minimization, local CLI isolation |
| [Design and SEO](docs/DESIGN-SEO.md) | Fifteen routes, interaction quality, original content, indexing gate |
| [Acceptance](docs/ACCEPTANCE.md) | Exact functional, security, UX, performance and SEO evidence |
| [Implementation plan](docs/IMPLEMENTATION-PLAN.md) | Milestones, command contract and completion rules |
| [Cloud setup](docs/CLOUD-SETUP.md) | One-time account/environment setup and recovery |
| [Research baseline](docs/RESEARCH-BASELINE.md) | Evidence and unresolved product hypotheses |
| [Verification](docs/VERIFICATION.md) | What has and has not actually been checked |
| [Delivery status](docs/DELIVERY-STATUS.md) | Preparation status and external setup blockers |

## Planned development commands

After the agent creates the application, its root commands must include `npm run dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `test:a11y`, `check:content`, `check:security`, `check:seo`, and `check`. **They are requirements, not commands implemented in this seed.** The final README must replace this section with verified installation, CLI usage, test and static-preview commands.

## Release and contribution

This repository is intentionally public. The owner authorizes normal commits and pushes of reviewed source, documentation, tests and synthetic examples to a working branch. Check files and commits before pushing; never publish secrets, tokens, personal data, real user reports or sensitive logs. Do not bypass branch protection or force push. Routine safe source changes do not require renewed approval.

Source publication does not authorize a website deployment, public preview, GitHub Release, package publication, site indexing or additional spending. Keep `SITE_RELEASE_APPROVED=false` and `SITE_PUBLIC_ORIGIN` empty. The dedicated Codex Cloud environment must remain private / Only me even though the source is public. A `noindex` directive does not restrict access. Future implementation documentation should include a verified sample walkthrough, architecture, contribution instructions and required dependency notices. No private security-reporting channel is claimed to exist.

Original project code uses the [MIT license](LICENSE). Third-party code and assets retain their licenses and required notices. Do not copy W3C examples or dependency source into this project without preserving applicable notices. The name is provisional; no trademark or domain availability claim has been made.

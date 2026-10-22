# Existing Cloud workspace and runtime checks

## Owner-selected execution context

The owner explicitly selected the existing Cloud chat/workspace for this project and authorized implementation directly in its a11y-workbench checkout. This supersedes earlier preparation steps requiring a separately launched implementation task. Do not create a new environment, competing task or nested Codex invocation. Implementation and tests stay in the existing Cloud workspace, not on the owner's computer.

The environment name and Only me/ACL metadata are UNVERIFIED because the available runtime interface does not expose them. This missing metadata is not itself a new access change or a reason to repeat approval for the already selected workspace. Preserve the current access, sandbox and network settings. Private chat/runtime/configuration identifiers stay outside the public source repository.

The repository intentionally remains public: kostrubin/a11y-workbench, working branch work. Reviewed source, documentation, tests and synthetic examples may be committed and pushed normally. No force push, protection bypass or visibility change.

## Verified runtime and dependencies

Node 24.19.0, npm 11.9.0 and Git 2.52.0 are available. One committed root npm lockfile pins the reviewed workspace graph. npm ci completed. Next.js 16.4.2 / React 19.3.1 compile and export all fifteen authored routes. TypeScript 6.0.3 supplies the compiler API; TypeScript 7 is outside the selected linter's supported peer range. Next's supported useTypeScriptCli:false selects that compiler API while keeping strict type checking enabled.

No application API key, paid API, database, telemetry or product secret is needed. Build defaults are NEXT_TELEMETRY_DISABLED=1, SITE_RELEASE_APPROVED=false and empty SITE_PUBLIC_ORIGIN.

## Reproduction in this workspace

```bash
npm ci
npm run build
npm run typecheck
npm run lint
npm test
npm run check:licenses
npm run preview
```

The preview binds only to 127.0.0.1:4173. Development uses npm run dev at 127.0.0.1:3000. These loopback servers do not publish a website. The combined npm run check also requires working browser tests and currently remains blocked at that prerequisite.

scripts/cloud-setup.sh uses npm ci once a lockfile exists. A11Y_INSTALL_BROWSERS=1 requests the pinned local Playwright Chromium install. Run bash scripts/environment-doctor.sh --browser to prove a real browser launch; package installation alone is insufficient.

## Concrete browser blocker

The local Playwright 1.64.1 installer requests Chromium 156.0.8078.4 (build 1248) from:

```text
https://cdn.playwright.dev/builds/cft/156.0.8078.4/linux64/chrome-linux64.zip
https://cdn.playwright.dev/builds/cft/156.0.8078.4/linux64/chrome-headless-shell-linux64.zip
```

The current proxy rejects the download with 403 Domain forbidden. Browser doctor and an actual Chromium E2E attempt returned non-success because the pinned binary is missing. Firefox and WebKit are also absent. An earlier system Chromium attempt failed its SUID sandbox configuration; it is not an approved no-sandbox alternative.

Do not silently broaden networking, change sandbox flags, use sudo, install arbitrary global browsers or claim browser passes. A supported remedy must preserve the owner's boundaries; any actual network/access change needs the owner's explicit decision. Continue all independent engineering and keep blocked checks visible.

## Source and release boundaries

Only reviewed synthetic fixtures belong in source Git. Reports, identity files, browser profiles, traces, sensitive logs and credentials remain excluded. Preserve MIT and third-party terms. The owner separately approved public GitHub Pages publication of the prepared in-development candidate at `https://kostrubin.github.io/a11y-workbench/`. This overrides the earlier deployment/public-preview ban only for that candidate: use ordinary reviewed static-file commits/pushes on `gh-pages` and native branch Pages deployment; reviewed source remains on `work`. Actual publication status is recorded in GITHUB-PAGES.md. Do not request the same approval again or treat authorization as live-site evidence.

Native standard free Pages execution is allowed and may appear in Actions. Keep custom CI inactive in docs/ci/ci.yml.example; do not add a custom workflow, larger runner, cache or separately retained Actions artifact. Browser acceptance remains BLOCKED, not accepted P0. Preserve `SITE_RELEASE_APPROVED=false` and empty `SITE_PUBLIC_ORIGIN`: indexing is not approved. Other deployments/previews, GitHub Releases, package publication, additional spending, other projects and Cloud access/network/sandbox changes remain outside this approval.

The prior CLI authentication results were scoped to their respective sessions. A local CLI was reported to list tasks successfully while a Cloud-workspace CLI returned 401. Neither is a prerequisite for engineering in the existing owner-selected workspace; do not repeat login loops or create another task merely for delegation.

## Sources

- https://nextjs.org/docs/app/guides/static-exports
- https://nextjs.org/docs/app/getting-started/installation
- https://playwright.dev/docs/api/class-browsertype
- https://playwright.dev/docs/browsers

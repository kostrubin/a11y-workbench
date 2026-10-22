# Cloud setup and actual handoff state

Updated 2026-10-21. See `../START-HERE-RU.md` for the owner walkthrough and `../SETUP-CLOUD-ENVIRONMENT.txt` for setup instructions to the environment assistant.

## Actual state

The project-owned technical seed is available and the application is not yet implemented. Authenticated GitHub checks confirmed that `kostrubin/a11y-workbench` is public and was initially empty; the reviewed seed was then pushed to branch `work` at `fcbf0e65c9391adad3d3ec36fa83e12d1f62bab7`. Remote refs and the branch API confirmed the push. This supersedes the earlier preparation-time 404. The owner explicitly authorizes reviewed source, documentation, tests and synthetic examples in this repository, with ordinary commits and pushes to a working branch. Keep it public and inspect the exact files and prepared commits before pushing. Do not publish secrets, personal data, real reports or sensitive logs.

A managed cloud workspace is running, but the selected environment's name, private access scope and publication have not been verified. The current toolset exposes runtime status/diagnostics, not environment creation, editing or publication. Codex CLI cloud-list access returned `401 Unauthorized`; the device-authorization request failed before a secure sign-in interface was available. No implementation task was submitted or started. Neither a running workspace nor an inactive approval request proves a separate Cloud task was launched.

Do not alter other projects. Use only `kostrubin/a11y-workbench`. The old private-repository prerequisite is cancelled. The environment itself must still be dedicated to this project and private / `Only me`.

## One-time account setup

1. Use the existing public `kostrubin/a11y-workbench` repository. Do not recreate it or change its visibility. Inspect current remote contents before writing and preserve subsequent work. Grant the existing GitHub/Codex integration access only to this repository as needed. Do not request account-wide secrets, passwords, tokens or verification codes in chat.
2. Choose **Work in > Cloud > Select environment > Create environment** or **Settings > Codex Cloud > Environments > Create environment** in the current interface. Select the repository, use the supplied setup prompt, inspect the setup report and publish the private environment. Its visibility is **Only me**. Publishing this configuration makes it selectable; it does not publish the app.
3. Start a task in that environment on the reviewed working branch. Submit its complete `CODEX-IMPLEMENTATION-PROMPT.txt`, or a current self-contained prompt containing that full text and the matching seed. The original ZIP and bootstrap are historical snapshots with superseded repository-policy text; never restore them over the amended branch. Materialize only missing authorized files and preserve subsequent implementation work. Use one launch route, not duplicate implementations.

The source seed is intentionally not an implemented application. The environment assistant should not fabricate scaffolds, lockfiles or fake tests to make setup appear complete. Its readiness report must say what has actually been installed and what the first coding task must do.

## Runtime and network

Use a supported compatible Node LTS runtime (prefer available Node 24 LTS; a compatible still-supported Node 22 LTS is acceptable), npm, Git and Bash. Record actual versions; a broad `>=22` helper check does not establish framework compatibility. Python 3 is optional for the seed materializer and preparation tests, not required by the finished web runtime.

The first implementation task creates reviewed manifests and the initial lockfile. Dependency access must therefore be allowed **during that task**, not solely during setup. Use the smallest available scope: package registries, pinned browser-artifact hosts, connected GitHub and the referenced official documentation. Do not silently widen network policy to unrestricted access. Record the exact blocked host if downloads fail and complete independent work.

Common registry/documentation destinations include `registry.npmjs.org`, `nextjs.org`, `react.dev`, `typescriptlang.org`, `playwright.dev`, `www.w3.org`, `developers.google.com`, and the referenced GitHub sources. This list is a planning aid, not an asserted complete allowlist: dependency/browser CDN redirects depend on the pinned release and must be inspected. Do not grant arbitrary wildcard domains or install a proxy to bypass policy.

No application secrets, OpenAI API key, production data, shared browser profile, remote scanner or account-wide credentials are needed. Never request paid credits or automatic top-ups. Set build-time telemetry suppression `NEXT_TELEMETRY_DISABLED=1`. Keep `SITE_RELEASE_APPROVED=false`; `SITE_PUBLIC_ORIGIN` empty.

## Setup helpers

If seed files already exist, the install command is:

```bash
bash scripts/cloud-setup.sh
```

A README-only repository has no such path yet; leave the install field empty or use harmless runtime checks until the seed exists. When no manifest exists, this helper exits with `SEED READY` and downloads nothing. This is not an application or browser-test pass.

After the coding task has created compatible reviewed manifests and a lockfile:

```bash
A11Y_INSTALL_BROWSERS=1 bash scripts/cloud-setup.sh
bash scripts/environment-doctor.sh --browser
```

The first command uses `npm ci` and the local pinned Playwright executable to install Chromium. The second must actually launch an ephemeral browser on a synthetic local document. Do not use `sudo`, disable sandbox controls, or add a paid test service. Missing OS libraries or browser binaries remain explicit blockers. Additional engines can be installed through the same reviewed Playwright version when supported, with unavailable engines recorded separately.

An interactive Cloud browser has not been connected in this session. This is separate from installing and running headless Playwright in the coding environment. Browser test capability must be demonstrated by actual launch, not inferred from either the presence or absence of an interactive browser tool. The preinstalled Chromium failed a sandbox-enabled launch because its SUID sandbox helper was not configured correctly; this is a blocker, not permission to disable sandboxing. Project-pinned dependencies and browser binaries are still absent.

## Storage, checkpoints and CI

Continue the original task to use its own working files. A new task starts a separate workspace from the published setup and does not recover another task's uncommitted changes. Commit important work or retain explicit task artifacts through the normal authorized mechanism. Platform saved state is not permanent storage and not a source-control replacement.

Keep GitHub Actions inactive in `docs/ci/ci.yml.example` until the account's free capacity or a budget is established. Use the authorized cloud workspace/task for implementation checks and report which actually ran. Reviewed source commits and pushes to the project's working branch are allowed; they do not authorize deployment, public previews, GitHub Releases, package publication, domain purchase, visibility change, website indexing, additional spending, privileged workflows or an unbounded self-relaunch loop.

The owner receives a concrete reviewable candidate with exact commands, evidence and limitations. Routine implementation decisions do not require extra approvals. Usage/session limits may require a continuation but never justify fabricated results or a false claim of ongoing background work.

## Primary references, checked 2026-10-21

- https://learn.chatgpt.com/docs/environments/cloud-environments
- https://learn.chatgpt.com/docs/environments/modes
- https://help.openai.com/en/articles/20001545-using-codex-cloud
- https://learn.chatgpt.com/docs/agent-configuration/agents-md
- https://playwright.dev/docs/browsers

Check current account controls rather than assuming that every documented capability is available to this user. No account-specific quota, network permission or billing allowance was read in this preparation session.

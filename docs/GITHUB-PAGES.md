# Prepared GitHub Pages publication decision

**Status: static candidate prepared; not published.** The owner asked whether GitHub Pages is possible. The earlier explicit prohibition on deployment/public previews remains in effect until the owner authorizes this specific publication. A local build or source push is not a deployment approval.

## Concrete proposed publication

- Repository: existing public `kostrubin/a11y-workbench`; preserve visibility, source branch `work`, history and protections.
- Prospective project URL: `https://kostrubin.github.io/a11y-workbench/`. This is an expected address, not a claim that a live site exists.
- Source: only the reviewed generated static site in a separate `gh-pages` branch, served from its root. Preserve/review any existing branch before modifying it; never force push.
- Hosting: GitHub's native branch Pages publication. It may appear as a built-in Pages Actions run even without a custom workflow. Do not introduce `.github/workflows`, larger runners, custom caches, separately retained Actions artifacts, paid resources or a custom domain.
- Exposure: a public **in-development demonstration**, with synthetic bundled samples and explicit verification limitations. `noindex` does not make it private.
- Indexing: keep `SITE_RELEASE_APPROVED=false`, `SITE_PUBLIC_ORIGIN` empty, `noindex` on every page and no sitemap/canonicals. A deployment approval does not separately approve indexing.
- Cost: the existing repository is public; GitHub Pages is available on GitHub Free, and GitHub documents free standard runner usage for Pages. No paid product, credit purchase, budget change or additional service is proposed.
- Data: no credentials, real reports, identity files, browser profiles, runtime identifiers, logs, `.next` build diagnostics or development dependencies in the publication branch. Only generated browser assets/pages, `.nojekyll` and required license/NOTICE texts.

The current API read returned HTTP 404 for this repository's Pages resource and repository metadata confirmed `has_pages=false`. No remote `gh-pages` branch exists. Pages was not enabled or modified. The connected GitHub repository tool confirmed public visibility and repository administration capability. The settings read used the normal GitHub API because the connected tool does not expose Pages settings.

## Prepared and checked here

`npm run build:pages` creates a static project-path export in `apps/web/out/`, then preserves original MIT and actual installed/vendor license/NOTICE texts alongside the assets. No network publication is part of the command. Its explicit per-command values preserve the non-indexing defaults.

`npm run check:pages` checks all fifteen authored pages plus the framework 404, all local HTML/CSS resource links, both worker chunks and their webpack public path, `.nojekyll`, license texts and non-indexing metadata. See [the artifact evidence](evidence/pages.json).

Internal links use Next's mount-aware navigation. The base path is a validated build-time input, not runtime routing supplied by imported reports. Future separately approved indexing URLs also preserve the project path; pure synthetic configuration tests do not enable that release mode.

`npm run preview -- --base-path /a11y-workbench` serves the generated site only on loopback under the project prefix. Actual HTTP tests cover routes, refresh/deep links, CSS/JS, redirect, HEAD/POST, missing paths, mount isolation, malformed options, traversal and symlink escapes. The default root build and preview remain supported.

## Remaining acceptance limits

The installed Playwright package is pinned, but its browser executable is absent. The last pinned Chromium download attempt returned `403 Domain forbidden` from `cdn.playwright.dev`; browser/axe E2E, positive nine-state CLI capture, visual screenshots, browser performance/privacy and human assistive-technology checks have not passed. Pages preparation does not resolve this blocker or establish a fully accepted P0.

GitHub Pages serves static files and cannot run the local capture CLI, server endpoints or custom HTTP-header logic. The UI processes reports in browser memory; the CLI remains restricted to trusted explicit HTTP loopback origins. Do not weaken it to scan the public Pages URL. GitHub may log ordinary HTTP requests, including visitor IPs; local report processing is not a claim that hosting has no request logs. Project-path `robots.txt` is not an origin-wide robots policy; page-level `noindex` remains the indexing control for this candidate.

## Final owner decision

Authorize or decline **public publication of this in-development candidate on the prospective Pages URL**, while retaining the recorded verification limitations, no-index configuration and zero-additional-spending boundaries. Do not silently treat this as accessibility acceptance, approval of indexing, a package/GitHub Release, or permission to change Cloud network/sandbox settings.

After authorization, inspect the exact static artifact and any existing Pages branch/settings, commit/push the reviewed generated output through ordinary history, configure only this repository's Pages source, observe the native deployment and verify actual HTTPS pages/assets before reporting a live URL. If a supported interface cannot read that origin, distinguish GitHub deployment status from direct HTTP/browser verification. Do not report publication success on the basis of a settings save alone.

## Official references reviewed

- [GitHub Pages overview and project URL shape](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
- [Pages plan availability](https://github.com/github/docs/blob/main/data/reusables/gated-features/pages.md).
- [Branch publishing and native Pages deployment](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
- [Actions billing, including free Pages standard runner use](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

No custom workflow, Pages source setting, public preview, website release or additional spending was enabled during this preparation.

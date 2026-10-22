# GitHub Pages publication record

**Status: owner-approved in-development demonstration published, verified by GitHub.** Open [A11y Workbench](https://kostrubin.github.io/a11y-workbench/). Pages reports `built`, public visibility and enforced HTTPS; the native workflow and Pages deployment succeeded for the reviewed artifact commit. Direct HTTPS verification from Cloud is blocked at its outbound proxy before any origin response; browser rendering/behavior remains unverified. This publication is not accepted P0 or accessibility certification.

## Publication and authorization

- Repository: existing public `kostrubin/a11y-workbench`; preserve visibility, source branch `work`, history and protections.
- Project URL: [https://kostrubin.github.io/a11y-workbench/](https://kostrubin.github.io/a11y-workbench/). GitHub API and workflow evidence verify publication; direct body/assets/browser verification is recorded separately.
- Source: only the reviewed generated static site in a separate `gh-pages` branch, served from its root. Preserve/review any existing branch before modifying it; never force push.
- Hosting: GitHub's native branch Pages publication. It may appear as a built-in Pages Actions run even without a custom workflow. Do not introduce `.github/workflows`, larger runners, custom caches, separately retained Actions artifacts, paid resources or a custom domain.
- Exposure: a public **in-development demonstration**, with synthetic bundled samples and explicit verification limitations. `noindex` does not make it private.
- Indexing: keep `SITE_RELEASE_APPROVED=false`, `SITE_PUBLIC_ORIGIN` empty, `noindex` on every page and no sitemap/canonicals. A deployment approval does not separately approve indexing.
- Cost: the existing repository is public; GitHub Pages is available on GitHub Free, and GitHub documents free standard runner usage for Pages. No paid product, credit purchase, budget change or additional service was introduced.
- Data: no credentials, real reports, identity files, browser profiles, runtime identifiers, logs, `.next` build diagnostics or development dependencies in the publication branch. Only generated browser assets/pages, `.nojekyll` and required license/NOTICE texts.

Before owner approval, preparation reads showed `has_pages=false`, HTTP 404 for the Pages resource and no remote `gh-pages` branch. Those are historical preparation observations. After the owner explicitly approved this candidate, the exact reviewed static tree was committed/pushed normally to `gh-pages`. Current GitHub API observations report Pages `built`, `public=true`, `https_enforced=true`, `build_type=legacy` and source `gh-pages` at `/`. The normal GitHub API was used because the connected repository tool does not expose Pages settings.

## Prepared and checked here

`npm run build:pages` creates a static project-path export in `apps/web/out/`, then preserves original MIT and actual installed/vendor license/NOTICE texts alongside the assets. No network publication is part of the command. Its explicit per-command values preserve the non-indexing defaults.

`npm run check:pages` checks all fifteen authored pages plus the framework 404, all local HTML/CSS resource links, both worker chunks and their webpack public path, `.nojekyll`, license texts and non-indexing metadata. See [the artifact evidence](evidence/pages.json).

Internal links use Next's mount-aware navigation. The base path is a validated build-time input, not runtime routing supplied by imported reports. Future separately approved indexing URLs also preserve the project path; pure synthetic configuration tests do not enable that release mode.

`npm run preview -- --base-path /a11y-workbench` serves the generated site only on loopback under the project prefix. Actual HTTP tests cover routes, refresh/deep links, CSS/JS, redirect, HEAD/POST, missing paths, mount isolation, malformed options, traversal and symlink escapes. The default root build and preview remain supported.

## Remaining acceptance limits

The installed Playwright package is pinned, but its browser executable is absent. The last pinned Chromium download attempt returned `403 Domain forbidden` from `cdn.playwright.dev`; browser/axe E2E, positive nine-state CLI capture, visual screenshots, browser performance/privacy and human assistive-technology checks have not passed. Pages preparation does not resolve this blocker or establish a fully accepted P0.

GitHub Pages serves static files and cannot run the local capture CLI, server endpoints or custom HTTP-header logic. The UI processes reports in browser memory; the CLI remains restricted to trusted explicit HTTP loopback origins. Do not weaken it to scan the public Pages URL. GitHub may log ordinary HTTP requests, including visitor IPs; local report processing is not a claim that hosting has no request logs. Project-path `robots.txt` is not an origin-wide robots policy; page-level `noindex` remains the indexing control for this candidate.

## Verified publication evidence

- Published commit: [`f288edfc43e422b541cfd9b820d0b2f44eef65da`](https://github.com/kostrubin/a11y-workbench/commit/f288edfc43e422b541cfd9b820d0b2f44eef65da), matching the exact reviewed 128-file static tree built from source `be46d5cc78d0c2e1c1d17db55b1e3d1cea1c9da1`.
- [Native Pages workflow `39716613430`](https://github.com/kostrubin/a11y-workbench/actions/runs/39716613430): `status=completed`, `conclusion=success`, head SHA equal to the published commit.
- GitHub Pages resource: `status=built`, `public=true`, `https_enforced=true`, `build_type=legacy`, source branch `gh-pages`, source path `/`.
- Pages deployment `7242897689`: latest status `success`, environment `github-pages`, environment URL matching the published HTTPS site; [deployment job log](https://github.com/kostrubin/a11y-workbench/actions/runs/39716613430/job/119620183449).
- Direct public HTTPS response/body/assets: **BLOCKED from Cloud**. Curl returned exit `56`, reported origin HTTP status `000` and `CONNECT tunnel failed, response 403`; the proxy returned HTTP 403 before any origin body (zero bytes). This is a Cloud outbound restriction, not evidence that the site returned HTTP 403. The remote web reader also could not access the URL. The attempted browser panel opening/rendering was not confirmed. No network/sandbox setting was changed.
- Browser/axe/AT acceptance: **BLOCKED / NOT RUN** as detailed in VERIFICATION.md. No acceptance status was upgraded because publication succeeded.

The owner has already approved this specific public demonstration; no further approval for the same publication is pending. Keep its no-index configuration and zero-additional-spending boundaries. Other release targets, indexing, packages/GitHub Releases and Cloud security changes still require their own authorization. Continue blocked browser acceptance in the same selected workspace after a supported prerequisite remedy; do not weaken network/sandbox controls.

## Official references reviewed

- [GitHub Pages overview and project URL shape](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
- [Pages plan availability](https://github.com/github/docs/blob/main/data/reusables/gated-features/pages.md).
- [Branch publishing and native Pages deployment](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
- [Actions billing, including free Pages standard runner use](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

The owner-approved native Pages demonstration is published. No custom workflow, other deployment target, GitHub Release, package publication, indexing activation, Cloud security-setting change or additional spending was introduced.

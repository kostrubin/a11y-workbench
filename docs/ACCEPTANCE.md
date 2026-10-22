# P0 acceptance and evidence

Status: planned acceptance criteria, not executed results. IDs below are stable. `PRODUCT-SPEC.md` defines scope; `ARCHITECTURE.md` owns formats and limits. The implementation must maintain a results table containing ID, status, actual command/manual procedure, evidence path, and remaining limitation. Allowed statuses: `PASS`, `FAIL`, `NOT RUN`, `BLOCKED`. A document, TODO, screenshot, or claimed test count alone does not prove a working journey.

## 1. Deterministic fixture contract

Use only synthetic public examples. Generate representative axe fixtures from the pinned engine, then preserve minimal sanitized regression fixtures. Keep generation separate from assertions so expected outcomes are independently specified. All fixture exports follow schema version `1.0` and the privacy allowlist.

| Fixture | Required contents and expected purpose |
| --- | --- |
| `baseline-v1` | Compatible capture metadata; `forms.initial` has findings F1/F2 and a `pass` evaluated pair for F5's exact subject/rule; `dialog.open` has F3; `menu.open` has F4 |
| `candidate-v1` | Same comparable identities/configuration/scopes; F1 is still detected, F2 is not detected with a `pass` evaluated pair for its same subject/rule, F5 is newly detected; F3 persists; `menu.open` is absent |
| `candidate-incomplete` | Same as candidate, except the rule/node corresponding to F2 is incomplete or its capture failed |
| `candidate-engine-change` | Candidate with a changed engine version/rules configuration |
| `candidate-namespace-change` | Candidate containing matching-looking records but a different identity namespace |
| `candidate-finding-change` | Comparable candidate with F1's impact or supported check evidence changed, producing `changed` rather than persisting or resolved |
| `manual-unrun` | At least six manual checks, all `not-run`, accompanying a zero-violation automated result |
| `raw-axe-synthetic` | A valid raw axe result with violations, passes, incomplete and inapplicable outcomes; synthetic HTML/URL/text canaries for privacy tests |
| `hostile-import` | Script-like strings, unsafe URLs, prototype-property keys, invalid types, excess depth, duplicate IDs, unknown version, and oversized cases |

F1–F5 denote documented rule/subject pairs with stable fixture identities, not invented axe rule IDs. Select valid rules from the installed engine and record the mapping in fixture documentation. The expected diff is one new, two still detected, one not detected, and one cannot-assess finding. Missing `menu.open` never counts as fixed. Incomplete F2 becomes cannot-assess, not not-detected. Incompatible engine/configuration or namespace makes the relevant comparison unassessable. Include cases where the subject and rule occur separately but no exact evaluated pair exists, and where the rule is inapplicable; neither case can substitute for a recorded pass of that pair.

## 2. Functional end-to-end acceptance

| ID | Journey and observable completion |
| --- | --- |
| E2E-01 | A new visitor opens the synthetic sample without signing in. State, engine, capture scope, automated outcome categories, and outstanding manual work are visible. |
| E2E-02 | Import `raw-axe-synthetic` by file picker and by drop. Both yield identical separate violation/incomplete/pass/inapplicable counts; finding totals agree with reported outcomes. Source content stays inert. Reload clears imported data. |
| E2E-03 | Import `baseline-v1`, then `candidate-v1`. The diff matches the fixture table, filters preserve totals, and selecting a finding reveals its state and comparison rationale. |
| E2E-04 | Compare each incomplete/incompatible fixture. The UI explains why reliable conclusions cannot be drawn and does not display a misleading resolved/improvement total. The finding-change fixture exposes its supported change separately. |
| E2E-05 | With `manual-unrun`, zero automated violations leaves all manual checks `not-run`. A user marks pass/fail/not-applicable with evidence/reason, changes it again, and sees the report identify the result as user-reported. |
| E2E-06 | Export JSON and escaped Markdown after changing manual statuses. Both obey the same allowlist and omit notes, tester context, and sensitive canaries. Only JSON reimports; statuses survive with observation details explicitly absent. No conformance claim appears. |
| E2E-07 | In the corrected form, submit empty/invalid input, discover field errors, correct them using the keyboard, and reach local success. No network submission occurs and entered values survive validation recovery. |
| E2E-08 | Open the corrected modal with the keyboard, inspect initial focus, cycle forward/backward within it, cancel with Escape, reopen, save, and verify focus returns to the opener. Background controls cannot be activated while modal. |
| E2E-09 | Open the corrected action menu with Enter and Space in separate runs, navigate items, activate a command, reopen, and dismiss with Escape. State and focus follow documented behavior. |
| E2E-10 | Switch broken/corrected variants for all three patterns. The lesson shows a reproducible difference and the outside reset/escape controls remain operable. Deliberate failures are clearly separated from app defects. |
| E2E-11 | Run the local capture command against the built app's synthetic fixtures. Its bundled recipe may submit only the local synthetic form and activate local synthetic commands. Nine named states are produced and imported successfully. A controlled missing page/scan failure returns a failure or incomplete capture, never an empty pass. |
| E2E-12 | Clear the workspace after import and manual edits. Results, local notes, and comparison state disappear; the app is usable for a fresh import. No original data reappears after reload. |

Automated assertions may verify DOM focus, names, properties, and event behavior. They must not be described as listening with a screen reader or evaluating a person's experience. The corrected examples must have no unreviewed axe violations in the explicitly tested scope. Intentionally broken fixtures are tested separately and are never excluded from real app scans through broad global suppressions.

## 3. Security and privacy acceptance

| ID | Required evidence |
| --- | --- |
| SEC-01 | Network observation proves imported content, filenames, manual notes, canary URLs, and derived identifiers are not transmitted. Same-origin asset requests are permitted; no analytics, telemetry, remote fonts, or runtime API calls. |
| SEC-02 | Import and render `hostile-import`. No script, HTML, navigation, external-resource load, prototype mutation, or file execution occurs. Unsafe protocols cannot become actionable links. |
| SEC-03 | Before processing, reject oversized files; enforce structural/string/count limits; unknown versions and duplicate identities fail clearly. Last valid workspace survives invalid import. No silent truncation produces a success report. |
| SEC-04 | Every P0 export contains only allowed normalized fields. Assert absence of synthetic sensitive canaries, raw source fields, local identity keys, tester/AT context, and free-text notes. Markdown cannot introduce imported links, HTML, or executable content. |
| SEC-05 | A namespace/key mismatch cannot fabricate identity matches. The UI identifies pseudonymous fingerprints honestly and warns about export contents without claiming anonymity. |
| SEC-06 | Built application and repository contain no real credentials, personal captures, account storage states, source maps exposing secrets, or deployment credentials. Dependency and license findings are recorded, with material issues resolved or raised under owner policy. |

A denied check remains `BLOCKED`. Do not change approval policies, disable checks, access real sensitive data, or broaden network access merely to obtain a pass.

## 4. Accessibility, performance, and SEO gates

| ID | Required evidence |
| --- | --- |
| UX-01 | Keyboard-only traversal completes import, filtering, comparison, manual edits, export, and clear. Focus stays visible and returns predictably after overlays. Error/success announcements are asserted structurally. |
| UX-02 | Inspect screenshots and browser behavior at 390 px and 1280 px widths, with reduced motion and 320 px reflow. Check actual browser zoom at 200% where available; CSS zoom or device pixel ratio is not equivalent evidence, so record actual zoom as `NOT RUN` if unavailable. Core actions remain reachable; no clipped text or inaccessible results controls. |
| UX-03 | Run app-shell and corrected-pattern axe checks plus targeted behavior assertions in the documented browser matrix. Chromium covers all E2E; Firefox/WebKit cover the three corrected patterns and import/export smoke checks when executable. Unavailable engines are `NOT RUN`, not passed. |
| PERF-01 | On a documented environment, run a small report and a near-limit synthetic report three times. Record input size, parse/diff time, peak behavior, and responsiveness. A failed/oversized file cannot crash the tab or permanently block controls. |
| PERF-02 | Target small-report readiness within 1 second and near-limit completion within 5 seconds on the documented reference runner. Report actual measurements and any deviation. Heavy work is chunked/off-thread; controls respond during it. These laboratory targets are not field Core Web Vitals claims. |
| SEO-01 | Static export contains all fifteen exact routes from `DESIGN-SEO.md`, with complete titles, descriptions, primary headings, explanatory text, crawlable internal links, and working examples for three patterns and six guides. Educational text is useful without waiting for application hydration; interactive demonstrations may require JavaScript. |
| SEO-02 | Inspect preview robots/canonical/sitemap output. All default builds remain non-indexable. Public indexing and absolute production URLs require both an approved public HTTPS origin and a separate release flag; `/workbench/` stays non-indexable after release. No placeholder host leaks into a publishable build. |
| SEO-03 | Check internal links, refresh/deep links, not-found behavior, and code/example consistency. No empty mass-generated pages, fake structured-data claims, or ranking guarantees. |

## 5. Human evaluation and readiness

Maintain a separate assistive-technology matrix: pattern/state, browser, OS, AT/version, tester, date, observation, and status. Actual human assessment can include reading field errors, understanding dialog context, discovering a menu, and completing a task. It is not interchangeable with automated keyboard tests or accessibility-tree assertions. If no suitable human/AT session is available, record `NOT RUN` and describe the precise unverified coverage; do not manufacture evidence or ask the owner to perform routine development work.

Readiness has three separate decisions:

1. **Implementation candidate complete:** required P0 journeys and executable gates pass; fixtures, commands, reproducible evidence, documentation, and known limitations exist. Report any blocked browser/environment checks separately; do not quietly waive them or present an unconditional completion claim.
2. **Reviewable release candidate:** security/privacy findings are resolved or concretely presented, manual/AT coverage is explicit, and a scoped beta description accurately reflects tested behavior. Missing human AT coverage prevents claiming that coverage; it is not an excuse to abandon the implemented product.
3. **Website/product release authorized:** the owner explicitly approves the exact candidate, website exposure, configuration, and any budget/security decisions. Reviewed source, documentation, tests and synthetic examples may already be committed and pushed to the public `kostrubin/a11y-workbench` working branch. That source authorization does not permit changing repository visibility, deploying a website or public preview, creating GitHub Releases, releasing packages, activating website indexing or spending more.

The final implementation report must list completed acceptance IDs, failures/not-run checks, exact commands and artifact locations, dependency versions, observed performance, security decisions, remaining human coverage, and the next owner decision. No overall “100% accessible” badge is allowed.

Primary methodological references: [W3C evaluation tools limitations](https://www.w3.org/WAI/test-evaluate/tools/selecting/), [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing), and the pattern-specific W3C sources in `PRODUCT-SPEC.md`.

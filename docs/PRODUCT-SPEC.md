# Product specification — A11y Workbench

Status: implementation contract; application code and static export exist, while browser acceptance remains blocked as recorded in `VERIFICATION.md`. This document defines the full P0; it is not a claim that all requirements have passed. `ACCEPTANCE.md` defines completion evidence and `ARCHITECTURE.md` owns the serialized schema and technical boundaries. Names and branding are provisional. The owner authorizes reviewed source, documentation, tests and synthetic examples in the public `kostrubin/a11y-workbench` repository. The owner separately approved and GitHub verified publication of the prepared in-development Pages candidate at https://kostrubin.github.io/a11y-workbench/; see GITHUB-PAGES.md. Other deployments/previews, GitHub Releases, packages, indexing and additional spending remain unauthorized; browser acceptance is still blocked.

## 1. Purpose and users

Build an open-source web workbench that helps a small product team turn accessibility findings into a reproducible improvement. The useful journey is: understand a failure, inspect a captured interface state, compare a later run, perform the remaining human checks, and export an honest report. Success means the user can explain what was tested and what changed.

The primary users are frontend engineers, QA engineers, and maintainers without a dedicated accessibility team. Secondary users are designers and learners using the interactive examples. P0 is English, usable without an account, paid API, runtime LLM, or hosted processing service. All imported report processing happens in the user's browser. The companion runner executes in the user's own development environment.

The workbench assists evaluation. It must never claim that a green automated result proves WCAG conformance, legal compliance, or usability with every assistive technology. W3C explains that some checks require human judgment; Playwright similarly recommends combining automated checks, manual assessments, and inclusive user testing.[1][2]

## 2. P0 scope

| ID | Required capability | Boundary |
| --- | --- | --- |
| P0-01 | Import a supported raw axe JSON result or the versioned multi-state workbench bundle | Local file picker and drag/drop with an equivalent keyboard control; no upload endpoint |
| P0-02 | Inspect results by workflow state, rule, impact, and outcome | Preserve violations, incomplete results, passes, and inapplicable outcomes as distinct evidence |
| P0-03 | Compare baseline and candidate bundles | Explicit compatibility checks; conservative matching; never infer that a missing state passed |
| P0-04 | Record guided manual checks and export their status | User-reported evidence stays separate from automated results |
| P0-05 | Teach three patterns through broken/corrected interactive examples | Form validation, modal dialog, and a single-level action menu |
| P0-06 | Capture those example states through a local Playwright/axe runner | Executable bundled synthetic fixtures plus adapter documentation for a developer-owned app; no arbitrary-site hosted scanner |
| P0-07 | Export a minimized JSON bundle and readable Markdown report | Same allowlist; escaped text; explicit download; only JSON is re-importable |
| P0-08 | Provide substantive static learning pages and working examples | Human-readable HTML, meaningful internal links, metadata, and deployment-aware indexing controls |

The home page must offer immediate entry into a supplied synthetic report, the pattern lab, and file import. A visitor can complete a useful demonstration without preparing files or running the CLI. Empty, loading, invalid-file, large-file, no-results, and incompatible-comparison states are real product screens.

## 3. Reports, identity, and comparison

Use the canonical `schemaVersion: "1.0"` contract in `ARCHITECTURE.md`. Each captured state has a stable `stateId`, capture metadata, engine/configuration identifiers, scope evidence, and result categories. Display titles derive from the bundled synthetic-state registry or escaped state ID, never arbitrary imported text. Preserve source engine versions and separate `reportedOutcomes` rule/node counts for violations, incomplete, passes, and inapplicable results. Counts describe supplied records, not complete site coverage. Unknown or unsupported data produces an actionable validation message, never a fabricated successful scan.

Raw axe imports are for inspection and normalization. They do not necessarily contain enough configuration, coverage, or stable identity evidence for a trustworthy comparison. Missing evidence must remain unknown. Raw HTML, selectors, page text, accessible names, form values, full source URLs, credentials, and literal node/check messages must not enter the minimized default export. The architecture document specifies the allowlist and local-only handling.

Prefer author-assigned opaque `subjectId` values. For locally derived identities, use the architecture's project-scoped fingerprint mechanism. A shared local namespace is required for comparable identities. Browser identity keys are memory-only in P0 and are never exported. Opt-in browser persistence is P1; the CLI may use an explicitly selected local identity file under the architecture's safeguards. Such identifiers are pseudonymous and must not be described as guaranteed anonymous.

Comparison produces five clearly explained categories; serialized names follow the architecture contract:

- **Newly detected:** a violation appears in an equivalently captured candidate scope and the baseline contains a recorded pass for that exact rule and subject. An added or previously unobserved subject is unassessable.
- **Still detected:** the same comparable finding appears in both captures. An unchanged incomplete finding remains explicitly **Needs review**, not a proven violation or pass.
- **Changed:** a comparable finding remains but its impact or supported check evidence changed; expose the difference without treating it as a resolution. A transition involving an incomplete outcome belongs to **Cannot assess**.
- **Not detected in this run:** a previous violation is absent and the comparable candidate contains a recorded pass for that exact rule and subject. This is not a blanket claim that the accessibility barrier is fixed.
- **Cannot assess:** incompatible configuration, identity namespace, incomplete capture, missing state, changed coverage, or insufficient evidence prevents a reliable conclusion.

Engine/rule configuration changes must be visible. Incompatible captures cannot yield a reassuring improvement total. A missing route, failed scan, excluded node, selector change, or newly incomplete result cannot silently count as a resolution. Aggregate views must distinguish issue rules from affected-node occurrences and expose the selected state/scope.

## 4. Guided manual evaluation

Every check has a stable ID, purpose, steps, expected observable behavior, relevant state, and source link. Canonical statuses are `not-run`, `pass`, `fail`, and `not-applicable`. New checks start as `not-run`. Changing a status is an explicit user action; non-default edits require a local observation or not-applicable reason. Notes remain session-only and are never exported in P0. Reimported minimized statuses remain valid without notes and explicitly say their observation details were not included.

Reports label these results **user-reported manual checks**. Optional tester/browser/assistive-technology details supplied by the user also remain session-only and never enter P0 exports. Never invent them. An automated keyboard assertion, accessibility-tree inspection, or successful axe scan cannot fill in a human screen-reader check. A built-in demonstration may explain an expected outcome while its manual status remains `not-run`.

P0 guides cover keyboard completion and visible focus; understandable labels/errors; dialog announcement and focus return; menu discovery and action announcement; zoom/reflow; and reduced-motion behavior. Report totals show manual checks not yet performed as prominently as recorded passes. Do not express overall accessibility as a single compliance percentage.

## 5. Three executable pattern journeys

### Forms

Use synthetic data only: a display name and email input, a required-field explanation, submission, validation feedback, and local success feedback. The corrected version associates labels and instructions, identifies invalid fields, makes errors discoverable, allows recovery without losing entered values, and exposes submission feedback. Nothing is submitted to a network service. Capture `forms.initial`, `forms.invalid`, and `forms.success`.

The broken version deliberately demonstrates a small, documented set of problems; the corrected version addresses those same problems. The lesson explains both automated findings and human checks. Guidance draws on W3C's validation and notification tutorials rather than claiming one universal implementation.[3]

### Modal dialog

The example opens an “Edit display name” dialog, supports cancel and save, and returns to the opener. Capture `dialog.closed`, `dialog.open`, and `dialog.saved`. The corrected version has an accessible name, appropriate initial focus, modal keyboard containment, Escape/cancel behavior, and focus restoration. Background content is unavailable while the modal is active. Explain why focus placement depends on content.[4]

### Action menu

Use a single-level menu for local demo commands, such as changing a displayed view. Capture `menu.closed`, `menu.open`, and `menu.selected`. The corrected version exposes button/menu state, opens with Enter/Space, supports the documented item-navigation keys, activates a command, and closes/restores focus predictably. Explain that an application action menu has different interaction expectations from ordinary site navigation.[5]

Every pattern has a visible broken/corrected selector, reset control, keyboard instructions, source example, runnable regression example, and limitations. Deliberately broken components must be confined to the labeled example; the surrounding workbench stays usable, with a reliable escape/reset path. No intentional infinite focus trap is acceptable.

## 6. Local capture workflow

The repository includes a Node-based runner using Playwright and axe, with pinned dependencies and a documented command that captures all nine synthetic states into a workbench bundle. It runs against the built local examples without accounts or secrets. Its bundled declarative recipe may submit the synthetic local-only form and activate synthetic dialog/menu commands to reach those states. Document how a developer can integrate the report contract into their own trusted test harness; P0 does not dynamically load or execute user-supplied adapter scripts or general workflow definitions.

The runner must report a failed navigation, timeout, or unsuccessful scan as a failure/incomplete capture, never an empty successful result. It must document source scope and enabled rules. P0 does not crawl websites, request arbitrary credentials, save authenticated storage states, or record real user journeys. Playwright's official accessibility examples establish how scans fit into ordinary browser tests; coverage remains limited to exercised states.[2]

## 7. Experience, privacy, and content

Prioritize an efficient responsive workbench over decorative animation. All core operations must work using a keyboard, at narrow viewport widths, and with reduced motion. Use virtualized or paginated result lists without hiding status from assistive technology. Heavy parsing/comparison must not lock controls; show progress where needed and provide recovery from errors.

P0 limits are 10 MiB per report, 50 states, 10,000 total source node/finding occurrences across all outcome categories, 2,000 manual checks, and nesting depth 64. Reject over-limit input without silently truncating conclusions. Other limits follow `ARCHITECTURE.md`. Processing is session-only; clearing a workspace removes imported material and notes. Do not add analytics, third-party scripts, remote fonts, telemetry, or persistence.

Publishable learning content comprises three pattern pages and the six exact guide routes in `DESIGN-SEO.md`: interpreting axe outcomes, reliable report comparisons, form errors, dialog focus, choosing menus versus disclosures, and keyboard review. Form labels and action-menu key behavior are also taught within their complete pattern pages. Each guide includes an original explanation, a working example or concrete report, reproducible steps, limitations, and primary references. Cross-link relevant tools and examples. No generated city/framework permutations, empty issue pages, invented usage claims, or promised rankings.

The workbench state and imported data are not public content. All builds default to non-indexable behavior. Production canonicals, sitemap hostnames, and indexability require both an explicitly configured approved public HTTPS origin and a separate release/indexability flag. `/workbench/` remains non-indexable even after release; do not invent a live domain.

## 8. P1 and explicit exclusions

P1, only after P0 acceptance: a browser extension; more interaction patterns; expanded framework examples; translation; richer reporter adapters; and optional locally controlled persistence. Richer annotated exports require the owner's privacy-policy approval. These are not blockers for the first candidate.

Excluded from P0: runtime AI, automated remediation/PR submission, remote arbitrary-URL scans, hosted accounts/projects/uploads, paid services, public report sharing, screenshots or DOM archives of customer applications, automatic legal certification, billing, organization management, and public package publication. Third-party scanning and production publication need separate authorized decisions.

## 9. Sources

1. [W3C: selecting accessibility evaluation tools](https://www.w3.org/WAI/test-evaluate/tools/selecting/).
2. [Playwright: accessibility testing](https://playwright.dev/docs/accessibility-testing).
3. [W3C: validating form input](https://www.w3.org/WAI/tutorials/forms/validation/) and [user notifications](https://www.w3.org/WAI/tutorials/forms/notifications/).
4. [W3C APG: modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
5. [W3C APG: menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) and [menu/menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).
6. [axe-core repository and license](https://github.com/dequelabs/axe-core).

Consult the current primary guidance during implementation, record dependency versions, and explain any deliberate deviation. Referencing a standard is not evidence that the product has passed it.

# Research baseline and early validation

## Evidence status

Source review: 20 October 2026, Buenos Aires time. This is primary-document desk research; no interviews, usability studies, competitor execution tests, or keyword-volume measurements were performed. Implementation is authorized. These checks guide development without adding a product-approval gate. Existing budget, security, sensitive-data, and release boundaries apply.

The initial audience is a frontend developer or small team with an accessibility finding who needs to understand its effect, reproduce an interaction, and verify a correction. The selected scope is a browser-local viewer/comparison workflow for axe result JSON plus three working instructional patterns. A saved axe result generated through Playwright is in scope; a general Playwright HTML report, trace archive, arbitrary reporter JSON, and remote page scanning are not implied support.

## Existing tools and the honest opportunity

| Baseline | What primary documentation establishes | Consequence for this project |
| --- | --- | --- |
| WAVE [S1] | Visual evaluation, contextual explanations, browser extensions, and support for human review already exist. WAVE does not certify accessibility from an error-free result. | Visual explanations and “find then understand” are not unique. Do not imply WAVE is only a scanner or lacks guidance. |
| axe-core [S2] | An established open-source engine integrates into automated tests and returns inconclusive findings requiring manual review. | Reuse the engine and its terminology; do not invent a competing standards engine or claim complete detection. |
| Playwright with axe [S3] | Tests can scan specific interaction states and attach complete result JSON. The docs already discuss fingerprints and manual evaluation. | State-aware testing, report export, and stable comparison concepts are not inventions of this project. |
| Pa11y [S7] | The ecosystem includes a CLI, CI tooling, dashboard, and service; the dashboard tracks changes over time. | Free tooling, dashboards, and regression tracking are established capabilities. |
| W3C WAI/APG [S4–S6] | Authoritative behavior descriptions and instructional examples already exist for the chosen patterns. | Add a usable workflow around evidence and tests; do not repackage standards text as original research. |
| Accessibility Insights [S11] | Guided keyboard checks, manual assessment, examples, and correction guidance already exist. | Guided review is not a unique differentiator either. |

**Differentiation hypothesis:** a focused browser workflow can connect an existing finding to a reproducible example, correction, and verification record with less effort. Value depends on execution quality. Local processing, open source, styling, diffs, and examples alone do not establish a market gap.

Do not claim that this project is the first, that competitors cannot perform these tasks, that it replaces professional assessment, or that three corrected patterns ensure WCAG compliance. No search rankings, traffic, adoption, or time savings have been demonstrated.

## Five concrete workflows to prove

| Workflow | User-visible result | Evidence required from implementation |
| --- | --- | --- |
| Import an axe result saved from a Playwright test | Read the rule, affected nodes, available evidence, and incomplete results without uploading the file. | A documented exporter and real supported fixture round-trip; invalid, unsupported, and oversized inputs produce useful errors. |
| Compare the same fixture before and after a bounded change | See the five documented comparison categories with their assumptions visible. | Expected findings match the deterministic fixture change; exact rule/subject evaluation evidence and engine/scope metadata are checked. Missing findings never become a compliance claim. |
| Understand and correct a form error | Observe the broken association, inspect the correction, and follow the test and manual check. | Maintained broken/fixed examples and a test of the expected label/error relationship and submission behavior. |
| Verify a dialog or action-menu interaction | Reproduce the relevant focus/keyboard behavior and understand where an axe scan is insufficient. | Browser tests for the documented keys, state changes, dismissal, and appropriate focus return; manual assistive-technology coverage reported separately. |
| Finish a private review | Clear imported reports and return to the sample without exposing report contents. | The documented clear action removes application-held report state; sample mode contains synthetic data only. |

Use synthetic examples and generated reports. Reviewed synthetic examples and their test expectations may be published with the authorized project source. Do not collect customer reports, contact users, or publish real user findings or personal data. Report snippets must never execute markup or scripts.

The first three pattern cases are deliberately bounded: labelled form fields with associated validation feedback; a modal dialog with appropriate focus behavior; and an action menu button. Ordinary website navigation usually needs disclosure/link semantics instead of application-menu roles [S6]. Forms guidance comes from the WAI forms tutorial rather than an invented “APG forms pattern” [S4].

## Objective early validation

Complete these checks as implementation work and record their results in the delivery report:

1. **Evidence fidelity:** supported fixture imports preserve rule IDs, node counts, engine metadata, and incomplete results. Unsupported formats fail explicitly. Published examples are reproducible from repository commands.
2. **Meaningful comparison:** a controlled code change produces the documented delta; reordering a report does not manufacture regressions. Scope/version uncertainty remains visible. A selector change is not silently treated as proof that an old issue was fixed.
3. **Learning continuity:** every guide has a working route to its relevant example, source, and verification step. All three patterns have an observable broken/fixed distinction and a documented manual-review boundary.
4. **Usable shell:** the five workflows can be completed with keyboard input in the tested browser, with visible focus and no accidental trapping. Expected broken-fixture failures are separated from the workbench's own quality results.
5. **Local boundary and publication readiness:** inspect network behavior during import, comparison, and export; report contents must not be transmitted. Default builds remain non-indexable, and public SEO configuration stays gated on explicit release.

These checks establish technical usefulness, not product-market fit or screen-reader usability. Mark assistive-technology combinations “not tested” unless exercised. Do not fabricate benchmarks or interviews. Later adoption research may measure task completion, confusion, return usage, and qualified organic entrances; it does not block the authorized build.

If a planned differentiator duplicates an existing capability, improve the concrete workflow or describe the overlap honestly. Continue the bounded implementation. Do not expand into remote crawling, enterprise compliance, dozens of patterns, or paid integrations to manufacture novelty.

## Primary source register

Use these stable IDs in content manifests. Verify evolving tool documentation against the pinned implementation versions; retain the difference between normative requirements, instructional guidance, and vendor product claims.

- **S1 — WAVE Help:** <https://wave.webaim.org/help.php>. Contextual evaluation and the limits of automated conclusions.
- **S2 — axe-core repository/documentation:** <https://github.com/dequelabs/axe-core>. Engine capabilities, result categories, rules, and MPL-2.0 license. Review notices when distributing dependencies or modifying their files.
- **S3 — Playwright accessibility testing:** <https://playwright.dev/docs/accessibility-testing>. `@axe-core/playwright`, result attachments, fingerprints, and combined manual/automated evaluation.
- **S4 — WAI Forms Tutorial:** <https://www.w3.org/WAI/tutorials/forms/>. Labels, instructions, grouping, validation, and notifications.
- **S5 — APG modal dialog:** <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>. Focus and modal interaction behavior.
- **S6 — APG menu button and disclosure navigation:** <https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/> and <https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/>. Distinct widget semantics and the limits of instructional examples.
- **S7 — Pa11y:** <https://pa11y.org/>. Existing CLI, CI, dashboard, and service capabilities.
- **S8 — Google spam policies:** <https://developers.google.com/search/docs/essentials/spam-policies>. Scaled-content abuse and search eligibility.
- **S9 — Google noindex guidance:** <https://developers.google.com/search/docs/crawling-indexing/block-indexing>. A crawler must access a page to read its indexing directive.
- **S10 — Google sitemap overview:** <https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview>. Sitemap purpose and discovery limitations.
- **S11 — Accessibility Insights for Web:** <https://accessibilityinsights.io/docs/web/overview/>. Existing guided keyboard and manual assessment workflows.

This source register records research, not permission to reproduce complete third-party documentation, examples, screenshots, trademarks, or proprietary reports. Preserve dependency and content licenses separately from the project's own license.

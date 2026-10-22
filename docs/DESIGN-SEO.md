# Design and SEO specification

## Product direction

Build an accessibility workbench around a clear sequence: **inspect evidence, understand the interaction, try the corrected pattern, verify the change**. “A11y Workbench” is a working title; brand/domain availability is unverified.

This specifies future implementation, not completed validation. See [RESEARCH-BASELINE.md](RESEARCH-BASELINE.md) for evidence and sources.

Use Next.js static export, React, TypeScript, and browser-local report processing. Public articles must have useful HTML before hydration. Do not add a remote scanner, accounts, a backend database, paid APIs, or an LLM dependency to achieve this design.

## Visual system

Use a restrained light theme: warm white canvas (`#FAFAF7`), white panels, dark ink (`#172B35`), muted slate text, and a deep teal primary action (`#006B5E`). Treat these as initial design tokens; verify actual text, control, and focus contrast in the rendered interface. Amber and red indicate review or findings only when paired with text and an icon. Avoid gradients behind reading content, glass effects, oversized marketing banners, fake customer logos, invented adoption statistics, and decorative motion.

Use system sans-serif for prose and system monospace for code; no external fonts. Keep reading measures around 65–75 characters, body text at least 16px, and headings compact. Establish hierarchy through spacing and typography. A second theme is outside initial scope.

Desktop workbench layout: compact navigation, a primary findings list, and a detail panel. The selected item must remain identifiable without color. At narrow widths, use a single-column list followed by an explicit detail view with a “Back to findings” action that restores focus. Keep reading pages simple: title, concise answer, demonstration or evidence, explanation, verification, sources, and related pages. No sticky element may obscure keyboard focus or article anchors.

## Interaction rules

Provide “Try a sample” alongside the native file picker; drag-and-drop is an enhancement. Show a small synthetic sample before asking for a file. Import errors explain the supported format and preserve the previous usable state. Show loading, empty, incompatible, and cleared states deliberately.

Distinguish violations from findings requiring manual review. Count “rules” and “affected nodes” explicitly; never invent a universal accessibility score. Use the five canonical comparison labels from `PRODUCT-SPEC.md`: “Newly detected,” “Still detected,” “Changed,” “Not detected in this run,” and “Cannot assess.” Missing findings do not prove accessibility. Surface differences in engine version, scope, identity, or metadata before interpreting a comparison. A positive comparison conclusion requires the exact rule/subject evaluation evidence specified in `ARCHITECTURE.md`.

Use native controls where practical. Provide a skip link, visible focus, logical tab order, keyboard-operable filters, a labelled detail region, and predictable focus restoration. Announce completed imports and validation errors without repeatedly announcing every filter change. Avoid keyboard shortcuts that conflict with ordinary typing. Respect reduced-motion preferences; transitions must never delay an action.

The three pattern pages cover a form, a modal dialog, and an action menu button. Start with the corrected version. Intentionally broken examples must be explicitly labelled and entered by an intentional action inside an isolated, controlled fixture surface. They must not introduce broken controls into the workbench shell or make a visitor unable to leave. Keep a reliable reset/exit mechanism. Test the shell and corrected fixtures separately, and describe expected failures in broken fixtures rather than hiding unexpected failures through broad exclusions.

## Information architecture: fifteen distinct routes

English is the initial content language. The following is the complete first-release page budget; a route's existence alone does not make it eligible for indexing.

| Route | Unique purpose and required substance |
| --- | --- |
| `/` | Explain the workflow with one real sample, the local-processing boundary, and direct entry points. |
| `/workbench/` | Import, inspect, and compare supported report JSON; include a useful static introduction. |
| `/patterns/forms/` | Complete small form with labels, instructions, field errors, and a submission outcome. |
| `/patterns/dialog/` | Working modal with intentional initial focus, contained navigation, dismissal, and focus return. |
| `/patterns/menu-button/` | Working action menu with appropriate roles, state, and keyboard behavior. |
| `/guides/read-axe-results/` | Interpret rule IDs, impact, nodes, and incomplete results in an actual sample. |
| `/guides/compare-reports/` | Explain comparison identity, scope changes, and the limits of “Not detected in this run.” |
| `/guides/form-errors/` | Diagnose a specific field-error association and explain the correction and test. |
| `/guides/dialog-focus/` | Reproduce and test focus placement and return, including what an automated scan misses. |
| `/guides/menu-or-disclosure/` | Help choose an action menu or ordinary disclosure navigation; avoid inappropriate menu roles. |
| `/guides/keyboard-review/` | A bounded keyboard review procedure with expected observations and recording examples. |
| `/docs/import-format/` | Exact accepted JSON shape, exporter example, supported fields, size limits, and rejection examples. |
| `/privacy/` | Describe actual data flow, memory/storage behavior, exports, and clearing; match implementation. |
| `/limitations/` | Supported formats and browsers, incomplete checks, comparison limits, and untested assistive technologies. |
| `/about/` | Project purpose, authorship, open-source repository/license, sources, and contribution boundaries. |

Guides solve specific problems; pattern pages demonstrate complete interactions. Cross-link without duplicating content. Ordinary navigation uses links, not action-menu semantics [S6].

## Content and source-to-case traceability

Each guide or pattern needs a stable case ID, one concrete user consequence, a minimal reproducible example, the meaningful correction, an executable test where appropriate, a manual check, explicit limitations, and primary-source links. Maintain a machine-readable case manifest connecting the route, case ID, source URLs, fixture IDs, and test IDs. Record the dependency version used to generate example reports. Generate published code examples from maintained fixtures, or verify that they match; do not allow prose, code, and tests to drift independently.

Do not copy W3C example code or documentation without checking the applicable terms and preserving required notices. Prefer original small examples grounded in the cited behavior. APG examples are instructional and do not establish production compatibility across all browser/assistive-technology combinations [S4–S6].

## Release-gated indexing

All builds are non-indexable by default, including ordinary production-mode local builds. Require both an explicitly approved public HTTPS origin and a separate release/indexability setting before emitting indexable metadata. An origin alone must not enable release. Reject malformed origins, credentials, localhost, and placeholder domains; never invent a canonical URL.

Before release, emit `noindex` metadata on every page and omit the public sitemap and canonical URLs. Keep previews private through hosting access controls when available. `noindex` is not a security boundary. For a publicly reachable preview, do not assume `robots.txt` disallow plus `noindex` guarantees removal: a blocked crawler cannot read the tag [S9].

After explicit release, derive canonical URLs and sitemap entries from a reviewed route allowlist. Include only substantive, rendered, validated routes; always keep `/workbench/` non-indexable and exclude it from the sitemap. Also exclude fixture-only URLs, empty pages, duplicate query states, and internal artifacts. Use honest modification dates. Generate unique titles and descriptions from each page's actual purpose. Structured data is optional and must describe visible content without fabricated reviews or ratings.

Imported reports, filenames, selectors, URLs, and HTML snippets must never enter page metadata, route paths, query strings, analytics, or the sitemap. Keep report state local and render untrusted report text as text. Do not offer public report sharing in this scope.

SEO is a discoverability requirement, not a traffic promise. Avoid mass-produced rule permutations or AI filler; Google identifies scaled content created primarily to manipulate rankings as abuse [S8]. A sitemap assists discovery without guaranteeing indexing [S10].

## Design completion evidence

Before calling the interface complete, inspect representative routes at mobile and desktop widths, navigate the main workflows entirely by keyboard, verify focus visibility at zoom, and inspect the exported HTML with JavaScript disabled. Confirm all fifteen routes have distinct substance, every educational case resolves to its sources and tests, and unreleased builds emit no indexable route or invented canonical. Record observations and remaining limitations; do not turn intended targets into claimed results.

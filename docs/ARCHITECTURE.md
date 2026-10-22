# Architecture and report contract

## Purpose and boundaries

This document defines implementation requirements for the standalone `a11y-workbench` repository. P0 is a Next.js static export, React and TypeScript application: an English-language accessibility workbench, interactive forms/dialog/menu examples, bounded report import, manual checklists, and baseline comparison. The repository also includes an optional-to-run Node CLI that captures the bundled synthetic fixtures from an explicitly selected, trusted localhost application using Playwright and axe-core. It is not a hosted scanner.

There are no accounts, application servers, runtime AI calls, API keys, remote scanning, production data, payments, telemetry, or public deployment in P0. The owner has authorized reviewed source, documentation, tests and synthetic examples in the public project repository. Website deployment, public previews, GitHub Releases and package publication require separate owner approval. A static build is a review artifact, not authorization to deploy. Next.js supports generating HTML and static assets with `output: 'export'`; avoid features requiring a server runtime. See [Next.js static export documentation](https://nextjs.org/docs/app/guides/static-exports).

## Components and ownership

Keep one repository and a small dependency graph. The web presentation layer consumes a shared pure TypeScript domain layer containing validators, normalizers, report types, comparison rules, and checklist definitions. The browser import worker and optional CLI use that same layer. Browser-only APIs stay outside it. Do not introduce a database service or a framework for distributed agents.

The exact fifteen-route inventory is defined in `DESIGN-SEO.md`, including `/patterns/menu-button/`. Use trailing-slash URLs consistently. Pattern and guide content is static, source-backed content. The workbench is a client-side island; report content never enters pre-rendered pages, URLs, analytics, metadata, or search indexes. `/workbench/` always receives `noindex`, including after an approved public release. Public examples use synthetic data only.

The import pipeline is: file selected by the user, byte checks, worker parsing, structural validation, normalization, immutable in-memory report, display, optional export. A failed import never replaces the current report. P0 uses session memory only; browser persistence is P1. Future explicit “Save on this device” must persist only normalized records and private identity material, with clear/delete controls. No IndexedDB, localStorage report persistence, or service worker is required in P0.

## Canonical bundle v1.0

Implement an executable schema matching this contract, with `additionalProperties: false` at every canonical object boundary. Build objects by allowlist; do not spread raw input into canonical records. The following notation describes types, not executable input:

```text
ReportBundle
  schemaVersion: "1.0"
  normalizationVersion: "1"
  reportId: UUID
  createdAt: ISO-8601 UTC timestamp
  producer: { name: "a11y-workbench" | "axe-import", version: semver }
  identity: { namespace: UUID, method: "explicit" | "hmac-sha256-v1" }
  states: StateReport[]

StateReport
  stateId: opaque identifier
  patternId: "forms" | "dialog" | "menu" | "unspecified"
  capture:
    status: "complete" | "partial" | "error"
    engine: { name: "axe-core", version: semver }
    rulesetId: opaque identifier | null
    rulesetDigest: 64 lowercase hexadecimal characters | null
    scopeId: opaque identifier | null
    environmentDigest: 64 lowercase hexadecimal characters | null
    completeness: "producer-attested" | "unknown"
    executedRuleIds: identifier[]
    observedSubjectIds: subject identifier[]
    evaluatedPairs: { ruleId: identifier, subjectId: subject identifier,
                      outcome: "pass" | "violation" | "incomplete" }[]
    reasonCodes: bounded enum[]
  findings: Finding[]
  manualChecks: ManualCheck[]
  reportedOutcomes:
    violations: { ruleCount: integer, nodeCount: integer }
    incomplete: { ruleCount: integer, nodeCount: integer }
    passes: { ruleCount: integer, nodeCount: integer }
    inapplicable: { ruleCount: integer, nodeCount: integer }

Finding
  ruleId: identifier
  subjectId: subject identifier
  category: "violation" | "incomplete"
  impact: "minor" | "moderate" | "serious" | "critical" | null
  checks: { any: identifier[], all: identifier[], none: identifier[] }

ManualCheck
  checkId: identifier from the bundled checklist registry
  status: "not-run" | "pass" | "fail" | "not-applicable"
  reportedBy: "user"
```

Identifiers are 1–128 ASCII characters matching `[A-Za-z0-9][A-Za-z0-9._:-]*`; they must be non-sensitive aliases. UUIDs and timestamps receive actual format validation. No filenames, usernames, accessible names, selector strings, URLs, free-text notes, HTML, screenshots, or check messages belong in this schema. Unknown future schema versions are rejected with a supported-version message; do not guess migrations. Treat imported producer and completeness claims as unverified declarations, not authenticated provenance.

Require unique `stateId` values per bundle, unique `checkId` values per state, and at most one finding and one evaluated-pair record per `(ruleId, subjectId)` within a state. Reject duplicate pair/finding records rather than silently changing supplied counts. Sort and deduplicate check-ID arrays. Every evaluated pair must reference an executed rule and observed subject. Violation/incomplete pairs and findings have a one-to-one correspondence with matching category; a `pass` pair cannot also be a finding. Unknown rule IDs may be displayed as escaped identifiers without invented explanations; trusted explanatory text and links come from the bundled registry for the matching engine version. Unknown manual check IDs are rejected. Display titles come from the bundled synthetic-state registry or the escaped state ID, not imported arbitrary text.

Outcome counts describe the records actually supplied, not every element in the application. Counts are nonnegative integers bounded by the import limits; violation/incomplete totals must agree with normalized findings. Preserve passes and inapplicable separately even when their node arrays are omitted or limited. A reported pass count is not an accessibility score or proof of complete coverage.

The finite capture reason-code vocabulary is `capture-error`, `timeout`, `blocked-resource`, `missing-config`, `missing-scope`, `unsupported-context`, `duplicate-subject`, and `truncated-source`. Include relevant codes whenever capture is partial or erroneous. A complete producer-attested capture requires non-null ruleset and scope identifiers plus ruleset/environment digests. Empty findings do not prove a successful capture.

### Evidence and data minimization

Store rule and check IDs, result category, impact, stable state and subject identity, declared execution coverage, configuration fingerprints, and manual statuses. This is enough to navigate an issue category and compare observations without retaining source content. Raw axe results distinguish violations, incomplete results, passes and inapplicable rules; preserve that distinction. Incomplete results remain “needs review.” See the [axe-core API](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md).

Normalize supported raw axe JSON locally. Extract only validated identifiers and metadata; discard `html`, `failureSummary`, messages, check `data`, related-node content, page title, URL, test environment strings and other arbitrary text after normalization. Derive evaluated pairs only from actual pass, violation, or incomplete node records for that exact rule and subject. An inapplicable rule can appear in the executed-rule inventory and retain its separate outcome count, but cannot establish a subject-level pass. Separate lists of executed rules and observed subjects do not imply their Cartesian product was evaluated. Missing scope, omitted result types, truncated nodes, or unknown options cannot be repaired by assuming full coverage. Such imports retain useful findings and side-by-side counts while clearly limiting comparisons.

## Identity and comparison

Prefer stable author-assigned subject IDs in controlled fixtures and CLI integrations, such as `dialog.close-button`; repeated elements require genuinely unique IDs. Preserve `stateId` across runs (`dialog.open`, `forms.invalid`). Labels may change without changing identity. Never derive identity from an accessible name, field value, array position, or URL.

For raw axe imports without explicit IDs, canonicalize the complete nested target-selector array without flattening frame/shadow boundaries. In the import worker compute `h1:` plus HMAC-SHA-256 using a cryptographically random 256-bit workspace key. Preserve selector bytes; normalization must not silently merge different selectors. Use the same workspace namespace and key for a comparison pair. The browser key stays in memory in P0 and is never exported. The optional CLI can reuse a key only through an explicitly selected local identity file excluded from Git. Existing canonical bundles retain their fingerprints when re-imported; independently created namespaces cannot be silently joined.

These IDs are pseudonymous, not anonymous. Explicit IDs can accidentally disclose information, and fingerprints reveal equality within a namespace. A changed selector can change identity even when the human considers the element unchanged. Do not use fuzzy matching or claim a new fingerprint proves a new defect.

Compare per state, not across an entire bundle indiscriminately. A state pair is comparable only when normalization version, identity method/namespace, state ID, engine version, ruleset ID/digest, scope ID, and environment digest agree; both captures must be complete and producer-attested. The environment digest covers the explicitly normalized browser/runtime version, viewport and relevant rendering preferences. The ruleset digest covers enabled rules, options and the exact engine version. Use SHA-256 over UTF-8 canonical JSON: sort object keys and set-like rule arrays, preserve order-sensitive arrays. Neither digest includes DOM content or URLs. The scope ID names a stable capture recipe, not the implementation under test. Missing provenance yields `unassessable`, while still allowing a descriptive side-by-side view.

The issue key is `(namespace, stateId, ruleId, subjectId)`. Its observation signature is category, impact and sorted grouped check IDs. Timestamp, report ID and display order never affect matching.

| Result | Required evidence and meaning |
|---|---|
| `persisting` | Label **Still detected**. Same issue key and signature in comparable runs. An unchanged incomplete finding remains explicitly **Needs review**, not a proven violation or pass. |
| `changed` | Label **Changed**. Same key, different assessed signature; show which safe fields changed. A transition involving `incomplete` instead makes the improvement assessment unassessable. |
| `new` | Label **Newly detected**. Current violation absent before; the baseline contains a `pass` evaluated pair for that exact rule and subject. |
| `not-detected` | Label **Not detected in this run**. Previous violation absent now; the current run contains a `pass` evaluated pair for that exact rule and subject. This is an observation, not a verified fix. |
| `unassessable` | Label **Cannot assess**. Missing state/subject/rule-pair coverage, changed configuration/identity, partial capture, a changed or missing incomplete result, or unsupported source context. Explain the reason. |

There is no automatic `resolved`, accessibility percentage, WCAG compliance verdict, or inferred manual pass. Removing a component or skipping a state cannot improve a score. Manual results remain separate, explicitly user-reported, and `not-run` by default. Imported manual claims are not silently endorsed by the application.

Manual edits may keep a separate in-memory observation, limited to 2,000 characters; non-default statuses require an observation or a not-applicable reason. Optional local tester/browser/assistive-technology descriptions are each limited to 120 characters. These annotations are not part of the canonical bundle and are never exported in P0. Reimported statuses remain valid without excluded notes, but the UI says their observation details were not included. It must not reconstruct evidence or imply that a human review was independently verified.

## Limits and deterministic failures

Apply the same limits in browser and CLI. A report is at most 10 MiB of UTF-8, 50 states, 10,000 total source node occurrences across all result categories, and 2,000 manual checks. A canonical bundle additionally contains at most 10,000 evaluated pairs and at most 10,000 findings across all states; findings are a subset of the evaluated-pair inventory, not additional source occurrences. Maximum JSON depth is 64; any raw string is at most 64 KiB. Canonical identifiers use the stricter cap above. Limit aggregate parsed container entries to 250,000, check IDs to 100 per group and executed rules to 1,000 per state. Process at most two input files concurrently. No archives or compressed formats are accepted.

Reject over-limit input atomically with a specific reason; never truncate silently into a “complete” report. Parsing and traversal run in a cancellable worker with a five-second watchdog and iterative structural validation. The CLI uses bounded reads and the same deterministic validation. Errors contain safe paths and reason codes, not excerpts of imported content. Tests may use configurable shorter watchdogs without changing production caps.

## Required contract tests

Test canonical round trips, stable matching after reorder, changed impact/check sets, state omission, component removal, engine/config changes, duplicate identities, incomplete results and unsupported versions. Test raw axe fixtures with and without coverage information. Explicitly verify that renaming a selector produces an unassessable observation rather than an asserted fix/new defect. An executed rule plus a separately observed subject is insufficient without the exact evaluated pair; inapplicable outcomes never substitute for a pass pair. Golden fixtures and expected reports contain synthetic data only. Security boundary cases are defined in [SECURITY-PRIVACY.md](SECURITY-PRIVACY.md).

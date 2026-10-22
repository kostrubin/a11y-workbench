# Machine-readable preparation contracts

`routes.json` fixes the fifteen authored P0 routes and eligibility only after explicit release. `states.json` fixes the nine synthetic capture states. `manual-checks.json` supplies stable checklist IDs and initial user-reported statuses. `acceptance.json` lists all 26 executable acceptance criteria as NOT RUN; implementation evidence belongs in the verification record.

`schemas/report-bundle.schema.json` implements the structure described in the architecture document. Keep validation offline with the schema bundled locally. JSON Schema cannot enforce all cross-field/aggregate invariants: total counts over states, rule/subject pair coverage, uniqueness by tuple, count agreement, note requirements, source-byte limits and the worker watchdog still require code and tests. Validate date-time, UUID and supported SemVer semantics explicitly when a library treats formats as annotations.

These manifests are a source of truth for implementation, not test results. Do not mark a criterion passed by merely finding its ID. Extend the implementation's case manifest with real source files, primary references, test IDs and generated-fixture evidence. Existing shell scripts are preparation helpers; do not confuse them with working npm app commands.

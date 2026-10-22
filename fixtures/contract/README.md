# Hand-authored contract fixtures

These small JSON bundles are independent examples for schema and comparator tests, not axe output and not evidence that a browser scan happened. Engine and producer versions `0.0.0` / `0.0.1`, digests, dates and identifiers are deliberately synthetic placeholders. The `producer-attested` declaration is part of the simulated input contract, not an authenticated assertion. Do not advertise these files as real capture results.

Use `expected-comparison.json` as the independently specified regression oracle. It must not be regenerated from the comparator implementation just to make a failing test pass. For baseline vs candidate: F1 and F3 persist, F2 has an exact candidate pass, F5 has an exact baseline pass, and F4's entire state is missing so it is unassessable.

The illustration in F5 is only part of the abstract comparator fixture; it does not add a new user-facing interaction pattern. `candidate-finding-change` changes the assessed impact of F1. `manual-unrun` proves that automated pass observations do not fill manual check statuses.

The implementation still MUST generate separate real browser captures from its pinned installed axe engine and maintain them under `fixtures/synthetic/`. Confirm rule IDs against that engine and preserve a source/version/generation record. The shared schema's structural validation does not replace aggregate limits, pair consistency, safe imports, real Playwright execution, or human AT review.

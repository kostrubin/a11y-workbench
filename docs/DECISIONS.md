# Decision log

This log records the preparation decisions and subsequent owner amendments. It is not a claim that the application exists.

| ID | Decision | Reason and consequence |
| --- | --- | --- |
| D01 | Start with an accessibility workbench and three executable patterns | Connect a concrete debugging task to fixes and regression tests; keep the first complete release finite |
| D02 | Static Next.js/React/TypeScript web app with a pure shared core | Crawlable authored content, testable processing, and modest hosting requirements without a server |
| D03 | No runtime AI, accounts, uploads, persistence or analytics in P0 | Keep ongoing spending and sensitive-data handling bounded |
| D04 | Automated findings and manual checks remain separate | Automated absence of a finding is not conformance or a verified fix |
| D05 | Comparison requires per-state compatible evidence and stable identities | Missing coverage, changed rules or removed elements must not manufacture improvement |
| D06 | English first; fifteen authored routes and six useful guides | One maintainable audience/content surface; expansion follows evidence after release |
| D07 | MIT for original project work; preserve dependency licenses | A familiar OSS contribution model without mislicensing third-party material |
| D08 | Superseded by D11: the original private-repository prerequisite is cancelled | Website builds remain non-indexable and website release still needs separate owner approval |
| D09 | No enabled metered CI or paid services during preparation | A free plan or included allowance is not assumed without checking the account |
| D10 | Detailed written contract plus resumable checkpoints | Reduce routine owner involvement; session limits still require honest recovery behavior |
| D11 | Keep `kostrubin/a11y-workbench` public; publish reviewed project source, documentation, tests and synthetic examples through ordinary working-branch commits and pushes | Explicit owner amendment on 2026-10-21. No visibility change, force push or branch-protection bypass. Routine safe source publication needs no further approval |
| D12 | Source publication does not authorize website deployment or release | No public previews, GitHub Releases, package publication, website indexing or additional spending. Keep `SITE_RELEASE_APPROVED=false` and `SITE_PUBLIC_ORIGIN` empty; the dedicated Cloud environment remains `Only me` |
| D13 | Review the exact files and prepared commits before each source push | Publish no secrets, credentials, real reports, personal data or sensitive logs. Use reviewed synthetic data, retain MIT for original work and preserve applicable third-party notices |

The implementing agent should append material tradeoffs and any justified contract correction. Do not rewrite an unresolved decision as approved.

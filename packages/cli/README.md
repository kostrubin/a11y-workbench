# Bundled localhost capture CLI

This optional MIT-licensed development tool captures the project's nine synthetic
form, dialog and action-menu states. It is for an operator-controlled trusted local
application. Playwright request routing is defense in depth, not an operating-system
sandbox for malicious websites.

Build the packages and static site using the root `npm run build`. Start the root
static preview on loopback port 4173, then run:

```bash
mkdir -p local-reports identity-keys
npm run capture -- --origin http://127.0.0.1:4173 --output local-reports/corrected.json --identity-file identity-keys/demo.json
npm run capture -- --origin http://127.0.0.1:4173 --output local-reports/broken.json --identity-file identity-keys/demo.json --variant broken
```

The equivalent compiled command is `node packages/cli/dist/index.js capture` with
the same flags. `capture --help` describes the interface. Parent directories must
already exist. An existing output is refused unless `--overwrite` is explicit;
symlink outputs and symlink parents are refused. Writes are atomic and files are
created with owner-only permissions where the platform supports them.

The `--origin` must be a literal HTTP origin with an explicit port: `127.0.0.1`,
`localhost` (normalized to `127.0.0.1`) or `[::1]`. Paths, query strings, fragments,
credentials, remote hosts and alternate numeric representations are refused.
Only `corrected` and `broken` bundled variants exist. No imported callbacks,
adapters, authentication, stored browser profile, crawling or remote scan is supported.

Every capture uses the installed pinned axe engine and its WCAG 2/2.1 A/AA tag
configuration. Each state is isolated in a fresh ephemeral browser context with
Chromium sandboxing enabled, service workers blocked, no granted permissions and
no inherited proxy selectors. Only GET/HEAD requests on the selected origin are
allowed. All server redirects are blocked before a second hop; cross-origin
resources, other loopback ports, WebSockets, popups and downloads cannot be used
to expand the capture. A blocked resource makes the state incomplete.

Navigation is bounded to 15 seconds, a state to 30 seconds and the entire run to
five minutes. The fixed capture recipes may submit only the bundled synthetic
form and activate its synthetic dialog/menu commands. They never submit arbitrary
forms in an imported application. Each inspected node needs a unique stable
`data-subject-id`; unsupported or ambiguous coverage is an error rather than an
invented identity.

The optional identity file stores only a namespace for these author-provided IDs,
not an unnecessary HMAC secret. Reusing it allows baseline/candidate compatibility
when the other engine/configuration/coverage requirements agree. Without it, each
run has a fresh namespace. Existing identity files are bounded, validated and
required to be owned by the current user with owner-only permissions on POSIX.
Keep them and reports in the root gitignored directories shown above.

Output contains the validated minimized canonical bundle: findings, separate outcome
counts, exact evaluated rule/subject pairs, capture configuration fingerprints and
user-reported manual statuses initially `not-run`. It contains no source HTML,
selectors, text, URLs, credentials, free-text observations, identity keys or screenshots.
The tool does not forward browser console logs or create traces, HARs or videos.
The bundle is limited to 10 MiB and the shared aggregate node/pair/record bounds.

Exit 0 means all nine captures completed, not that there were no findings or that
the application is accessible. Partial captures and failures exit nonzero. If the
browser cannot launch, a writable output receives explicit error states with
unknown coverage, never a zero-findings successful scan. Automated scans do not
perform manual or assistive-technology evaluation, and absence of a finding is not
a verified fix or conformance claim.

These are implementation guarantees to verify with the repository's checks. Actual
environment results and unavailable browser engines belong in `docs/VERIFICATION.md`.

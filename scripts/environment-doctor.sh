#!/usr/bin/env bash
# Read-only tool inspection; --browser additionally launches a local ephemeral browser.
set -euo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd -- "$project_dir"

if (( $# > 1 )) || [[ "${1:-}" != "" && "${1:-}" != "--browser" ]]; then
  printf 'Usage: bash scripts/environment-doctor.sh [--browser]\n' >&2
  exit 2
fi

missing_tool=0
for required_tool in node npm git; do
  if command -v "$required_tool" >/dev/null 2>&1; then
    printf 'AVAILABLE: %s\n' "$required_tool"
  else
    printf 'BLOCKED: missing %s\n' "$required_tool" >&2
    missing_tool=1
  fi
done
if (( missing_tool )); then
  exit 1
fi

printf 'Node: %s\n' "$(node --version)"
printf 'npm: %s\n' "$(npm --version)"
printf 'Git: %s\n' "$(git --version)"
node -e 'if (Number(process.versions.node.split(".")[0]) < 22) { console.error("BLOCKED: choose Node.js 22 or newer."); process.exit(1); }'

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf 'Git checkout: available\n'
else
  printf 'Git checkout: NOT CONFIGURED (expected for an extracted preparation package)\n'
fi

if [[ ! -f package.json ]]; then
  printf 'Application: NOT IMPLEMENTED (preparation seed)\n'
  printf 'Application tests: NOT RUN\n'
  if [[ "${1:-}" == "--browser" ]]; then
    printf 'Browser launch: BLOCKED until pinned project dependencies are installed\n' >&2
    exit 1
  fi
  exit 0
fi

if [[ -f package-lock.json ]]; then
  printf 'npm lockfile: present\n'
else
  printf 'npm lockfile: MISSING\n' >&2
  exit 1
fi

node <<'NODE'
const fs = require('node:fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const required = ['dev', 'build', 'typecheck', 'lint', 'test', 'test:e2e', 'test:a11y', 'check:content', 'check:security', 'check:seo', 'check'];
const missing = required.filter(name => typeof pkg.scripts?.[name] !== 'string' || !pkg.scripts[name].trim());
console.log(`Declared required commands: ${required.length - missing.length}/${required.length}`);
if (missing.length) {
  console.error(`BLOCKED: missing npm scripts: ${missing.join(', ')}`);
  process.exitCode = 1;
}
NODE

if [[ "${1:-}" == "--browser" ]]; then
  node <<'NODE'
(async () => {
  let chromium;
  try {
    ({ chromium } = require('@playwright/test'));
  } catch {
    try { ({ chromium } = require('playwright')); }
    catch { throw new Error('Pinned local Playwright is unavailable. Run the reviewed dependency setup first.'); }
  }
  const browser = await chromium.launch({ headless: true, chromiumSandbox: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><title>A11y Workbench environment check</title><main>Local browser check</main>');
    if (await page.title() !== 'A11y Workbench environment check') throw new Error('Unexpected browser smoke-check result.');
    console.log(`Browser launch: PASS (Chromium ${browser.version()}, local synthetic document only)`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(`Browser launch: BLOCKED (${error.name || 'Error'}). Check the installed browser binary and system dependencies; no application test passed.`);
  process.exitCode = 1;
});
NODE
else
  printf 'Browser launch: NOT RUN (use --browser after dependency setup)\n'
fi

printf 'Application tests: NOT RUN by environment doctor\n'

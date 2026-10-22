#!/usr/bin/env bash
# Idempotent, repository-scoped setup. No deployment, global installs or sudo.
set -euo pipefail
export NEXT_TELEMETRY_DISABLED=1

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd -- "$project_dir"

for required_tool in node npm git; do
  if ! command -v "$required_tool" >/dev/null 2>&1; then
    printf 'SETUP BLOCKED: required command is unavailable: %s\n' "$required_tool" >&2
    exit 1
  fi
done

node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( node_major < 22 )); then
  printf 'SETUP BLOCKED: Node.js 22 or newer is required. Select a compatible LTS runtime in the environment.\n' >&2
  exit 1
fi

printf 'Runtime: Node %s; npm %s\n' "$(node --version)" "$(npm --version)"

if [[ "${A11Y_INSTALL_BROWSERS:-0}" != "0" && "${A11Y_INSTALL_BROWSERS:-0}" != "1" ]]; then
  printf 'SETUP BLOCKED: A11Y_INSTALL_BROWSERS must be 0 or 1.\n' >&2
  exit 1
fi

if [[ ! -f package.json ]]; then
  printf 'SEED READY: application dependencies have not been created yet. No packages or browsers were downloaded.\n'
  printf 'The implementation agent must select compatible stable versions, create the manifests and lockfile, then rerun this script.\n'
  exit 0
fi

if [[ ! -f package-lock.json ]]; then
  printf 'SETUP BLOCKED: package.json exists without package-lock.json. The implementation agent must create and review the npm lockfile first.\n' >&2
  exit 1
fi

npm ci --no-fund --no-audit

if [[ "${A11Y_INSTALL_BROWSERS:-0}" == "1" ]]; then
  if [[ ! -x node_modules/.bin/playwright ]]; then
    printf 'SETUP BLOCKED: pinned local Playwright is not installed. Add it to the reviewed project dependencies first.\n' >&2
    exit 1
  fi
  ./node_modules/.bin/playwright install chromium
else
  printf 'Browser download skipped. Set A11Y_INSTALL_BROWSERS=1 when preparing Chromium for the required tests.\n'
fi

printf 'DEPENDENCY SETUP COMPLETE: application tests have not been run by this script.\n'

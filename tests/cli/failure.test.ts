import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateBundle } from '../../packages/core/src/index.js';

test('missing browser produces nine explicit error captures and a non-success exit', async () => {
  const directory = await realpath(await mkdtemp(join(tmpdir(), 'a11y-cli-launch-failure-')));
  try {
    const output = join(directory, 'failure.json');
    const child = spawnSync(process.execPath, ['packages/cli/dist/index.js', 'capture', '--origin', 'http://127.0.0.1:4173', '--output', output], {
      encoding: 'utf8', timeout: 15_000,
      env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: join(directory, 'absent-pinned-browser') },
    });
    assert.equal(child.status, 1);
    assert.match(child.stdout, /Capture incomplete: 9 synthetic states/, child.stderr || String(child.error));
    const text = await readFile(output, 'utf8');
    const bundle = validateBundle(JSON.parse(text));
    assert.equal(bundle.states.length, 9);
    assert.ok(bundle.states.every(state => state.capture.status === 'error' && state.capture.completeness === 'unknown'));
    assert.ok(bundle.states.every(state => state.capture.reasonCodes.includes('capture-error')));
    assert.ok(bundle.states.every(state => state.manualChecks.every(check => check.status === 'not-run')));
    assert.equal(text.includes('127.0.0.1'), false);
    assert.equal(text.includes(directory), false);
    assert.equal(text.includes('executablePath'), false);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { authoredRoutes } from '../../apps/web/lib/release.js';

test('the loopback static preview serves deep links and rejects writes, missing paths and escaped symlinks', async () => {
  const portProbe = http.createServer();
  await new Promise<void>(done => portProbe.listen(0, '127.0.0.1', done));
  const address = portProbe.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>((done, fail) => portProbe.close(error => error ? fail(error) : done()));
  const temporary = await mkdtemp(join(tmpdir(), 'a11y-preview-synthetic-'));
  const link = resolve('apps/web/out/synthetic-outside-link');
  const child = spawn(process.execPath, ['scripts/preview.mjs', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise<void>((done, fail) => {
      const timer = setTimeout(() => fail(new Error('Static preview readiness timed out.')), 8000);
      child.once('error', error => { clearTimeout(timer); fail(error); });
      child.once('exit', () => { clearTimeout(timer); fail(new Error('Static preview exited before readiness.')); });
      child.stdout.on('data', data => { if (String(data).includes('Local static preview:')) { clearTimeout(timer); done(); } });
    });
    const origin = `http://127.0.0.1:${port}`;
    for (const path of authoredRoutes) {
      for (let visit = 0; visit < 2; visit++) {
        const response = await fetch(origin + path);
        assert.equal(response.status, 200, path);
        assert.match(response.headers.get('content-type') ?? '', /text\/html/);
        assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/);
        assert.match(await response.text(), /<h1(?:\s|>)/);
      }
    }
    assert.equal((await fetch(origin + '/workbench/', { method: 'HEAD' })).status, 200);
    assert.equal((await fetch(origin + '/workbench/', { method: 'POST' })).status, 405);
    assert.equal((await fetch(origin + '/outside-the-route-contract/')).status, 404);
    assert.equal((await fetch(origin + '/%2e%2e/.env')).status, 404);
    await writeFile(join(temporary, 'synthetic-only.txt'), 'SYNTHETIC_PREVIEW_BOUNDARY_CANARY');
    await symlink(join(temporary, 'synthetic-only.txt'), link);
    const escaped = await fetch(origin + '/synthetic-outside-link');
    assert.equal(escaped.status, 404);
    assert.doesNotMatch(await escaped.text(), /SYNTHETIC_PREVIEW_BOUNDARY_CANARY/);
  } finally {
    await rm(link, { force: true });
    await rm(temporary, { recursive: true, force: true });
    if (child.exitCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); }
  }
});

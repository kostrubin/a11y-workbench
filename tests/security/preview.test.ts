import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { authoredRoutes } from '../../apps/web/lib/release.js';

function requestPath(port: number, path: string, method = 'GET'): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((done, fail) => {
    const request = http.request({ hostname: '127.0.0.1', port, path, method }, response => {
      const chunks: Buffer[] = [];
      response.on('data', chunk => chunks.push(Buffer.from(chunk)));
      response.once('error', fail);
      response.once('end', () => done({ status: response.statusCode ?? 0, headers: response.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    request.once('error', fail);
    request.setTimeout(5000, () => request.destroy(new Error('Synthetic preview request timed out.')));
    request.end();
  });
}

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

test('the project-path preview serves its mounted pages and real assets without exposing root paths or traversal', async () => {
  const portProbe = http.createServer();
  await new Promise<void>(done => portProbe.listen(0, '127.0.0.1', done));
  const address = portProbe.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>((done, fail) => portProbe.close(error => error ? fail(error) : done()));
  const basePath = '/a11y-workbench';
  const child = spawn(process.execPath, ['scripts/preview.mjs', '--port', String(port), '--base-path', basePath], { stdio: ['ignore', 'pipe', 'pipe'] });
  const temporary = await mkdtemp(join(tmpdir(), 'a11y-prefixed-preview-synthetic-'));
  const link = resolve('apps/web/out/synthetic-prefixed-outside-link');
  try {
    await new Promise<void>((done, fail) => {
      const timer = setTimeout(() => fail(new Error('Project-path preview readiness timed out.')), 8000);
      child.once('error', error => { clearTimeout(timer); fail(error); });
      child.once('exit', () => { clearTimeout(timer); fail(new Error('Project-path preview exited before readiness.')); });
      child.stdout.on('data', data => { if (String(data).includes('Local static preview:')) { clearTimeout(timer); done(); } });
    });
    const redirect = await requestPath(port, basePath);
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.location, basePath + '/');
    for (const route of authoredRoutes) {
      const response = await requestPath(port, basePath + route);
      assert.equal(response.status, 200, route);
      assert.match(response.headers['content-type'] ?? '', /text\/html/);
      assert.match(String(response.headers['x-robots-tag'] ?? ''), /noindex/);
      assert.match(response.body, /<h1(?:\s|>)/);
    }
    const home = await requestPath(port, basePath + '/');
    // The same mount test covers both the default root build and a project-path
    // build: use the emitted asset suffix instead of guessing a bundle hash.
    const resources = [...home.body.matchAll(/(?:src|href)="([^"]*\/_next\/[^"?#]+\.(?:js|css))(?:\?[^"#]*)?"/g)].map(match => match[1]).filter((path): path is string => path !== undefined);
    for (const extension of ['.js', '.css']) {
      const resource = resources.find(path => path.endsWith(extension));
      assert.ok(resource, `Emitted ${extension} resource exists.`);
      const suffix = resource.slice(resource.indexOf('/_next/'));
      const response = await requestPath(port, basePath + suffix);
      assert.equal(response.status, 200, suffix);
      assert.match(response.headers['content-type'] ?? '', extension === '.js' ? /javascript/ : /text\/css/);
      assert.ok(response.body.length > 100, 'Actual generated asset is served.');
      assert.doesNotMatch(response.body, /<!DOCTYPE html>/i);
      assert.equal((await requestPath(port, suffix)).status, 404, 'Assets are not exposed outside the mount.');
    }
    const head = await requestPath(port, basePath + '/workbench/', 'HEAD');
    assert.equal(head.status, 200);
    assert.equal(head.body, '');
    assert.equal((await requestPath(port, basePath + '/workbench/', 'POST')).status, 405);
    for (const path of [
      '/', '/workbench/', '/a11y-workbench-else/workbench/',
      basePath + '/outside-the-route-contract/', basePath + '/../workbench/',
      basePath + '/%2e%2e/workbench/', basePath + '/%2e/workbench/',
      basePath + '//workbench/', '/' + basePath + '/workbench/',
      basePath + '%2fworkbench/', basePath + '/%5c..%5c.env',
      basePath + '/..\\.env', basePath + '/%00index.html', basePath + '/%'
    ]) {
      assert.equal((await requestPath(port, path)).status, 404, path);
    }
    await writeFile(join(temporary, 'synthetic-only.txt'), 'SYNTHETIC_PREFIXED_PREVIEW_BOUNDARY_CANARY');
    await symlink(join(temporary, 'synthetic-only.txt'), link);
    const escaped = await requestPath(port, basePath + '/synthetic-prefixed-outside-link');
    assert.equal(escaped.status, 404);
    assert.doesNotMatch(escaped.body, /SYNTHETIC_PREFIXED_PREVIEW_BOUNDARY_CANARY/);
  } finally {
    await rm(link, { force: true });
    await rm(temporary, { recursive: true, force: true });
    if (child.exitCode === null) {
      const stopped = once(child, 'exit');
      child.kill('SIGTERM');
      await stopped;
    }
  }
});

test('the preview rejects malformed project-path options before opening a listener', async () => {
  for (const args of [
    ['--base-path'], ['--base-path', 'a11y-workbench'], ['--base-path', '/'],
    ['--base-path', '/a11y-workbench/'], ['--base-path', '/a/../workbench'],
    ['--base-path', '/a//workbench'], ['--base-path', '/a%2fworkbench'],
    ['--base-path', '/a?workbench'], ['--base-path', '/a\\workbench'],
    ['--base-path', '/a', '--base-path', '/b'], ['--unexpected-option', '/a']
  ]) {
    const child = spawn(process.execPath, ['scripts/preview.mjs', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', data => { output += String(data); });
    child.stderr.on('data', data => { output += String(data); });
    const [code] = await once(child, 'exit');
    assert.equal(code, 1, args.join(' '));
    assert.doesNotMatch(output, /Local static preview:/);
    assert.match(output, /Base path must|Use optional --port/);
  }
});

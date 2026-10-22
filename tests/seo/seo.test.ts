import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { authoredRoutes, releaseConfiguration, indexingArtifacts } from '../../apps/web/lib/release.js';
import { validateBasePath } from '../../apps/web/lib/base-path.mjs';

const basePath = validateBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

test('release defaults are non-indexable and require both deliberate configuration inputs', () => {
  assert.deepEqual(releaseConfiguration({}), { approved: false, origin: null, basePath: '' });
  assert.equal(releaseConfiguration({ SITE_PUBLIC_ORIGIN: 'https://review.a11y-lab.org' }).approved, false);
  assert.throws(() => releaseConfiguration({ SITE_RELEASE_APPROVED: 'true' }));
  for (const origin of ['http://prod.org', 'https://localhost', 'https://127.0.0.1', 'https://[::1]', 'https://example.com', 'https://demo.example.com', 'https://a.test', 'https://user:pass@prod.org', 'https://prod.org/a', 'https://prod.org/?a=1', 'https://prod.org/#a', 'https://prod.org:444']) {
    assert.throws(() => releaseConfiguration({ SITE_RELEASE_APPROVED: 'true', SITE_PUBLIC_ORIGIN: origin }), origin);
  }
  const synthetic = indexingArtifacts({ SITE_RELEASE_APPROVED: 'true', SITE_PUBLIC_ORIGIN: 'https://review.a11y-lab.org' });
  assert.ok(synthetic.sitemap && !synthetic.sitemap.includes('/workbench/'));
  assert.equal((synthetic.sitemap.match(/<loc>/g) ?? []).length, 14);
  assert.equal(indexingArtifacts({}).sitemap, null);
});

test('project hosting validates the mount point and preserves it in synthetic indexing URLs', () => {
  assert.equal(validateBasePath(), '');
  assert.equal(validateBasePath('/a11y-workbench'), '/a11y-workbench');
  for (const path of ['/', 'a11y-workbench', '//host', '/a11y-workbench/', '/../outside', '/a%2fb', '/a?b', '/a#b', '/a\\b', '/a.b']) {
    assert.throws(() => validateBasePath(path), path);
  }
  const env = { SITE_RELEASE_APPROVED: 'true', SITE_PUBLIC_ORIGIN: 'https://review.a11y-lab.org', NEXT_PUBLIC_BASE_PATH: '/a11y-workbench' };
  const synthetic = indexingArtifacts(env);
  assert.match(synthetic.sitemap ?? '', /<loc>https:\/\/review\.a11y-lab\.org\/a11y-workbench\/<\/loc>/);
  assert.match(synthetic.robots, /Sitemap: https:\/\/review\.a11y-lab\.org\/a11y-workbench\/sitemap\.xml/);
  assert.doesNotMatch(synthetic.sitemap ?? '', /\/workbench\//);
  assert.equal(indexingArtifacts({ NEXT_PUBLIC_BASE_PATH: '/a11y-workbench' }).sitemap, null);
});

test('the production export contains fifteen distinct complete authored pages and safe default metadata', () => {
  const spec = JSON.parse(readFileSync('spec/routes.json', 'utf8')) as { routes: { path: string }[] };
  assert.deepEqual([...authoredRoutes].sort(), spec.routes.map(r => r.path).sort());
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const route of authoredRoutes) {
    const html = readFileSync(resolve('apps/web/out', '.' + route, 'index.html'), 'utf8');
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title && title.length > 12, route);
    assert.ok(description && description.length > 40, route);
    assert.ok(!titles.has(title), 'unique title: ' + route); titles.add(title);
    assert.ok(!descriptions.has(description), 'unique description: ' + route); descriptions.add(description);
    assert.match(html, /<html lang="en"/);
    assert.match(html, /<h1(?:\s[^>]*)?>[^]*?<\/h1>/);
    assert.match(html, /<meta name="robots" content="[^"]*noindex/);
    assert.doesNotMatch(html, /<link rel="canonical"/);
    assert.ok(html.includes(`href="${basePath}/workbench/"`), 'mounted workbench link: ' + route);
    assert.ok(html.length > 3000, 'real static content: ' + route);
    for (const match of html.matchAll(/href="(\/(?!\/)[^"?#]*)/g)) {
      const mounted = match[1];
      assert.ok(!basePath || mounted?.startsWith(basePath + '/'), `link stays under mount point ${route}: ${mounted}`);
      const target = mounted?.slice(basePath.length);
      if (!target || target.startsWith('/_next/')) continue;
      assert.ok(existsSync(resolve('apps/web/out', '.' + target, target.endsWith('/') ? 'index.html' : '')), `working internal link ${route}: ${target}`);
    }
  }
  assert.equal(existsSync('apps/web/out/sitemap.xml'), false);
  assert.equal(existsSync('apps/web/out/.nojekyll'), true);
  assert.doesNotMatch(readFileSync('apps/web/out/robots.txt', 'utf8'), /Sitemap:/);
});

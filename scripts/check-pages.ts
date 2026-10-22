import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, basename } from 'node:path';
import { authoredRoutes } from '../apps/web/lib/release.js';
import { validateBasePath } from '../apps/web/lib/base-path.mjs';

const root = resolve('apps/web/out');
const basePath = validateBasePath(process.env.NEXT_PUBLIC_BASE_PATH);
assert.equal(basePath, '/a11y-workbench', 'Check the actual GitHub project Pages build.');
assert.ok((await stat(resolve(root, '.nojekyll'))).isFile(), 'Pages must serve the _next directory.');
assert.match(await readFile(resolve(root, 'LICENSE.txt'), 'utf8'), /MIT License/);
assert.match(await readFile(resolve(root, 'THIRD-PARTY-LICENSES.txt'), 'utf8'), /Permission is hereby granted/);
assert.match(await readFile(resolve(root, 'THIRD-PARTY-NOTICES.txt'), 'utf8'), /Third-party dependency notices/);

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    assert.equal(entry.isSymbolicLink(), false, 'No symlinks in the static publication candidate.');
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : Promise.resolve([path]);
  }));
  return nested.flat();
}

const allFiles = await files(root);
const checkedReferences = new Set<string>();
async function checkReference(path: string) {
  assert.ok(path.startsWith(basePath + '/'), 'Static URL escapes the project mount: ' + path);
  const clean = path.slice(basePath.length).split(/[?#]/, 1)[0] ?? '';
  assert.ok(clean.startsWith('/') && !clean.includes('..') && !clean.includes('\\'), 'Unsafe artifact reference.');
  const file = resolve(root, '.' + clean, clean.endsWith('/') ? 'index.html' : '');
  assert.ok((await stat(file)).isFile(), 'Missing referenced static file: ' + path);
  checkedReferences.add(path);
}

for (const route of [...authoredRoutes, '/404.html']) {
  const html = await readFile(resolve(root, '.' + route, route.endsWith('/') ? 'index.html' : ''), 'utf8');
  assert.match(html, /<meta name="robots" content="[^"]*noindex/);
  assert.doesNotMatch(html, /<link rel="canonical"/);
  assert.ok(html.includes(`href="${basePath}/workbench/"`));
  for (const match of html.matchAll(/(?:href|src)="(\/(?!\/)[^"]+)"/g)) {
    await checkReference(match[1] ?? '');
  }
}

for (const file of allFiles.filter(path => path.endsWith('.css'))) {
  const css = await readFile(file, 'utf8');
  for (const match of css.matchAll(/url\(["']?(\/(?!\/)[^"'()\s]+)["']?\)/g)) await checkReference(match[1] ?? '');
}

const workbenchPage = allFiles.find(path => /_next\/static\/chunks\/app\/workbench\/page-[^/]+\.js$/.test(path));
assert.ok(workbenchPage, 'Compiled workbench client entry must exist.');
const workerEntry = await readFile(workbenchPage, 'utf8');
const workerIds = [...workerEntry.matchAll(/new Worker\([^;]{0,160}?\.u\((\d+)\)/g)].map(match => match[1]);
assert.equal(new Set(workerIds).size, 2, 'Both import and comparison workers must be emitted.');
const runtime = allFiles.find(path => /^webpack-[^/]+\.js$/.test(basename(path)));
assert.ok(runtime, 'Webpack asset runtime must exist.');
const runtimeText = await readFile(runtime, 'utf8');
assert.ok(runtimeText.includes(`.p="${basePath}/_next/"`), 'Lazy worker assets need the project public path.');
const workerAssets: string[] = [];
for (const id of workerIds) {
  const worker = allFiles.find(path => new RegExp(`^${id}\\.[a-f0-9]+\\.js$`).test(basename(path)));
  assert.ok(worker, 'Missing lazy worker chunk: ' + id);
  const hash = basename(worker).split('.')[1];
  assert.ok(runtimeText.includes(`${id}:"${hash}"`), 'Worker chunk must match the runtime asset mapping.');
  const mounted = basePath + '/' + relative(root, worker);
  await checkReference(mounted);
  workerAssets.push(mounted);
}

assert.equal(allFiles.some(path => basename(path) === 'sitemap.xml'), false);
assert.doesNotMatch(await readFile(resolve(root, 'robots.txt'), 'utf8'), /Sitemap:/);
console.log(JSON.stringify({
  status: 'PASS_STATIC_ARTIFACT_CHECKS',
  basePath,
  authoredRoutes: authoredRoutes.length,
  framework404: true,
  staticFiles: allFiles.length,
  checkedReferences: checkedReferences.size,
  workerAssets,
  browserExecution: 'BLOCKED; static checks do not establish browser behavior',
  deployment: false,
  indexing: false
}, null, 2));

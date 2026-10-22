import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, rm, symlink, chmod, mkdir, realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  atomicWrite, browserEnvironment, CaptureError, digest,
  identityNamespace, parseLoopbackOrigin, prepareOutput, requestAllowed,
} from '../../packages/cli/src/security.js';
import { parseArguments } from '../../packages/cli/src/options.js';

async function temporary() {
  const directory = await realpath(await mkdtemp(join(tmpdir(), 'a11y-cli-test-')));
  return { directory, cleanup: () => rm(directory, { recursive: true, force: true }) };
}

function errorCode(code: string) {
  return (error: unknown) => error instanceof CaptureError && error.code === code;
}

test('accepts only literal HTTP loopback with an explicit valid port', () => {
  assert.equal(parseLoopbackOrigin('http://localhost:4173/'), 'http://127.0.0.1:4173');
  assert.equal(parseLoopbackOrigin('HTTP://LOCALHOST:4173'), 'http://127.0.0.1:4173');
  assert.equal(parseLoopbackOrigin('http://127.0.0.1:1'), 'http://127.0.0.1:1');
  assert.equal(parseLoopbackOrigin('http://[::1]:65535'), 'http://[::1]:65535');
  for (const origin of [
    'https://localhost:4173', 'http://localhost', 'http://localhost:0', 'http://localhost:65536',
    'http://localhost.example.test:4173', 'http://localhost.:4173', 'http://127.1:4173',
    'http://2130706433:4173', 'http://0x7f000001:4173', 'http://0177.0.0.1:4173',
    'http://127.0.0.2:4173', 'http://[::ffff:127.0.0.1]:4173', 'http://user:secret@localhost:4173',
    'http://localhost:4173/path', 'http://localhost:4173?url=example.test', 'http://localhost:4173/#hash',
    'file:///tmp/index.html', 'http://localhost\\@example.test:4173', ' http://localhost:4173',
    'http://localhost:4173\n', 'http://%6cocalhost:4173',
  ]) assert.throws(() => parseLoopbackOrigin(origin), CaptureError, origin);
});

test('request policy blocks another port/host, non-GET/HEAD and userinfo', () => {
  const origin = 'http://127.0.0.1:4173';
  assert.equal(requestAllowed(`${origin}/patterns/forms/`, 'GET', origin), true);
  assert.equal(requestAllowed(`${origin}/_next/static/app.js`, 'HEAD', origin), true);
  for (const [url, method] of [
    ['http://127.0.0.1:4174/', 'GET'], ['http://localhost:4173/', 'GET'],
    ['https://127.0.0.1:4173/', 'GET'], ['http://example.test:4173/', 'GET'],
    [`${origin}/submit`, 'POST'], [`${origin}/`, 'DELETE'],
    ['http://user:password@127.0.0.1:4173/', 'GET'], ['data:text/plain,hello', 'GET'],
  ]) assert.equal(requestAllowed(url!, method!, origin), false, `${method} ${url}`);
});

test('browser child environment removes proxy selectors without mutating the parent', () => {
  const parent = { PATH: '/safe/bin', HTTPS_PROXY: 'http://proxy.test', http_proxy: 'http://proxy.test', ALL_PROXY: 'http://proxy.test', NO_PROXY: '*', npm_config_proxy: 'http://proxy.test', SYNTHETIC: 'value' };
  const child = browserEnvironment(parent);
  assert.deepEqual(child, { PATH: '/safe/bin', SYNTHETIC: 'value' });
  assert.equal(parent.HTTPS_PROXY, 'http://proxy.test');
});

test('argument parser rejects arbitrary adapters, duplicate flags and identity/output conflict', () => {
  const parsed = parseArguments(['capture', '--origin', 'http://localhost:4173', '--output', 'local-reports/capture.json', '--variant', 'broken', '--identity-file', 'identity-keys/demo.json']);
  assert.notEqual(parsed, 'help');
  if (parsed === 'help') return;
  assert.equal(parsed.origin, 'http://127.0.0.1:4173');
  assert.equal(parsed.variant, 'broken');
  assert.equal(parsed.overwrite, false);
  const prefix = ['capture', '--origin', 'http://localhost:4173', '--output', 'out.json'];
  assert.throws(() => parseArguments([...prefix, '--adapter', 'evil.js']), errorCode('unsupported-argument'));
  assert.throws(() => parseArguments([...prefix, '--variant', 'arbitrary']), errorCode('unsupported-variant'));
  assert.throws(() => parseArguments([...prefix, '--origin', 'http://localhost:4173']), errorCode('duplicate-argument'));
  assert.throws(() => parseArguments([...prefix, '--overwrite', '--overwrite']), errorCode('duplicate-argument'));
  assert.throws(() => parseArguments([...prefix, '--identity-file', 'out.json']), errorCode('output-identity-conflict'));
  assert.throws(() => parseArguments(['capture', '--origin', '--output', 'out.json']), errorCode('missing-argument'));
});

test('atomic output never overwrites without consent and explicit overwrite replaces a regular file', async () => {
  const { directory, cleanup } = await temporary();
  try {
    const output = join(directory, 'report.json');
    await atomicWrite(output, 'original', false);
    await assert.rejects(atomicWrite(output, 'unexpected', false), errorCode('output-exists'));
    assert.equal(await readFile(output, 'utf8'), 'original');
    await atomicWrite(output, 'replacement', true);
    assert.equal(await readFile(output, 'utf8'), 'replacement');
    assert.deepEqual(await readdir(directory), ['report.json']);
  } finally { await cleanup(); }
});

test('concurrent no-overwrite writes allow exactly one complete output and clean temporary files', async () => {
  const { directory, cleanup } = await temporary();
  try {
    const output = join(directory, 'report.json');
    const results = await Promise.allSettled([atomicWrite(output, 'first', false), atomicWrite(output, 'second', false)]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.ok(['first', 'second'].includes(await readFile(output, 'utf8')));
    assert.deepEqual(await readdir(directory), ['report.json']);
  } finally { await cleanup(); }
});

test('symlink outputs and parents are rejected without changing the linked target', async () => {
  const { directory, cleanup } = await temporary();
  try {
    const target = join(directory, 'target.json');
    const output = join(directory, 'link.json');
    await atomicWrite(target, 'preserved', false);
    await symlink(target, output);
    await assert.rejects(atomicWrite(output, 'unexpected', true), errorCode('output-symlink'));
    assert.equal(await readFile(target, 'utf8'), 'preserved');
    await mkdir(join(directory, 'real'));
    await symlink(join(directory, 'real'), join(directory, 'parent'));
    await assert.rejects(prepareOutput(join(directory, 'parent', 'out.json'), false), errorCode('output-parent-symlink'));
    await assert.rejects(prepareOutput(join(directory, 'absent', 'out.json'), false), errorCode('output-parent-unavailable'));
  } finally { await cleanup(); }
});

test('explicit identity namespace is reusable, bounded and permission restricted', async () => {
  const { directory, cleanup } = await temporary();
  try {
    const identity = join(directory, 'identity.json');
    const namespace = await identityNamespace(identity);
    assert.match(namespace, /^[0-9a-f-]{36}$/);
    assert.equal(await identityNamespace(identity), namespace);
    const data = JSON.parse(await readFile(identity, 'utf8')) as Record<string, unknown>;
    assert.deepEqual(Object.keys(data).sort(), ['namespace', 'version']);
    assert.equal('key' in data, false, 'explicit IDs do not need an unnecessary persistent HMAC key');
    if (process.platform !== 'win32') {
      await chmod(identity, 0o644);
      await assert.rejects(identityNamespace(identity), errorCode('identity-permissions'));
      await chmod(identity, 0o600);
    }
    await atomicWrite(identity, JSON.stringify({ ...data, extra: 'not allowed' }), true);
    await assert.rejects(identityNamespace(identity), errorCode('invalid-identity-file'));
    await atomicWrite(identity, 'x'.repeat(4097), true);
    await assert.rejects(identityNamespace(identity), errorCode('invalid-identity-file'));
  } finally { await cleanup(); }
});

test('canonical digests ignore object insertion order and remain sensitive to array order', () => {
  assert.equal(digest({ b: 2, a: { d: 4, c: 3 } }), digest({ a: { c: 3, d: 4 }, b: 2 }));
  assert.notEqual(digest(['a', 'b']), digest(['b', 'a']));
});

test('compiled CLI rejects credential-bearing origins before capture and never echoes them', async () => {
  const { directory, cleanup } = await temporary();
  try {
    const secret = 'synthetic-cli-canary-8c31';
    const output = join(directory, 'not-created.json');
    const child = spawnSync(process.execPath, ['packages/cli/dist/index.js', 'capture', '--origin', `http://demo:${secret}@localhost:4173`, '--output', output], { encoding: 'utf8', timeout: 10_000 });
    assert.equal(child.status, 1);
    assert.match(child.stderr, /invalid-loopback-origin/);
    assert.equal(`${child.stdout}${child.stderr}`.includes(secret), false);
    assert.deepEqual(await readdir(directory), []);
  } finally { await cleanup(); }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import type { Route } from '@playwright/test';
import { guardedRoute } from '../../packages/cli/src/network.js';

test('route guard prevents cross-origin requests and never invokes their transport', async () => {
  let fetches = 0;
  let blocked = 0;
  let aborted = '';
  const route = {
    request: () => ({ url: () => 'http://127.0.0.1:4174/side-effect', method: () => 'GET' }),
    fetch: async () => { fetches++; throw new Error('must not reach transport'); },
    abort: async (code: string) => { aborted = code; },
  } as unknown as Route;
  await guardedRoute(route, 'http://127.0.0.1:4173', () => { blocked++; });
  assert.equal(fetches, 0);
  assert.equal(blocked, 1);
  assert.equal(aborted, 'blockedbyclient');
});

test('one-hop transport blocks a real local redirect before another port is contacted', async () => {
  let targetHits = 0;
  const target = createServer((_req, res) => { targetHits++; res.end('must not be fetched'); });
  target.listen(0, '127.0.0.1');
  await once(target, 'listening');
  const targetAddress = target.address();
  if (!targetAddress || typeof targetAddress === 'string') throw new Error('Missing test address');
  const redirected = `http://127.0.0.1:${targetAddress.port}/blocked`;
  const source = createServer((_req, res) => { res.writeHead(302, { location: redirected }); res.end(); });
  source.listen(0, '127.0.0.1');
  await once(source, 'listening');
  const sourceAddress = source.address();
  if (!sourceAddress || typeof sourceAddress === 'string') throw new Error('Missing test address');
  const origin = `http://127.0.0.1:${sourceAddress.port}`;
  let blocked = 0;
  let fulfilled = false;
  let aborted = false;
  try {
    const route = {
      request: () => ({ url: () => `${origin}/redirect`, method: () => 'GET' }),
      fetch: async (options: { maxRedirects: number }) => {
        assert.equal(options.maxRedirects, 0);
        const response = await fetch(`${origin}/redirect`, { redirect: 'manual' });
        return { status: () => response.status, dispose: async () => undefined };
      },
      fulfill: async () => { fulfilled = true; },
      abort: async () => { aborted = true; },
    } as unknown as Route;
    await guardedRoute(route, origin, () => { blocked++; });
    assert.equal(blocked, 1);
    assert.equal(aborted, true);
    assert.equal(fulfilled, false);
    assert.equal(targetHits, 0, 'redirect target was never contacted');
  } finally {
    await Promise.all([new Promise<void>(resolve => source.close(() => resolve())), new Promise<void>(resolve => target.close(() => resolve()))]);
  }
});

import { expect, test } from '@playwright/test';
import axe from 'axe-core';

test('SEC-01, SEC-02 and SEC-04: raw canaries stay inert, absent from export, logs and requests', async ({ page }) => {
  const requests: string[] = [];
  const consoleText: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('console', (message) => consoleText.push(message.text()));
  await page.goto('/workbench/');
  const canary = 'SYNTHETIC_PRIVATE_CANARY_57';
  const data = {
    testEngine: { name: 'axe-core', version: axe.version },
    timestamp: '2026-01-01T00:00:00.000Z',
    url: `https://privacy-canary.invalid/${canary}`,
    testEnvironment: { userAgent: canary },
    violations: [{ id: 'label', impact: 'serious', helpUrl: `https://privacy-canary.invalid/${canary}`, nodes: [{ target: ['#synthetic-private-selector'], html: `<img src="https://privacy-canary.invalid/${canary}" onerror="globalThis.syntheticExecuted=true"><input value="${canary}">`, failureSummary: canary, any: [{ id: 'label', message: canary, data: { private: canary } }], all: [], none: [] }] }],
    incomplete: [], passes: [], inapplicable: [],
  };
  await page.getByLabel('Current report', { exact: true }).setInputFiles({ name: `${canary}.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  await expect(page.getByTestId('import-status')).toContainText('Current report imported');
  await page.getByRole('button', { name: /label.*open finding details/ }).click();
  await page.getByRole('button', { name: 'Preview minimized export' }).click();
  const exported = await page.getByLabel('Minimized JSON preview', { exact: true }).inputValue();
  for (const forbidden of [canary, 'synthetic-private-selector', 'failureSummary', 'helpUrl', '<img', 'identityKey']) expect(exported).not.toContain(forbidden);
  expect(await page.locator('body').innerText()).not.toContain(canary);
  expect(await page.locator('img[src*="privacy-canary.invalid"]').count()).toBe(0);
  expect(await page.evaluate(() => Object.hasOwn(globalThis, 'syntheticExecuted'))).toBe(false);
  expect(requests.filter((url) => !url.startsWith('http://127.0.0.1:4173/'))).toEqual([]);
  expect(requests.join(' ')).not.toContain(canary);
  expect(consoleText.join(' ')).not.toContain(canary);
  const storage = await page.evaluate(async () => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), caches: await caches.keys(), databases: (await indexedDB.databases()).map((database) => database.name), serviceWorkers: (await navigator.serviceWorker.getRegistrations()).length }));
  expect(storage).toEqual({ local: [], session: [], caches: [], databases: [], serviceWorkers: 0 });
});

test('SEC-03: cancellation and worker watchdog keep the previous report usable', async ({ page }) => {
  await page.goto('/workbench/');
  await page.getByRole('button', { name: 'Try synthetic comparison', exact: true }).click();
  await expect(page.getByTestId('comparison-new')).toHaveText('1');
  // A controlled nonresponding worker is a fault injection for the UI watchdog,
  // not a claimed report parse or real axe capture.
  await page.evaluate(() => {
    class NonrespondingWorker extends EventTarget {
      onmessage = null;
      onerror = null;
      postMessage() { /* deliberately stalled import boundary */ }
      terminate() { /* no background worker exists in this fault injection */ }
    }
    Object.defineProperty(window, 'Worker', { value: NonrespondingWorker, configurable: true });
  });
  await page.getByLabel('Current report', { exact: true }).setInputFiles({ name: 'synthetic-stall.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await page.getByRole('button', { name: 'Cancel current import' }).click();
  await expect(page.getByTestId('import-status')).toContainText('import cancelled');
  await expect(page.getByTestId('comparison-new')).toHaveText('1');
  await page.getByLabel('Current report', { exact: true }).setInputFiles({ name: 'synthetic-stall.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await expect(page.getByRole('alert')).toContainText('five-second limit', { timeout: 7000 });
  await expect(page.getByTestId('comparison-not-detected')).toHaveText('1');
  await page.getByRole('button', { name: 'Try synthetic comparison', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cancel comparison', exact: true })).toBeVisible();
  await expect(page.getByTestId('comparison-new')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancel comparison', exact: true }).click();
  await expect(page.getByText('Comparison cancelled. Both reports were preserved; no verdict is displayed.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry comparison', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A clear workspace' })).toBeVisible();
});

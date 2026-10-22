import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import axe from 'axe-core';

async function fixture(name: string) {
  return readFile(resolve('fixtures/contract', `${name}.json`));
}

async function importCanonical(page: Page, name: string, target = 'Current report') {
  await page.getByLabel(target, { exact: true }).setInputFiles({ name: 'synthetic-report.json', mimeType: 'application/json', buffer: await fixture(name) });
  await expect(page.getByTestId('import-status')).toContainText(`${target === 'Current report' ? 'Current' : 'Baseline'} report imported`);
}

function rawAxe() {
  const node = (target: string) => ({ target: [target], html: '<input value="synthetic-private-value">', any: [], all: [], none: [] });
  return {
    testEngine: { name: 'axe-core', version: axe.version },
    timestamp: '2026-01-01T00:00:00.000Z',
    url: 'https://synthetic-sensitive.invalid/path',
    violations: [{ id: 'label', impact: 'serious', nodes: [node('#synthetic-label')] }],
    incomplete: [{ id: 'color-contrast', impact: 'moderate', nodes: [node('#synthetic-contrast')] }],
    passes: [{ id: 'button-name', nodes: [node('#synthetic-button')] }],
    inapplicable: [{ id: 'image-alt', nodes: [] }],
  };
}

test.beforeEach(async ({ page }) => {
  await page.goto('/workbench/');
  await expect(page.getByRole('heading', { name: 'Your accessibility workbench' })).toBeVisible();
});

test('E2E-01 and E2E-03: useful sample and independent conservative comparison', async ({ page }) => {
  await expect(page.getByText(/Hand-authored synthetic contract sample/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Violations', exact: true })).toBeVisible();
  await expect(page.getByText(/user-reported manual checks not run/)).toBeVisible();
  await page.getByRole('button', { name: 'Try synthetic comparison', exact: true }).click();
  await expect(page.getByTestId('comparison-new')).toHaveText('1');
  await expect(page.getByTestId('comparison-persisting')).toHaveText('2');
  await expect(page.getByTestId('comparison-changed')).toHaveText('0');
  await expect(page.getByTestId('comparison-not-detected')).toHaveText('1');
  await expect(page.getByTestId('comparison-unassessable')).toHaveText('1');
  await page.getByLabel('Comparison', { exact: true }).selectOption('unassessable');
  await page.getByRole('button', { name: /button-name.*menu.trigger/ }).click();
  await expect(page.getByRole('complementary', { name: 'Finding details' })).toContainText('Cannot assess');
  await expect(page.getByRole('complementary', { name: 'Finding details' })).toContainText(/missing|absent/i);
  // Filtering observations must not rewrite the independently specified totals.
  await expect(page.getByTestId('comparison-new')).toHaveText('1');
  await page.getByLabel('State', { exact: true }).selectOption('menu.open');
  await page.getByRole('button', { name: 'Remove baseline', exact: true }).click();
  await expect(page.getByLabel('State', { exact: true })).toHaveValue('all');
  await expect(page.getByLabel('Rule', { exact: true })).toHaveValue('all');
  await expect(page.getByRole('button', { name: /label.*forms.name/ })).toBeVisible();
});

test('E2E-02: picker and drop preserve separate raw axe outcomes', async ({ page }) => {
  const content = JSON.stringify(rawAxe());
  await page.getByLabel('Current report', { exact: true }).setInputFiles({ name: 'synthetic-raw.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  await expect(page.getByTestId('import-status')).toContainText('Current report imported');
  const currentCounts = await page.locator('h3').filter({ hasText: /^(Violations|Needs review|Pass observations|Inapplicable)$/ }).evaluateAll((headings) => headings.map((heading) => heading.parentElement?.textContent));
  expect(currentCounts.join(' ')).toContain('1 rule records');
  await expect(page.getByLabel('Automated outcome', { exact: true })).toBeVisible();
  await page.getByLabel('Automated outcome', { exact: true }).selectOption('incomplete');
  await expect(page.getByRole('button', { name: /color-contrast/ })).toContainText('Needs review');
  await page.getByRole('button', { name: 'Try synthetic sample', exact: true }).click();
  const transfer = await page.evaluateHandle((text) => {
    const data = new DataTransfer();
    data.items.add(new File([text], 'synthetic-raw.json', { type: 'application/json' }));
    return data;
  }, content);
  await page.getByTestId('report-drop-zone').dispatchEvent('drop', { dataTransfer: transfer });
  await transfer.dispose();
  await expect(page.getByTestId('import-status')).toContainText('Current report imported');
  const droppedCounts = await page.locator('h3').filter({ hasText: /^(Violations|Needs review|Pass observations|Inapplicable)$/ }).evaluateAll((headings) => headings.map((heading) => heading.parentElement?.textContent));
  expect(droppedCounts).toEqual(currentCounts);
  await page.reload();
  await expect(page.getByText(/Hand-authored synthetic contract sample/)).toBeVisible();
  await expect(page.getByLabel('State', { exact: true }).locator('option[value="import.current"]')).toHaveCount(0);
});

test('E2E-03 and E2E-04: imported fixtures expose changed and unsupported comparison evidence', async ({ page }) => {
  await importCanonical(page, 'baseline-v1', 'Baseline report');
  await importCanonical(page, 'candidate-v1');
  await expect(page.getByTestId('comparison-not-detected')).toHaveText('1');
  await importCanonical(page, 'candidate-incomplete');
  await expect(page.getByTestId('comparison-not-detected')).toHaveText('0');
  await expect(page.getByTestId('comparison-unassessable')).toHaveText('2');
  await importCanonical(page, 'candidate-finding-change');
  await expect(page.getByTestId('comparison-changed')).toHaveText('1');
  await importCanonical(page, 'candidate-engine-change');
  await expect(page.getByTestId('comparison-new')).toHaveText('0');
  await expect(page.getByTestId('comparison-not-detected')).toHaveText('0');
  await expect(page.getByTestId('comparison-unassessable')).not.toHaveText('0');
  await importCanonical(page, 'candidate-namespace-change');
  await expect(page.getByTestId('comparison-new')).toHaveText('0');
  await expect(page.getByTestId('comparison-not-detected')).toHaveText('0');
});

test('E2E-05, E2E-06 and E2E-12: manual evidence, minimized export, reimport and clear', async ({ page }) => {
  await importCanonical(page, 'manual-unrun');
  await expect(page.getByRole('heading', { name: 'No findings supplied' })).toBeVisible();
  const check = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Complete the interaction by keyboard', exact: true }) });
  await expect(check).toContainText('Saved: Not run');
  await check.getByLabel('Reported status', { exact: true }).selectOption('pass');
  await check.getByRole('button', { name: 'Save manual status' }).click();
  await expect(check.getByRole('alert')).toContainText('Record an observation');
  await expect(check).toContainText('Saved: Not run');
  await check.getByLabel('Local observation or not-applicable reason', { exact: true }).fill('SYNTHETIC_PRIVATE_OBSERVATION: completed keyboard steps.');
  await check.getByRole('button', { name: 'Save manual status' }).click();
  await expect(check).toContainText('Saved: Pass');
  await page.getByText('Optional local tester context (not exported)', { exact: true }).click();
  await page.getByLabel('Tester alias', { exact: true }).fill('SYNTHETIC_PRIVATE_TESTER');
  await page.getByRole('button', { name: 'Preview minimized export' }).click();
  const text = await page.getByLabel('Minimized JSON preview', { exact: true }).inputValue();
  expect(text).not.toContain('SYNTHETIC_PRIVATE_');
  const exported = JSON.parse(text) as { states: { manualChecks: { checkId: string; status: string }[] }[] };
  expect(exported.states[0]?.manualChecks.find((item) => item.checkId === 'keyboard.complete')?.status).toBe('pass');
  expect(exported.states[0]?.manualChecks.find((item) => item.checkId === 'screen-reader.feedback')?.status).toBe('not-run');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON', exact: true }).click();
  expect((await downloadEvent).suggestedFilename()).toBe('a11y-workbench-report.json');
  await page.getByLabel('Current report', { exact: true }).setInputFiles({ name: 'synthetic-export.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.getByTestId('import-status')).toContainText('Current report imported');
  await expect(check).toContainText('Observation details were not included');
  await expect(check.getByLabel('Local observation or not-applicable reason', { exact: true })).toHaveValue('');
  await page.getByLabel('Export format', { exact: true }).selectOption('markdown');
  await page.getByRole('button', { name: 'Preview minimized export' }).click();
  await expect(page.getByLabel('Minimized Markdown preview', { exact: true })).not.toHaveValue(/SYNTHETIC_PRIVATE_/);
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A clear workspace' })).toBeVisible();
  await expect(page.getByLabel('Minimized Markdown preview')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(/Hand-authored synthetic contract sample/)).toBeVisible();
  await expect(page.getByLabel('Tester alias', { exact: true })).toHaveValue('');
});

test('SEC-03: malformed, unsupported, oversized and invalid UTF-8 inputs preserve last valid report', async ({ page }) => {
  await page.getByRole('button', { name: 'Try synthetic comparison', exact: true }).click();
  const rejected = [
    { name: 'malformed.json', buffer: Buffer.from('{"invalid":') },
    { name: 'version.json', buffer: Buffer.from(JSON.stringify({ schemaVersion: '99.0' })) },
    { name: 'unsafe-property.json', buffer: Buffer.from('{"__proto__":{"polluted":true}}') },
    { name: 'utf8.json', buffer: Buffer.from([0xff, 0xfe, 0x80]) },
    { name: 'oversized.json', buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 0x20) },
  ];
  for (const input of rejected) {
    await page.getByLabel('Current report', { exact: true }).setInputFiles({ ...input, mimeType: 'application/json' });
    await expect(page.getByRole('alert')).toContainText('previous workspace was preserved');
    await expect(page.getByTestId('comparison-new')).toHaveText('1');
    await expect(page.getByTestId('comparison-not-detected')).toHaveText('1');
  }
  expect(await page.evaluate(() => Object.hasOwn(Object.prototype, 'polluted'))).toBe(false);
});

test('UX-01: keyboard path reaches filtering, details, manual evidence, export and clear', async ({ page }) => {
  const stateSelect = page.getByLabel('State', { exact: true });
  await stateSelect.focus();
  await expect(stateSelect).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Rule', { exact: true })).toBeFocused();
  await stateSelect.selectOption('all');
  await page.getByLabel('Rule', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Automated outcome', { exact: true })).toBeFocused();
  const finding = page.getByRole('button', { name: /open finding details/ }).first();
  await finding.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Finding details', exact: true })).toBeFocused();
  const observation = page.getByLabel('Local observation or not-applicable reason', { exact: true }).first();
  await observation.focus();
  await page.keyboard.type('Synthetic keyboard-only observation');
  const previewButton = page.getByRole('button', { name: 'Preview minimized export' });
  await previewButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Minimized JSON preview', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'A clear workspace' })).toBeVisible();
});

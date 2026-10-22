import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { authoredRoutes } from '../../apps/web/lib/release.js';

test.describe('static routes and direct navigation', () => {
  for (const route of authoredRoutes) {
    test(`direct ${route} returns useful static HTML and survives refresh`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      const html = await response!.text();
      expect(html).toMatch(/<html lang="en"/);
      expect(html).toMatch(/<h1(?:\s[^>]*)?>/);
      expect(html).toMatch(/<meta name="description" content="[^"]{40,}"/);
      expect(html).toMatch(/<meta name="robots" content="[^"]*noindex/);
      expect(html).not.toMatch(/<link rel="canonical"/);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      const title = await page.title();
      expect(title.length).toBeGreaterThan(12);
      expect((await page.reload())?.status()).toBe(200);
      await expect(page).toHaveTitle(title);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }
});

test('the supplied comparison is a useful workflow without files or an account', async ({ page }) => {
  await page.goto('/workbench/');
  await expect(page.getByRole('heading', { name: 'Your accessibility workbench' })).toBeVisible();
  await expect(page.getByText('Hand-authored synthetic contract sample.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Try synthetic comparison', exact: true }).click();
  for (const [category, count] of [['new', 1], ['persisting', 2], ['changed', 0], ['not-detected', 1], ['unassessable', 1]] as const) {
    await expect(page.getByTestId(`comparison-${category}`)).toHaveText(String(count));
  }
  await page.getByLabel('Comparison', { exact: true }).selectOption('unassessable');
  const findings = page.getByRole('button', { name: /open finding details/ });
  await expect(findings).toHaveCount(1);
  await findings.first().click();
  await expect(page.getByRole('heading', { name: 'Finding details', exact: true })).toBeFocused();
  await expect(page.getByRole('complementary', { name: 'Finding details' })).toContainText('The corresponding state was not captured');
  await page.getByRole('button', { name: 'Clear workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A clear workspace' })).toBeVisible();
});

for (const width of [320, 390, 1280]) {
  test(`reflow and keyboard entry remain usable at ${width}px with reduced motion`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    expect(await skip.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    const sample = page.getByRole('link', { name: 'Explore the sample', exact: false });
    await page.keyboard.press('Tab');
    await expect(sample).toBeFocused();
    await expect(sample).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`home-${width}px.png`), fullPage: true });
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/workbench\/$/);
    await expect(page.getByRole('button', { name: 'Try synthetic sample', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`workbench-${width}px.png`), fullPage: true });
  });
}

test('@a11y the default shell and workbench have no scoped WCAG A/AA axe violations', async ({ page }) => {
  for (const route of ['/', '/workbench/', '/guides/keyboard-review/']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations, route).toEqual([]);
  }
});

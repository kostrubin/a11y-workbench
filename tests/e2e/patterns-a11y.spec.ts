import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoViolations(page: Page) {
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
}

test("@a11y corrected pattern forms has no axe violations in initial, invalid and success states", async ({ page }) => {
  await page.goto("/patterns/forms/");
  await expectNoViolations(page);
  await page.locator("[data-action='forms.submit']").click();
  await expect(page.locator("[data-pattern='forms']")).toHaveAttribute("data-state", "forms.invalid");
  await expectNoViolations(page);
  await page.getByLabel("Display name", { exact: true }).fill("Synthetic Reviewer");
  await page.getByLabel("Email", { exact: true }).fill("reviewer@example.test");
  await page.locator("[data-action='forms.submit']").click();
  await expect(page.locator("[data-pattern='forms']")).toHaveAttribute("data-state", "forms.success");
  await expectNoViolations(page);
});

test("@a11y corrected pattern dialog has no axe violations before, during and after the modal", async ({ page }) => {
  await page.goto("/patterns/dialog/");
  await expectNoViolations(page);
  await page.locator("[data-action='dialog.open']").click();
  await expect(page.getByRole("dialog", { name: "Edit display name" })).toBeVisible();
  await expectNoViolations(page);
  await page.getByLabel("Display name", { exact: true }).fill("Synthetic Editor");
  await page.locator("[data-action='dialog.save']").click();
  await expect(page.locator("[data-pattern='dialog']")).toHaveAttribute("data-state", "dialog.saved");
  await expectNoViolations(page);
});

test("@a11y corrected pattern menu has no axe violations while closed, open and selected", async ({ page }) => {
  await page.goto("/patterns/menu-button/");
  await expectNoViolations(page);
  await page.locator("[data-action='menu.open']").click();
  await expect(page.getByRole("menu")).toBeVisible();
  await expectNoViolations(page);
  await page.getByRole("menuitem", { name: "Compact", exact: true }).click();
  await expect(page.locator("[data-pattern='menu']")).toHaveAttribute("data-state", "menu.selected");
  await expectNoViolations(page);
});

test("@a11y broken forms expose the documented missing-label finding without global axe suppression", async ({ page }) => {
  await page.goto("/patterns/forms/?variant=broken");
  await expect(page.locator("[data-pattern='forms']")).toHaveAttribute("data-variant", "broken");
  const result = await new AxeBuilder({ page }).analyze();
  const missingLabels = result.violations.find((violation) => violation.id === "label");
  expect(missingLabels).toBeDefined();
  expect(missingLabels?.nodes.length).toBe(2);
  expect(result.violations.map((violation) => violation.id)).toEqual(["label"]);
});

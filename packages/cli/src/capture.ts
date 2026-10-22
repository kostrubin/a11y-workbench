import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import axe, { type RunOptions } from 'axe-core';
import {
  validateBundle, exportBundle, newManualChecks,
  type ReportBundle, type StateReport, type Finding, type EvaluatedPair,
} from '@a11y-workbench/core';
import { atomicWrite, browserEnvironment, CaptureError, digest, identityNamespace, parseLoopbackOrigin, prepareOutput } from './security.js';
import { installGuards } from './network.js';
import type { CaptureOptions } from './options.js';

type Pattern = 'forms' | 'dialog' | 'menu';
type Reason = 'capture-error' | 'timeout' | 'blocked-resource' | 'missing-config' | 'missing-scope' | 'unsupported-context' | 'duplicate-subject' | 'truncated-source';

interface Recipe {
  stateId: string;
  patternId: Pattern;
  route: string;
  action: (page: Page) => Promise<void>;
}

export const recipes: readonly Recipe[] = [
  { stateId: 'forms.initial', patternId: 'forms', route: '/patterns/forms/', action: async () => undefined },
  { stateId: 'forms.invalid', patternId: 'forms', route: '/patterns/forms/', action: async page => { await page.locator('[data-action="forms.submit"]').click(); } },
  { stateId: 'forms.success', patternId: 'forms', route: '/patterns/forms/', action: async page => {
    await page.locator('#demo-name').fill('Synthetic Reviewer');
    await page.locator('#demo-email').fill('reviewer@example.test');
    await page.locator('[data-action="forms.submit"]').click();
  } },
  { stateId: 'dialog.closed', patternId: 'dialog', route: '/patterns/dialog/', action: async () => undefined },
  { stateId: 'dialog.open', patternId: 'dialog', route: '/patterns/dialog/', action: async page => { await page.locator('[data-action="dialog.open"]').click(); } },
  { stateId: 'dialog.saved', patternId: 'dialog', route: '/patterns/dialog/', action: async page => {
    await page.locator('[data-action="dialog.open"]').click();
    await page.locator('#dialog-name').fill('Synthetic Reviewer');
    await page.locator('[data-action="dialog.save"]').click();
  } },
  { stateId: 'menu.closed', patternId: 'menu', route: '/patterns/menu-button/', action: async () => undefined },
  { stateId: 'menu.open', patternId: 'menu', route: '/patterns/menu-button/', action: async page => { await page.locator('[data-action="menu.open"]').click(); } },
  { stateId: 'menu.selected', patternId: 'menu', route: '/patterns/menu-button/', action: async page => {
    await page.locator('[data-action="menu.open"]').click();
    await page.locator('[data-action="menu.select"][data-value="compact"]').click();
  } },
];

const scanOptions: RunOptions = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable'],
  reporter: 'v2',
};

const viewport = { width: 1280, height: 900 };

function emptyState(recipe: Recipe, reason: Reason): StateReport {
  return {
    stateId: recipe.stateId,
    patternId: recipe.patternId,
    capture: {
      status: 'error',
      engine: { name: 'axe-core', version: axe.version },
      rulesetId: null,
      rulesetDigest: null,
      scopeId: `bundled.${recipe.patternId}.v1`,
      environmentDigest: null,
      completeness: 'unknown',
      executedRuleIds: [], observedSubjectIds: [], evaluatedPairs: [], reasonCodes: [reason],
    },
    findings: [], manualChecks: newManualChecks(),
    reportedOutcomes: {
      violations: { ruleCount: 0, nodeCount: 0 }, incomplete: { ruleCount: 0, nodeCount: 0 },
      passes: { ruleCount: 0, nodeCount: 0 }, inapplicable: { ruleCount: 0, nodeCount: 0 },
    },
  };
}

async function scanPage(page: Page, pattern: Pattern) {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async ({ pattern, options }) => {
    const surface = document.querySelector(`[data-pattern="${pattern}"]`);
    if (!surface) throw new Error('missing-scope');
    const browserAxe = (window as unknown as { axe: typeof axe }).axe;
    const results = await browserAxe.run(surface, options);
    const subjects = Array.from(surface.querySelectorAll('[data-subject-id]'), element => element.getAttribute('data-subject-id') ?? '');
    if (surface.hasAttribute('data-subject-id')) subjects.push(surface.getAttribute('data-subject-id') ?? '');
    const duplicateSubjects = subjects.length !== new Set(subjects).size;
    let missingSubject = false;
    const groups = (['violations', 'incomplete', 'passes', 'inapplicable'] as const).map(category => ({
      category,
      rules: results[category].map(rule => ({
        ruleId: rule.id,
        impact: rule.impact ?? null,
        nodes: rule.nodes.map(node => {
          // These selectors come only from the installed engine scanning our
          // bundled fixture, never from an imported report or adapter.
          const selector = node.target.length === 1 && typeof node.target[0] === 'string' ? node.target[0] : null;
          const element = selector ? document.querySelector(selector) : null;
          const subjectId = element?.getAttribute('data-subject-id');
          if (!subjectId || !(element === surface || surface.contains(element))) missingSubject = true;
          return {
            subjectId: subjectId ?? '',
            checks: {
              any: [...new Set(node.any.map(check => check.id))].sort(),
              all: [...new Set(node.all.map(check => check.id))].sort(),
              none: [...new Set(node.none.map(check => check.id))].sort(),
            },
          };
        }),
      })),
    }));
    return {
      engineVersion: results.testEngine.version,
      groups, subjects: [...new Set(subjects)].sort(), duplicateSubjects, missingSubject,
      popupBlocked: (window as unknown as { __a11yCapturePopupBlocked?: boolean }).__a11yCapturePopupBlocked === true,
    };
  }, { pattern, options: scanOptions });
}

async function captureState(browser: Browser, recipe: Recipe, options: CaptureOptions): Promise<StateReport> {
  let context: BrowserContext | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let expired = false;
  let blocked = false;
  const operation = async (): Promise<StateReport> => {
    context = await browser.newContext({
      viewport, locale: 'en-US', colorScheme: 'light', reducedMotion: 'reduce',
      serviceWorkers: 'block', permissions: [], acceptDownloads: false, ignoreHTTPSErrors: false,
    });
    if (expired) {
      await context.close();
      throw new CaptureError('timeout');
    }
    const page = await installGuards(context, options.origin, () => { blocked = true; });
    const response = await page.goto(`${options.origin}${recipe.route}?variant=${options.variant}`, { waitUntil: 'load', timeout: 15_000 });
    if (!response?.ok()) throw new CaptureError('capture-error');
    await page.locator(`[data-pattern="${recipe.patternId}"]`).waitFor({ state: 'visible' });
    await page.waitForFunction(({ pattern, variant }) => {
      const surface = document.querySelector(`[data-pattern="${pattern}"]`);
      return surface?.getAttribute('data-variant') === variant;
    }, { pattern: recipe.patternId, variant: options.variant });
    await recipe.action(page);
    await page.waitForFunction(({ pattern, state }) => document.querySelector(`[data-pattern="${pattern}"]`)?.getAttribute('data-state') === state,
      { pattern: recipe.patternId, state: recipe.stateId });
    const scan = await scanPage(page, recipe.patternId);
    if (scan.duplicateSubjects) throw new CaptureError('duplicate-subject');
    if (scan.missingSubject) throw new CaptureError('missing-scope');
    if (scan.engineVersion !== axe.version) throw new CaptureError('missing-config');
    const findings: Finding[] = [];
    const evaluatedPairs: EvaluatedPair[] = [];
    const pairKeys = new Set<string>();
    const executedRules = new Set<string>();
    const reportedOutcomes = {
      violations: { ruleCount: 0, nodeCount: 0 }, incomplete: { ruleCount: 0, nodeCount: 0 },
      passes: { ruleCount: 0, nodeCount: 0 }, inapplicable: { ruleCount: 0, nodeCount: 0 },
    };
    for (const group of scan.groups) {
      reportedOutcomes[group.category] = { ruleCount: group.rules.length, nodeCount: group.rules.reduce((sum, rule) => sum + rule.nodes.length, 0) };
      for (const rule of group.rules) {
        executedRules.add(rule.ruleId);
        if (group.category === 'inapplicable') continue;
        const outcome = group.category === 'passes' ? 'pass' : group.category === 'violations' ? 'violation' : 'incomplete';
        for (const node of rule.nodes) {
          const key = `${rule.ruleId}\0${node.subjectId}`;
          if (pairKeys.has(key)) throw new CaptureError('duplicate-subject');
          pairKeys.add(key);
          evaluatedPairs.push({ ruleId: rule.ruleId, subjectId: node.subjectId, outcome });
          if (outcome !== 'pass') findings.push({ ruleId: rule.ruleId, subjectId: node.subjectId, category: outcome, impact: rule.impact, checks: node.checks });
        }
      }
    }
    if (findings.length > 10_000 || evaluatedPairs.length > 10_000 || Object.values(reportedOutcomes).reduce((sum, count) => sum + count.nodeCount, 0) > 10_000) {
      throw new CaptureError('truncated-source');
    }
    const executedRuleIds = [...executedRules].sort();
    const reasons: Reason[] = blocked || scan.popupBlocked ? ['blocked-resource'] : [];
    return {
      stateId: recipe.stateId, patternId: recipe.patternId,
      capture: {
        status: reasons.length ? 'partial' : 'complete',
        engine: { name: 'axe-core', version: scan.engineVersion }, rulesetId: 'wcag21-aa',
        rulesetDigest: digest({ engine: scan.engineVersion, enabledRuleIds: executedRuleIds, options: scanOptions }),
        scopeId: `bundled.${recipe.patternId}.v1`,
        environmentDigest: digest({ browser: browser.version(), node: process.versions.node, viewport, locale: 'en-US', colorScheme: 'light', reducedMotion: 'reduce' }),
        completeness: 'producer-attested', executedRuleIds, observedSubjectIds: scan.subjects, evaluatedPairs, reasonCodes: reasons,
      },
      findings, manualChecks: newManualChecks(), reportedOutcomes,
    };
  };
  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => { expired = true; reject(new CaptureError('timeout')); }, 30_000); }),
    ]);
  } catch (error) {
    const allowedReasons = ['timeout', 'missing-scope', 'missing-config', 'duplicate-subject', 'truncated-source'] as const;
    const reason: Reason = error instanceof CaptureError && allowedReasons.includes(error.code as typeof allowedReasons[number])
      ? error.code as Reason : blocked ? 'blocked-resource' : 'capture-error';
    return emptyState(recipe, reason);
  } finally {
    if (timeout) clearTimeout(timeout);
    await context?.close().catch(() => undefined);
  }
}

export async function runCapture(options: CaptureOptions): Promise<{ bundle: ReportBundle; complete: boolean }> {
  // Fail output/identity checks before launching a browser or touching a target.
  options = { ...options, origin: parseLoopbackOrigin(options.origin) };
  if (options.variant !== 'corrected' && options.variant !== 'broken') throw new CaptureError('unsupported-variant');
  if (options.identityFile && resolve(options.identityFile) === resolve(options.output)) throw new CaptureError('output-identity-conflict');
  await prepareOutput(options.output, options.overwrite);
  const namespace = await identityNamespace(options.identityFile);
  let browser: Browser | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const states: StateReport[] = [];
  let overallExpired = false;
  try {
    deadline = setTimeout(() => {
      overallExpired = true;
      void browser?.close().catch(() => undefined);
    }, 300_000);
    browser = await chromium.launch({ headless: true, chromiumSandbox: true, timeout: 30_000, env: browserEnvironment(process.env) });
    let totalNodes = 0;
    for (const recipe of recipes) {
      if (overallExpired) { states.push(emptyState(recipe, 'timeout')); continue; }
      const state = await captureState(browser, recipe, options);
      totalNodes += Object.values(state.reportedOutcomes).reduce((sum, count) => sum + count.nodeCount, 0);
      states.push(totalNodes > 10_000 ? emptyState(recipe, 'truncated-source') : state);
    }
  } catch {
    // Missing binaries, OS libraries, sandbox support and navigation failures
    // produce explicit error captures, never an empty successful scan.
    for (const recipe of recipes.slice(states.length)) states.push(emptyState(recipe, overallExpired ? 'timeout' : 'capture-error'));
  } finally {
    if (deadline) clearTimeout(deadline);
    await browser?.close().catch(() => undefined);
  }
  const bundle = exportBundle(validateBundle({
    schemaVersion: '1.0', normalizationVersion: '1', reportId: randomUUID(), createdAt: new Date().toISOString(),
    producer: { name: 'a11y-workbench', version: '0.1.0' }, identity: { namespace, method: 'explicit' }, states,
  }));
  const serialized = `${JSON.stringify(bundle, null, 2)}\n`;
  if (Buffer.byteLength(serialized, 'utf8') > 10 * 1024 * 1024) throw new CaptureError('report-byte-limit');
  await atomicWrite(options.output, serialized, options.overwrite);
  return { bundle, complete: bundle.states.length === recipes.length && bundle.states.every(state => state.capture.status === 'complete') };
}

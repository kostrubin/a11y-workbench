import { performance } from 'node:perf_hooks';
import { mkdir, writeFile } from 'node:fs/promises';
import { createIdentityContext, parseReportText, compareBundles } from '@a11y-workbench/core';

function rawReport(count: number, padding: number) {
  return JSON.stringify({
    testEngine: { name: 'axe-core', version: '4.14.0' },
    violations: [{ id: 'label', impact: 'serious', nodes: Array.from({ length: count }, (_, i) => ({
      target: [`#synthetic-field-${i}`], html: '<input data-synthetic="' + 'x'.repeat(padding) + '">',
      any: [{ id: 'label', data: null }], all: [], none: []
    })) }], incomplete: [], passes: [], inapplicable: []
  });
}

const small = rawReport(12, 30);
let padding = 760;
let near = rawReport(10_000, padding);
while (Buffer.byteLength(near) < 9.5 * 1024 * 1024) near = rawReport(10_000, padding += 10);
if (Buffer.byteLength(near) > 10 * 1024 * 1024) throw new Error('Generated near-limit fixture exceeds production byte cap.');
const rows: Record<string, unknown>[] = [];
for (const [name, text] of [['small', small], ['near-limit', near]] as const) {
  for (let run = 1; run <= 3; run++) {
    const identity = createIdentityContext();
    const before = process.memoryUsage().rss;
    const started = performance.now();
    try {
      const report = await parseReportText(text, identity);
      const normalized = performance.now();
      const comparison = compareBundles(report, report);
      const finished = performance.now();
      rows.push({ name, run, inputBytes: Buffer.byteLength(text), sourceNodes: name === 'small' ? 12 : 10_000,
        parseNormalizeMs: Math.round((normalized - started) * 100) / 100, diffMs: Math.round((finished - normalized) * 100) / 100,
        totalMs: Math.round((finished - started) * 100) / 100, rssBeforeBytes: before, rssAfterBytes: process.memoryUsage().rss,
        comparisonItems: comparison.items.length, status: 'PASS', laboratoryTargetMet: finished - started <= (name === 'small' ? 1000 : 5000) });
    } catch (error) {
      rows.push({ name, run, inputBytes: Buffer.byteLength(text), status: 'FAIL', elapsedMs: Math.round(performance.now() - started),
        reason: error instanceof Error ? error.name + ': ' + error.message : 'Unknown error' });
    }
  }
}
const result = { runtime: { node: process.version, platform: process.platform, arch: process.arch },
  scope: 'Node laboratory normalization/diff timings for synthetic inputs, not browser responsiveness or field Core Web Vitals. RSS is before/after, not a peak-memory measurement.', results: rows };
await mkdir('docs/evidence', { recursive: true });
await writeFile('docs/evidence/performance.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (rows.some(row => row.status !== 'PASS' || !row.laboratoryTargetMet)) process.exitCode = 1;

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  compareBundles, createIdentityContext, DomainError, exportBundle, exportMarkdown, getRuleInfo,
  LIMITS, manualChecks, newManualChecks, normalizeRawAxe, parseReportBytes, parseReportText,
  sampleBundle, sampleCandidate, validateBundle,
} from '../../packages/core/src/index.js';
import type { ReportBundle } from '../../packages/core/src/index.js';

function fixture(name: string): ReportBundle {
  return validateBundle(JSON.parse(readFileSync(new URL(`../../fixtures/contract/${name}.json`, import.meta.url), 'utf8')));
}
const errorCode = (code: string) => (error: unknown) => error instanceof DomainError && error.code === code;
function rawAxe() {
  return {
    testEngine: { name: 'axe-core', version: '4.14.0' },
    url: 'https://do-not-request.invalid/URL_CANARY',
    violations: [{ id: 'label', impact: 'serious', helpUrl: 'https://do-not-request.invalid/RULE_URL', nodes: [
      { target: ['#synthetic-field'], html: '<input value="PRIVATE-CANARY@example.invalid">', failureSummary: 'PASSWORD-CANARY', any: [{ id: 'explicit-label', data: { message: 'TOKEN-CANARY' } }], all: [], none: [] },
    ] }],
    incomplete: [{ id: 'color-contrast', impact: null, nodes: [{ target: ['#synthetic-text'], any: [], all: [], none: [] }] }],
    passes: [{ id: 'button-name', nodes: [{ target: ['#synthetic-button'], any: [], all: [], none: [] }] }],
    inapplicable: [{ id: 'image-alt', nodes: [] }],
  };
}

test('independent canonical fixture oracle classifies each F1–F5 identity', () => {
  const expected = JSON.parse(readFileSync(new URL('../../fixtures/contract/expected-comparison.json', import.meta.url), 'utf8'));
  const result = compareBundles(fixture('baseline-v1'), fixture('candidate-v1'));
  assert.deepEqual(result.counts, expected.counts);
  for (const [name, identity] of Object.entries(expected.identities) as [string, { stateId: string; ruleId: string; subjectId: string }][]) {
    const actual = result.items.find(item => item.stateId === identity.stateId && item.ruleId === identity.ruleId && item.subjectId === identity.subjectId);
    assert.equal(actual?.category, expected.byFixtureKey[name]);
  }
});

test('canonical round trip preserves manual statuses without observations', async () => {
  const bundle = fixture('manual-unrun');
  const first = bundle.states[0]!;
  first.manualChecks[0]!.status = 'pass';
  const roundtrip = await parseReportText(JSON.stringify(exportBundle(bundle)));
  assert.equal(roundtrip.states[0]!.manualChecks[0]!.status, 'pass');
  assert.equal(roundtrip.states[0]!.manualChecks[1]!.status, 'not-run');
  assert.deepEqual(Object.keys(roundtrip.states[0]!.manualChecks[0]!).sort(), ['checkId', 'reportedBy', 'status']);
});

test('reordering observations and changing timestamps does not change matches', () => {
  const candidate = fixture('candidate-v1');
  candidate.states.reverse(); candidate.reportId = crypto.randomUUID(); candidate.createdAt = new Date().toISOString();
  for (const state of candidate.states) { state.findings.reverse(); state.capture.evaluatedPairs.reverse(); }
  assert.deepEqual(compareBundles(fixture('baseline-v1'), candidate).counts, { new: 1, persisting: 2, changed: 0, 'not-detected': 1, unassessable: 1 });
});

test('impact/check evidence changes are a distinct changed category', () => {
  const result = compareBundles(fixture('baseline-v1'), fixture('candidate-finding-change'));
  assert.equal(result.items.find(i => i.subjectId === 'forms.name')?.category, 'changed');
  assert.equal(result.counts.changed, 1);
});

test('incomplete or failed evidence cannot claim an improvement', () => {
  const result = compareBundles(fixture('baseline-v1'), fixture('candidate-incomplete'));
  assert.equal(result.items.find(i => i.subjectId === 'forms.email')?.category, 'unassessable');
  const failed = fixture('candidate-v1'); failed.states[0]!.capture.status = 'error'; failed.states[0]!.capture.reasonCodes = ['capture-error'];
  assert.equal(compareBundles(fixture('baseline-v1'), failed).counts['not-detected'], 0);
});

test('unchanged incomplete observations persist explicitly as needs review', () => {
  const bundle = fixture('candidate-incomplete');
  const result = compareBundles(bundle, structuredClone(bundle));
  const item = result.items.find(i => i.baseline?.category === 'incomplete');
  assert.equal(item?.category, 'persisting'); assert.match(item?.reason ?? '', /review/i);
});

test('engine changes and namespace changes never fabricate matching success', () => {
  const engine = compareBundles(fixture('baseline-v1'), fixture('candidate-engine-change'));
  assert.equal(engine.counts.new + engine.counts['not-detected'] + engine.counts.persisting, 0);
  const identity = compareBundles(fixture('baseline-v1'), fixture('candidate-namespace-change'));
  assert.equal(identity.counts.new + identity.counts['not-detected'] + identity.counts.persisting, 0);
  assert.ok(identity.items.every(item => item.category === 'unassessable'));
});

test('separate rule/subject inventories and inapplicable counts are not a pass pair', () => {
  const candidate = fixture('candidate-v1');
  const state = candidate.states.find(s => s.stateId === 'forms.initial')!;
  state.capture.evaluatedPairs = state.capture.evaluatedPairs.filter(p => p.subjectId !== 'forms.email');
  state.reportedOutcomes.inapplicable = { ruleCount: 1, nodeCount: 1 };
  const result = compareBundles(fixture('baseline-v1'), candidate);
  assert.equal(result.items.find(i => i.subjectId === 'forms.email')?.category, 'unassessable');
});

test('state or subject removal cannot become a fixed finding', () => {
  const candidate = fixture('candidate-v1');
  const state = candidate.states[0]!;
  state.capture.evaluatedPairs = state.capture.evaluatedPairs.filter(p => p.subjectId !== 'forms.email');
  state.capture.observedSubjectIds = state.capture.observedSubjectIds.filter(s => s !== 'forms.email');
  const result = compareBundles(fixture('baseline-v1'), candidate);
  assert.equal(result.items.find(i => i.subjectId === 'forms.email')?.category, 'unassessable');
  assert.equal(result.items.find(i => i.stateId === 'menu.open')?.category, 'unassessable');
});

test('unknown schemas, unknown manual IDs and canonical extra properties fail', () => {
  const bundle = fixture('baseline-v1');
  assert.throws(() => validateBundle({ ...bundle, schemaVersion: '2.0' }), errorCode('unsupported-version'));
  assert.throws(() => validateBundle({ ...bundle, rawHtml: '<script>bad()</script>' }), errorCode('invalid-schema'));
  const manual = fixture('manual-unrun'); manual.states[0]!.manualChecks[0]!.checkId = 'invented.check';
  assert.throws(() => validateBundle(manual), errorCode('invalid-schema'));
});

test('duplicate states, findings and mismatched pair/outcome counts are rejected', () => {
  const duplicate = fixture('baseline-v1'); duplicate.states.push(structuredClone(duplicate.states[0]!));
  assert.throws(() => validateBundle(duplicate), errorCode('duplicate-state'));
  const finding = fixture('baseline-v1'); finding.states[0]!.findings.push(structuredClone(finding.states[0]!.findings[0]!));
  assert.throws(() => validateBundle(finding), errorCode('duplicate-finding'));
  const mismatch = fixture('baseline-v1'); mismatch.states[0]!.reportedOutcomes.violations.nodeCount = 0;
  assert.throws(() => validateBundle(mismatch), errorCode('outcome-count-mismatch'));
});

test('aggregate source-node limits apply across states and all result categories', () => {
  const bundle = fixture('baseline-v1');
  bundle.states[0]!.reportedOutcomes.passes.nodeCount = 6_000;
  bundle.states[1]!.reportedOutcomes.inapplicable.nodeCount = 6_000;
  assert.throws(() => validateBundle(bundle), errorCode('node-limit'));
});

test('raw axe preserves four outcome categories and only exact observed pairs', async () => {
  const bundle = await normalizeRawAxe(rawAxe());
  const state = bundle.states[0]!;
  assert.deepEqual(state.reportedOutcomes, { violations: { ruleCount: 1, nodeCount: 1 }, incomplete: { ruleCount: 1, nodeCount: 1 }, passes: { ruleCount: 1, nodeCount: 1 }, inapplicable: { ruleCount: 1, nodeCount: 0 } });
  assert.equal(state.capture.evaluatedPairs.length, 3);
  assert.equal(state.capture.evaluatedPairs.some(p => p.ruleId === 'image-alt'), false);
  assert.equal(state.capture.completeness, 'unknown');
  assert.equal(compareBundles(bundle, bundle).counts.persisting, 0);
});

test('raw content canaries never enter normalized JSON or Markdown exports', async () => {
  const bundle = await normalizeRawAxe(rawAxe());
  const serialized = JSON.stringify(exportBundle(bundle)) + exportMarkdown(bundle);
  for (const canary of ['PRIVATE-CANARY', 'PASSWORD-CANARY', 'TOKEN-CANARY', 'URL_CANARY', 'RULE_URL', 'synthetic-field', 'failureSummary', 'helpUrl']) assert.equal(serialized.includes(canary), false, canary);
});

test('HMAC identities are stable within a session and change for a separate key', async () => {
  const context = createIdentityContext(); const input = rawAxe();
  const a = await normalizeRawAxe(input, context); const b = await normalizeRawAxe(input, context); const c = await normalizeRawAxe(input, createIdentityContext());
  assert.equal(a.states[0]!.findings[0]!.subjectId, b.states[0]!.findings[0]!.subjectId);
  assert.notEqual(a.states[0]!.findings[0]!.subjectId, c.states[0]!.findings[0]!.subjectId);
  assert.match(a.states[0]!.findings[0]!.subjectId, /^h1:[0-9a-f]{64}$/);
});

test('nested selector boundaries and selector bytes remain identity-significant', async () => {
  const context = createIdentityContext();
  const first = rawAxe(); const second = rawAxe();
  (first.violations[0]!.nodes[0]!.target as unknown) = ['iframe', ['#field']];
  (second.violations[0]!.nodes[0]!.target as unknown) = [['iframe'], '#field'];
  const a = await normalizeRawAxe(first, context); const b = await normalizeRawAxe(second, context);
  assert.notEqual(a.states[0]!.findings[0]!.subjectId, b.states[0]!.findings[0]!.subjectId);
});

test('raw duplicate node identities and absent outcome arrays fail atomically', async () => {
  const duplicate = rawAxe(); duplicate.violations[0]!.nodes.push(structuredClone(duplicate.violations[0]!.nodes[0]!));
  await assert.rejects(normalizeRawAxe(duplicate), errorCode('duplicate-evaluated-pair'));
  const omitted = rawAxe() as Record<string, unknown>; delete omitted.passes;
  await assert.rejects(normalizeRawAxe(omitted), errorCode('unsupported-shape'));
});

test('global poison keys in discarded metadata are rejected without prototype effects', async () => {
  for (const name of ['__proto__', 'prototype', 'constructor']) {
    const raw = JSON.stringify(rawAxe()).replace('"testEngine":', `"discarded":{"${name}":{"polluted":true}},"testEngine":`);
    await assert.rejects(parseReportText(raw), errorCode('unsafe-property'));
  }
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
});

test('malformed UTF-8, JSON and executable objects produce bounded safe errors', async () => {
  await assert.rejects(parseReportBytes(Uint8Array.from([0xc3])), errorCode('invalid-utf8'));
  await assert.rejects(parseReportText('{"SECRET-CONTENT":'), errorCode('invalid-json'));
  const object = Object.create(null) as Record<string, unknown>;
  Object.defineProperty(object, 'payload', { enumerable: true, get() { throw new Error('getter must never run'); } });
  assert.throws(() => validateBundle(object), errorCode('invalid-structure'));
});

test('byte, string, depth and container-entry caps include discarded source fields', async () => {
  await assert.rejects(parseReportText(' '.repeat(LIMITS.bytes + 1)), errorCode('file-size'));
  await assert.rejects(normalizeRawAxe({ ...rawAxe(), ignored: 'a'.repeat(LIMITS.stringBytes + 1) }), errorCode('string-limit'));
  let nested: unknown = null; for (let i = 0; i < 65; i += 1) nested = { x: nested };
  await assert.rejects(normalizeRawAxe({ ...rawAxe(), ignored: nested }), errorCode('depth-limit'));
  await assert.rejects(normalizeRawAxe({ ...rawAxe(), ignored: Array.from({ length: LIMITS.entries + 1 }, () => 0) }), errorCode('entry-limit'));
});

test('raw source-node cap rejects 10,001 occurrences rather than truncating', async () => {
  const raw = { testEngine: { name: 'axe-core', version: '4.14.0' }, violations: [], incomplete: [], inapplicable: [], passes: [{ id: 'label', nodes: Array.from({ length: 10_001 }, (_, i) => ({ subjectId: `synthetic.${i}` })) }] };
  await assert.rejects(normalizeRawAxe(raw), errorCode('node-limit'));
});

test('cancellation and watchdog termination have explicit error codes', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(parseReportText('{}', undefined, { signal: controller.signal }), errorCode('cancelled'));
  await assert.rejects(parseReportText('{}', undefined, { maxProcessingMs: 0 }), errorCode('timeout'));
});

test('allowlisted export omits UI annotations while canonical reimport rejects extras', () => {
  const bundle = fixture('manual-unrun') as ReportBundle & { notes?: string; identityKey?: string };
  bundle.notes = 'LOCAL-NOTE-CANARY'; bundle.identityKey = 'LOCAL-KEY-CANARY';
  Object.assign(bundle.states[0]!.manualChecks[0]!, { tester: 'LOCAL-TESTER-CANARY', observation: 'LOCAL-OBSERVATION-CANARY' });
  const exported = JSON.stringify(exportBundle(bundle));
  assert.equal(exported.includes('CANARY'), false);
  assert.throws(() => validateBundle(bundle), errorCode('invalid-schema'));
});

test('Markdown escapes safe alias punctuation and contains no imported links', () => {
  const bundle = fixture('baseline-v1');
  bundle.states[0]!.findings[0]!.subjectId = 'subject.with_underscores';
  bundle.states[0]!.capture.observedSubjectIds[0] = 'subject.with_underscores';
  // Update the corresponding actual pair, preserving the independent other records.
  bundle.states[0]!.capture.evaluatedPairs.find(p => p.subjectId === 'forms.name')!.subjectId = 'subject.with_underscores';
  bundle.states[0]!.capture.observedSubjectIds = [...new Set([...bundle.states[0]!.capture.observedSubjectIds, 'forms.email', 'forms.illustration'])];
  const markdown = exportMarkdown(bundle);
  assert.match(markdown, /subject\\\.with\\_underscores/);
  assert.equal(markdown.includes(']('), false);
});

test('bundled sample/manual checks are explicitly synthetic, independent and unrun', () => {
  assert.equal(sampleBundle.states[0]!.capture.engine.version, '0.0.0');
  assert.equal(sampleCandidate.states[0]!.capture.engine.version, '0.0.0');
  assert.equal(manualChecks.length, 8);
  assert.ok(newManualChecks().every(check => check.status === 'not-run' && check.reportedBy === 'user'));
  assert.ok(sampleBundle.states.every(state => state.manualChecks.every(check => check.status === 'not-run')));
  assert.equal(getRuleInfo('label', '4.14.0')?.guide, '/guides/form-errors/');
  assert.equal(getRuleInfo('unknown-rule', '4.14.0'), undefined);
  assert.equal(getRuleInfo('label', '9.0.0'), undefined);
});

test('Markdown preserves safe check identifiers and capture configuration evidence', () => {
  const bundle = fixture('baseline-v1');
  bundle.states[0]!.findings[0]!.checks.any = ['synthetic-check'];
  const markdown = exportMarkdown(bundle);
  assert.ok(markdown.includes('synthetic\\-check'));
  assert.ok(markdown.includes(bundle.states[0]!.capture.rulesetDigest!));
  assert.ok(markdown.includes(bundle.states[0]!.capture.environmentDigest!));
  assert.match(markdown, /Exact evaluated pairs/);
  assert.match(markdown, /forms\\\.email/);
});

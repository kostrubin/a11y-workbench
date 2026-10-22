import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { bundleSchema } from './schema.js';
import { checkTextSize, DomainError, inspectStructure, LIMITS, requireCondition } from './limits.js';
import type { Finding, ReportBundle, StateReport } from './types.js';

const ajv = new Ajv2020({ allErrors: false, strict: true, validateFormats: true });
// ajv-formats publishes CommonJS plus a default export. Support both the Node
// ESM view and the web bundler's interop view without changing validation rules.
const installFormats = typeof addFormats === 'function' ? addFormats : addFormats.default;
installFormats(ajv);
const isBundle = ajv.compile<ReportBundle>(bundleSchema);
export const pairKey = (rule: string, subject: string): string => JSON.stringify([rule, subject]);
const unique = (values: string[]) => new Set(values).size === values.length;

function validateState(state: StateReport, index: number): void {
  const path = `$.states[${index}]`;
  const capture = state.capture;
  requireCondition(unique(capture.executedRuleIds) && unique(capture.observedSubjectIds), 'duplicate-identity', 'A coverage identifier appears more than once.', path);
  requireCondition(unique(state.manualChecks.map(c => c.checkId)), 'duplicate-manual-check', 'A manual check appears more than once in a state.', path);
  const executed = new Set(capture.executedRuleIds);
  const observed = new Set(capture.observedSubjectIds);
  const pairs = new Map<string, string>();
  for (const pair of capture.evaluatedPairs) {
    const key = pairKey(pair.ruleId, pair.subjectId);
    requireCondition(!pairs.has(key), 'duplicate-evaluated-pair', 'An evaluated pair appears more than once.', path);
    requireCondition(executed.has(pair.ruleId) && observed.has(pair.subjectId), 'invalid-coverage', 'Each evaluated pair must refer to an executed rule and an observed subject.', path);
    pairs.set(key, pair.outcome);
  }
  const findings = new Map<string, Finding>();
  for (const finding of state.findings) {
    const key = pairKey(finding.ruleId, finding.subjectId);
    requireCondition(!findings.has(key), 'duplicate-finding', 'A finding appears more than once in a state.', path);
    requireCondition(pairs.get(key) === finding.category, 'finding-coverage-mismatch', 'A finding needs a corresponding evaluated pair with the same outcome.', path);
    findings.set(key, finding);
  }
  for (const [key, outcome] of pairs) {
    requireCondition(outcome === 'pass' || findings.has(key), 'finding-coverage-mismatch', 'A violation or incomplete evaluated pair must have a finding.', path);
  }
  for (const [category, name] of [['violation', 'violations'], ['incomplete', 'incomplete']] as const) {
    const selected = state.findings.filter(f => f.category === category);
    requireCondition(state.reportedOutcomes[name].nodeCount === selected.length && state.reportedOutcomes[name].ruleCount === new Set(selected.map(f => f.ruleId)).size, 'outcome-count-mismatch', 'Finding counts do not agree with the reported outcomes.', path);
  }
  const passes = capture.evaluatedPairs.filter(p => p.outcome === 'pass');
  requireCondition(state.reportedOutcomes.passes.nodeCount >= passes.length && state.reportedOutcomes.passes.ruleCount >= new Set(passes.map(p => p.ruleId)).size, 'outcome-count-mismatch', 'Recorded pass-pair counts exceed the reported pass outcomes.', path);
}

function safeFinding(finding: Finding): Finding {
  return { ruleId: finding.ruleId, subjectId: finding.subjectId, category: finding.category, impact: finding.impact,
    checks: { any: [...new Set(finding.checks.any)].sort(), all: [...new Set(finding.checks.all)].sort(), none: [...new Set(finding.checks.none)].sort() } };
}

/** Construct the public contract explicitly; do not serialize source/UI objects. */
export function allowlistedBundle(input: ReportBundle): ReportBundle {
  return {
    schemaVersion: input.schemaVersion, normalizationVersion: input.normalizationVersion,
    reportId: input.reportId, createdAt: input.createdAt,
    producer: { name: input.producer.name, version: input.producer.version },
    identity: { namespace: input.identity.namespace, method: input.identity.method },
    states: input.states.map(s => ({
      stateId: s.stateId, patternId: s.patternId,
      capture: { status: s.capture.status, engine: { name: s.capture.engine.name, version: s.capture.engine.version },
        rulesetId: s.capture.rulesetId, rulesetDigest: s.capture.rulesetDigest, scopeId: s.capture.scopeId, environmentDigest: s.capture.environmentDigest,
        completeness: s.capture.completeness, executedRuleIds: [...s.capture.executedRuleIds].sort(), observedSubjectIds: [...s.capture.observedSubjectIds].sort(),
        evaluatedPairs: s.capture.evaluatedPairs.map(p => ({ ruleId: p.ruleId, subjectId: p.subjectId, outcome: p.outcome })), reasonCodes: [...s.capture.reasonCodes] },
      findings: s.findings.map(safeFinding), manualChecks: s.manualChecks.map(m => ({ checkId: m.checkId, status: m.status, reportedBy: m.reportedBy })),
      reportedOutcomes: { violations: { ruleCount: s.reportedOutcomes.violations.ruleCount, nodeCount: s.reportedOutcomes.violations.nodeCount },
        incomplete: { ruleCount: s.reportedOutcomes.incomplete.ruleCount, nodeCount: s.reportedOutcomes.incomplete.nodeCount },
        passes: { ruleCount: s.reportedOutcomes.passes.ruleCount, nodeCount: s.reportedOutcomes.passes.nodeCount },
        inapplicable: { ruleCount: s.reportedOutcomes.inapplicable.ruleCount, nodeCount: s.reportedOutcomes.inapplicable.nodeCount } },
    })),
  };
}

export function validateBundle(input: unknown): ReportBundle {
  inspectStructure(input);
  if (input && typeof input === 'object' && Object.hasOwn(input, 'schemaVersion') && (input as { schemaVersion?: unknown }).schemaVersion !== '1.0') {
    throw new DomainError('unsupported-version', 'This application supports canonical report schema 1.0 only.');
  }
  if (!isBundle(input)) {
    // The error keyword is from our schema. Do not echo imported values, property
    // names or AJV's verbose messages/params, which can contain source material.
    throw new DomainError('invalid-schema', `The report does not match schema 1.0 (${isBundle.errors?.[0]?.keyword ?? 'validation'}).`);
  }
  requireCondition(unique(input.states.map(s => s.stateId)), 'duplicate-state', 'Each state identifier must be unique.');
  let pairCount = 0; let findingCount = 0; let manualCount = 0; let nodeCount = 0;
  input.states.forEach((state, index) => {
    validateState(state, index);
    pairCount += state.capture.evaluatedPairs.length; findingCount += state.findings.length; manualCount += state.manualChecks.length;
    nodeCount += Object.values(state.reportedOutcomes).reduce((sum, category) => sum + category.nodeCount, 0);
  });
  requireCondition(pairCount <= LIMITS.evaluatedPairs, 'evaluated-pair-limit', 'A report may contain at most 10,000 evaluated pairs.');
  requireCondition(findingCount <= LIMITS.findings, 'finding-limit', 'A report may contain at most 10,000 findings.');
  requireCondition(manualCount <= LIMITS.manualChecks, 'manual-check-limit', 'A report may contain at most 2,000 manual checks.');
  requireCondition(nodeCount <= LIMITS.nodes, 'node-limit', 'A report may contain at most 10,000 source node occurrences.');
  const clean = allowlistedBundle(input);
  checkTextSize(JSON.stringify(clean));
  return clean;
}

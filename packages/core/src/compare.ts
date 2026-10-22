import { pairKey, validateBundle } from './validate.js';
import type { ComparisonCategory, ComparisonItem, ComparisonResult, Finding, ReportBundle, StateReport } from './types.js';

export const comparisonLabels: Readonly<Record<ComparisonCategory, string>> = Object.freeze({
  new: 'Newly detected', persisting: 'Still detected', changed: 'Changed', 'not-detected': 'Not detected in this run', unassessable: 'Cannot assess',
});
function compatibility(base: ReportBundle, next: ReportBundle, a?: StateReport, b?: StateReport): string | undefined {
  if (base.identity.namespace !== next.identity.namespace) return 'Identity namespaces differ; independently created identities cannot be matched.';
  if (base.identity.method !== next.identity.method || base.normalizationVersion !== next.normalizationVersion) return 'Identity or normalization methods differ.';
  if (!a || !b) return 'The corresponding state was not captured in both runs.';
  if (a.patternId !== b.patternId) return 'The declared pattern for this state differs.';
  const first = a.capture; const second = b.capture;
  if (first.status !== 'complete' || second.status !== 'complete') return 'One or both state captures are partial or failed.';
  if (first.completeness !== 'producer-attested' || second.completeness !== 'producer-attested') return 'The imports do not declare sufficient capture provenance.';
  if (first.reasonCodes.length || second.reasonCodes.length) return 'A capture declares limitations that prevent a reliable comparison.';
  if (first.engine.name !== second.engine.name || first.engine.version !== second.engine.version) return 'The accessibility engine version changed.';
  for (const key of ['rulesetId', 'rulesetDigest', 'scopeId', 'environmentDigest'] as const) {
    if (!first[key] || !second[key]) return 'Capture configuration, scope or environment evidence is missing.';
    if (first[key] !== second[key]) return 'Capture rules, scope or environment changed.';
  }
  return undefined;
}
function signature(finding: Finding): string {
  return JSON.stringify([finding.category, finding.impact, [...finding.checks.any].sort(), [...finding.checks.all].sort(), [...finding.checks.none].sort()]);
}
function exactPass(state: StateReport | undefined, finding: Finding): boolean {
  return !!state?.capture.evaluatedPairs.some(p => p.ruleId === finding.ruleId && p.subjectId === finding.subjectId && p.outcome === 'pass');
}
export function compareBundles(baselineInput: ReportBundle, candidateInput: ReportBundle): ComparisonResult {
  const baseline = validateBundle(baselineInput); const candidate = validateBundle(candidateInput);
  const baselineStates = new Map(baseline.states.map(s => [s.stateId, s]));
  const candidateStates = new Map(candidate.states.map(s => [s.stateId, s]));
  const observations = new Map<string, { stateId: string; baseline?: Finding; candidate?: Finding }>();
  for (const [side, bundle] of [['baseline', baseline], ['candidate', candidate]] as const) {
    for (const state of bundle.states) for (const finding of state.findings) {
      const key = JSON.stringify([bundle.identity.namespace, state.stateId, finding.ruleId, finding.subjectId]);
      const previous = observations.get(key) ?? { stateId: state.stateId };
      observations.set(key, { ...previous, [side]: finding });
    }
  }
  const counts: ComparisonResult['counts'] = { new: 0, persisting: 0, changed: 0, 'not-detected': 0, unassessable: 0 };
  const items: ComparisonItem[] = [];
  for (const [key, observation] of observations) {
    const a = baselineStates.get(observation.stateId); const b = candidateStates.get(observation.stateId);
    const first = observation.baseline; const second = observation.candidate; const finding = second ?? first!;
    let category: ComparisonCategory = 'unassessable';
    let reason = compatibility(baseline, candidate, a, b);
    if (!reason) {
      if (first && second) {
        if (signature(first) === signature(second)) {
          category = 'persisting'; reason = first.category === 'incomplete' ? 'The same incomplete observation remains; human review is still needed.' : 'The same rule and subject have the same assessed finding in both comparable runs.';
        } else if (first.category === 'incomplete' || second.category === 'incomplete') {
          reason = 'An incomplete observation changed; this cannot establish improvement or regression.';
        } else {
          category = 'changed'; reason = 'The same rule and subject remain, with changed impact or check evidence.';
        }
      } else if (second) {
        if (second.category === 'violation' && exactPass(a, second)) {
          category = 'new'; reason = 'The baseline records an exact pass for this rule and subject; the candidate records a violation.';
        } else reason = 'No exact baseline pass establishes that this rule previously passed for this subject.';
      } else if (first) {
        if (first.category === 'violation' && exactPass(b, first)) {
          category = 'not-detected'; reason = 'The candidate records an exact pass for this rule and subject. This observation does not prove a fix.';
        } else reason = 'No exact candidate pass establishes that this rule was checked successfully for this subject.';
      }
    }
    const item: ComparisonItem = { key, stateId: observation.stateId, ruleId: finding.ruleId, subjectId: finding.subjectId, category, reason: reason ?? 'Capture evidence is insufficient.' };
    if (first) item.baseline = first;
    if (second) item.candidate = second;
    items.push(item); counts[category] += 1;
  }
  items.sort((a, b) => a.stateId.localeCompare(b.stateId) || pairKey(a.ruleId, a.subjectId).localeCompare(pairKey(b.ruleId, b.subjectId)) || a.key.localeCompare(b.key));
  return { items, counts };
}

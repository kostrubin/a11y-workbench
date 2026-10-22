import { inspectStructure } from './limits.js';
import { allowlistedBundle, validateBundle } from './validate.js';
import type { ReportBundle } from './types.js';

export function exportBundle(bundle: ReportBundle): ReportBundle {
  inspectStructure(bundle);
  return validateBundle(allowlistedBundle(bundle));
}
export function escapeMarkdown(value: string): string { return value.replace(/[\\`*_{}[\]()#+\-.!|><]/g, '\\$&'); }
export function exportMarkdown(input: ReportBundle): string {
  const bundle = exportBundle(input);
  const lines = ['# A11y Workbench report', '', 'Automated observations and user-reported manual statuses are separate. This report is not a WCAG conformance verdict. Identifiers are pseudonymous, not guaranteed anonymous.', '',
    `Schema: ${bundle.schemaVersion}. Normalization: ${bundle.normalizationVersion}. Report: ${escapeMarkdown(bundle.reportId)}. Created: ${escapeMarkdown(bundle.createdAt)}.`, '',
    `Producer declaration: ${bundle.producer.name} ${escapeMarkdown(bundle.producer.version)}. Identity: ${bundle.identity.method}; namespace ${escapeMarkdown(bundle.identity.namespace)}.`, '',
    'Free-text notes, tester context, selectors, HTML, URLs, identity keys and raw source messages are excluded.', ''];
  for (const state of bundle.states) {
    lines.push(`## ${escapeMarkdown(state.stateId)}`, '', `Pattern: ${state.patternId}. Engine: axe-core ${escapeMarkdown(state.capture.engine.version)}. Capture: ${state.capture.status}; completeness declaration: ${state.capture.completeness}.`, '',
      '| Capture evidence | Declared value |', '| --- | --- |',
      `| Ruleset ID | ${escapeMarkdown(state.capture.rulesetId ?? 'unknown')} |`,
      `| Ruleset digest | ${escapeMarkdown(state.capture.rulesetDigest ?? 'unknown')} |`,
      `| Scope ID | ${escapeMarkdown(state.capture.scopeId ?? 'unknown')} |`,
      `| Environment digest | ${escapeMarkdown(state.capture.environmentDigest ?? 'unknown')} |`,
      `| Limitations | ${state.capture.reasonCodes.map(escapeMarkdown).join(', ') || 'none declared'} |`, '',
      `Executed rule inventory: ${state.capture.executedRuleIds.map(escapeMarkdown).join(', ') || 'none supplied'}.`, '',
      `Observed subject inventory: ${state.capture.observedSubjectIds.map(escapeMarkdown).join(', ') || 'none supplied'}.`, '',
      '| Supplied outcome | Rules | Node occurrences |', '| --- | ---: | ---: |');
    for (const name of ['violations', 'incomplete', 'passes', 'inapplicable'] as const) {
      const count = state.reportedOutcomes[name]; lines.push(`| ${name} | ${count.ruleCount} | ${count.nodeCount} |`);
    }
    lines.push('', '| Rule | Subject | Outcome | Impact | Any check IDs | All check IDs | None check IDs |', '| --- | --- | --- | --- | --- | --- | --- |');
    for (const finding of state.findings) lines.push(`| ${escapeMarkdown(finding.ruleId)} | ${escapeMarkdown(finding.subjectId)} | ${finding.category === 'incomplete' ? 'Needs review' : 'violation'} | ${finding.impact ?? 'unknown'} | ${finding.checks.any.map(escapeMarkdown).join(', ') || '—'} | ${finding.checks.all.map(escapeMarkdown).join(', ') || '—'} | ${finding.checks.none.map(escapeMarkdown).join(', ') || '—'} |`);
    if (!state.findings.length) lines.push('| — | — | No supplied findings; not proof of complete accessibility | — | — | — | — |');
    lines.push('', '### Exact evaluated pairs', '', 'Separate rule and subject inventories do not imply a pass for their Cartesian product.', '', '| Rule | Subject | Observed outcome |', '| --- | --- | --- |');
    for (const pair of state.capture.evaluatedPairs) lines.push(`| ${escapeMarkdown(pair.ruleId)} | ${escapeMarkdown(pair.subjectId)} | ${pair.outcome} |`);
    if (!state.capture.evaluatedPairs.length) lines.push('| — | — | No exact pair evidence supplied |');
    lines.push('', '### User-reported manual checks', '', 'Observation details were not included in this minimized export.', '', '| Check | User-reported status |', '| --- | --- |');
    for (const check of state.manualChecks) lines.push(`| ${escapeMarkdown(check.checkId)} | ${check.status} |`);
    if (!state.manualChecks.length) lines.push('| — | No supplied manual results |');
    lines.push('');
  }
  return lines.join('\n');
}

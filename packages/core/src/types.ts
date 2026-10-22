export type Impact = 'minor' | 'moderate' | 'serious' | 'critical' | null;
export type Outcome = 'pass' | 'violation' | 'incomplete';
export type ManualStatus = 'not-run' | 'pass' | 'fail' | 'not-applicable';
export type PatternId = 'forms' | 'dialog' | 'menu' | 'unspecified';
export type ReasonCode = 'capture-error' | 'timeout' | 'blocked-resource' | 'missing-config' | 'missing-scope' | 'unsupported-context' | 'duplicate-subject' | 'truncated-source';
export interface EvaluatedPair { ruleId: string; subjectId: string; outcome: Outcome }
export interface Finding { ruleId: string; subjectId: string; category: 'violation' | 'incomplete'; impact: Impact; checks: { any: string[]; all: string[]; none: string[] } }
export interface ManualCheck { checkId: string; status: ManualStatus; reportedBy: 'user' }
export interface Capture {
  status: 'complete' | 'partial' | 'error';
  engine: { name: 'axe-core'; version: string };
  rulesetId: string | null; rulesetDigest: string | null; scopeId: string | null; environmentDigest: string | null;
  completeness: 'producer-attested' | 'unknown';
  executedRuleIds: string[]; observedSubjectIds: string[]; evaluatedPairs: EvaluatedPair[]; reasonCodes: ReasonCode[];
}
export interface OutcomeCount { ruleCount: number; nodeCount: number }
export interface StateReport {
  stateId: string; patternId: PatternId; capture: Capture; findings: Finding[]; manualChecks: ManualCheck[];
  reportedOutcomes: { violations: OutcomeCount; incomplete: OutcomeCount; passes: OutcomeCount; inapplicable: OutcomeCount };
}
export interface ReportBundle {
  schemaVersion: '1.0'; normalizationVersion: '1'; reportId: string; createdAt: string;
  producer: { name: 'a11y-workbench' | 'axe-import'; version: string };
  identity: { namespace: string; method: 'explicit' | 'hmac-sha256-v1' }; states: StateReport[];
}
/** Session-only. Never serialize this object into a report, log or browser storage. */
export interface IdentityContext { namespace: string; key: Uint8Array }
export interface ParseOptions { stateId?: string; signal?: AbortSignal; maxProcessingMs?: number }
export type ComparisonCategory = 'new' | 'persisting' | 'changed' | 'not-detected' | 'unassessable';
export interface ComparisonItem {
  key: string; stateId: string; ruleId: string; subjectId: string; category: ComparisonCategory; reason: string;
  baseline?: Finding; candidate?: Finding;
}
export interface ComparisonResult { items: ComparisonItem[]; counts: Record<ComparisonCategory, number> }

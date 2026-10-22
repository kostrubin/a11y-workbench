import { checkpoint, checkTextSize, DomainError, inspectStructure, LIMITS, requireCondition } from './limits.js';
import { newManualChecks } from './registry.js';
import { pairKey, validateBundle } from './validate.js';
import type { Finding, IdentityContext, Impact, Outcome, ParseOptions, ReportBundle, StateReport } from './types.js';

const identifier = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const semver = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const encoder = new TextEncoder();
function record(value: unknown, path: string): Record<string, unknown> {
  requireCondition(value !== null && typeof value === 'object' && !Array.isArray(value), 'unsupported-shape', 'A required JSON record is missing or invalid.', path);
  return value as Record<string, unknown>;
}
function id(value: unknown, path: string): string {
  requireCondition(typeof value === 'string' && identifier.test(value), 'unsafe-identifier', 'An identifier is missing or outside the supported safe alias format.', path);
  return value;
}
function array(value: unknown, path: string): unknown[] {
  requireCondition(Array.isArray(value), 'unsupported-shape', 'A required result array is missing or invalid.', path);
  return value;
}
export function createIdentityContext(): IdentityContext {
  return { namespace: crypto.randomUUID(), key: crypto.getRandomValues(new Uint8Array(32)) };
}
function canonicalTarget(value: unknown, path: string): string {
  const root = array(value, path);
  requireCondition(root.length > 0, 'missing-identity', 'A source node needs a complete target array or an explicit safe subject identifier.', path);
  let leaves = 0;
  const walk = (part: unknown, depth: number): unknown => {
    requireCondition(depth <= LIMITS.depth, 'depth-limit', 'A selector target exceeds the nesting limit.', path);
    if (typeof part === 'string') {
      requireCondition(part.length > 0, 'missing-identity', 'A selector target must not be empty.', path);
      leaves += 1; return part;
    }
    const children = array(part, path);
    requireCondition(children.length > 0, 'missing-identity', 'A selector target must not be empty.', path);
    return children.map(child => walk(child, depth + 1));
  };
  const normalized = root.map(part => walk(part, 1));
  requireCondition(leaves > 0, 'missing-identity', 'A source target has no selector identity.', path);
  return JSON.stringify(normalized);
}
function checks(node: Record<string, unknown>, group: 'any' | 'all' | 'none', path: string): string[] {
  if (!Object.hasOwn(node, group)) return [];
  const values = array(node[group], path);
  requireCondition(values.length <= LIMITS.checksPerGroup, 'check-limit', 'A source node contains too many check records.', path);
  return [...new Set(values.map((value, i) => id(record(value, `${path}[${i}]`).id, `${path}[${i}].id`)))].sort();
}
function impact(value: unknown, path: string): Impact {
  requireCondition(value === undefined || value === null || ['minor', 'moderate', 'serious', 'critical'].includes(value as string), 'unsupported-impact', 'An impact value is unsupported.', path);
  return value === undefined ? null : value as Impact;
}

/** Supported raw input is one axe result with all four outcome arrays. */
export async function normalizeRawAxe(input: unknown, identity = createIdentityContext(), options: ParseOptions = {}): Promise<ReportBundle> {
  const started = Date.now();
  inspectStructure(input, started, options);
  const source = record(input, '$');
  const engine = record(source.testEngine, '$.testEngine');
  requireCondition(engine.name === 'axe-core' && typeof engine.version === 'string' && engine.version.length <= 128 && semver.test(engine.version), 'unsupported-engine', 'A supported axe-core engine name and semantic version are required.', '$.testEngine');
  const groups = ['violations', 'incomplete', 'passes', 'inapplicable'] as const;
  const results = groups.map(group => [group, array(source[group], `$.${group}`)] as const);
  requireCondition(identity.key instanceof Uint8Array && identity.key.byteLength === 32, 'invalid-identity', 'The session identity key must have 256 bits.');
  const signingKey = await crypto.subtle.importKey('raw', identity.key.slice().buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const fingerprints = new Map<string, string>();
  const executed = new Set<string>(); const observed = new Set<string>(); const pairs = new Map<string, Outcome>();
  const findings: Finding[] = [];
  let totalNodes = 0; let hmacUsed = false;
  const state: StateReport = {
    stateId: id(options.stateId ?? 'imported.state', '$.stateId'), patternId: 'unspecified',
    capture: { status: 'partial', engine: { name: 'axe-core', version: engine.version }, rulesetId: null, rulesetDigest: null, scopeId: null, environmentDigest: null,
      completeness: 'unknown', executedRuleIds: [], observedSubjectIds: [], evaluatedPairs: [], reasonCodes: ['missing-config', 'missing-scope'] },
    findings, manualChecks: newManualChecks(),
    reportedOutcomes: { violations: { ruleCount: 0, nodeCount: 0 }, incomplete: { ruleCount: 0, nodeCount: 0 }, passes: { ruleCount: 0, nodeCount: 0 }, inapplicable: { ruleCount: 0, nodeCount: 0 } },
  };
  for (const [group, rules] of results) {
    checkpoint(started, options);
    requireCondition(rules.length <= LIMITS.rulesPerState, 'rule-limit', 'A source result contains too many rules.', `$.${group}`);
    const ruleIds = new Set<string>();
    for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex += 1) {
      const path = `$.${group}[${ruleIndex}]`;
      const rule = record(rules[ruleIndex], path); const ruleId = id(rule.id, `${path}.id`);
      requireCondition(!ruleIds.has(ruleId), 'duplicate-rule', 'A rule appears more than once in the same outcome group.', path);
      ruleIds.add(ruleId); executed.add(ruleId);
      requireCondition(executed.size <= LIMITS.rulesPerState, 'rule-limit', 'A state may contain at most 1,000 executed rules.');
      const nodes = array(rule.nodes, `${path}.nodes`);
      if (group === 'violations' || group === 'incomplete') requireCondition(nodes.length > 0, 'missing-nodes', 'A violation or incomplete rule needs its source node records.', path);
      totalNodes += nodes.length;
      requireCondition(totalNodes <= LIMITS.nodes, 'node-limit', 'A report may contain at most 10,000 source node occurrences.');
      state.reportedOutcomes[group].nodeCount += nodes.length;
      for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
        checkpoint(started, options);
        const nodePath = `${path}.nodes[${nodeIndex}]`; const node = record(nodes[nodeIndex], nodePath);
        // Inapplicable observations retain counts but never establish a pass for
        // an individual subject, even if the source contains a node array.
        if (group === 'inapplicable') continue;
        let subject: string;
        if (Object.hasOwn(node, 'subjectId')) subject = id(node.subjectId, `${nodePath}.subjectId`);
        else {
          hmacUsed = true;
          const serialized = canonicalTarget(node.target, `${nodePath}.target`);
          const existing = fingerprints.get(serialized);
          if (existing) subject = existing;
          else {
            const digest = await crypto.subtle.sign('HMAC', signingKey, encoder.encode(serialized));
            subject = 'h1:' + [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
            fingerprints.set(serialized, subject);
          }
        }
        observed.add(subject);
        const key = pairKey(ruleId, subject);
        requireCondition(!pairs.has(key), 'duplicate-evaluated-pair', 'Source records repeat the same rule and subject.', nodePath);
        const outcome: Outcome = group === 'passes' ? 'pass' : group === 'violations' ? 'violation' : 'incomplete';
        pairs.set(key, outcome);
        state.capture.evaluatedPairs.push({ ruleId, subjectId: subject, outcome });
        if (outcome !== 'pass') findings.push({ ruleId, subjectId: subject, category: outcome, impact: impact(node.impact ?? rule.impact, nodePath),
          checks: { any: checks(node, 'any', `${nodePath}.any`), all: checks(node, 'all', `${nodePath}.all`), none: checks(node, 'none', `${nodePath}.none`) } });
      }
    }
    state.reportedOutcomes[group].ruleCount = ruleIds.size;
  }
  state.capture.executedRuleIds = [...executed].sort(); state.capture.observedSubjectIds = [...observed].sort();
  checkpoint(started, options);
  const result: ReportBundle = { schemaVersion: '1.0', normalizationVersion: '1', reportId: crypto.randomUUID(), createdAt: new Date().toISOString(),
    producer: { name: 'axe-import', version: '0.1.0' }, identity: { namespace: identity.namespace, method: hmacUsed ? 'hmac-sha256-v1' : 'explicit' }, states: [state] };
  const bundle = validateBundle(result);
  checkpoint(started, options);
  return bundle;
}

export async function parseReportText(text: string, identity?: IdentityContext, options: ParseOptions = {}): Promise<ReportBundle> {
  const started = Date.now(); checkpoint(started, options); checkTextSize(text);
  let value: unknown;
  try { value = JSON.parse(text); }
  catch { throw new DomainError('invalid-json', 'The selected file is not valid JSON.'); }
  // Each destination performs the full iterative inspection. Avoid traversing
  // a near-limit report twice before normalization; JSON.parse cannot create
  // getters or executable properties, and no raw field is used before that scan.
  checkpoint(started, options);
  if (value && typeof value === 'object' && Object.hasOwn(value, 'schemaVersion')) {
    const result = validateBundle(value); checkpoint(started, options); return result;
  }
  const remaining = Math.min(options.maxProcessingMs ?? LIMITS.processingMs, LIMITS.processingMs) - (Date.now() - started);
  const result = await normalizeRawAxe(value, identity, { ...options, maxProcessingMs: remaining });
  checkpoint(started, options);
  return result;
}
export async function parseReportBytes(bytes: Uint8Array, identity?: IdentityContext, options: ParseOptions = {}): Promise<ReportBundle> {
  requireCondition(bytes.byteLength <= LIMITS.bytes, 'file-size', 'A report may be at most 10 MiB.');
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new DomainError('invalid-utf8', 'The selected file is not valid UTF-8 JSON.'); }
  return parseReportText(text, identity, options);
}

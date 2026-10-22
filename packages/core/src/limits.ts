import type { ParseOptions } from './types.js';

export const LIMITS = Object.freeze({ bytes: 10 * 1024 * 1024, states: 50, nodes: 10_000, findings: 10_000, evaluatedPairs: 10_000, manualChecks: 2_000, depth: 64, stringBytes: 64 * 1024, entries: 250_000, checksPerGroup: 100, rulesPerState: 1_000, processingMs: 5_000 });
export class DomainError extends Error {
  readonly code: string;
  readonly path: string;
  constructor(code: string, message: string, path = '$') {
    super(message);
    this.name = 'DomainError'; this.code = code; this.path = path;
  }
}
export function requireCondition(value: unknown, code: string, message: string, path = '$'): asserts value {
  if (!value) throw new DomainError(code, message, path);
}
export function checkpoint(start: number, options: ParseOptions = {}): void {
  if (options.signal?.aborted) throw new DomainError('cancelled', 'Import was cancelled.');
  const maximum = Math.min(options.maxProcessingMs ?? LIMITS.processingMs, LIMITS.processingMs);
  if (Date.now() - start >= maximum) throw new DomainError('timeout', 'Report processing exceeded the time limit.');
}
const encoder = new TextEncoder();
const poison = new Set(['__proto__', 'prototype', 'constructor']);
/** Reject hostile keys and resource excess before touching schema/normalization code. */
export function inspectStructure(input: unknown, start = Date.now(), options: ParseOptions = {}): void {
  const stack: { value: unknown; depth: number; exit?: boolean }[] = [{ value: input, depth: 1 }];
  const ancestors = new WeakSet<object>();
  let entries = 0;
  while (stack.length) {
    const current = stack.pop()!;
    if (current.exit && current.value !== null && typeof current.value === 'object') { ancestors.delete(current.value); continue; }
    if ((entries & 127) === 0) checkpoint(start, options);
    const value = current.value;
    requireCondition(current.depth <= LIMITS.depth, 'depth-limit', 'JSON nesting exceeds 64 levels.');
    if (typeof value === 'string') {
      requireCondition(value.length <= LIMITS.stringBytes && encoder.encode(value).byteLength <= LIMITS.stringBytes, 'string-limit', 'A string exceeds the 64 KiB limit.');
      requireCondition(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value), 'invalid-unicode', 'A string contains invalid Unicode.');
    } else if (value !== null && typeof value === 'object') {
      requireCondition(!ancestors.has(value), 'invalid-structure', 'Reports must not contain cyclic object references.');
      ancestors.add(value);
      stack.push({ value, depth: current.depth, exit: true });
      requireCondition(Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null, 'invalid-structure', 'Only JSON records and arrays are supported.');
      requireCondition(Object.getOwnPropertySymbols(value).length === 0, 'invalid-structure', 'Only JSON property names are supported.');
      const descriptors = Object.getOwnPropertyDescriptors(value);
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (Array.isArray(value) && key === 'length') continue;
        requireCondition(!poison.has(key), 'unsafe-property', 'A forbidden property name was found.');
        requireCondition(key.length <= LIMITS.stringBytes && encoder.encode(key).byteLength <= LIMITS.stringBytes, 'string-limit', 'A property name exceeds the string limit.');
        requireCondition('value' in descriptor, 'invalid-structure', 'Executable object properties are not supported.');
        entries += 1;
        requireCondition(entries <= LIMITS.entries, 'entry-limit', 'The report contains too many entries.');
        stack.push({ value: descriptor.value, depth: current.depth + 1 });
      }
    } else {
      requireCondition(value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)), 'invalid-structure', 'Only finite JSON values are supported.');
    }
  }
}
export function checkTextSize(text: string): void {
  requireCondition(typeof text === 'string', 'unsupported-input', 'Select a UTF-8 JSON report.');
  requireCondition(text.length <= LIMITS.bytes && encoder.encode(text).byteLength <= LIMITS.bytes, 'file-size', 'A report may be at most 10 MiB.');
}

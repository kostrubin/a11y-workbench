import type { ComparisonResult, ReportBundle } from '@a11y-workbench/core';

export type CompareRequest = { id: number; baseline: ReportBundle; candidate: ReportBundle };
export type CompareResponse =
  | { id: number; ok: true; result: ComparisonResult }
  | { id: number; ok: false };

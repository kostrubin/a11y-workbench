import type { IdentityContext, ReportBundle } from '@a11y-workbench/core';

export type ImportRequest = {
  id: number;
  bytes: ArrayBuffer;
  identity: IdentityContext;
};

export type ImportResponse =
  | { id: number; ok: true; bundle: ReportBundle }
  | { id: number; ok: false; code: string };

import { compareBundles } from '@a11y-workbench/core';
import type { CompareRequest, CompareResponse } from './compare-protocol';

const worker = globalThis as unknown as {
  onmessage: ((event: MessageEvent<CompareRequest>) => void) | null;
  postMessage: (response: CompareResponse) => void;
};

worker.onmessage = (event) => {
  const request = event.data;
  try {
    worker.postMessage({ id: request.id, ok: true, result: compareBundles(request.baseline, request.candidate) });
  } catch {
    worker.postMessage({ id: request.id, ok: false });
  }
};

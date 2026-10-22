import { DomainError, LIMITS, parseReportBytes } from '@a11y-workbench/core';
import type { ImportRequest, ImportResponse } from './import-protocol';

const worker = globalThis as unknown as {
  onmessage: ((event: MessageEvent<ImportRequest>) => void) | null;
  postMessage: (response: ImportResponse) => void;
};

worker.onmessage = (event) => {
  const request = event.data;
  void parseReportBytes(new Uint8Array(request.bytes), request.identity, {
    stateId: 'import.current',
    maxProcessingMs: LIMITS.processingMs,
  }).then(
    (bundle) => worker.postMessage({ id: request.id, ok: true, bundle }),
    (error: unknown) => worker.postMessage({
      id: request.id,
      ok: false,
      code: error instanceof DomainError ? error.code : 'IMPORT_FAILED',
    }),
  );
};

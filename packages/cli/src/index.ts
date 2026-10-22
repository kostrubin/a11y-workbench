#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { CaptureError } from './security.js';
import { parseArguments } from './options.js';

export async function main(args = process.argv.slice(2)): Promise<number> {
  try {
    const options = parseArguments(args);
    if (options === 'help') {
      process.stdout.write('A11y Workbench — bundled synthetic localhost capture\n\nUsage: a11y-workbench capture --origin http://127.0.0.1:4173 --output local-reports/capture.json [--identity-file identity-keys/demo.json] [--variant corrected|broken] [--overwrite]\n\nThe explicit output/identity parent directories must already exist. Only reviewed bundled pattern recipes run. Reports are minimized; no raw HTML, URLs, selectors, credentials or screenshots are exported. This is for a trusted operator-controlled local app, not an isolation sandbox for malicious sites.\n');
      return 0;
    }
    // Validate arguments before loading Playwright or starting a browser.
    const { runCapture } = await import('./capture.js');
    const result = await runCapture(options);
    process.stdout.write(`Capture ${result.complete ? 'complete' : 'incomplete'}: ${result.bundle.states.length} synthetic states; manual checks remain user-reported and not run.\n`);
    return result.complete ? 0 : 1;
  } catch (error) {
    const code = error instanceof CaptureError ? error.code : 'capture-failed';
    process.stderr.write(`Capture failed: ${code}. No application test is marked passed.\n`);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}

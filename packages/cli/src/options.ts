import { resolve } from 'node:path';
import { CaptureError, parseLoopbackOrigin } from './security.js';

export interface CaptureOptions {
  origin: string;
  output: string;
  overwrite: boolean;
  variant: 'broken' | 'corrected';
  identityFile?: string;
}

export function parseArguments(args: readonly string[]): CaptureOptions | 'help' {
  if (!args.length || (args.length === 1 && (args[0] === '--help' || args[0] === 'help')) || (args.length === 2 && args[0] === 'capture' && args[1] === '--help')) return 'help';
  if (args[0] !== 'capture') throw new CaptureError('unknown-command');
  const options: Record<string, string> = {};
  let overwrite = false;
  for (let i = 1; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--overwrite') {
      if (overwrite) throw new CaptureError('duplicate-argument');
      overwrite = true;
    } else if (flag && ['--origin', '--output', '--identity-file', '--variant'].includes(flag)) {
      if (flag in options) throw new CaptureError('duplicate-argument');
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new CaptureError('missing-argument');
      options[flag] = value;
    } else throw new CaptureError('unsupported-argument');
  }
  if (!options['--origin'] || !options['--output']) throw new CaptureError('origin-and-output-required');
  const variant = options['--variant'] ?? 'corrected';
  if (variant !== 'corrected' && variant !== 'broken') throw new CaptureError('unsupported-variant');
  const output = resolve(options['--output']);
  const identityFile = options['--identity-file'];
  if (identityFile && resolve(identityFile) === output) throw new CaptureError('output-identity-conflict');
  return {
    origin: parseLoopbackOrigin(options['--origin']),
    output,
    overwrite,
    variant,
    ...(identityFile ? { identityFile: resolve(identityFile) } : {}),
  };
}

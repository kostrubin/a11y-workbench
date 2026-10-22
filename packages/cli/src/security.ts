import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, link, rename, unlink, realpath } from 'node:fs/promises';
import { basename, dirname, join, parse, resolve } from 'node:path';

export class CaptureError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'CaptureError';
  }
}

export function parseLoopbackOrigin(input: string): string {
  // Inspect the literal authority before URL normalization can accept alternate
  // numeric hosts, dot suffixes, credentials or backslashes as loopback aliases.
  const match = /^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):([0-9]{1,5})\/?$/i.exec(input);
  if (!match || match[0] !== input) throw new CaptureError('invalid-loopback-origin');
  const port = Number(match[2]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new CaptureError('invalid-port');
  const host = match[1]?.toLowerCase() === 'localhost' ? '127.0.0.1' : match[1]?.toLowerCase();
  return `http://${host}:${port}`;
}

export function requestAllowed(url: string, method: string, origin: string): boolean {
  if (method !== 'GET' && method !== 'HEAD') return false;
  try {
    const target = new URL(url);
    return target.protocol === 'http:' && target.origin === origin && !target.username && !target.password;
  } catch {
    return false;
  }
}

export function browserEnvironment(source: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(Object.entries(source).filter((pair): pair is [string, string] =>
    typeof pair[1] === 'string' && !/(?:^|_)proxy$/i.test(pair[0])));
}

async function existingFile(path: string) {
  try {
    return await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new CaptureError('filesystem-unavailable');
  }
}

export async function prepareOutput(path: string, overwrite: boolean): Promise<string> {
  if (!path || path.includes('\0')) throw new CaptureError('invalid-output-path');
  const absolute = resolve(path);
  if (basename(absolute) === parse(absolute).root) throw new CaptureError('invalid-output-path');
  let parent: string;
  try {
    parent = await realpath(dirname(absolute));
  } catch {
    throw new CaptureError('output-parent-unavailable');
  }
  if (parent !== dirname(absolute)) throw new CaptureError('output-parent-symlink');
  const current = await existingFile(absolute);
  if (current?.isSymbolicLink()) throw new CaptureError('output-symlink');
  if (current && !current.isFile()) throw new CaptureError('output-not-regular-file');
  if (current && !overwrite) throw new CaptureError('output-exists');
  return absolute;
}

export async function atomicWrite(path: string, text: string, overwrite: boolean): Promise<void> {
  const output = await prepareOutput(path, overwrite);
  const temporary = join(dirname(output), `.a11y-${randomUUID()}.tmp`);
  let created = false;
  try {
    const file = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    created = true;
    try {
      await file.writeFile(text, { encoding: 'utf8' });
      await file.sync();
    } finally {
      await file.close();
    }
    // Recheck immediately before the atomic operation. rename replaces an entry
    // without following it; link refuses a concurrent destination creation.
    await prepareOutput(output, overwrite);
    if (overwrite) {
      await rename(temporary, output);
      created = false;
    } else {
      await link(temporary, output);
    }
  } catch (error) {
    if (error instanceof CaptureError) throw error;
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new CaptureError('output-exists');
    throw new CaptureError('output-write-failed');
  } finally {
    if (created) await unlink(temporary).catch(() => undefined);
  }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function identityNamespace(file?: string): Promise<string> {
  if (!file) return randomUUID();
  const path = await prepareOutput(file, true);
  const stat = await existingFile(path);
  if (!stat) {
    const namespace = randomUUID();
    // Author-provided IDs require a reusable namespace, not a stored HMAC key.
    await atomicWrite(path, `${JSON.stringify({ version: 1, namespace })}\n`, false);
    return namespace;
  }
  if (stat.size > 4096) throw new CaptureError('invalid-identity-file');
  if (process.platform !== 'win32' && (stat.mode & 0o077)) throw new CaptureError('identity-permissions');
  if (typeof process.getuid === 'function' && stat.uid !== process.getuid()) throw new CaptureError('identity-owner');
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const buffer = Buffer.alloc(4097);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead > 4096) throw new CaptureError('invalid-identity-file');
    const bytes = buffer.subarray(0, bytesRead);
    let data: unknown;
    try { data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { throw new CaptureError('invalid-identity-file'); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new CaptureError('invalid-identity-file');
    const record = data as Record<string, unknown>;
    if (Object.keys(record).sort().join(',') !== 'namespace,version' || record.version !== 1 || typeof record.namespace !== 'string' || record.namespace.length !== 36 || !uuid.test(record.namespace)) {
      throw new CaptureError('invalid-identity-file');
    }
    return record.namespace;
  } finally { await handle.close(); }
}

export function digest(value: unknown): string {
  const canonical = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(canonical);
    if (input !== null && typeof input === 'object') {
      return Object.fromEntries(Object.entries(input).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, canonical(item)]));
    }
    return input;
  };
  return createHash('sha256').update(JSON.stringify(canonical(value)), 'utf8').digest('hex');
}

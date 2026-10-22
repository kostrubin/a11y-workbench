import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { validateBasePath } from '../apps/web/lib/base-path.mjs';

const root = resolve('apps/web/out');
const options = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const name = process.argv[index];
  const value = process.argv[index + 1];
  if (!['--port', '--base-path'].includes(name) || options.has(name) || value === undefined || value.startsWith('--')) {
    throw new Error('Use optional --port PORT and --base-path /project-path once each.');
  }
  options.set(name, value);
}
const port = options.has('--port') ? Number(options.get('--port')) : 4173;
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Use an explicit unprivileged port from 1024 to 65535.');
const basePath = validateBasePath(options.get('--base-path'));
await stat(resolve(root, 'index.html'));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
  try {
    // Inspect the unnormalized request target: URL would erase dot segments
    // before the mount and traversal checks could reject them.
    const target = request.url ?? '/';
    if (!target.startsWith('/') || target.startsWith('//')) throw new Error('path');
    const encodedPath = target.split(/[?#]/, 1)[0];
    if (/%(?:2f|5c|00)/i.test(encodedPath)) throw new Error('path');
    const pathname = decodeURIComponent(encodedPath);
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.includes('//') ||
        pathname.split('/').some(segment => segment === '.' || segment === '..')) throw new Error('path');
    if (basePath && pathname === basePath) {
      response.writeHead(308, { Location: basePath + '/' });
      response.end();
      return;
    }
    if (basePath && !pathname.startsWith(basePath + '/')) throw new Error('path');
    const mountedPath = basePath ? pathname.slice(basePath.length) : pathname;
    let file = resolve(root, '.' + mountedPath);
    if (file !== root && !file.startsWith(root + sep)) throw new Error('path');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const canonical = await realpath(file);
    if (!canonical.startsWith(root + sep)) throw new Error('path');
    const data = await readFile(canonical);
    response.writeHead(200, { 'Content-Type': types[extname(canonical)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    let data = 'Not found';
    try { data = await readFile(resolve(root, '404.html'), 'utf8'); } catch { /* no generated error document */ }
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : data);
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Local static preview: http://127.0.0.1:${port}${basePath}/`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));

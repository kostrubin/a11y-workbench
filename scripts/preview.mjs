import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('apps/web/out');
const portIndex = process.argv.indexOf('--port');
const port = portIndex === -1 ? 4173 : Number(process.argv[portIndex + 1]);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Use an explicit unprivileged port from 1024 to 65535.');
await stat(resolve(root, 'index.html'));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
  try {
    const parsed = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
    const pathname = decodeURIComponent(parsed.pathname);
    if (pathname.includes('\0') || pathname.includes('\\')) throw new Error('path');
    let file = resolve(root, '.' + pathname);
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
server.listen(port, '127.0.0.1', () => console.log(`Local static preview: http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));

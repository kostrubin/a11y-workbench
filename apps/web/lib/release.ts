export const authoredRoutes = [
  '/', '/workbench/', '/patterns/forms/', '/patterns/dialog/', '/patterns/menu-button/',
  '/guides/read-axe-results/', '/guides/compare-reports/', '/guides/form-errors/',
  '/guides/dialog-focus/', '/guides/menu-or-disclosure/', '/guides/keyboard-review/',
  '/docs/import-format/', '/privacy/', '/limitations/', '/about/'
] as const;

export interface ReleaseEnvironment { SITE_RELEASE_APPROVED?: string; SITE_PUBLIC_ORIGIN?: string }

/** This validates configuration; no value supplied here constitutes owner approval. */
export function releaseConfiguration(env: ReleaseEnvironment) {
  const flag = env.SITE_RELEASE_APPROVED ?? 'false';
  if (flag !== 'false' && flag !== 'true') throw new Error('Invalid SITE_RELEASE_APPROVED setting.');
  const raw = env.SITE_PUBLIC_ORIGIN ?? '';
  let origin: string | null = null;
  if (raw) {
    let url: URL;
    try { url = new URL(raw); } catch { throw new Error('Invalid public origin.'); }
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || url.pathname !== '/' ||
        host === 'localhost' || host.endsWith('.localhost') || host.includes(':') || /^\d[\d.]*$/.test(host) ||
        !host.includes('.') || /(?:^|\.)(?:example\.(?:com|org|net)|invalid|test|example)$/.test(host)) {
      throw new Error('Public origin must be a reviewed production HTTPS origin without credentials, paths or placeholders.');
    }
    origin = url.origin;
  }
  if (flag === 'true' && !origin) throw new Error('Release configuration requires an approved public origin.');
  return { approved: flag === 'true' && origin !== null, origin };
}

export function indexingArtifacts(env: ReleaseEnvironment) {
  const config = releaseConfiguration(env);
  const routes = config.approved ? authoredRoutes.filter(path => path !== '/workbench/') : [];
  const xml = routes.length ? '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    routes.map(path => `  <url><loc>${config.origin}${path}</loc></url>`).join('\n') + '\n</urlset>\n' : null;
  return { robots: 'User-agent: *\nDisallow:\n' + (xml ? `Sitemap: ${config.origin}/sitemap.xml\n` : ''), sitemap: xml };
}

import { writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { indexingArtifacts } from '../apps/web/lib/release.js';

const out = resolve('apps/web/out');
const artifacts = indexingArtifacts({ SITE_RELEASE_APPROVED: process.env.SITE_RELEASE_APPROVED, SITE_PUBLIC_ORIGIN: process.env.SITE_PUBLIC_ORIGIN, NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH });
await writeFile(resolve(out, 'robots.txt'), artifacts.robots);
if (artifacts.sitemap) await writeFile(resolve(out, 'sitemap.xml'), artifacts.sitemap);
else await rm(resolve(out, 'sitemap.xml'), { force: true });
console.log(`Indexing artifacts: ${artifacts.sitemap ? 'configured release URLs' : 'no public sitemap; noindex is required in page HTML'}. No deployment performed.`);

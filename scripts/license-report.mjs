import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const rows = [];
for (const [location, entry] of Object.entries(lock.packages)) {
  if (!location.includes('node_modules/') || entry.link) continue;
  let pkg;
  try { pkg = JSON.parse(await readFile(resolve(location, 'package.json'), 'utf8')); } catch { continue; } // optional packages for other OSs are not installed
  const files = (await readdir(resolve(location))).filter(name => /^(?:licen[cs]e|copying|notice)(?:\.|$)/i.test(name));
  rows.push({ name: pkg.name, version: pkg.version, license: typeof pkg.license === 'string' ? pkg.license : JSON.stringify(pkg.license ?? 'UNDECLARED'), licenseFiles: files.map(file => location + '/' + file) });
}
rows.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
const unknown = rows.filter(row => !row.license || /UNDECLARED|UNLICENSED/.test(row.license));
if (unknown.length) { console.error('Missing license declarations:', unknown.map(row => row.name)); process.exitCode = 1; }
const markdown = '# Third-party dependency notices\n\nOriginal project work is MIT licensed. Dependencies retain their own copyrights and license terms. The inventory below records the installed dependency graph from the committed lockfile. License and NOTICE files remain in the installed packages; npm installation does not transfer their ownership to this project.\n\nReact, Next.js, Ajv and many supporting packages use MIT terms; TypeScript, Playwright and ESLint components include Apache-2.0 terms; axe-core and its Playwright integration use MPL-2.0. No third-party source has been modified or relicensed here. When redistributing a built bundle, preserve the applicable installed license/NOTICE texts and generated third-party license comments.\n\n| Package | Version | Declared license | Installed license/notice paths |\n| --- | --- | --- | --- |\n' + rows.map(row => `| ${row.name} | ${row.version} | ${row.license.replaceAll('|', '\\|')} | ${row.licenseFiles.map(file => '`' + file + '`').join(', ') || 'See package metadata and upstream repository'} |`).join('\n') + '\n';
if (process.argv.includes('--write')) {
  await writeFile('docs/THIRD-PARTY-NOTICES.md', markdown);
  console.log(`Recorded ${rows.length} installed dependency license declarations.`);
} else {
  const recorded = await readFile('docs/THIRD-PARTY-NOTICES.md', 'utf8');
  if (recorded !== markdown) { console.error('License inventory is stale; review and regenerate with node scripts/license-report.mjs --write.'); process.exitCode = 1; }
  else console.log(`PASS: ${rows.length} installed dependency declarations match the reviewed inventory; this inventory is not a legal certification.`);
}

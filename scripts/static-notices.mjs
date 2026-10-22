import { readFile, readdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

// Preserve actual installed license texts when redistributing generated assets.
// The broad inventory includes development/optional packages; it does not claim
// that every listed dependency is present in the browser bundle.
const root = resolve('apps/web/out');
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const licenseFiles = new Set();
const licenseName = /^(?:licen[cs]e|copying|notice)(?:\.|$)/i;
for (const [location, entry] of Object.entries(lock.packages)) {
  if (!location.includes('node_modules/') || entry.link) continue;
  let entries;
  try { entries = await readdir(location, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  for (const file of entries) {
    if (file.isFile() && licenseName.test(file.name)) licenseFiles.add(resolve(location, file.name));
  }
}
async function vendoredNotices(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await vendoredNotices(path);
    else if (entry.isFile() && licenseName.test(entry.name)) licenseFiles.add(path);
  }
}
await vendoredNotices(resolve('node_modules/next/dist/compiled'));
const texts = [];
for (const file of [...licenseFiles].sort()) texts.push(`\n--- ${relative(process.cwd(), file)} ---\n\n${await readFile(file, 'utf8')}`);
if (!texts.length) throw new Error('Installed third-party license texts are missing.');
await copyFile('LICENSE', resolve(root, 'LICENSE.txt'));
await copyFile('docs/THIRD-PARTY-NOTICES.md', resolve(root, 'THIRD-PARTY-NOTICES.txt'));
await writeFile(resolve(root, 'THIRD-PARTY-LICENSES.txt'), 'Installed dependency license and NOTICE texts. Broad inventory; no third-party code is relicensed.\n' + texts.join('\n'));
console.log(`Preserved ${texts.length} installed and vendored license/NOTICE texts alongside the static candidate.`);

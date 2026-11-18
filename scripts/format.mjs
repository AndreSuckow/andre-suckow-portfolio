// Explicit migration boundary: never format the legacy engine or generated files.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as prettier from 'prettier';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = [
  'build.mjs',
  'check.mjs',
  'server.mjs',
  'range.mjs',
  'scripts/format.mjs',
  'verify-contact.mjs',
  'verify-crt-persistence.mjs',
  'verify-discman-controls.mjs',
  'verify-discman-playback.mjs',
  'verify-gameboy.mjs',
  'verify-inspections-mobile.mjs',
  'verify-loading-screen.mjs',
  'verify-mobile-controls.mjs',
  'verify-portfolio.mjs',
  'verify-routes.mjs',
  'verify-tv-brightness.mjs',
];
const mode = process.argv[2];
if (!['--check', '--write'].includes(mode) || process.argv.length !== 3) {
  console.error('Usage: node scripts/format.mjs --check|--write');
  process.exit(1);
}

let changed = 0;
for (const relative of files) {
  const file = path.join(root, relative);
  const source = await readFile(file, 'utf8');
  const options = await prettier.resolveConfig(file);
  const formatted = await prettier.format(source, { ...options, filepath: file });
  if (source === formatted) continue;
  changed++;
  if (mode === '--write') await writeFile(file, formatted);
  console.log(`${mode === '--write' ? 'Formatted' : 'Needs formatting'}: ${relative}`);
}
console.log(
  `${files.length} maintained scripts checked; ${changed} ${mode === '--write' ? 'formatted' : 'differences'}.`,
);
if (mode === '--check' && changed) process.exitCode = 1;

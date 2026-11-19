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
  'certification.cjs',
  'cs-portfolio.cjs',
  'public/audio-controller.js',
  'public/board-games/board-games.css',
  'public/board-games/checker-renderer.js',
  'public/board-games/damas-computer.js',
  'public/board-games/damas-opponent.js',
  'public/board-games/damas-worker.js',
  'public/board-games/damas.js',
  'public/board-games/ludo.js',
  'public/board-games/trilha-motion.js',
  'public/board-games/trilha.js',
  'public/board-games/ui.js',
  'public/board-games/xadrez.js',
  'public/career-map.js',
  'public/career-models.js',
  'public/career-orbit.js',
  'public/contact-form.js',
  'public/cs-interactions.js',
  'public/cs-model.js',
  'public/custom.css',
  'public/discman-player.js',
  'public/discman.js',
  'public/enhancements.js',
  'public/family-frame.js',
  'public/game-access.js',
  'public/gameboy-model.js',
  'public/gameboy-runtime.js',
  'public/gameboy.css',
  'public/hobby-icons.js',
  'public/imported-props.js',
  'public/inspection-layout.js',
  'public/inspection-picking.js',
  'public/interaction-motion.js',
  'public/mobile-motion.js',
  'public/mobile-reading.js',
  'public/model-loader.js',
  'public/notebook-viewer.js',
  'public/poster-games.js',
  'public/project-shelf.js',
  'public/scene-affordances.js',
  'public/snes-console.js',
  'public/snes-controls.js',
  'public/style.css',
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
  'board-games-ui.test.mjs',
  'board-games.test.mjs',
  'board-model.test.mjs',
  'board-opponents.test.mjs',
  'career-models.test.mjs',
  'career-orbit.test.mjs',
  'checker-renderer.test.mjs',
  'contact.test.mjs',
  'crt-curvature.test.mjs',
  'cs-portfolio.test.mjs',
  'gameboy.test.mjs',
  'hero-interactions.test.mjs',
  'inspection-layout.test.mjs',
  'inspection-picking.test.mjs',
  'loading-screen.test.mjs',
  'mobile-crt.test.mjs',
  'mobile-game-access.test.mjs',
  'mobile-motion.test.mjs',
  'mobile-reading.test.mjs',
  'model-optimization.test.mjs',
  'poster-games.test.mjs',
  'poster-rendering.test.mjs',
  'range.test.mjs',
  'room-discoveries.test.mjs',
  'scene-affordances.test.mjs',
  'skills-modal.test.mjs',
  'snes-controls.test.mjs',
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

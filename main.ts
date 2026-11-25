// Ember & Thyme — Rush Hour Kitchen: the hand-in program (Node 22, stdlib only).
// It copies this repository's game/ and screenshots/ into /output and writes
// /output/dossier.json with the vendored make.fun library, so the sealed
// scorer can check the game and the judge can read its dossier.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly instead of handing in a broken entry: the game shell and at
// least one screenshot must be present before anything is copied.
const gameIndex = join(here, 'game', 'index.html');
if (!existsSync(gameIndex) || statSync(gameIndex).size === 0) {
  throw new Error('hand-in refused: game/index.html is missing or empty');
}
const shotDir = join(here, 'screenshots');
const shots = existsSync(shotDir) ? readdirSync(shotDir).filter((f) => !f.startsWith('.')) : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`hand-in refused: expected 3 or 4 screenshots, found ${shots.length}`);
}
for (const shot of shots) {
  if (statSync(join(shotDir, shot)).size === 0) throw new Error(`hand-in refused: screenshots/${shot} is empty`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in game/ or 48 MiB of game files in all,
// or a path under game/ over 1000 bytes: game/ counts beside /output's own
// 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Confirm the dossier actually landed before the program exits.
const dossierPath = join(out, 'dossier.json');
if (!existsSync(dossierPath) || statSync(dossierPath).size === 0) {
  throw new Error('hand-in failed: dossier.json was not written');
}

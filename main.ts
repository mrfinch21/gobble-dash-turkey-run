// Gobble Dash — the entry program (Node 22, standard library only).
//
// The game is this directory's game/ folder: plain static files a desktop
// browser loads offline (game/index.html and its ES modules, no library,
// no network request). This program hands it in: it copies game/ and
// screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library (vendor/makefun-game.ts, kept unchanged from the kit).
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program is deterministic: it copies files and writes the dossier the
// library computes from them, so two runs write the same bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate refuses an entry with no playable page, so fail loudly here
// instead of handing in an empty folder.
const indexHtml = join(here, 'game', 'index.html');
if (!existsSync(indexHtml)) throw new Error('game/index.html is missing');
const indexBytes = readFileSync(indexHtml).length;
if (indexBytes === 0 || indexBytes > 1048576) {
  throw new Error(`game/index.html is ${indexBytes} bytes; the gate caps it at 1 MiB`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB
// of game files, in all, or a path under game/ over 1000 bytes: game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossierPath = join(out, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Read the dossier back and prove it is well-formed before reporting
// success: a corrupt or empty dossier would fail the gate silently.
const dossierText = readFileSync(dossierPath, 'utf8');
const dossier = JSON.parse(dossierText);
const shotCount = existsSync(join(out, 'screenshots'))
  ? readdirSync(join(out, 'screenshots')).filter((f) => !f.startsWith('.')).length
  : 0;
if (shotCount < 3 || shotCount > 4) {
  throw new Error(`screenshots/ holds ${shotCount} images; the gate needs 3 or 4`);
}
console.log(
  `Gobble Dash handed in: ${dossierText.length} byte dossier, ${shotCount} screenshots, ` +
    `game files copied to ${join(out, 'game')}`,
);
void dossier;

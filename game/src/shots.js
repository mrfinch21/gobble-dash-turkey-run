// Gobble Dash — screenshot scenes behind ?shot=start|play|kitchen|escaped.
// One clear job: build one fixed, deterministic scene per screenshot from
// the real game objects (same world, same renderer, same HUD), then freeze
// it. These are renders of the game's own code, never mockups: the turkey,
// the farmer, the oven and the knives are all placed through the same
// structures the live game updates every frame.

import { GROUND_Y, stageFor } from './config.js';

function placeObstacle(world, key, x, extra = {}) {
  const defs = { bale: [78, 52], fence: [46, 64], pumpkin: [52, 48], knife: [26, 86], oven: [110, 96], pot: [60, 44] };
  const [w, h] = defs[key];
  const ob = { key, x, y: GROUND_Y, w, h, state: 'idle', t: 0.5, hit: false, ...extra };
  if (key === 'knife' && extra.state === 'stuck') ob.y = GROUND_Y - h + 11;
  if (key === 'pot') ob.y = GROUND_Y - 150;
  world.obstacles.push(ob);
  return ob;
}

function placePickup(world, key, x, y) {
  world.pickups.push({ key, x, y, r: 16, taken: false, bob: 0.6 });
}

export function applyShot(game, shot, seed) {
  const world = game.world;
  world.seed = seed || 7;
  world.reset();

  if (shot === 'start') {
    // Title screen, with a best score on the board.
    game.state = 'title';
    game.best = 1250;
    return;
  }

  if (shot === 'escaped') {
    // End screen: the turkey made it. The frozen farmyard sits behind it.
    game.state = 'escaped';
    game.score = 3850;
    game.distance = 1200;
    game.best = 3850;
    game.isNewBest = true;
    game.stage = stageFor(1200);
    game.scroll = 3200;
    placeObstacle(world, 'bale', 700);
    placePickup(world, 'corn', 420, GROUND_Y - 46);
    return;
  }

  if (shot === 'kitchen') {
    // Late run in the kitchen: oven breathing fire, a stuck knife, a
    // swinging pot, the farmer almost on the turkey's tail.
    game.state = 'playing';
    game.distance = 940;
    game.score = 2900;
    game.lives = 2;
    game.best = 3120;
    game.stage = stageFor(940);
    game.scroll = 2400;
    game.banner = '';
    game.bannerTimer = 0;
    world.ovenFlame = 1.0; // flame high on the oven below
    game.turkey.runPhase = 3.1;
    game.farmer.gap = 7;
    game.farmer.runPhase = 2.4;
    game.farmer.shoutTimer = 1.0;
    placeObstacle(world, 'knife', 380, { state: 'stuck' });
    placeObstacle(world, 'oven', 600, { state: 'breathing', flamePhase: 0 });
    placeObstacle(world, 'pot', 800, { state: 'swinging', swing: 0.8 });
    placePickup(world, 'corn', 470, GROUND_Y - 46);
    placePickup(world, 'feather', 700, GROUND_Y - 130);
    return;
  }

  // Default: 'play' — mid-run in the farmyard. The turkey jumps a hay bale
  // while a carving knife falls ahead and the farmer closes in.
  game.state = 'playing';
  game.distance = 168;
  game.score = 310;
  game.lives = 3;
  game.best = 1250;
  game.stage = stageFor(168);
  game.scroll = 600;
  game.banner = '';
  game.bannerTimer = 0;
  game.turkey.y = GROUND_Y - 118;
  game.turkey.onGround = false;
  game.turkey.vy = -120;
  game.turkey.runPhase = 1.2;
  game.farmer.gap = 14;
  game.farmer.runPhase = 2.0;
  game.farmer.shoutTimer = 0.8;
  placeObstacle(world, 'bale', 330);
  placeObstacle(world, 'fence', 540);
  placeObstacle(world, 'knife', 720, { state: 'falling', fallDelay: 0.15, targetX: 720, y: 60 });
  placeObstacle(world, 'pumpkin', 870, { state: 'rolling', spin: 1.1 });
  placePickup(world, 'corn', 430, GROUND_Y - 46);
  placePickup(world, 'corn', 640, GROUND_Y - 130);
}

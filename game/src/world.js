// Gobble Dash — the world the turkey runs through.
// One clear job: spawning hazards and pickups by distance, moving them,
// and answering "did anything hit the turkey?". The farmyard, barn and
// kitchen each bring their own hazards; difficulty rises with distance.

import { GROUND_Y, HAZARD_DEFS, PICKUP_DEFS, VIEW_W, stageFor } from './config.js';
import { chance, mulberry32, pick, range } from './random.js';

// No new hazard spawns in the final stretch before the forest gate.
const ESCAPE_RUNUP_END = 1150;

export class World {
  constructor(seed = 20261127) {
    this.seed = seed;
    this.reset();
  }

  reset() {
    this.rng = mulberry32(this.seed);
    this.distance = 0; // metres run
    this.nextSpawnAt = 26; // metres: first obstacle appears here
    this.nextPickupAt = 14;
    this.obstacles = []; // {key,x,y,w,h,state,t,hit}
    this.pickups = []; // {key,x,y,r,taken}
    this.leaves = []; // ambient autumn leaves
    for (let i = 0; i < 26; i++) {
      this.leaves.push({
        x: this.rng() * VIEW_W,
        y: this.rng() * 300,
        s: range(this.rng, 5, 11),
        vy: range(this.rng, 18, 46),
        sway: range(this.rng, 0, Math.PI * 2),
        hue: pick(this.rng, ['#e07b39', '#d9a441', '#b8512e', '#c96a2c']),
      });
    }
    this.ovenFlame = 0; // shared flame clock for kitchen ovens
  }

  spawnObstacle(distance) {
    const stage = stageFor(distance);
    const key = pick(this.rng, stage.hazards);
    const def = HAZARD_DEFS[key];
    const x = VIEW_W + 60;
    const ob = { key, x, y: GROUND_Y, w: def.w, h: def.h, state: 'idle', t: 0, hit: false };
    if (key === 'knife') {
      // Carving knives fall from above, telegraphed by a shadow on the ground.
      ob.y = -90;
      ob.fallDelay = range(this.rng, 0.35, 0.7);
      ob.targetX = x - range(this.rng, 40, 160);
      ob.state = 'falling';
    }
    if (key === 'pot') {
      // Hanging pots swing from above; slide under them.
      ob.y = GROUND_Y - 150;
      ob.swing = range(this.rng, 0, Math.PI * 2);
      ob.state = 'swinging';
    }
    if (key === 'oven') {
      // Ovens breathe fire in a rhythm; jump while the flame is low.
      ob.state = 'breathing';
      ob.flamePhase = range(this.rng, 0, Math.PI * 2);
    }
    if (key === 'pumpkin') {
      ob.state = 'rolling';
      ob.spin = 0;
    }
    this.obstacles.push(ob);
    // Next obstacle: closer together as the run gets harder.
    const tightness = Math.min(0.55, distance / 2400);
    this.nextSpawnAt =
      distance + range(this.rng, 20 - 8 * tightness, 38 - 14 * tightness);
  }

  spawnPickup(distance) {
    const roll = this.rng();
    let key = 'corn';
    if (roll > 0.94) key = 'pie';
    else if (roll > 0.86) key = 'feather';
    const def = PICKUP_DEFS[key];
    const arc = chance(this.rng, 0.4); // some corn arcs high, for jumpers
    this.pickups.push({
      key,
      x: VIEW_W + 60,
      y: arc ? GROUND_Y - 130 : GROUND_Y - 46,
      r: def.r,
      taken: false,
      bob: range(this.rng, 0, Math.PI * 2),
    });
    this.nextPickupAt = distance + range(this.rng, 16, 42);
  }

  update(dt, speed, distance) {
    this.distance = distance;
    this.ovenFlame += dt;
    const dx = speed * dt;

    // The last 50 m are a clear final sprint: no new hazard spawns, so the
    // forest gate stands alone when the turkey reaches it.
    while (distance >= this.nextSpawnAt && distance < ESCAPE_RUNUP_END) {
      this.spawnObstacle(this.nextSpawnAt);
    }
    while (distance >= this.nextPickupAt) this.spawnPickup(this.nextPickupAt);

    for (const ob of this.obstacles) {
      ob.x -= dx;
      ob.t += dt;
      if (ob.key === 'knife' && ob.state === 'falling') {
        ob.fallDelay -= dt;
        if (ob.fallDelay <= 0) {
          ob.y += 900 * dt;
          ob.x = ob.targetX + Math.sin(ob.t * 9) * 6;
          if (ob.y >= GROUND_Y - ob.h) {
            ob.y = GROUND_Y - ob.h;
            ob.state = 'stuck';
          }
        }
      }
      if (ob.key === 'pot' && ob.state === 'swinging') {
        ob.swing += dt * 2.2;
      }
      if (ob.key === 'pumpkin') ob.spin += dt * 7;
    }
    this.obstacles = this.obstacles.filter((o) => o.x > -220);

    for (const p of this.pickups) {
      p.x -= dx;
      p.bob += dt * 4;
    }
    this.pickups = this.pickups.filter((p) => p.x > -60 && !p.taken);

    for (const leaf of this.leaves) {
      leaf.x -= dx * 0.35 + 12 * dt;
      leaf.y += leaf.vy * dt;
      leaf.sway += dt * 2;
      if (leaf.x < -20) {
        leaf.x = VIEW_W + 10;
        leaf.y = this.rng() * 200;
      }
      if (leaf.y > GROUND_Y + 10) leaf.y = -10;
    }
  }

  // Axis-aligned overlap between the turkey and an obstacle.
  // Knives only hurt while falling or freshly stuck; ovens hurt only
  // while their flame is high; pots hurt only while swinging low.
  hitObstacle(turkey) {
    if (turkey.invulnerable) return null;
    const tx0 = turkey.x - turkey.width / 2;
    const tx1 = turkey.x + turkey.width / 2;
    const ty0 = turkey.top;
    const ty1 = turkey.y;
    for (const ob of this.obstacles) {
      if (ob.hit) continue;
      let ox0 = ob.x - ob.w / 2;
      let ox1 = ob.x + ob.w / 2;
      let oy0 = ob.y - ob.h;
      let oy1 = ob.y;
      if (ob.key === 'knife') {
        if (ob.state === 'falling' && ob.fallDelay > 0) continue; // still in the air
        if (ob.state === 'stuck') {
          ox0 += 6;
          ox1 -= 6;
        }
      }
      if (ob.key === 'oven') {
        // The flame is the danger, not the box: it is high half the cycle.
        const flame = Math.sin(this.ovenFlame * 2.4 + ob.flamePhase) > 0.1;
        if (!flame) continue;
        oy0 = ob.y - ob.h - 46; // flame licks above the oven
      }
      if (ob.key === 'pot') {
        const swingX = Math.sin(ob.swing) * 26;
        ox0 += swingX;
        ox1 += swingX;
        oy0 = ob.y - ob.h + 26; // pot hangs low enough to duck under
        oy1 = ob.y;
        if (turkey.sliding) continue; // sliding ducks clean under a pot
      }
      const overlap = tx1 > ox0 + 6 && tx0 < ox1 - 6 && ty1 > oy0 + 6 && ty0 < oy1 - 4;
      if (overlap) {
        ob.hit = true;
        return ob;
      }
    }
    return null;
  }

  collectPickup(turkey) {
    const cx = turkey.x;
    const cy = turkey.y - turkey.height / 2;
    for (const p of this.pickups) {
      if (p.taken) continue;
      const dx = p.x - cx;
      const dy = p.y + Math.sin(p.bob) * 4 - cy;
      if (dx * dx + dy * dy < (p.r + 30) * (p.r + 30)) {
        p.taken = true;
        return p;
      }
    }
    return null;
  }
}

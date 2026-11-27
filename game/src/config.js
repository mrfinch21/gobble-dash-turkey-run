// Gobble Dash — tuning and world constants.
// One clear job: every number the game balances on lives here, so tuning
// never means hunting through gameplay code.

export const VIEW_W = 960;
export const VIEW_H = 540;
export const GROUND_Y = 452;
export const TURKEY_X = 210;

export const GRAVITY = 2300; // px / s^2
export const JUMP_SPEED = 880; // px / s
export const SLIDE_TIME = 0.55; // s a slide lasts
export const STUMBLE_TIME = 0.7; // s of wobble after a hit
export const INVULN_TIME = 1.6; // s of mercy after a hit

export const ESCAPE_DISTANCE = 1200; // metres to the forest gate
export const START_LIVES = 3;
export const MAX_LIVES = 3;
export const START_GAP = 30; // metres the farmer starts behind
export const MAX_GAP = 42; // metres the farmer can fall behind
export const STUMBLE_GAP_LOSS = 11; // metres the farmer gains on a stumble
export const CORN_GAP_GAIN = 1.5; // metres gained per corn cob
export const GAP_RECOVERY = 1.1; // metres / s recovered while running clean

export const POINTS = {
  corn: 50,
  feather: 200,
  pie: 0, // pie restores a life instead of points
  metre: 1,
  stageBonus: 250,
};

// Stages the run passes through: farmyard, barn, kitchen. Each stage sets
// the palette, the speed, the hazards it may spawn and its banner text.
export const STAGES = [
  {
    key: 'farmyard',
    name: 'THE FARMYARD',
    from: 0,
    speed: 265,
    sky: ['#ffd9a0', '#ff9e5e'],
    hill: '#c98a3d',
    hillFar: '#a86f2e',
    ground: '#8a5a2b',
    groundTop: '#b5773a',
    hazards: ['bale', 'fence', 'pumpkin', 'knife'],
    banner: 'The farmer is coming! RUN!',
  },
  {
    key: 'barn',
    name: 'THE BARN',
    from: 400,
    speed: 325,
    sky: ['#e8a56b', '#b45a2e'],
    hill: '#7d4a22',
    hillFar: '#5f3718',
    ground: '#6b4423',
    groundTop: '#96602f',
    hazards: ['bale', 'fence', 'pumpkin', 'knife', 'pot'],
    banner: 'Through the barn — mind the hanging pots!',
  },
  {
    key: 'kitchen',
    name: 'THE KITCHEN',
    from: 800,
    speed: 385,
    sky: ['#d98a4a', '#8f3b1e'],
    hill: '#5c2f16',
    hillFar: '#472312',
    ground: '#59371e',
    groundTop: '#7d4d28',
    hazards: ['oven', 'knife', 'pot', 'fence', 'pumpkin'],
    banner: 'The oven is lit! Almost to the forest!',
  },
];

export function stageFor(distance) {
  let stage = STAGES[0];
  for (const s of STAGES) if (distance >= s.from) stage = s;
  return stage;
}

// Spawn tables: [hazardKey, minGapMetres, maxGapMetres, weight]
export const HAZARD_DEFS = {
  bale: { w: 78, h: 52, points: 0, label: 'hay bale' },
  fence: { w: 46, h: 64, points: 0, label: 'fence' },
  pumpkin: { w: 52, h: 48, points: 0, label: 'rolling pumpkin' },
  knife: { w: 26, h: 86, points: 0, label: 'carving knife' },
  oven: { w: 110, h: 96, points: 0, label: 'hot oven' },
  pot: { w: 60, h: 44, points: 0, label: 'hanging pot' },
};

export const PICKUP_DEFS = {
  corn: { r: 16, label: 'corn cob' },
  feather: { r: 18, label: 'golden feather' },
  pie: { r: 18, label: 'pumpkin pie' },
};

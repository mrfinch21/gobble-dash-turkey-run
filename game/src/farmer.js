// Gobble Dash — the farmer: Old Man Bramble.
// One clear job: the chase. The farmer is never drawn at a fixed spot by
// accident — a "gap" in metres says how close he is, and every stumble,
// corn cob and clean second of running moves it. He also searches: when
// the turkey hides (slides) under cover he hesitates, and when the gap
// gets small he sprints and shouts, so the player always knows the danger.

import { MAX_GAP, STUMBLE_GAP_LOSS } from './config.js';

export class Farmer {
  constructor() {
    this.reset();
  }

  reset() {
    this.gap = 30; // metres behind the turkey
    this.runPhase = 0;
    this.shoutTimer = 0;
    this.searching = false; // hesitating while the turkey slides
    this.searchTimer = 0;
    this.sprinting = false;
  }

  // Screen x of the farmer's feet, from the gap. 0 gap = on the turkey.
  screenX(turkeyX) {
    const pxPerMetre = 9;
    return turkeyX - 70 - this.gap * pxPerMetre;
  }

  stumbleHit() {
    this.gap = Math.max(0, this.gap - STUMBLE_GAP_LOSS);
    this.shoutTimer = 1.2;
  }

  cornEaten(gain) {
    this.gap = Math.min(MAX_GAP, this.gap + gain);
  }

  update(dt, turkey, speed, recovery) {
    this.runPhase += dt * (this.sprinting ? 18 : 12);
    if (this.shoutTimer > 0) this.shoutTimer -= dt;

    // Hiding: while the turkey slides low, the farmer loses the trail and
    // pauses to look around instead of closing in.
    if (turkey.sliding && turkey.onGround && this.gap < 26) {
      this.searching = true;
      this.searchTimer = 0.9;
    }
    if (this.searchTimer > 0) {
      this.searchTimer -= dt;
      if (this.searchTimer <= 0) this.searching = false;
    }

    if (this.searching) return; // he stands and scans; the gap holds

    // The farmer closes in whenever the turkey stumbles, and drifts back
    // while the turkey runs clean at full speed.
    this.sprinting = this.gap < 10;
    if (turkey.stunned) {
      this.gap = Math.max(0, this.gap - dt * 14);
    } else {
      this.gap = Math.min(MAX_GAP, this.gap + recovery * dt);
    }
    void speed;
  }

  get caught() {
    return this.gap <= 0;
  }

  get danger() {
    if (this.gap < 8) return 'critical';
    if (this.gap < 16) return 'close';
    return 'safe';
  }
}

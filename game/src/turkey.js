// Gobble Dash — the turkey: Giblet.
// One clear job: the player's body, physics and stumble. The turkey runs
// at a fixed screen position while the world scrolls past; jumping, sliding
// and stumbling are the only moves, and every one of them is tuned here.

import {
  GRAVITY,
  GROUND_Y,
  INVULN_TIME,
  JUMP_SPEED,
  SLIDE_TIME,
  STUMBLE_TIME,
  TURKEY_X,
} from './config.js';

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = TURKEY_X;
    this.y = GROUND_Y; // feet position
    this.vy = 0;
    this.onGround = true;
    this.sliding = false;
    this.slideTimer = 0;
    this.stumbleTimer = 0;
    this.invulnTimer = 0;
    this.runPhase = 0; // leg animation clock
    this.wasAirborne = false;
    this.landed = false; // set true on the frame it touches down
  }

  get width() {
    return this.sliding ? 62 : 46;
  }

  get height() {
    return this.sliding ? 34 : 58;
  }

  get top() {
    return this.y - this.height;
  }

  get stunned() {
    return this.stumbleTimer > 0;
  }

  get invulnerable() {
    return this.invulnTimer > 0;
  }

  jump() {
    if (!this.onGround || this.stunned) return false;
    this.vy = -JUMP_SPEED;
    this.onGround = false;
    this.sliding = false;
    this.slideTimer = 0;
    return true;
  }

  startSlide() {
    if (!this.onGround || this.stunned) return;
    this.sliding = true;
    this.slideTimer = SLIDE_TIME;
  }

  stumble() {
    this.stumbleTimer = STUMBLE_TIME;
    this.invulnTimer = INVULN_TIME;
    this.sliding = false;
    this.slideTimer = 0;
  }

  update(dt, input) {
    this.landed = false;
    if (this.stumbleTimer > 0) this.stumbleTimer -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;

    if (this.slideTimer > 0) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.sliding = false;
    }

    if (input.jumpHit()) this.jump();
    if (input.slideHeld()) this.startSlide();

    if (!this.onGround) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.vy = 0;
        this.onGround = true;
        if (this.wasAirborne) this.landed = true;
      }
    }
    this.wasAirborne = !this.onGround;
    this.runPhase += dt * (this.onGround ? 14 : 6);
  }
}

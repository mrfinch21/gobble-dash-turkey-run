// Gobble Dash — the game loop and state machine.
// One clear job: own the screens (title → playing → paused → caught /
// escaped), advance the world each frame, score the run and hand every
// drawing job to the Renderer. Nothing here draws a sprite itself.

import {
  CORN_GAP_GAIN,
  ESCAPE_DISTANCE,
  GAP_RECOVERY,
  GROUND_Y,
  MAX_LIVES,
  POINTS,
  START_LIVES,
  VIEW_H,
  VIEW_W,
  stageFor,
} from './config.js';
import { SoundFX } from './audio.js';
import { Farmer } from './farmer.js';
import { Input, buttonHit } from './input.js';
import { Renderer } from './render.js';
import { Turkey } from './turkey.js';
import { World } from './world.js';
import { applyShot } from './shots.js';

const START_BUTTON = { x: VIEW_W / 2 - 130, y: 268, w: 260, h: 58 };
const AGAIN_BUTTON = { x: VIEW_W / 2 - 130, y: 380, w: 260, h: 58 };

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.sfx = new SoundFX();
    this.input.onKey = () => this.sfx.unlock();
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.world = new World();
    this.state = 'title'; // title | playing | paused | caught | escaped
    this.score = 0;
    this.distance = 0;
    this.lives = START_LIVES;
    this.best = 0;
    this.isNewBest = false;
    this.scroll = 0;
    this.stage = stageFor(0);
    this.banner = '';
    this.bannerTimer = 0;
    this.blink = false;
    this.blinkTimer = 0;
    this.shotMode = null;
    this.lastTime = 0;
    this.statusEl = document.getElementById('status');
    this.announce('Gobble Dash title screen. Press Space or click Start to run.');
  }

  announce(msg) {
    if (this.statusEl) this.statusEl.textContent = msg;
  }

  startRun() {
    this.turkey.reset();
    this.farmer.reset();
    this.world.reset();
    this.score = 0;
    this.distance = 0;
    this.lives = START_LIVES;
    this.isNewBest = false;
    this.scroll = 0;
    this.stage = stageFor(0);
    this.banner = this.stage.banner;
    this.bannerTimer = 2.4;
    this.state = 'playing';
    this.sfx.stopTitleMusic();
    this.sfx.gobble();
    this.announce('Running! Jump the bales and knives, slide under the pots.');
  }

  endRun(result) {
    this.state = result; // 'caught' | 'escaped'
    this.isNewBest = this.score > this.best;
    if (this.isNewBest) this.best = this.score;
    if (result === 'escaped') {
      this.sfx.escaped();
      this.announce(`Escaped! Score ${this.score}. Press R to run again.`);
    } else {
      this.sfx.caught();
      this.announce(`Caught by the farmer. Score ${this.score}. Press R to run again.`);
    }
  }

  updatePlaying(dt) {
    const speed = this.stage.speed;
    this.distance += (speed * dt) / 50;
    this.score += (speed * dt) / 50; // float; the HUD floors it for display
    this.scroll += speed * dt;

    const nextStage = stageFor(this.distance);
    if (nextStage.key !== this.stage.key) {
      this.stage = nextStage;
      this.score += POINTS.stageBonus;
      this.banner = this.stage.banner;
      this.bannerTimer = 2.4;
      this.sfx.stageUp();
      this.announce(`Now in ${this.stage.name}. ${this.stage.banner}`);
    }

    this.turkey.update(dt, this.input);
    if (this.turkey.landed) this.sfx.land();
    this.world.update(dt, speed, this.distance);
    this.farmer.update(dt, this.turkey, speed, GAP_RECOVERY);

    // Pickups.
    const pickup = this.world.collectPickup(this.turkey);
    if (pickup) {
      if (pickup.key === 'corn') {
        this.score += POINTS.corn;
        this.farmer.cornEaten(CORN_GAP_GAIN);
        this.sfx.pickup();
      } else if (pickup.key === 'feather') {
        this.score += POINTS.feather;
        this.sfx.feather();
      } else if (pickup.key === 'pie') {
        this.lives = Math.min(MAX_LIVES, this.lives + 1);
        this.sfx.feather();
      }
    }

    // Hazards.
    const hit = this.world.hitObstacle(this.turkey);
    if (hit) {
      this.lives -= 1;
      this.turkey.stumble();
      this.farmer.stumbleHit();
      if (hit.key === 'knife') this.sfx.knifeWhoosh();
      else if (hit.key === 'oven') this.sfx.ovenRoar();
      else this.sfx.hit();
      this.announce(`Ouch! Hit by a ${hit.key}. ${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left.`);
      if (this.lives <= 0) {
        this.endRun('caught');
        return;
      }
    }

    // The farmer catches up, or the turkey reaches the forest gate.
    if (this.farmer.caught) {
      this.endRun('caught');
      return;
    }
    if (this.distance >= ESCAPE_DISTANCE) {
      this.score += 500; // escape bonus
      this.endRun('escaped');
    }
  }

  update(dt) {
    if (this.input.muteHit()) {
      const muted = this.sfx.toggleMute();
      this.announce(muted ? 'Sound off.' : 'Sound on.');
    }
    this.blinkTimer += dt;
    if (this.blinkTimer > 0.09) {
      this.blinkTimer = 0;
      this.blink = !this.blink;
    }
    if (this.bannerTimer > 0) this.bannerTimer -= dt;

    if (this.state === 'title') {
      this.sfx.startTitleMusic();
      const start = buttonHit(this.input, START_BUTTON.x, START_BUTTON.y, START_BUTTON.w, START_BUTTON.h);
      if (start.clicked || this.input.jumpHit() || this.input.hit('Enter')) {
        this.sfx.click();
        this.startRun();
      }
      return;
    }

    if (this.state === 'playing') {
      if (this.input.pauseHit()) {
        this.state = 'paused';
        this.sfx.click();
        this.announce('Paused. Press P to keep running.');
        return;
      }
      this.updatePlaying(dt);
      return;
    }

    if (this.state === 'paused') {
      if (this.input.pauseHit() || this.input.mouse.clicked) {
        this.state = 'playing';
        this.sfx.click();
        this.announce('Running again.');
      }
      return;
    }

    // caught | escaped
    const again = buttonHit(this.input, AGAIN_BUTTON.x, AGAIN_BUTTON.y, AGAIN_BUTTON.w, AGAIN_BUTTON.h);
    if (again.clicked || this.input.hit('KeyR') || this.input.hit('Enter')) {
      this.sfx.click();
      this.startRun();
    }
  }

  render() {
    const r = this.renderer;
    if (this.state === 'title') {
      r.drawTitle(this.best);
      return;
    }
    if (this.state === 'caught' || this.state === 'escaped') {
      // Freeze the world behind the end screen, as it looked at the end.
      r.clear(this.stage);
      r.drawBackground(this.stage, this.scroll, this.distance);
      r.drawLeaves(this.world.leaves);
      r.drawObstacles(this.world);
      r.drawPickups(this.world);
      r.drawTurkey(this.turkey, false);
      r.drawFarmer(this.farmer, this.turkey.x, GROUND_Y);
      r.drawEnd(this.state, this.score, this.distance, this.best, this.isNewBest);
      return;
    }
    r.clear(this.stage);
    r.drawBackground(this.stage, this.scroll, this.distance);
    r.drawLeaves(this.world.leaves);
    r.drawGoal(this.distance, ESCAPE_DISTANCE);
    r.drawObstacles(this.world);
    r.drawPickups(this.world);
    r.drawTurkey(this.turkey, this.blink);
    r.drawFarmer(this.farmer, this.turkey.x, GROUND_Y);
    r.drawHud({
      score: this.score,
      distance: this.distance,
      escapeDistance: ESCAPE_DISTANCE,
      lives: this.lives,
      maxLives: MAX_LIVES,
      stage: this.stage,
      best: this.best,
      farmerGap: this.farmer.gap,
      farmerDanger: this.farmer.danger,
    });
    if (this.bannerTimer > 0) {
      r.drawBanner(this.banner, Math.min(1, this.bannerTimer));
    }
    if (this.state === 'paused') r.drawPaused();
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000 || 0.016);
    this.lastTime = now;
    if (!this.shotMode) this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }

  // ?shot=start|play|kitchen|escaped&seed=N renders one fixed scene for
  // screenshots. The scene is built by the real game code (same world,
  // same renderer), frozen in place — never a mockup.
  bootFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (!shot) return;
    this.shotMode = shot;
    applyShot(this, shot, Number(params.get('seed') || 7));
    document.title = `Gobble Dash — ${shot}`;
  }
}

export function boot() {
  const canvas = document.getElementById('game');
  const resize = () => {
    const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
    canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
  };
  window.addEventListener('resize', resize);
  resize();
  const game = new Game(canvas);
  game.bootFromQuery();
  // Exposed for play-testing and debugging only; the game never reads it.
  window.__gobbleDash = game;
  requestAnimationFrame((t) => game.frame(t));
  return game;
}

boot();

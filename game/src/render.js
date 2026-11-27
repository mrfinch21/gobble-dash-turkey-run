// Gobble Dash — everything the eye sees, drawn with Canvas 2D.
// One clear job: paint the turkey, the farmer, the farm, the barn, the
// kitchen, the HUD and every screen. All art is original vector art drawn
// in code — no image files, no fonts from the network.

import { GROUND_Y, VIEW_H, VIEW_W } from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '800') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scroll = 0;
  }

  clear(stage) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, stage.sky[0]);
    grad.addColorStop(1, stage.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // Rolling hills, fences, a barn silhouette and the kitchen wall, per stage.
  drawBackground(stage, scroll, distance) {
    const ctx = this.ctx;
    // Sun.
    ctx.fillStyle = 'rgba(255, 244, 200, 0.9)';
    ellipse(ctx, 830, 84, 42, 42);
    ctx.fillStyle = 'rgba(255, 220, 130, 0.55)';
    ellipse(ctx, 830, 84, 58, 58);

    // Far hills.
    ctx.fillStyle = stage.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, 330);
    for (let x = 0; x <= VIEW_W; x += 60) {
      ctx.lineTo(x, 330 - Math.sin((x + scroll * 0.2) / 160) * 26 - 18);
    }
    ctx.lineTo(VIEW_W, GROUND_Y + 4);
    ctx.lineTo(0, GROUND_Y + 4);
    ctx.closePath();
    ctx.fill();

    if (stage.key === 'kitchen') {
      this.drawKitchenWall(scroll);
    } else {
      // Barn silhouette + trees on the near hill.
      ctx.fillStyle = stage.hill;
      const barnX = 700 - ((scroll * 0.4) % 1400);
      ctx.fillRect(barnX, 300, 150, 120);
      ctx.beginPath();
      ctx.moveTo(barnX - 12, 300);
      ctx.lineTo(barnX + 75, 238);
      ctx.lineTo(barnX + 162, 300);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5d3a1a';
      ctx.fillRect(barnX + 58, 352, 34, 68);
      for (let i = 0; i < 4; i++) {
        const tx = 120 + i * 260 - ((scroll * 0.55) % 1040);
        ctx.fillStyle = '#6d3f16';
        ctx.fillRect(tx, 330, 10, 70);
        ctx.fillStyle = stage.key === 'farmyard' ? '#c96a2c' : '#8a4a1d';
        ellipse(ctx, tx + 5, 322, 42, 34);
      }
      // Picket fence along the ground line.
      ctx.fillStyle = '#e8d9b0';
      for (let x = -((scroll * 1) % 46); x < VIEW_W; x += 46) {
        ctx.fillRect(x, GROUND_Y - 26, 7, 26);
        ctx.fillRect(x + 16, GROUND_Y - 26, 7, 26);
        ctx.fillRect(x - 4, GROUND_Y - 20, 44, 5);
        ctx.fillRect(x - 4, GROUND_Y - 10, 44, 5);
      }
    }

    // Ground.
    ctx.fillStyle = stage.groundTop;
    ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, GROUND_Y + 10, VIEW_W, VIEW_H - GROUND_Y - 10);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = -((scroll) % 90); x < VIEW_W; x += 90) {
      ctx.fillRect(x, GROUND_Y + 16, 46, 4);
    }
    void distance;
  }

  drawKitchenWall(scroll) {
    const ctx = this.ctx;
    ctx.fillStyle = '#a34d28';
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let y = 0; y < GROUND_Y; y += 46) {
      ctx.fillRect(0, y, VIEW_W, 3);
    }
    for (let x = -((scroll * 0.3) % 92); x < VIEW_W; x += 92) {
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(x, 0, 3, GROUND_Y);
    }
    // Hanging pans and a shelf of jars.
    ctx.fillStyle = '#3d3d3d';
    for (let i = 0; i < 3; i++) {
      const px = 180 + i * 300 - ((scroll * 0.2) % 900);
      ctx.beginPath();
      ctx.arc(px, 90, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(px - 3, 40, 6, 26);
    }
    ctx.fillStyle = '#7a4a24';
    ctx.fillRect(60, 210, 220, 12);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = ['#d9a441', '#b8512e', '#e07b39', '#8a5a2b'][i];
      ellipse(ctx, 92 + i * 52, 196, 14, 18);
    }
  }

  drawLeaves(leaves) {
    const ctx = this.ctx;
    for (const leaf of leaves) {
      ctx.save();
      ctx.translate(leaf.x + Math.sin(leaf.sway) * 8, leaf.y);
      ctx.rotate(Math.sin(leaf.sway) * 0.9);
      ctx.fillStyle = leaf.hue;
      ellipse(ctx, 0, 0, leaf.s, leaf.s * 0.55);
      ctx.restore();
    }
  }

  // Giblet the turkey, mid-stride. Legs pump, wings flap on a jump, tail
  // fans behind; while sliding he ducks low and flat.
  drawTurkey(t, blink) {
    const ctx = this.ctx;
    if (t.invulnerable && blink) return; // mercy blink
    const x = t.x;
    const y = t.y;
    const legSwing = Math.sin(t.runPhase) * 10;
    ctx.save();
    ctx.translate(x, y);
    if (t.stunned) ctx.rotate(Math.sin(t.runPhase * 2) * 0.08);

    // Legs.
    ctx.strokeStyle = '#e07b39';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(-6 + legSwing, 0);
    ctx.moveTo(8, -14);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();

    if (t.sliding) {
      // Flat duck-slide.
      ctx.fillStyle = '#7a4a24';
      ellipse(ctx, 0, -16, 34, 15);
      ctx.fillStyle = '#8a5a2b';
      ellipse(ctx, 26, -22, 13, 11);
      ctx.fillStyle = '#f2a541';
      ctx.beginPath();
      ctx.moveTo(36, -24);
      ctx.lineTo(48, -19);
      ctx.lineTo(36, -15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d9382b';
      ellipse(ctx, 30, -12, 4, 7);
      ctx.restore();
      return;
    }

    // Tail fan.
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.translate(-22, -34);
      ctx.rotate(i * 0.32);
      ctx.fillStyle = i % 2 === 0 ? '#8a4a1d' : '#a86428';
      ellipse(ctx, 0, -22, 8, 24);
      ctx.fillStyle = '#e8c07a';
      ellipse(ctx, 0, -40, 4, 7);
      ctx.restore();
    }
    // Body.
    ctx.fillStyle = '#8a5a2b';
    ellipse(ctx, 0, -28, 26, 24);
    ctx.fillStyle = '#a06a35';
    ellipse(ctx, 6, -30, 18, 17);
    // Wing, flapping while airborne.
    const flap = t.onGround ? Math.sin(t.runPhase) * 4 : -12;
    ctx.fillStyle = '#6d4423';
    ctx.save();
    ctx.translate(-4, -30);
    ctx.rotate(flap * 0.06);
    ellipse(ctx, -6, 0, 14, 9);
    ctx.restore();
    // Neck + head.
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(16, -58, 10, 26);
    ctx.fillStyle = '#9c6b3a';
    ellipse(ctx, 22, -60, 12, 11);
    // Beak, wattle, eye.
    ctx.fillStyle = '#f2a541';
    ctx.beginPath();
    ctx.moveTo(32, -62);
    ctx.lineTo(44, -58);
    ctx.lineTo(32, -54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9382b';
    ellipse(ctx, 28, -50, 4, 8);
    ctx.fillStyle = '#1c1c1c';
    ellipse(ctx, 26, -63, 2.6, 2.6);
    ctx.fillStyle = '#fff';
    ellipse(ctx, 27, -64, 1, 1);
    ctx.restore();
  }

  // Old Man Bramble, sprinting in with his straw hat and his net.
  drawFarmer(f, turkeyX, groundY) {
    const ctx = this.ctx;
    // Clamp so he is never half-clipped off the left edge while closing in.
    const rawX = f.screenX(turkeyX);
    if (rawX < -160) return; // still off-screen, far behind
    const x = Math.max(0, rawX);
    const y = groundY;
    const legSwing = Math.sin(f.runPhase) * 12;
    ctx.save();
    ctx.translate(x, y);
    // Legs (overalls).
    ctx.strokeStyle = '#3a5a8c';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-4, -46);
    ctx.lineTo(-4 + legSwing, 0);
    ctx.moveTo(8, -46);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();
    // Body: plaid shirt + overalls.
    ctx.fillStyle = '#b8512e';
    rr(ctx, -16, -96, 38, 54, 8);
    ctx.fill();
    ctx.fillStyle = '#3a5a8c';
    ctx.fillRect(-14, -58, 34, 20);
    ctx.fillStyle = '#e8d9b0';
    ctx.fillRect(-16, -76, 38, 4);
    ctx.fillRect(-16, -64, 38, 4);
    // Arms pumping, one hand holding the butterfly net.
    ctx.strokeStyle = '#c98a5a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(16, -88);
    ctx.lineTo(34, -70 + legSwing * 0.4);
    ctx.moveTo(-14, -88);
    ctx.lineTo(-30, -70 - legSwing * 0.4);
    ctx.stroke();
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(34, -70 + legSwing * 0.4);
    ctx.lineTo(58, -96);
    ctx.stroke();
    ctx.strokeStyle = '#d9d9d9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(62, -104, 12, 0, Math.PI * 2);
    ctx.stroke();
    // Head: beard, nose, angry brows.
    ctx.fillStyle = '#e8b98a';
    ellipse(ctx, 2, -108, 13, 14);
    ctx.fillStyle = '#e8e8e8';
    ellipse(ctx, 2, -96, 12, 9);
    ctx.fillStyle = '#1c1c1c';
    ellipse(ctx, 7, -112, 2.4, 2.4);
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(2, -118, 10, 3);
    // Straw hat.
    ctx.fillStyle = '#d9b44a';
    ellipse(ctx, 2, -120, 22, 6);
    ctx.fillStyle = '#c9a13a';
    ctx.beginPath();
    ctx.ellipse(2, -126, 13, 8, 0, Math.PI, 0);
    ctx.fill();
    // Shout bubble when he is closing in.
    if (f.shoutTimer > 0) {
      ctx.fillStyle = '#fff';
      rr(ctx, 24, -170, 116, 36, 10);
      ctx.fill();
      ctx.fillStyle = '#1c1c1c';
      text(ctx, 'COME BACK!', 82, -151, 14, '#1c1c1c');
    }
    ctx.restore();
  }

  drawObstacles(world) {
    const ctx = this.ctx;
    for (const ob of world.obstacles) {
      const cx = ob.x;
      if (ob.key === 'bale') {
        ctx.fillStyle = '#d9a441';
        rr(ctx, cx - ob.w / 2, ob.y - ob.h, ob.w, ob.h, 12);
        ctx.fill();
        ctx.strokeStyle = '#a87c2e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, ob.y - ob.h / 2, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - ob.w / 2 + 6, ob.y - 14);
        ctx.lineTo(cx + ob.w / 2 - 6, ob.y - 14);
        ctx.moveTo(cx - ob.w / 2 + 6, ob.y - ob.h + 14);
        ctx.lineTo(cx + ob.w / 2 - 6, ob.y - ob.h + 14);
        ctx.stroke();
      } else if (ob.key === 'fence') {
        ctx.fillStyle = '#8a5a2b';
        ctx.fillRect(cx - 4, ob.y - ob.h, 8, ob.h);
        ctx.fillRect(cx - ob.w / 2, ob.y - ob.h, ob.w, 8);
        ctx.fillRect(cx - ob.w / 2, ob.y - ob.h + 24, ob.w, 8);
        ctx.fillStyle = '#a06a35';
        ctx.fillRect(cx - ob.w / 2, ob.y - ob.h - 6, ob.w, 6);
      } else if (ob.key === 'pumpkin') {
        ctx.save();
        ctx.translate(cx, ob.y - ob.h / 2);
        ctx.rotate(ob.spin);
        ctx.fillStyle = '#e07b39';
        ellipse(ctx, 0, 0, 26, 24);
        ctx.strokeStyle = '#b85a1e';
        ctx.lineWidth = 3;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, 10 + Math.abs(i) * 8, 24, 0, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
        }
        ctx.fillStyle = '#4a7a2e';
        ctx.fillRect(-3, -30, 6, 10);
        ctx.restore();
      } else if (ob.key === 'knife') {
        // Shadow telegraphs the landing spot while it falls; the warning
        // sits high above the fence line so it cannot hide behind it.
        if (ob.state === 'falling' && ob.fallDelay > 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ellipse(ctx, ob.targetX, GROUND_Y + 4, 22, 6);
          ctx.fillStyle = '#c0392b';
          text(ctx, '!', ob.targetX, GROUND_Y - 62, 30, '#c0392b');
        }
        ctx.save();
        ctx.translate(cx, ob.y + ob.h / 2);
        ctx.rotate(ob.state === 'falling' ? Math.sin(ob.t * 9) * 0.2 : 0.12);
        ctx.fillStyle = '#d9dee6';
        ctx.beginPath();
        ctx.moveTo(-7, -ob.h / 2);
        ctx.lineTo(7, -ob.h / 2);
        ctx.lineTo(2, 6);
        ctx.lineTo(-2, 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2b2b2b';
        rr(ctx, -8, 6, 16, 26, 4);
        ctx.fill();
        ctx.restore();
      } else if (ob.key === 'oven') {
        const flameHigh = Math.sin(world.ovenFlame * 2.4 + ob.flamePhase) > 0.1;
        ctx.fillStyle = '#3d3d3d';
        rr(ctx, cx - ob.w / 2, ob.y - ob.h, ob.w, ob.h, 8);
        ctx.fill();
        ctx.fillStyle = '#222';
        rr(ctx, cx - ob.w / 2 + 12, ob.y - ob.h + 14, ob.w - 24, 44, 6);
        ctx.fill();
        // Fire inside the window, and a jet on top while the flame is high.
        const flick = Math.sin(world.ovenFlame * 14 + ob.x) * 4;
        ctx.fillStyle = flameHigh ? '#ff7b1c' : '#e8a13c';
        ctx.beginPath();
        ctx.moveTo(cx - 32, ob.y - ob.h + 52);
        ctx.quadraticCurveTo(cx - 18, ob.y - ob.h + 10 + flick, cx, ob.y - ob.h + 34);
        ctx.quadraticCurveTo(cx + 18, ob.y - ob.h + 10 + flick, cx + 32, ob.y - ob.h + 52);
        ctx.closePath();
        ctx.fill();
        if (flameHigh) {
          ctx.fillStyle = 'rgba(255, 123, 28, 0.85)';
          ctx.beginPath();
          ctx.moveTo(cx - 26, ob.y - ob.h);
          ctx.quadraticCurveTo(cx - 10, ob.y - ob.h - 44 - flick, cx, ob.y - ob.h - 18);
          ctx.quadraticCurveTo(cx + 10, ob.y - ob.h - 44 - flick, cx + 26, ob.y - ob.h);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffd94a';
          text(ctx, 'HOT!', cx, ob.y - ob.h - 58, 16, '#ffd94a');
        }
        ctx.fillStyle = '#d9dee6';
        ctx.fillRect(cx - 10, ob.y - 10, 20, 6);
      } else if (ob.key === 'pot') {
        const swingX = Math.sin(ob.swing) * 26;
        ctx.strokeStyle = '#2b2b2b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + swingX, 0);
        ctx.lineTo(cx + swingX, ob.y - ob.h);
        ctx.stroke();
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.ellipse(cx + swingX, ob.y - ob.h / 2 + 8, ob.w / 2, ob.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#666';
        ellipse(ctx, cx + swingX, ob.y - ob.h + 8, ob.w / 2 - 8, 6);
        ctx.fillStyle = '#fff';
        text(ctx, 'SLIDE!', cx + swingX, ob.y - ob.h - 22, 14, '#fff');
      }
    }
  }

  drawPickups(world) {
    const ctx = this.ctx;
    for (const p of world.pickups) {
      const bobY = p.y + Math.sin(p.bob) * 4;
      if (p.key === 'corn') {
        ctx.fillStyle = '#f2c14e';
        ellipse(ctx, p.x, bobY, 12, 18);
        ctx.fillStyle = '#e8a13c';
        ctx.fillRect(p.x - 8, bobY - 12, 16, 3);
        ctx.fillRect(p.x - 8, bobY - 2, 16, 3);
        ctx.fillRect(p.x - 8, bobY + 8, 16, 3);
        ctx.fillStyle = '#4a7a2e';
        ctx.beginPath();
        ctx.moveTo(p.x - 12, bobY + 14);
        ctx.lineTo(p.x + 12, bobY + 14);
        ctx.lineTo(p.x, bobY + 26);
        ctx.closePath();
        ctx.fill();
      } else if (p.key === 'feather') {
        ctx.save();
        ctx.translate(p.x, bobY);
        ctx.rotate(Math.sin(p.bob) * 0.3);
        ctx.fillStyle = '#ffd94a';
        ellipse(ctx, 0, 0, 8, 18);
        ctx.fillStyle = '#fff3b0';
        ellipse(ctx, 0, -6, 4, 12);
        ctx.restore();
        text(ctx, '+200', p.x, bobY - 30, 13, '#ffd94a');
      } else if (p.key === 'pie') {
        ctx.fillStyle = '#c96a2c';
        ellipse(ctx, p.x, bobY, 18, 10);
        ctx.fillStyle = '#e8b06a';
        ellipse(ctx, p.x, bobY - 4, 15, 7);
        ctx.fillStyle = '#d9382b';
        ellipse(ctx, p.x - 5, bobY - 6, 3, 3);
        ellipse(ctx, p.x + 5, bobY - 6, 3, 3);
        text(ctx, '+1 LIFE', p.x, bobY - 30, 13, '#ff9e8a');
      }
    }
  }

  // Forest gate at the end of the run, drawn when the turkey is close.
  drawGoal(distance, escapeDistance) {
    const ctx = this.ctx;
    const remaining = escapeDistance - distance;
    if (remaining > 90) return;
    // The gate slides in from the right as you approach and stands at the
    // finish line when you arrive — never drifting off-screen.
    const gx = VIEW_W - 60 - (90 - remaining) * 4;
    ctx.fillStyle = '#4a7a2e';
    ctx.fillRect(gx - 8, GROUND_Y - 190, 12, 190);
    ctx.fillRect(gx + 78, GROUND_Y - 190, 12, 190);
    ctx.fillStyle = '#6d3f16';
    ctx.beginPath();
    ctx.moveTo(gx - 20, GROUND_Y - 190);
    ctx.quadraticCurveTo(gx + 40, GROUND_Y - 250, gx + 100, GROUND_Y - 190);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd94a';
    text(ctx, 'FREEDOM!', gx + 40, GROUND_Y - 205, 20, '#ffd94a');
  }

  // HUD: score, distance, lives, stage, and the farmer proximity meter.
  drawHud(state) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(20, 12, 6, 0.55)';
    rr(ctx, 12, 10, 340, 62, 12);
    ctx.fill();
    text(ctx, `SCORE ${Math.floor(state.score)}`, 26, 32, 22, '#ffd94a', 'left');
    text(ctx, `${Math.floor(state.distance)}m / ${state.escapeDistance}m`, 26, 58, 16, '#fff', 'left');
    // Lives as hearts.
    for (let i = 0; i < state.maxLives; i++) {
      const hx = 392 + i * 34;
      const hy = 34;
      ctx.fillStyle = i < state.lives ? '#e63946' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 12, hy - 4, hx - 6, hy - 14, hx, hy - 6);
      ctx.bezierCurveTo(hx + 6, hy - 14, hx + 12, hy - 4, hx, hy + 8);
      ctx.fill();
    }
    // Dark pill behind the stage label so it reads against the bright sky.
    ctx.fillStyle = 'rgba(20, 12, 6, 0.55)';
    rr(ctx, VIEW_W - 236, 10, 224, 62, 12);
    ctx.fill();
    text(ctx, state.stage.name, VIEW_W - 24, 32, 20, '#fff', 'right');
    text(ctx, state.best > 0 ? `BEST ${Math.floor(state.best)}` : '', VIEW_W - 24, 58, 14, '#ffd94a', 'right');

    // Farmer proximity meter along the bottom.
    const gapFrac = Math.max(0, Math.min(1, state.farmerGap / 42));
    const barW = 300;
    const barX = VIEW_W / 2 - barW / 2;
    const barY = VIEW_H - 34;
    ctx.fillStyle = 'rgba(20, 12, 6, 0.55)';
    rr(ctx, barX - 78, barY - 8, barW + 140, 26, 12);
    ctx.fill();
    text(ctx, 'FARMER', barX - 68, barY + 5, 13, '#ffb3a0', 'left');
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    rr(ctx, barX, barY, barW, 10, 5);
    ctx.fill();
    ctx.fillStyle = gapFrac < 0.2 ? '#e63946' : gapFrac < 0.4 ? '#f2a541' : '#7ac74f';
    rr(ctx, barX, barY, Math.max(8, barW * gapFrac), 10, 5);
    ctx.fill();
    text(ctx, 'YOU', barX + barW + 12, barY + 5, 13, '#ffd94a', 'left');
    if (state.farmerDanger === 'critical') {
      text(ctx, "HE'S RIGHT BEHIND YOU!", VIEW_W / 2, barY - 24, 17, '#ff5a4a');
    }
  }

  drawBanner(banner, alpha) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(20, 12, 6, 0.6)';
    rr(ctx, VIEW_W / 2 - 300, 96, 600, 52, 14);
    ctx.fill();
    text(ctx, banner, VIEW_W / 2, 122, 24, '#ffd94a');
    ctx.restore();
  }

  drawPaused() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(20, 12, 6, 0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'PAUSED', VIEW_W / 2, VIEW_H / 2 - 30, 52, '#ffd94a');
    text(ctx, 'Press P or click to keep running', VIEW_W / 2, VIEW_H / 2 + 24, 18, '#fff');
  }

  // Title screen: big turkey, the story, the controls, START button.
  drawTitle(best) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, '#ffcf8a');
    grad.addColorStop(1, '#e07b39');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Autumn leaves drifting on the title.
    for (let i = 0; i < 18; i++) {
      const lx = (i * 173) % VIEW_W;
      const ly = (i * 97) % 260;
      ctx.fillStyle = ['#d9a441', '#b8512e', '#e07b39'][i % 3];
      ellipse(ctx, lx, ly, 8, 5);
    }
    ctx.fillStyle = 'rgba(122, 74, 36, 0.9)';
    ellipse(ctx, 845, 482, 120, 22);
    // Big hero turkey, bottom-right so the button stays clear.
    ctx.save();
    ctx.translate(845, 462);
    ctx.scale(1.5, 1.5);
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.translate(-22, -34);
      ctx.rotate(i * 0.32);
      ctx.fillStyle = i % 2 === 0 ? '#8a4a1d' : '#a86428';
      ellipse(ctx, 0, -22, 8, 24);
      ctx.restore();
    }
    ctx.fillStyle = '#8a5a2b';
    ellipse(ctx, 0, -28, 26, 24);
    ctx.fillStyle = '#9c6b3a';
    ellipse(ctx, 22, -60, 12, 11);
    ctx.fillStyle = '#f2a541';
    ctx.beginPath();
    ctx.moveTo(32, -62);
    ctx.lineTo(44, -58);
    ctx.lineTo(32, -54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9382b';
    ellipse(ctx, 28, -50, 4, 8);
    ctx.fillStyle = '#1c1c1c';
    ellipse(ctx, 26, -63, 2.6, 2.6);
    ctx.restore();

    text(ctx, 'GOBBLE DASH', VIEW_W / 2, 92, 64, '#5d2c0c');
    text(ctx, 'The Great Thanksgiving Escape', VIEW_W / 2, 142, 26, '#7a3a14');
    text(ctx, 'Thanksgiving is coming. Old Man Bramble wants YOU for dinner.', VIEW_W / 2, 186, 19, '#4a2408');
    text(ctx, 'Outrun the farmer, dodge the oven and the carving knives,', VIEW_W / 2, 212, 19, '#4a2408');
    text(ctx, 'and reach the forest gate 1200m away.', VIEW_W / 2, 238, 19, '#4a2408');

    // START button.
    ctx.fillStyle = '#2e7d32';
    rr(ctx, VIEW_W / 2 - 130, 268, 260, 58, 16);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    rr(ctx, VIEW_W / 2 - 130, 268, 260, 14, 16);
    ctx.fill();
    text(ctx, '▶  START THE ESCAPE', VIEW_W / 2, 298, 24, '#fff');

    text(ctx, 'SPACE / ↑ / CLICK — jump      ↓ / S — slide under pots', VIEW_W / 2, 356, 17, '#5d2c0c');
    text(ctx, 'Grab corn to slow the farmer  •  P — pause  •  M — mute', VIEW_W / 2, 382, 17, '#5d2c0c');
    if (best > 0) text(ctx, `Best escape so far: ${best} points`, VIEW_W / 2, 414, 17, '#7a3a14');
  }

  // End screens: caught (farmer wins) or escaped (freedom).
  drawEnd(result, score, distance, best, isNewBest) {
    const ctx = this.ctx;
    ctx.fillStyle = result === 'escaped' ? 'rgba(46, 90, 30, 0.88)' : 'rgba(60, 16, 8, 0.88)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (result === 'escaped') {
      text(ctx, '🦃  ESCAPED!  🦃', VIEW_W / 2, 110, 58, '#ffd94a');
      text(ctx, 'Giblet made it to the forest — no Thanksgiving dinner today!', VIEW_W / 2, 168, 21, '#fff');
      text(ctx, 'The farmer is still looking under the hay bales.', VIEW_W / 2, 198, 18, '#d9f2c2');
    } else {
      text(ctx, 'CAUGHT!', VIEW_W / 2, 110, 58, '#ff8a7a');
      text(ctx, 'Old Man Bramble got you. The oven was already warm…', VIEW_W / 2, 168, 21, '#fff');
      text(ctx, 'Next time: jump the knives, slide the pots, eat the corn.', VIEW_W / 2, 198, 18, '#ffd9c2');
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    rr(ctx, VIEW_W / 2 - 220, 240, 440, 110, 16);
    ctx.fill();
    text(ctx, `SCORE  ${Math.floor(score)}`, VIEW_W / 2, 272, 30, '#ffd94a');
    text(ctx, `Distance  ${Math.floor(distance)}m / 1200m`, VIEW_W / 2, 306, 20, '#fff');
    text(ctx, isNewBest ? '★ NEW BEST SCORE! ★' : `Best: ${Math.floor(best)}`, VIEW_W / 2, 334, 18, '#ffd94a');

    ctx.fillStyle = '#2e7d32';
    rr(ctx, VIEW_W / 2 - 130, 380, 260, 58, 16);
    ctx.fill();
    text(ctx, '↻  RUN AGAIN  (R)', VIEW_W / 2, 410, 24, '#fff');
    text(ctx, 'or press Enter', VIEW_W / 2, 462, 16, '#fff');
  }
}

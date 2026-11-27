// Gobble Dash — keyboard and mouse input.
// One clear job: turn keys and clicks into game intents (jump, slide,
// pause, confirm) and report where the mouse is for buttons.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered, consumed each frame
    this.mouse = { x: 0, y: 0, clicked: false, down: false };
    this.onKey = null; // hook for the game to unlock audio on first gesture

    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (!e.repeat) {
        this.keys.add(e.code);
        this.pressed.add(e.code);
      }
      if (this.onKey) this.onKey(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
    });
    canvas.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
      this.mouse.down = true;
      this.mouse.clicked = true;
      if (this.onKey) this.onKey('Pointer');
    });
    window.addEventListener('pointerup', () => {
      this.mouse.down = false;
    });
  }

  held(code) {
    return this.keys.has(code);
  }

  // True once, on the frame the key went down; call after the frame ends
  // via endFrame() to clear.
  hit(code) {
    return this.pressed.has(code);
  }

  jumpHit() {
    return (
      this.hit('Space') ||
      this.hit('ArrowUp') ||
      this.hit('KeyW') ||
      this.mouse.clicked
    );
  }

  slideHeld() {
    return this.held('ArrowDown') || this.held('KeyS');
  }

  confirmHit() {
    return this.hit('Enter') || this.hit('KeyR') || this.mouse.clicked;
  }

  pauseHit() {
    return this.hit('KeyP') || this.hit('Escape');
  }

  muteHit() {
    return this.hit('KeyM');
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}

// A rectangular button the mouse can hover and click.
export function buttonHit(input, x, y, w, h) {
  const m = input.mouse;
  const hover = m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h;
  return { hover, clicked: hover && input.mouse.clicked };
}

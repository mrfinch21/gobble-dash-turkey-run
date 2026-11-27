// Gobble Dash — all sound, synthesised live with WebAudio.
// One clear job: every gobble, chirp and thud. No audio files are shipped;
// each effect is a few oscillators shaped in code, so the game stays
// fully offline and dependency-free.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  // Browsers only allow audio after a user gesture; call from any click/key.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
    return this.muted;
  }

  tone(freq, dur, type, vol, slideTo, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.5, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol, lowpass, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 1200;
    const gain = this.ctx.createGain();
    gain.gain.value = vol || 0.4;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  // The turkey's signature: a quick gobble-gobble.
  gobble() {
    this.tone(320, 0.09, 'square', 0.32, 180);
    this.tone(300, 0.09, 'square', 0.32, 170, 0.11);
    this.tone(340, 0.12, 'square', 0.3, 200, 0.22);
  }

  jump() {
    this.tone(280, 0.16, 'sine', 0.4, 640);
  }

  land() {
    this.noise(0.08, 0.25, 500);
  }

  pickup() {
    this.tone(880, 0.09, 'triangle', 0.45, 1320);
    this.tone(1320, 0.12, 'triangle', 0.3, 1760, 0.07);
  }

  feather() {
    [660, 880, 1100, 1320].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.35, f * 1.2, i * 0.06));
  }

  hit() {
    this.noise(0.22, 0.6, 900);
    this.tone(140, 0.25, 'sawtooth', 0.5, 60);
  }

  knifeWhoosh() {
    this.noise(0.3, 0.35, 2600);
  }

  ovenRoar() {
    this.noise(0.5, 0.3, 700);
  }

  click() {
    this.tone(700, 0.05, 'square', 0.25, 900);
  }

  stageUp() {
    [523, 659, 784].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.4, f, i * 0.09));
  }

  caught() {
    [392, 370, 349, 311].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.35, f * 0.94, i * 0.22));
    this.noise(0.4, 0.3, 600, 0.9);
  }

  escaped() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.42, f, i * 0.13));
    this.gobble();
  }

  // A light banjo-ish pluck loop for the title screen, kept tiny on purpose.
  startTitleMusic() {
    if (!this.ctx || this.musicTimer) return;
    const notes = [392, 440, 523, 587, 659, 587, 523, 440];
    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const f = notes[this.musicStep % notes.length];
      this.tone(f, 0.22, 'triangle', 0.16, f);
      this.musicStep += 1;
    }, 260);
  }

  stopTitleMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

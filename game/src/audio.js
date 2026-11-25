// audio.js — every sound in Ember & Thyme is synthesised live with the
// Web Audio API: no audio files, no network. A chop thock, a grill sizzle,
// a serve ding, a coin pop and a soft kitchen hum.

export function createSoundFX() {
  const fx = {
    ctx: null,
    muted: false,
    sizzleNode: null,

    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return true;
    },

    toggleMute() {
      this.muted = !this.muted;
      if (this.muted) this.stopSizzle();
      return this.muted;
    },

    blip(freq, dur, type, vol, slideTo = null) {
      if (this.muted || !this.ensure()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },

    noiseBurst(dur, vol, filterFreq) {
      if (this.muted || !this.ensure()) return;
      const t = this.ctx.currentTime;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(filter).connect(gain).connect(this.ctx.destination);
      src.start(t);
    },

    pickup() { this.blip(520, 0.09, 'sine', 0.12, 760); },
    chop() { this.noiseBurst(0.08, 0.25, 900); this.blip(180, 0.07, 'triangle', 0.18, 90); },
    place() { this.blip(300, 0.08, 'triangle', 0.14, 210); },
    ding() { this.blip(880, 0.35, 'sine', 0.16); this.blip(1320, 0.4, 'sine', 0.1); },
    coin() { this.blip(990, 0.1, 'square', 0.07, 1480); },
    error() { this.blip(160, 0.18, 'sawtooth', 0.1, 110); },
    expired() { this.blip(320, 0.4, 'sawtooth', 0.12, 140); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => {
        setTimeout(() => this.blip(f, 0.3, 'triangle', 0.14), i * 110);
      });
    },

    // A looping filtered-noise sizzle while anything cooks on the grill.
    startSizzle() {
      if (this.muted || !this.ensure() || this.sizzleNode) return;
      const len = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3200;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.035;
      src.connect(filter).connect(gain).connect(this.ctx.destination);
      src.start();
      this.sizzleNode = { src, gain };
    },

    stopSizzle() {
      if (!this.sizzleNode) return;
      try { this.sizzleNode.src.stop(); } catch (_e) { /* already stopped */ }
      this.sizzleNode = null;
    },
  };
  return fx;
}

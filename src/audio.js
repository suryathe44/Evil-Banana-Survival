import { LANG } from "./language.js";

const MAX_MASTER_VOLUME = 0.16;
const AMBIENT_VOLUME = 0.026;
const HEARTBEAT_VOLUME = 0.055;
const WHISPER_VOLUME = 0.16;

export class AudioSystem {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.heartbeatGain = null;
    this.droneGain = null;
    this.activeNodes = [];
    this.heartbeatTimer = 0;
    this.whisperTimer = 3;
    this.jumpscareCooldown = 0;
    this.isMuted = false;
  }

  async start() {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.context.destination);
      this.createAmbientLoop();
      this.createHeartbeat();
    }
    if (this.context.state === "suspended") await this.context.resume();
    this.fadeGain(this.masterGain, this.isMuted ? 0 : MAX_MASTER_VOLUME, 1.2);
  }

  createAmbientLoop() {
    this.ambientGain = this.context.createGain();
    this.droneGain = this.context.createGain();
    this.ambientGain.gain.value = 0;
    this.droneGain.gain.value = 0;

    const rumble = this.createNoiseLoop();
    const rumbleFilter = this.context.createBiquadFilter();
    rumbleFilter.type = "lowpass";
    rumbleFilter.frequency.value = 135;
    rumbleFilter.Q.value = 0.7;

    rumble.connect(rumbleFilter);
    rumbleFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    [34, 47].forEach((baseFrequency, index) => {
      const oscillator = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = baseFrequency + Math.random() * 4;
      filter.type = "lowpass";
      filter.frequency.value = 220;
      gain.gain.value = index === 0 ? 0.34 : 0.2;
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(this.droneGain);
      oscillator.start();
      this.activeNodes.push(oscillator);
    });

    this.droneGain.connect(this.masterGain);
    rumble.start();
    this.activeNodes.push(rumble);
    this.fadeGain(this.ambientGain, AMBIENT_VOLUME, 2.8);
    this.fadeGain(this.droneGain, 0.018, 3.4);
  }

  createNoiseLoop() {
    const length = this.context.sampleRate * 2;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      last = last * 0.985 + (Math.random() * 2 - 1) * 0.015;
      data[i] = last;
    }
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  createHeartbeat() {
    this.heartbeatGain = this.context.createGain();
    this.heartbeatGain.gain.value = 0;
    this.heartbeatGain.connect(this.masterGain);
  }

  setMuted(isMuted) {
    this.isMuted = isMuted;
    if (!this.context || !this.masterGain) return;
    this.fadeGain(this.masterGain, isMuted ? 0 : MAX_MASTER_VOLUME, 0.25);
    if (isMuted) this.stopWhisper();
  }

  update(delta, monsterDistance) {
    if (!this.context) return;
    const nearAmount = Math.max(0, 1 - monsterDistance / 9);
    this.jumpscareCooldown = Math.max(0, this.jumpscareCooldown - delta);
    this.fadeGain(this.heartbeatGain, nearAmount > 0.18 ? nearAmount * HEARTBEAT_VOLUME : 0, 0.35);

    this.heartbeatTimer -= delta;
    if (!this.isMuted && nearAmount > 0.24 && this.heartbeatTimer <= 0 && this.jumpscareCooldown <= 0) {
      this.playHeartbeatPulse(54 + nearAmount * 18);
      this.heartbeatTimer = 1.08 - nearAmount * 0.36;
    }

    this.whisperTimer -= delta;
    if (!this.isMuted && nearAmount > 0.42 && this.whisperTimer <= 0 && this.jumpscareCooldown <= 0) {
      this.playBananaWhisper();
      this.whisperTimer = 7 + Math.random() * 6;
    }
  }

  playHeartbeatPulse(frequency) {
    if (!this.context || this.isMuted) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.value = frequency + (Math.random() - 0.5) * 5;
    filter.type = "lowpass";
    filter.frequency.value = 105;
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, this.context.currentTime + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.24);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.heartbeatGain);
    osc.start();
    osc.stop(this.context.currentTime + 0.26);
  }

  playJumpscare() {
    if (!this.context || this.isMuted) return;
    this.stopAfterReset();
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(92, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(31, this.context.currentTime + 0.38);
    filter.type = "lowpass";
    filter.frequency.value = 420;
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, this.context.currentTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.48);
    osc.connect(gain);
    gain.connect(filter);
    filter.connect(this.masterGain);
    osc.start();
    osc.stop(this.context.currentTime + 0.52);
  }

  stopAfterReset() {
    if (!this.context) return;
    this.jumpscareCooldown = 1.1;
    this.heartbeatTimer = 1.1;
    this.whisperTimer = 4 + Math.random() * 3;
    this.fadeGain(this.heartbeatGain, 0, 0.16);
    this.stopWhisper();
  }

  playBananaWhisper() {
    const speech = window.speechSynthesis;
    if (!speech) return;
    const languageKeys = Object.keys(LANG);
    const language = languageKeys[Math.floor(Math.random() * languageKeys.length)];
    const jokes = LANG[language].jokes;
    const text = jokes[Math.floor(Math.random() * jokes.length)];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "hi" ? "hi-IN" : language === "es" ? "es-ES" : "en-US";
    utterance.volume = WHISPER_VOLUME;
    utterance.rate = 0.62 + Math.random() * 0.16;
    utterance.pitch = 0.45 + Math.random() * 0.18;
    speech.cancel();
    speech.speak(utterance);
  }

  stopWhisper() {
    window.speechSynthesis?.cancel();
  }

  fadeGain(gainNode, target, duration) {
    if (!gainNode || !this.context) return;
    const now = this.context.currentTime;
    const safeTarget = Math.max(0, Math.min(MAX_MASTER_VOLUME, target));
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(safeTarget, now, Math.max(0.03, duration / 4));
  }
}

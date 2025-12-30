
// Simple synth for retro sounds using Web Audio API

let audioCtx: AudioContext | null = null;

const getAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, delay = 0, vol = 0.1) => {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
};

export const playMoveSound = () => {
  playTone(400, 'sine', 0.1, 0, 0.05);
};

export const playCaptureSound = () => {
  playTone(150, 'square', 0.1, 0, 0.1);
  playTone(100, 'sawtooth', 0.15, 0.05, 0.1);
};

export const playCheckSound = () => {
  playTone(600, 'sine', 0.1, 0, 0.1);
  playTone(800, 'sine', 0.2, 0.1, 0.1);
};

export const playWinSound = () => {
  const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]; 
  notes.forEach((freq, i) => {
    playTone(freq, 'square', 0.3, i * 0.15, 0.1);
  });
};

export const playStartSound = () => {
    playTone(440, 'triangle', 0.1, 0, 0.1);
    playTone(880, 'triangle', 0.4, 0.1, 0.1);
};

// --- Combat Sounds ---

export const playThunderSound = () => {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

  // Noise buffer for rumble
  const bufferSize = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  
  noiseGain.gain.setValueAtTime(0.5, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(filter);
  filter.connect(ctx.destination);
  
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  osc.start();
  noise.start();
  osc.stop(ctx.currentTime + 0.5);
  noise.stop(ctx.currentTime + 0.5);
};

export const playFireSound = () => {
  const ctx = getAudioCtx();
  const bufferSize = ctx.sampleRate * 0.8;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.8);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  noise.start();
};

export const playPsychicSound = () => {
  playTone(800, 'sine', 0.1, 0, 0.1);
  playTone(1200, 'sine', 0.1, 0.1, 0.1);
  playTone(600, 'sine', 0.3, 0.2, 0.1);
};

export const playSlamSound = () => {
    playTone(100, 'square', 0.2, 0, 0.3);
};

export const playTeleportSound = () => {
    playTone(400, 'sine', 0.2, 0, 0.1);
};

export const playGhostSound = () => {
    playTone(300, 'sine', 0.3, 0, 0.05);
};

// --- New Sounds ---

export const playCritSound = () => {
    // High impact hit
    playTone(150, 'square', 0.1, 0, 0.4);
    playTone(100, 'sawtooth', 0.3, 0, 0.4);
    playTone(50, 'triangle', 0.5, 0, 0.5);
};

export const playLevelUpSound = () => {
    // Short ascending triplet
    playTone(523.25, 'triangle', 0.2, 0, 0.1);
    playTone(659.25, 'triangle', 0.2, 0.1, 0.1);
    playTone(1046.50, 'square', 0.4, 0.2, 0.1);
};

export const playEmoteSound = () => {
    // Simple Pop
    playTone(800, 'sine', 0.05, 0, 0.05);
};

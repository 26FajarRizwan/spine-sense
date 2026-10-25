/**
 * High-priority ergonomic warning synthesizer (Web Audio API).
 * Dual-tone sawtooth/square pulses at 880Hz ↔ 1046Hz for SLUMPING.
 */

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) sharedCtx = new Ctx();
  return sharedCtx;
}

/** Soft warning tone (non-critical). Volume 0–1. */
export function playWarningAlert(volume = 0.7): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume();

  const peak = Math.max(0.0001, Math.min(1, volume) * 0.16);
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(740, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.22);
}

/**
 * Critical slump alert: 3 sharp dual-tone pulses (sawtooth + square),
 * alternating 880Hz / 1046Hz with max gain and fast attack.
 */
export function playCriticalSlumpAlert(volume = 1): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume();

  const level = Math.max(0.15, Math.min(1, volume));
  const peak = level * 0.55;
  const now = ctx.currentTime;
  const freqs = [880, 1046, 880] as const;
  const pulseGap = 0.16;
  const pulseLen = 0.11;

  freqs.forEach((freq, index) => {
    const t0 = now + index * pulseGap;

    const saw = ctx.createOscillator();
    const square = ctx.createOscillator();
    const mix = ctx.createGain();
    const envelope = ctx.createGain();

    saw.type = "sawtooth";
    square.type = "square";
    saw.frequency.setValueAtTime(freq, t0);
    square.frequency.setValueAtTime(freq, t0);

    mix.gain.setValueAtTime(0.55, t0);
    const squareGain = ctx.createGain();
    squareGain.gain.setValueAtTime(0.35, t0);

    // Sharp attack, rapid decay
    envelope.gain.setValueAtTime(0.0001, t0);
    envelope.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t0 + pulseLen);

    saw.connect(mix);
    square.connect(squareGain);
    squareGain.connect(mix);
    mix.connect(envelope);
    envelope.connect(ctx.destination);

    saw.start(t0);
    square.start(t0);
    saw.stop(t0 + pulseLen + 0.02);
    square.stop(t0 + pulseLen + 0.02);
  });
}

/** Settings “Test Critical Alert” trigger. */
export function playTestCriticalAlert(volume = 1): void {
  playCriticalSlumpAlert(volume);
}

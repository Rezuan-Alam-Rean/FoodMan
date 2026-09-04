// web audio api sound synthesizer for zero-dependency audible alarms and chimes
'use client';

export type SoundVariant = 'kitchen_order' | 'rider_offer' | 'food_ready_delivery' | 'cancellation';

export interface PlayAlarmOptions {
  durationSeconds?: number;
}

let audioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

// active repeating alarm tracking for restaurant & rider (30-40s alarms)
let activeAlarmInterval: ReturnType<typeof setInterval> | null = null;
let activeAlarmTimeout: ReturnType<typeof setTimeout> | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

// unlock browser audio on first user touch/click/key
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state !== 'running') {
      ctx.resume().then(() => {
        isAudioUnlocked = true;
      }).catch(() => {});
    } else {
      isAudioUnlocked = true;
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };

  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
}

/**
 * stop any currently repeating alarm immediately
 */
export function stopAlarmSound() {
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
  if (activeAlarmTimeout) {
    clearTimeout(activeAlarmTimeout);
    activeAlarmTimeout = null;
  }
}

/**
 * play an alarm sound synthesized via web audio api.
 * For operational notifications ('kitchen_order' for restaurant and 'rider_offer' for rider),
 * loops continuously for 30-40 seconds (default: 35s) or until stopped via stopAlarmSound().
 * For customer and status notifications ('food_ready_delivery' and 'cancellation'),
 * plays a single-shot pleasant chime or warning tone.
 *
 * @param variant - type of alarm chime to play
 * @param options - playback options (e.g. custom durationSeconds)
 */
export function playAlarmSound(
  variant: SoundVariant = 'food_ready_delivery',
  options?: PlayAlarmOptions
) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Stop any previously running alarm loop before starting a new one
    stopAlarmSound();

    const durationSeconds = options?.durationSeconds ?? 35;

    if (variant === 'kitchen_order') {
      // repeating resonant kitchen bell (high attention double chime for restaurant)
      const playTone = (freq: number, start: number, duration: number, peakGain = 0.4) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      };

      const playKitchenPulse = () => {
        const c = getAudioContext();
        if (!c) return;
        if (c.state === 'suspended') {
          c.resume().catch(() => {});
        }
        const t = c.currentTime;
        playTone(880, t, 0.25, 0.4); // A5
        playTone(1174.66, t + 0.15, 0.4, 0.45); // D6
        playTone(880, t + 0.45, 0.25, 0.4); // A5
        playTone(1174.66, t + 0.6, 0.5, 0.45); // D6
      };

      // 1. Play immediate first pulse
      playKitchenPulse();

      // 2. Repeat every 1.4s for the duration (30-40s long alarm, default 35s)
      activeAlarmInterval = setInterval(playKitchenPulse, 1400);
      activeAlarmTimeout = setTimeout(() => {
        stopAlarmSound();
      }, durationSeconds * 1000);
    } else if (variant === 'rider_offer') {
      // rapid urgent radar ping for couriers (30-40s long alarm)
      const playChirp = (freq: number, start: number, sweepFreq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(sweepFreq, start + 0.12);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.35, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.15);
      };

      const playRiderPulse = () => {
        const c = getAudioContext();
        if (!c) return;
        if (c.state === 'suspended') {
          c.resume().catch(() => {});
        }
        const t = c.currentTime;
        playChirp(587.33, t, 783.99); // D5 -> G5
        playChirp(783.99, t + 0.12, 1046.5); // G5 -> C6
        playChirp(1046.5, t + 0.24, 1396.91); // C6 -> F6
      };

      // 1. Play immediate first pulse
      playRiderPulse();

      // 2. Repeat every 1.1s for the duration (30-40s long alarm, default 35s)
      activeAlarmInterval = setInterval(playRiderPulse, 1100);
      activeAlarmTimeout = setTimeout(() => {
        stopAlarmSound();
      }, durationSeconds * 1000);
    } else if (variant === 'food_ready_delivery') {
      // melodic upbeat chime: "food is ready / out for delivery" (customer 1-shot pleasant chime)
      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: 0 }, // C5
        { freq: 659.25, time: 0.14 }, // E5
        { freq: 783.99, time: 0.28 }, // G5
        { freq: 1046.5, time: 0.44 }, // C6
      ];

      notes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.exponentialRampToValueAtTime(0.3, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + 0.38);
      });
    } else if (variant === 'cancellation') {
      // low warning double tone (1-shot)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    }
  } catch {
    // ignore audio synthesis limitations
  }
}

// Expose on window for easy developer testing in browser console
if (typeof window !== 'undefined') {
  (window as any).playAlarmSound = playAlarmSound;
  (window as any).stopAlarmSound = stopAlarmSound;
}

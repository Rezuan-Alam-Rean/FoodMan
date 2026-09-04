// web audio api sound synthesizer for zero-dependency audible alarms and chimes
'use client';

export type SoundVariant = 'kitchen_order' | 'rider_offer' | 'food_ready_delivery' | 'cancellation';

export interface PlayAlarmOptions {
  isLongAlarm?: boolean;
  durationSeconds?: number;
}

let audioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

// active alarm state tracking
let activeAlarmInterval: ReturnType<typeof setInterval> | null = null;
let activeAlarmTimeout: ReturnType<typeof setTimeout> | null = null;
let activeMasterGain: GainNode | null = null;

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
 * stop any currently playing or repeating alarm immediately
 */
export function stopActiveAlarm() {
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
  if (activeAlarmTimeout) {
    clearTimeout(activeAlarmTimeout);
    activeAlarmTimeout = null;
  }
  if (activeMasterGain && audioCtx) {
    try {
      activeMasterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      activeMasterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      activeMasterGain.disconnect();
    } catch {
      // ignore
    }
    activeMasterGain = null;
  }
}

/**
 * Synthesizes a single pulse of a kitchen order bell (restaurant)
 */
function playKitchenOrderPulse(ctx: AudioContext, destinationNode: AudioNode) {
  const now = ctx.currentTime;

  const playTone = (freq: number, start: number, duration: number, peakGain = 0.45) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(destinationNode);

    osc.start(start);
    osc.stop(start + duration);
  };

  // High-attention dual bell strike (restaurant order bell)
  playTone(880, now, 0.28, 0.42);            // A5
  playTone(1318.51, now + 0.12, 0.38, 0.48); // E6
  playTone(880, now + 0.45, 0.28, 0.38);     // A5
  playTone(1318.51, now + 0.58, 0.48, 0.48); // E6
}

/**
 * Synthesizes a single pulse of a rider offer radar ping (courier)
 */
function playRiderOfferPulse(ctx: AudioContext, destinationNode: AudioNode) {
  const now = ctx.currentTime;

  const playChirp = (freq: number, start: number, sweepFreq: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(sweepFreq, start + 0.12);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.4, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);

    osc.connect(gain);
    gain.connect(destinationNode);

    osc.start(start);
    osc.stop(start + 0.15);
  };

  // Urgent 3-tone rising radar alert
  playChirp(659.25, now, 783.99);          // E5 -> G5
  playChirp(880, now + 0.12, 1046.5);       // A5 -> C6
  playChirp(1174.66, now + 0.24, 1396.91);  // D6 -> F6
}

/**
 * Synthesizes customer melodic chime: food is ready / out for delivery
 */
function playFoodReadyChime(ctx: AudioContext, destinationNode: AudioNode) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0 },    // C5
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
    gain.connect(destinationNode);

    osc.start(now + time);
    osc.stop(now + time + 0.38);
  });
}

/**
 * Synthesizes order cancellation warning
 */
function playCancellationTone(ctx: AudioContext, destinationNode: AudioNode) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(destinationNode);

  osc.start(now);
  osc.stop(now + 0.36);
}

/**
 * play an alarm sound synthesized via web audio api.
 * For long alarms (rider & restaurant), loops continuously for 30-40 seconds (default: 35s)
 * or until dismissed / stopActiveAlarm() is called.
 *
 * @param variant - SoundVariant
 * @param options - { isLongAlarm?: boolean, durationSeconds?: number }
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

    // Stop any existing playing alarm before starting new
    stopActiveAlarm();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1, ctx.currentTime);
    masterGain.connect(ctx.destination);
    activeMasterGain = masterGain;

    // Continuous 30-40 second alarm for rider & restaurant
    const isRepeating =
      options?.isLongAlarm !== undefined
        ? options.isLongAlarm
        : variant === 'kitchen_order' || variant === 'rider_offer';

    const durationSeconds = options?.durationSeconds || 35;

    if (isRepeating) {
      const intervalMs = variant === 'kitchen_order' ? 1400 : 1250;

      // Play immediate first pulse
      if (variant === 'kitchen_order') {
        playKitchenOrderPulse(ctx, masterGain);
      } else {
        playRiderOfferPulse(ctx, masterGain);
      }

      // Loop pulses every interval
      activeAlarmInterval = setInterval(() => {
        if (!activeMasterGain || !audioCtx) return;
        if (variant === 'kitchen_order') {
          playKitchenOrderPulse(audioCtx, activeMasterGain);
        } else {
          playRiderOfferPulse(audioCtx, activeMasterGain);
        }
      }, intervalMs);

      // Auto-stop after durationSeconds (e.g. 35 seconds)
      activeAlarmTimeout = setTimeout(() => {
        stopActiveAlarm();
      }, durationSeconds * 1000);
    } else {
      // Single-shot chime
      if (variant === 'food_ready_delivery') {
        playFoodReadyChime(ctx, masterGain);
      } else if (variant === 'cancellation') {
        playCancellationTone(ctx, masterGain);
      } else if (variant === 'kitchen_order') {
        playKitchenOrderPulse(ctx, masterGain);
      } else {
        playRiderOfferPulse(ctx, masterGain);
      }
    }
  } catch {
    // Ignore audio synthesis limitations
  }
}

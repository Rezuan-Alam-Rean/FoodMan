// web audio api & html5 audio sound synthesizer for audible alarms and chimes
'use client';

export type SoundVariant = 'kitchen_order' | 'rider_offer' | 'food_ready_delivery' | 'cancellation';

export interface PlayAlarmOptions {
  isLongAlarm?: boolean;
  durationSeconds?: number;
}

let audioCtx: AudioContext | null = null;
let currentAlarmId = 0;
let activeAlarmInterval: ReturnType<typeof setInterval> | null = null;
let activeAlarmTimeout: ReturnType<typeof setTimeout> | null = null;
let activeAudioElement: HTMLAudioElement | null = null;

export function getAudioContext(): AudioContext | null {
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

// unlock browser audio on ANY user touch/click/key
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  window.addEventListener('click', unlockAudio, { capture: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { capture: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { capture: true, passive: true });
  window.addEventListener('pointerdown', unlockAudio, { capture: true, passive: true });
}

/**
 * stop any currently repeating alarm immediately
 */
export function stopActiveAlarm() {
  currentAlarmId++;

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudioElement = null;
  }

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
 * Synthesizes a single pulse of a kitchen order bell (restaurant)
 */
function playKitchenOrderPulse(ctx: AudioContext) {
  const now = ctx.currentTime;

  const playTone = (freq: number, start: number, duration: number, peakGain = 0.5) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    } catch {
      // ignore
    }
  };

  // High-attention dual bell strike (restaurant order bell)
  playTone(880, now, 0.28, 0.45);            // A5
  playTone(1318.51, now + 0.12, 0.38, 0.5);  // E6
  playTone(880, now + 0.45, 0.28, 0.4);      // A5
  playTone(1318.51, now + 0.58, 0.48, 0.5);  // E6
}

/**
 * Synthesizes a single pulse of a rider offer radar ping (courier)
 */
function playRiderOfferPulse(ctx: AudioContext) {
  const now = ctx.currentTime;

  const playChirp = (freq: number, start: number, sweepFreq: number) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(sweepFreq, start + 0.12);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.45, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.15);
    } catch {
      // ignore
    }
  };

  // Urgent 3-tone rising radar alert
  playChirp(659.25, now, 783.99);          // E5 -> G5
  playChirp(880, now + 0.12, 1046.5);       // A5 -> C6
  playChirp(1174.66, now + 0.24, 1396.91);  // D6 -> F6
}

/**
 * Synthesizes customer melodic chime: food is ready / out for delivery
 */
function playFoodReadyChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0 },    // C5
    { freq: 659.25, time: 0.14 }, // E5
    { freq: 783.99, time: 0.28 }, // G5
    { freq: 1046.5, time: 0.44 }, // C6
  ];

  notes.forEach(({ freq, time }) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.0001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.35, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + 0.38);
    } catch {
      // ignore
    }
  });
}

/**
 * Synthesizes order cancellation warning
 */
function playCancellationTone(ctx: AudioContext) {
  const now = ctx.currentTime;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    // ignore
  }
}

/**
 * play an alarm sound synthesized via Web Audio API or audio asset.
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
    // Stop any existing repeating alarm before starting a new one
    stopActiveAlarm();

    const alarmId = currentAlarmId;

    const isRepeating =
      options?.isLongAlarm !== undefined
        ? options.isLongAlarm
        : variant === 'kitchen_order' || variant === 'rider_offer';

    const durationSeconds = options?.durationSeconds || 35;

    const executeWebAudioSound = () => {
      const ctx = getAudioContext();
      if (!ctx) return;

      const triggerOscillators = () => {
        if (currentAlarmId !== alarmId) return;

        if (isRepeating) {
          const intervalMs = variant === 'kitchen_order' ? 1400 : 1250;

          // 1. Play immediate first pulse
          if (variant === 'kitchen_order') {
            playKitchenOrderPulse(ctx);
          } else {
            playRiderOfferPulse(ctx);
          }

          // 2. Loop pulses every interval
          activeAlarmInterval = setInterval(() => {
            if (currentAlarmId !== alarmId) {
              if (activeAlarmInterval) clearInterval(activeAlarmInterval);
              return;
            }
            if (variant === 'kitchen_order') {
              playKitchenOrderPulse(ctx);
            } else {
              playRiderOfferPulse(ctx);
            }
          }, intervalMs);

          // 3. Auto-stop after durationSeconds (e.g. 35s)
          activeAlarmTimeout = setTimeout(() => {
            if (currentAlarmId === alarmId) {
              stopActiveAlarm();
            }
          }, durationSeconds * 1000);
        } else {
          // Single-shot chime
          if (variant === 'food_ready_delivery') {
            playFoodReadyChime(ctx);
          } else if (variant === 'cancellation') {
            playCancellationTone(ctx);
          } else if (variant === 'kitchen_order') {
            playKitchenOrderPulse(ctx);
          } else {
            playRiderOfferPulse(ctx);
          }
        }
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(() => triggerOscillators()).catch(() => triggerOscillators());
      } else {
        triggerOscillators();
      }
    };

    // For long alarms (rider & restaurant), first try MP3 audio asset if available
    if (isRepeating && typeof window !== 'undefined') {
      try {
        const audio = new Audio('/never-50672.mp3');
        audio.loop = true;
        audio.volume = 1.0;
        activeAudioElement = audio;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (currentAlarmId !== alarmId) {
                audio.pause();
                return;
              }
              // Auto-stop after durationSeconds (35s)
              activeAlarmTimeout = setTimeout(() => {
                if (currentAlarmId === alarmId) {
                  stopActiveAlarm();
                }
              }, durationSeconds * 1000);
            })
            .catch(() => {
              // Browser autoplay policy or load failure: fall back immediately to synthesized Web Audio
              executeWebAudioSound();
            });
        } else {
          activeAlarmTimeout = setTimeout(() => {
            if (currentAlarmId === alarmId) {
              stopActiveAlarm();
            }
          }, durationSeconds * 1000);
        }
      } catch {
        executeWebAudioSound();
      }
    } else {
      executeWebAudioSound();
    }
  } catch {
    // Ignore audio playback limitations
  }
}

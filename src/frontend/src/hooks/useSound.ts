import { useCallback, useEffect, useRef } from "react";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  fadeOut = true,
) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    if (fadeOut) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) {
    /* ignore */
  }
}

function playNoise(duration: number, volume: number, freq: number) {
  try {
    const ctx = getCtx();
    const bufSize = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 1;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + duration);
  } catch (_) {
    /* ignore */
  }
}

export function useSoundManager(enabled: boolean) {
  const bgmNodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const bgmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgmRunningRef = useRef(false);

  const playPop = useCallback(
    (pitch = 1) => {
      if (!enabled) return;
      playTone(300 * pitch, 0.08, 0.3, "sine");
      playTone(500 * pitch, 0.06, 0.2, "sine");
    },
    [enabled],
  );

  const playShoot = useCallback(() => {
    if (!enabled) return;
    playNoise(0.15, 0.15, 800);
    playTone(200, 0.1, 0.1, "sawtooth");
  }, [enabled]);

  const playCombo = useCallback(
    (size: number) => {
      if (!enabled) return;
      const notes = [261, 329, 392, 523, 659];
      const count = Math.min(size - 4, notes.length - 1);
      for (let i = 0; i <= count; i++) {
        setTimeout(() => playTone(notes[i] ?? 261, 0.15, 0.25, "sine"), i * 80);
      }
    },
    [enabled],
  );

  const playWin = useCallback(() => {
    if (!enabled) return;
    const melody = [523, 659, 784, 1047, 1319];
    melody.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 0.3, "sine"), i * 120);
    });
  }, [enabled]);

  const playBomb = useCallback(() => {
    if (!enabled) return;
    playNoise(0.3, 0.4, 200);
    playTone(80, 0.3, 0.3, "sawtooth");
  }, [enabled]);

  const playIntro = useCallback(() => {
    if (!enabled) return;
    const notes = [392, 494, 587, 784];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 0.2, "sine"), i * 150);
    });
  }, [enabled]);

  const startBgm = useCallback(() => {
    if (!enabled || bgmRunningRef.current) return;
    bgmRunningRef.current = true;
    const ctx = getCtx();
    const chords = [
      [261, 330, 392],
      [293, 370, 440],
      [349, 440, 523],
      [329, 415, 494],
    ];
    let chordIdx = 0;
    let noteIdx = 0;

    bgmIntervalRef.current = setInterval(() => {
      if (!enabled) return;
      try {
        const chord = chords[chordIdx];
        const freq = chord[noteIdx % chord.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = freq ?? 261;
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        noteIdx++;
        if (noteIdx % chord.length === 0) {
          chordIdx = (chordIdx + 1) % chords.length;
        }
      } catch (_) {
        /* ignore */
      }
    }, 200);
  }, [enabled]);

  const stopBgm = useCallback(() => {
    bgmRunningRef.current = false;
    if (bgmIntervalRef.current !== null) {
      clearInterval(bgmIntervalRef.current);
      bgmIntervalRef.current = null;
    }
    for (const { osc, gain } of bgmNodesRef.current) {
      try {
        gain.gain.setValueAtTime(0, 0);
        osc.stop();
      } catch (_) {
        /* ignore */
      }
    }
    bgmNodesRef.current = [];
  }, []);

  useEffect(() => {
    if (!enabled) stopBgm();
  }, [enabled, stopBgm]);

  useEffect(() => {
    return () => stopBgm();
  }, [stopBgm]);

  return {
    playPop,
    playShoot,
    playCombo,
    playWin,
    playBomb,
    playIntro,
    startBgm,
    stopBgm,
  };
}

import { ref } from 'vue';

type ToneStep = {
  frequency: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
};

const CORRECT_TONES: ToneStep[] = [
  { frequency: 660, duration: 0.08, gain: 0.04, type: 'triangle' },
  { frequency: 880, duration: 0.12, gain: 0.05, type: 'triangle' },
  { frequency: 1108, duration: 0.18, gain: 0.04, type: 'sine' },
];

const INCORRECT_TONES: ToneStep[] = [
  { frequency: 320, duration: 0.11, gain: 0.045, type: 'sawtooth' },
  { frequency: 240, duration: 0.16, gain: 0.04, type: 'sawtooth' },
];

export const useFeedbackAudio = () => {
  const audioEffectsSupported = ref(false);
  let audioContext: AudioContext | null = null;

  const setup = () => {
    if (typeof window === 'undefined') {
      audioEffectsSupported.value = false;
      return;
    }

    audioEffectsSupported.value = Boolean(
      window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    );
  };

  const getAudioContext = async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    const BrowserAudioContext =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!BrowserAudioContext) {
      return null;
    }

    audioContext ??= new BrowserAudioContext();

    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch {
        return null;
      }
    }

    return audioContext;
  };

  const playToneSequence = async (tones: ToneStep[]) => {
    const context = await getAudioContext();

    if (!context) {
      return;
    }

    const startAt = context.currentTime + 0.02;

    tones.forEach((tone, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const offset = tones.slice(0, index).reduce((sum, item) => sum + item.duration, 0);
      const toneStart = startAt + offset;
      const toneEnd = toneStart + tone.duration;

      oscillator.type = tone.type ?? 'sine';
      oscillator.frequency.setValueAtTime(tone.frequency, toneStart);
      gainNode.gain.setValueAtTime(0.0001, toneStart);
      gainNode.gain.exponentialRampToValueAtTime(tone.gain, toneStart + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(toneStart);
      oscillator.stop(toneEnd + 0.02);
    });
  };

  const playFeedbackSound = async (correct: boolean) => {
    if (!audioEffectsSupported.value) {
      return;
    }

    await playToneSequence(correct ? CORRECT_TONES : INCORRECT_TONES);
  };

  const cleanup = () => {
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close();
      audioContext = null;
    }
  };

  return {
    audioEffectsSupported,
    playFeedbackSound,
    setup,
    cleanup,
  };
};

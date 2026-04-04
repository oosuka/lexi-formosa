import { ref } from 'vue';

type ToneStep = {
  frequency: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
};

type RecordCelebrationTone = 'single' | 'double';

const CORRECT_TONES: ToneStep[] = [
  { frequency: 660, duration: 0.08, gain: 0.14, type: 'triangle' },
  { frequency: 880, duration: 0.12, gain: 0.18, type: 'triangle' },
  { frequency: 1108, duration: 0.18, gain: 0.14, type: 'sine' },
];

const INCORRECT_TONES: ToneStep[] = [
  { frequency: 320, duration: 0.11, gain: 0.16, type: 'sawtooth' },
  { frequency: 240, duration: 0.16, gain: 0.13, type: 'sawtooth' },
];

const GAME_OVER_TONES: ToneStep[] = [
  { frequency: 392, duration: 0.16, gain: 0.24, type: 'triangle' },
  { frequency: 294, duration: 0.2, gain: 0.2, type: 'triangle' },
  { frequency: 220, duration: 0.28, gain: 0.18, type: 'sine' },
];

const RECORD_CELEBRATION_TONES: Record<RecordCelebrationTone, ToneStep[]> = {
  single: [
    { frequency: 440, duration: 0.1, gain: 0.18, type: 'triangle' },
    { frequency: 587, duration: 0.14, gain: 0.2, type: 'triangle' },
    { frequency: 784, duration: 0.22, gain: 0.18, type: 'sine' },
  ],
  double: [
    { frequency: 440, duration: 0.08, gain: 0.18, type: 'triangle' },
    { frequency: 587, duration: 0.1, gain: 0.2, type: 'triangle' },
    { frequency: 784, duration: 0.12, gain: 0.22, type: 'triangle' },
    { frequency: 1046, duration: 0.24, gain: 0.2, type: 'sine' },
  ],
};

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

  const playGameOverSound = async () => {
    if (!audioEffectsSupported.value) {
      return;
    }

    await playToneSequence(GAME_OVER_TONES);
  };

  const playRecordCelebrationSound = async (tone: RecordCelebrationTone) => {
    if (!audioEffectsSupported.value) {
      return;
    }

    await playToneSequence(RECORD_CELEBRATION_TONES[tone]);
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
    playGameOverSound,
    playRecordCelebrationSound,
    setup,
    cleanup,
  };
};

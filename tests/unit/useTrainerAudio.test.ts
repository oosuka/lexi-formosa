import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useTrainerAudio } from '~/composables/useTrainerAudio';

class TestSpeechSynthesisUtterance {
  lang = '';
  rate = 1;
  pitch = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: ((event: SpeechSynthesisEvent) => void) | null = null;
  onend: ((event: SpeechSynthesisEvent) => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;

  constructor(public text: string) {}
}

describe('useTrainerAudio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: TestSpeechSynthesisUtterance,
    });
    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: TestSpeechSynthesisUtterance,
    });
  });

  it('SpeechSynthesis 非対応環境では再生不可のまま継続する', () => {
    Reflect.deleteProperty(window as unknown as Record<string, unknown>, 'speechSynthesis');
    Reflect.deleteProperty(
      window as unknown as Record<string, unknown>,
      'SpeechSynthesisUtterance'
    );
    Reflect.deleteProperty(globalThis as Record<string, unknown>, 'SpeechSynthesisUtterance');

    const currentQuestionId = ref('q1');
    const currentQuestionText = ref('你好');
    const sessionStarted = ref(true);
    const audio = useTrainerAudio({
      getQuestionId: () => currentQuestionId.value,
      getQuestionText: () => currentQuestionText.value,
      shouldReplayPending: () => sessionStarted.value,
    });

    audio.requestCurrentQuestionAudio();

    expect(audio.speechSupported.value).toBe(false);
    expect(audio.isSpeaking.value).toBe(false);
  });

  it('zh-TW voice を優先して pending を解消し、停止できる', () => {
    const speechSynthesisMock = {
      speaking: false,
      getVoices: vi.fn(
        () =>
          [
            { lang: 'en-US', name: 'English' },
            { lang: 'zh-CN', name: 'Generic Chinese' },
            { lang: 'zh-TW', name: 'Taiwanese Mandarin' },
          ] as SpeechSynthesisVoice[]
      ),
      cancel: vi.fn(() => {
        speechSynthesisMock.speaking = false;
      }),
      speak: vi.fn((utterance: SpeechSynthesisUtterance) => {
        speechSynthesisMock.speaking = true;
        utterance.onstart?.({} as SpeechSynthesisEvent);
      }),
    };

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: speechSynthesisMock,
    });

    const currentQuestionId = ref('q1');
    const currentQuestionText = ref('你好');
    const sessionStarted = ref(true);
    const audio = useTrainerAudio({
      getQuestionId: () => currentQuestionId.value,
      getQuestionText: () => currentQuestionText.value,
      shouldReplayPending: () => sessionStarted.value,
    });

    audio.requestCurrentQuestionAudio();

    expect(audio.speechSupported.value).toBe(true);
    expect(audio.isSpeaking.value).toBe(true);
    expect(speechSynthesisMock.speak).toHaveBeenCalledTimes(1);
    const utterance = speechSynthesisMock.speak.mock.calls[0]?.[0] as SpeechSynthesisUtterance;
    expect(utterance.voice?.lang).toBe('zh-TW');

    audio.clearPendingQuestionAudio();
    expect(speechSynthesisMock.cancel).toHaveBeenCalled();
    expect(audio.isSpeaking.value).toBe(false);
  });

  it('音声一覧が遅れて届いたら pending 中の問題を再生し直す', () => {
    const voices = [
      [] as SpeechSynthesisVoice[],
      [] as SpeechSynthesisVoice[],
      [{ lang: 'zh-HK', name: 'Hong Kong Mandarin' } as SpeechSynthesisVoice],
      [{ lang: 'zh-HK', name: 'Hong Kong Mandarin' } as SpeechSynthesisVoice],
    ];
    const speechSynthesisMock = {
      speaking: false,
      getVoices: vi.fn(() => voices.shift() ?? []),
      cancel: vi.fn(() => {
        speechSynthesisMock.speaking = false;
      }),
      speak: vi.fn((utterance: SpeechSynthesisUtterance) => {
        if (speechSynthesisMock.speak.mock.calls.length >= 2) {
          speechSynthesisMock.speaking = true;
          utterance.onstart?.({} as SpeechSynthesisEvent);
        }
      }),
    };

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: speechSynthesisMock,
    });

    const currentQuestionId = ref('q-late-voice');
    const currentQuestionText = ref('請問');
    const sessionStarted = ref(true);
    const audio = useTrainerAudio({
      getQuestionId: () => currentQuestionId.value,
      getQuestionText: () => currentQuestionText.value,
      shouldReplayPending: () => sessionStarted.value,
    });

    audio.requestCurrentQuestionAudio();

    expect(audio.pendingQuestionAudioId.value).toBe('q-late-voice');
    expect(speechSynthesisMock.speak).toHaveBeenCalledTimes(1);
    const initialUtterance = speechSynthesisMock.speak.mock.calls[0]?.[0] as SpeechSynthesisUtterance;
    expect(initialUtterance.voice).toBeNull();

    audio.handleVoicesChanged();

    expect(speechSynthesisMock.speak).toHaveBeenCalledTimes(2);
    expect(audio.pendingQuestionAudioId.value).toBeNull();
    const replayUtterance = speechSynthesisMock.speak.mock.calls[1]?.[0] as SpeechSynthesisUtterance;
    expect(replayUtterance.voice?.lang).toBe('zh-HK');
  });
});

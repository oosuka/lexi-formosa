import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useTrainerAudio } from '~/composables/useTrainerAudio';

describe('useTrainerAudio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

    audio.setup();
    audio.requestCurrentQuestionAudio();

    expect(audio.speechSupported.value).toBe(false);
    expect(audio.isSpeaking.value).toBe(false);
  });

  it('zh-TW voice を優先して pending を解消し、停止できる', () => {
    let voicesChangedHandler: (() => void) | undefined;
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
      addEventListener: vi.fn((eventName: string, handler: () => void) => {
        if (eventName === 'voiceschanged') {
          voicesChangedHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
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

    audio.setup();
    audio.requestCurrentQuestionAudio();

    expect(audio.speechSupported.value).toBe(true);
    expect(audio.isSpeaking.value).toBe(true);
    expect(speechSynthesisMock.speak).toHaveBeenCalledTimes(1);
    const utterance = speechSynthesisMock.speak.mock.calls[0]?.[0] as SpeechSynthesisUtterance;
    expect(utterance.voice?.lang).toBe('zh-TW');

    voicesChangedHandler?.();
    expect(speechSynthesisMock.speak).toHaveBeenCalledTimes(1);

    audio.clearPendingQuestionAudio();
    expect(speechSynthesisMock.cancel).toHaveBeenCalled();
    expect(audio.isSpeaking.value).toBe(false);
  });
});

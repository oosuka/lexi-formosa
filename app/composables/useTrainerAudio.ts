import { type Ref, ref } from 'vue';

import { isMobilePlaybackEnvironment } from '~/utils/playbackEnvironment';

type TrainerAudioOptions = {
  getQuestionId: () => string | null;
  getQuestionText: () => string | null;
  shouldReplayPending: () => boolean;
};

const DESKTOP_PRONUNCIATION_VOLUME = 1;
const MOBILE_PRONUNCIATION_VOLUME = 0.82;

const getSpeechSynthesis = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  return window.speechSynthesis;
};

const getSpeechSynthesisUtterance = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    window.SpeechSynthesisUtterance ??
    (
      globalThis as typeof globalThis & {
        SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
      }
    ).SpeechSynthesisUtterance ??
    null
  );
};

const pickPreferredVoice = (voices: SpeechSynthesisVoice[]) =>
  voices.find((voice) => voice.lang.toLowerCase().startsWith('zh-tw')) ??
  voices.find((voice) => voice.lang.toLowerCase().startsWith('zh-hk')) ??
  voices.find((voice) => voice.lang.toLowerCase().startsWith('zh')) ??
  null;

const getPronunciationVolume = () =>
  isMobilePlaybackEnvironment() ? MOBILE_PRONUNCIATION_VOLUME : DESKTOP_PRONUNCIATION_VOLUME;

export const useTrainerAudio = (options: TrainerAudioOptions) => {
  const speechSupported = ref(false);
  const isSpeaking = ref(false);
  const preferredVoice = ref<SpeechSynthesisVoice | null>(null);
  const pendingQuestionAudioId = ref<string | null>(null);

  let utterance: SpeechSynthesisUtterance | null = null;

  const syncPreferredVoice = () => {
    const speechSynthesis = getSpeechSynthesis();

    if (!speechSynthesis) {
      preferredVoice.value = null;
      return null;
    }

    const voices = speechSynthesis.getVoices();
    preferredVoice.value = pickPreferredVoice(voices);
    return preferredVoice.value;
  };

  const setup = () => {
    const speechSynthesis = getSpeechSynthesis();
    const utteranceCtor = getSpeechSynthesisUtterance();

    speechSupported.value = Boolean(speechSynthesis && utteranceCtor);

    if (!speechSupported.value) {
      preferredVoice.value = null;
      return;
    }

    syncPreferredVoice();
  };

  const clearPendingQuestionAudio = () => {
    pendingQuestionAudioId.value = null;
    isSpeaking.value = false;
    utterance = null;

    const speechSynthesis = getSpeechSynthesis();

    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
  };

  const playCurrentQuestionAudio = () => {
    const speechSynthesis = getSpeechSynthesis();
    const utteranceCtor = getSpeechSynthesisUtterance();
    const questionId = options.getQuestionId();
    const questionText = options.getQuestionText();

    if (
      !speechSynthesis ||
      !utteranceCtor ||
      !speechSupported.value ||
      !questionId ||
      !questionText
    ) {
      pendingQuestionAudioId.value = null;
      isSpeaking.value = false;
      return;
    }

    syncPreferredVoice();

    utterance = new utteranceCtor(questionText);
    utterance.lang = preferredVoice.value?.lang ?? 'zh-TW';
    utterance.rate = 0.82;
    utterance.pitch = 1;
    utterance.volume = getPronunciationVolume();

    if (preferredVoice.value) {
      utterance.voice = preferredVoice.value;
    }

    utterance.onstart = () => {
      isSpeaking.value = true;
      pendingQuestionAudioId.value = null;
    };
    utterance.onend = () => {
      isSpeaking.value = false;
    };
    utterance.onerror = () => {
      isSpeaking.value = false;
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  const requestCurrentQuestionAudio = () => {
    const questionId = options.getQuestionId();

    if (!speechSupported.value || !questionId) {
      clearPendingQuestionAudio();
      return;
    }

    pendingQuestionAudioId.value = questionId;
    playCurrentQuestionAudio();
  };

  const handleVoicesChanged = () => {
    const speechSynthesis = getSpeechSynthesis();
    const questionId = options.getQuestionId();

    syncPreferredVoice();

    if (
      !speechSynthesis ||
      !questionId ||
      pendingQuestionAudioId.value !== questionId ||
      !options.shouldReplayPending() ||
      isSpeaking.value ||
      speechSynthesis.speaking
    ) {
      return;
    }

    requestCurrentQuestionAudio();
  };

  const dispose = () => {
    clearPendingQuestionAudio();
  };

  setup();

  return {
    speechSupported,
    isSpeaking,
    preferredVoice,
    pendingQuestionAudioId,
    setup,
    syncPreferredVoice,
    requestCurrentQuestionAudio,
    clearPendingQuestionAudio,
    handleVoicesChanged,
    dispose,
  } as {
    speechSupported: Ref<boolean>;
    isSpeaking: Ref<boolean>;
    preferredVoice: Ref<SpeechSynthesisVoice | null>;
    pendingQuestionAudioId: Ref<string | null>;
    setup: () => void;
    syncPreferredVoice: () => SpeechSynthesisVoice | null;
    requestCurrentQuestionAudio: () => void;
    clearPendingQuestionAudio: () => void;
    handleVoicesChanged: () => void;
    dispose: () => void;
  };
};

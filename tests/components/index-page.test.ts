import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

import IndexPage from '~/pages/index.vue';
import type { GameState } from '~/types/vocabulary';

import { questionOne, questionTwo } from '../fixtures/vocabulary';

vi.mock('@vueuse/core', () => ({
  usePreferredReducedMotion: () => ref('no-preference'),
}));

const useTraditionalTrainerMock = vi.hoisted(() => vi.fn());
const loadVocabularyMetadataMock = vi.hoisted(() => vi.fn());

mockNuxtImport('useTraditionalTrainer', () => useTraditionalTrainerMock);

vi.mock('~/utils/vocabulary', async () => {
  const actual = await vi.importActual<typeof import('~/utils/vocabulary')>('~/utils/vocabulary');

  return {
    ...actual,
    loadVocabularyMetadata: loadVocabularyMetadataMock,
  };
});

const createGameState = (): GameState => ({
  level: 1,
  score: 0,
  streak: 0,
  rounds: 0,
  status: 'ready',
  currentQuestion: questionOne,
  selectedChoiceId: null,
  lastCorrect: null,
  recentQuestionIds: [],
});

const createTrainerStub = () => {
  const game = ref<GameState>(createGameState());
  const isLoading = ref(false);

  return {
    game,
    correctChoice: computed(
      () => game.value.currentQuestion?.choices.find((choice) => choice.correct) ?? null
    ),
    isLoading,
    initialize: vi.fn(async () => undefined),
    submitAnswer: vi.fn((choiceId: string) => {
      const correct = choiceId === questionOne.questionId;
      game.value = {
        ...game.value,
        status: 'answered',
        selectedChoiceId: choiceId,
        lastCorrect: correct,
        rounds: game.value.rounds + 1,
        score: correct ? game.value.score + 10 : game.value.score,
        streak: correct ? game.value.streak + 1 : 0,
      };

      return {
        correct,
        correctChoiceId: questionOne.questionId,
      };
    }),
    nextQuestion: vi.fn(() => {
      game.value = {
        ...game.value,
        status: 'ready',
        selectedChoiceId: null,
        lastCorrect: null,
        currentQuestion: questionTwo,
        recentQuestionIds: [questionOne.questionId],
      };
    }),
    resetSession: vi.fn(async () => undefined),
    setLevel: vi.fn(async () => undefined),
  };
};

describe('index page', () => {
  beforeEach(() => {
    useTraditionalTrainerMock.mockReset();
    useTraditionalTrainerMock.mockReturnValue(createTrainerStub());
    loadVocabularyMetadataMock.mockReset();
    loadVocabularyMetadataMock.mockResolvedValue({
      total: 123,
      counts: {
        1: 45,
        2: 38,
        3: 40,
      },
    });
  });

  it('読み方を表示する', async () => {
    const wrapper = await mountSuspended(IndexPage);

    expect(wrapper.text()).toContain('你好');
    expect(wrapper.text()).toContain('ニ ハオ');
    expect(wrapper.text()).toContain('nǐ hǎo');
    expect(wrapper.text()).toContain('45語');
  });

  it('回答後に正誤表示を更新し、次の問題で音声を自動再生する', async () => {
    const wrapper = await mountSuspended(IndexPage);
    const answerButton = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    await answerButton?.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Correct');

    const nextButton = wrapper.get('button.primary-button');
    await nextButton.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('謝謝');
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('metadata 読み込み失敗時もゲーム本体は表示する', async () => {
    loadVocabularyMetadataMock.mockRejectedValue(new Error('metadata missing'));

    const wrapper = await mountSuspended(IndexPage);

    expect(wrapper.text()).toContain('你好');
    expect(wrapper.text()).toContain('この単語の意味は？');
    expect(wrapper.text()).not.toContain('辞書データ未生成');
  });
});

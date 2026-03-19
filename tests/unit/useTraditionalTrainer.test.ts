import { mountSuspended } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { useState } from '#app';

import { useTraditionalTrainer } from '~/composables/useTraditionalTrainer';
import type { GameState, Level, VocabEntry } from '~/types/vocabulary';

import { level1Vocabulary } from '../fixtures/vocabulary';

const loadVocabularyLevelMock = vi.hoisted(() => vi.fn<(level: Level) => Promise<VocabEntry[]>>());

const createEntry = (
  id: string,
  trad: string,
  ja: string,
  level: Level,
  category: string
): VocabEntry => ({
  id,
  trad,
  ja,
  level,
  length: [...trad].length,
  category,
  taiwanPriority: true,
  sources: ['seed'],
});

const level2Vocabulary: VocabEntry[] = [
  createEntry('l2-1', '便利商店', 'コンビニ', 2, 'place'),
  createEntry('l2-2', '百貨公司', 'デパート', 2, 'place'),
  createEntry('l2-3', '悠遊卡片', 'ICカード', 2, 'object'),
  createEntry('l2-4', '週末行程', '週末の予定', 2, 'schedule'),
];

const level3Vocabulary: VocabEntry[] = [
  createEntry('l3-1', '國際電話卡', '国際電話カード', 3, 'object'),
  createEntry('l3-2', '臺灣高速鐵路', '台湾高速鉄道', 3, 'transport'),
  createEntry('l3-3', '自助洗衣店鋪', 'コインランドリー', 3, 'place'),
  createEntry('l3-4', '觀光夜市地圖', '観光夜市地図', 3, 'object'),
];

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

vi.mock('~/utils/vocabulary', () => ({
  loadVocabularyLevel: loadVocabularyLevelMock,
}));

const resetTrainerState = () => {
  useState<GameState>('traditional-trainer-game').value = {
    level: 1,
    score: 0,
    streak: 0,
    rounds: 0,
    status: 'ready',
    currentQuestion: null,
    selectedChoiceId: null,
    lastCorrect: null,
    recentQuestionIds: [],
  };
  useState<Partial<Record<Level, VocabEntry[]>>>('traditional-trainer-levels').value = {};
  useState<boolean>('traditional-trainer-loading').value = false;
  useState<number>('traditional-trainer-initialize-request-id').value = 0;
};

describe('useTraditionalTrainer', () => {
  beforeEach(() => {
    loadVocabularyLevelMock.mockReset();
    loadVocabularyLevelMock.mockResolvedValue(level1Vocabulary);
  });

  it('初期化時に問題を読み込む', async () => {
    let trainer!: ReturnType<typeof useTraditionalTrainer>;

    const Harness = defineComponent({
      setup() {
        trainer = useTraditionalTrainer();
        return () => h('div');
      },
    });

    await mountSuspended(Harness);
    resetTrainerState();

    await trainer.initialize(1);

    expect(loadVocabularyLevelMock).toHaveBeenCalledWith(1);
    expect(trainer.game.value.currentQuestion?.trad).toBeTruthy();
    expect(trainer.isLoading.value).toBe(false);
  });

  it('正解時にスコアと連続正解数を更新し、次の問題へ進める', async () => {
    let trainer!: ReturnType<typeof useTraditionalTrainer>;

    const Harness = defineComponent({
      setup() {
        trainer = useTraditionalTrainer();
        return () => h('div');
      },
    });

    await mountSuspended(Harness);
    resetTrainerState();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    await trainer.initialize(1);
    const firstQuestionId = trainer.game.value.currentQuestion?.questionId;
    const result = trainer.submitAnswer(trainer.correctChoice.value?.id as string);

    expect(result.correct).toBe(true);
    expect(trainer.game.value.score).toBe(10);
    expect(trainer.game.value.streak).toBe(1);
    expect(trainer.game.value.status).toBe('answered');

    trainer.nextQuestion();

    expect(trainer.game.value.status).toBe('ready');
    expect(trainer.game.value.selectedChoiceId).toBeNull();
    expect(trainer.game.value.currentQuestion?.questionId).not.toBe(firstQuestionId);
  });

  it('不正解時はスコアを加算しない', async () => {
    let trainer!: ReturnType<typeof useTraditionalTrainer>;

    const Harness = defineComponent({
      setup() {
        trainer = useTraditionalTrainer();
        return () => h('div');
      },
    });

    await mountSuspended(Harness);
    resetTrainerState();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    await trainer.initialize(1);
    const wrongChoiceId = trainer.game.value.currentQuestion?.choices.find(
      (choice) => !choice.correct
    )?.id as string;

    const result = trainer.submitAnswer(wrongChoiceId);

    expect(result.correct).toBe(false);
    expect(trainer.game.value.score).toBe(0);
    expect(trainer.game.value.streak).toBe(0);
    expect(trainer.game.value.lastCorrect).toBe(false);
  });

  it('連続した初期化では最後のリクエストだけが状態を確定する', async () => {
    let trainer!: ReturnType<typeof useTraditionalTrainer>;
    const level2Deferred = createDeferred<VocabEntry[]>();
    const level3Deferred = createDeferred<VocabEntry[]>();

    loadVocabularyLevelMock.mockImplementation((level) => {
      if (level === 2) {
        return level2Deferred.promise;
      }

      if (level === 3) {
        return level3Deferred.promise;
      }

      return Promise.resolve(level1Vocabulary);
    });

    const Harness = defineComponent({
      setup() {
        trainer = useTraditionalTrainer();
        return () => h('div');
      },
    });

    await mountSuspended(Harness);
    resetTrainerState();

    const level2Task = trainer.initialize(2);
    const level3Task = trainer.initialize(3);

    level3Deferred.resolve(level3Vocabulary);
    await level3Task;

    level2Deferred.resolve(level2Vocabulary);
    await level2Task;

    expect(trainer.game.value.level).toBe(3);
    expect(trainer.game.value.currentQuestion?.level).toBe(3);
    expect(level3Vocabulary.map((entry) => entry.trad)).toContain(
      trainer.game.value.currentQuestion?.trad as string
    );
    expect(trainer.isLoading.value).toBe(false);
  });
});

import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

import { getScoreForCorrectAnswer } from '~/composables/useTraditionalTrainer';
import IndexPage from '~/pages/index.vue';
import type { GameState } from '~~/shared/types/vocabulary';
import packageJson from '../../package.json' with { type: 'json' };

import { questionOne, questionTwo } from '../fixtures/vocabulary';

const preferredReducedMotion = vi.hoisted(() => ({
  value: 'no-preference' as 'no-preference' | 'reduce',
}));

vi.mock('@vueuse/core', () => ({
  usePreferredReducedMotion: () => preferredReducedMotion,
}));

const useTraditionalTrainerMock = vi.hoisted(() => vi.fn());
const loadVocabularyMetadataMock = vi.hoisted(() => vi.fn());
const HIGH_SCORE_STORAGE_KEY = 'lexi-formosa-high-scores-v2';
const APP_VERSION_LABEL = `v${packageJson.version}`;

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
  bestStreak: 0,
  missesInRow: 0,
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
      const nextStreak = correct ? game.value.streak + 1 : 0;
      const nextMissesInRow = correct ? 0 : game.value.missesInRow + 1;
      const nextStatus = nextMissesInRow >= 3 ? 'finished' : 'answered';
      const scoreGain = correct ? getScoreForCorrectAnswer(nextStreak) : 0;
      game.value = {
        ...game.value,
        status: nextStatus,
        selectedChoiceId: choiceId,
        lastCorrect: correct,
        rounds: game.value.rounds + 1,
        score: game.value.score + scoreGain,
        streak: nextStreak,
        bestStreak: Math.max(game.value.bestStreak, nextStreak),
        missesInRow: nextMissesInRow,
      };

      return {
        correct,
        correctChoiceId: questionOne.questionId,
      };
    }),
    nextQuestion: vi.fn(() => {
      if (game.value.status === 'finished') {
        return;
      }

      game.value = {
        ...game.value,
        status: 'ready',
        selectedChoiceId: null,
        lastCorrect: null,
        currentQuestion: questionTwo,
        recentQuestionIds: [questionOne.questionId],
      };
    }),
    resetSession: vi.fn(async () => {
      game.value = {
        ...createGameState(),
        level: game.value.level,
      };
    }),
    setLevel: vi.fn(async () => undefined),
  };
};

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const startGame = async (wrapper: VueWrapper) => {
  await wrapper.get('button.session-start-button').trigger('click');
  await flushPromises();
};

describe('index page', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    window.localStorage.clear();
    preferredReducedMotion.value = 'no-preference';
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

  it('初回表示では開始パネルを表示する', async () => {
    const wrapper = await mountSuspended(IndexPage);

    expect(wrapper.text()).toContain(APP_VERSION_LABEL);
    expect(wrapper.findAll('button.session-start-button')).toHaveLength(1);
    expect(wrapper.get('.hero-panel').classes()).toContain('hero-panel--start-screen');
    expect(wrapper.get('.hero-brand').classes()).toContain('hero-brand--start-screen');
    expect(wrapper.get('.hero-stats-panel').classes()).toContain('hero-stats-panel--start-screen');
    expect(wrapper.findAll('.record-grid .record-card')).toHaveLength(3);
    expect(wrapper.text()).not.toContain('你好');
  });

  it('開始画面では説明を1文にし、冗長な開始文言を出さない', async () => {
    const wrapper = await mountSuspended(IndexPage);

    expect(wrapper.text()).toContain(
      '台湾で使われる繁体字の意味を、日本語4択でテンポよく見抜いていく単語ゲーム。'
    );
    expect(wrapper.text()).toContain('ゲームを始める');
    expect(wrapper.text()).not.toContain('このレベルから始める');
    expect(wrapper.text()).not.toContain('学習を始める');
    expect(wrapper.text()).not.toContain('落ち着いたテンポ');
  });

  it('開始画面のルール一覧では加点条件を別々の箇条書きで表示する', async () => {
    const wrapper = await mountSuspended(IndexPage);
    const ruleItems = wrapper
      .findAll('.hint-block li')
      .map((item) => item.text().replace(/\s+/g, ' ').trim());

    expect(ruleItems).toContain('正解で10点');
    expect(ruleItems).toContain('3連続正解以降はボーナス加点');
  });

  it('開始画面では全レベル Records を維持し、Level ルールから不要文言を除く', async () => {
    const wrapper = await mountSuspended(IndexPage);
    const recordGridText = wrapper.get('.record-grid').text();
    const ruleItems = wrapper.findAll('.hint-block li').map((item) => item.text());

    expect(recordGridText).toContain('Level 1');
    expect(recordGridText).toContain('Level 2');
    expect(recordGridText).toContain('Level 3');
    expect(recordGridText).toContain('Best Score');
    expect(recordGridText).toContain('Best Streak');
    expect(ruleItems).not.toContain('すべて繁体字の単語');
    expect(wrapper.text()).not.toContain('Session');
  });

  it('開始画面専用のヒーロー圧縮クラスはプレイ開始後に外れる', async () => {
    const wrapper = await mountSuspended(IndexPage);

    expect(wrapper.get('.hero-panel').classes()).toContain('hero-panel--start-screen');
    expect(wrapper.get('.hero-brand').classes()).toContain('hero-brand--start-screen');
    expect(wrapper.get('.hero-stats-panel').classes()).toContain('hero-stats-panel--start-screen');

    await startGame(wrapper);

    expect(wrapper.get('.hero-panel').classes()).not.toContain('hero-panel--start-screen');
    expect(wrapper.get('.hero-brand').classes()).not.toContain('hero-brand--start-screen');
    expect(wrapper.get('.hero-stats-panel').classes()).not.toContain(
      'hero-stats-panel--start-screen'
    );
  });

  it('開始画面ではレベルごとの最高記録を表示する', async () => {
    window.localStorage.setItem(
      HIGH_SCORE_STORAGE_KEY,
      JSON.stringify({
        1: { score: 80, streak: 5 },
        2: { score: 140, streak: 9 },
        3: { score: 60, streak: 3 },
      })
    );

    const wrapper = await mountSuspended(IndexPage);
    const recordGridText = wrapper.get('.record-grid').text();

    expect(wrapper.text()).toContain('レベルごとの最高記録');
    expect(recordGridText).toContain('Level 1');
    expect(recordGridText).toContain('Best Score');
    expect(recordGridText).toContain('80');
    expect(recordGridText).toContain('Best Streak');
    expect(recordGridText).toContain('5');
    expect(recordGridText).toContain('Level 2');
    expect(recordGridText).toContain('140');
    expect(recordGridText).toContain('9');
    expect(recordGridText).toContain('Level 3');
    expect(recordGridText).toContain('60');
    expect(recordGridText).toContain('3');
    expect(recordGridText).not.toContain('45語');
  });

  it('開始後に読み方を表示する', async () => {
    const wrapper = await mountSuspended(IndexPage);

    await startGame(wrapper);

    const idleFeedback = wrapper.get('.feedback-copy');

    expect(wrapper.text()).toContain('今回の記録');
    expect(wrapper.text()).toContain('Score');
    expect(wrapper.find('.level-panel').exists()).toBe(false);
    expect(wrapper.find('.result-banner').exists()).toBe(false);
    expect(idleFeedback.classes()).toContain('feedback-copy--embedded');
    expect(wrapper.text()).toContain('你好');
    expect(wrapper.text()).toContain('ニ ハオ');
    expect(wrapper.text()).toContain('nǐ hǎo');
  });

  it('プレイ中は Score / Streak / Miss をプレイエリアに表示する', async () => {
    const wrapper = await mountSuspended(IndexPage);

    await startGame(wrapper);

    const quizPanel = wrapper.get('.quiz-panel');
    const heroStatsPanel = wrapper.get('.hero-stats-panel');

    expect(quizPanel.text()).toContain('Score');
    expect(quizPanel.text()).toContain('Streak');
    expect(quizPanel.text()).toContain('Miss');
    expect(heroStatsPanel.text()).not.toContain('Miss');
  });

  it('回答後の正解と不正解は選択肢の見た目で区別できる', async () => {
    const wrapper = await mountSuspended(IndexPage);

    await startGame(wrapper);

    const firstQuestionChoices = wrapper.findAll('.choice-card');
    const correctChoice = firstQuestionChoices.find((candidate) =>
      candidate.text().includes('こんにちは')
    );

    await correctChoice?.trigger('click');
    await flushPromises();

    const resultBanner = wrapper.get('.result-banner');
    const quizPanel = wrapper.get('.quiz-panel');
    const answeredCorrectChoices = wrapper.findAll('.choice-card');
    const answeredCorrectChoice = answeredCorrectChoices.find((candidate) =>
      candidate.text().includes('こんにちは')
    );
    const answeredWrongChoice = answeredCorrectChoices.find((candidate) =>
      candidate.text().includes('牛乳')
    );

    expect(resultBanner.classes()).toContain('result-banner--correct');
    expect(resultBanner.text()).toContain('正解。+10点獲得');
    expect(answeredCorrectChoice?.classes()).toContain('choice-card--correct');
    expect(answeredCorrectChoice?.classes()).toContain('choice-card--correct-impact');
    expect(answeredWrongChoice?.classes()).toContain('choice-card--muted');
    expect(quizPanel.classes()).toContain('quiz-panel--correct-impact');

    await wrapper.get('button.primary-button').trigger('click');
    await flushPromises();

    const secondQuestionChoices = wrapper.findAll('.choice-card');
    const secondWrongChoice = secondQuestionChoices.find((candidate) =>
      candidate.text().includes('牛乳')
    );
    const secondCorrectChoice = secondQuestionChoices.find((candidate) =>
      candidate.text().includes('ありがとう')
    );

    await secondWrongChoice?.trigger('click');
    await flushPromises();

    const secondResultBanner = wrapper.get('.result-banner');
    const secondFeedbackRow = wrapper.get('.feedback-row');
    const secondFeedbackActions = wrapper.get('.feedback-actions');
    const secondQuizPanel = wrapper.get('.quiz-panel');
    const answeredWrongChoices = wrapper.findAll('.choice-card');
    const answeredWrongSelectedChoice = answeredWrongChoices.find((candidate) =>
      candidate.text().includes('牛乳')
    );
    const answeredWrongCorrectChoice = answeredWrongChoices.find((candidate) =>
      candidate.text().includes('ありがとう')
    );

    expect(secondResultBanner.classes()).toContain('result-banner--incorrect');
    expect(secondFeedbackRow.classes()).toContain('feedback-row--embedded');
    expect(secondFeedbackRow.classes()).toContain('feedback-row--stacked');
    expect(secondFeedbackActions.element.previousElementSibling).toBe(secondResultBanner.element);
    expect(secondResultBanner.text()).toContain('残り2回で終了します');
    expect(answeredWrongSelectedChoice?.classes()).toContain('choice-card--incorrect');
    expect(answeredWrongSelectedChoice?.classes()).toContain('choice-card--incorrect-impact');
    expect(answeredWrongCorrectChoice?.classes()).toContain('choice-card--correct');
    expect(answeredWrongCorrectChoice?.classes()).toContain('choice-card--correct-reveal');
    expect(secondQuizPanel.classes()).toContain('quiz-panel--incorrect-impact');
    expect(secondCorrectChoice?.text()).toContain('ありがとう');
  });

  it('reduced motion では回答後も CORRECT と YOUR PICK ラベルが見える', async () => {
    preferredReducedMotion.value = 'reduce';

    const wrapper = await mountSuspended(IndexPage);

    await startGame(wrapper);

    const correctChoice = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    await correctChoice?.trigger('click');
    await flushPromises();

    const answeredCorrectChoice = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    expect(answeredCorrectChoice?.text()).toContain('CORRECT');

    await wrapper.get('button.primary-button').trigger('click');
    await flushPromises();

    const wrongChoice = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('牛乳'));

    await wrongChoice?.trigger('click');
    await flushPromises();

    const answeredWrongSelectedChoice = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('牛乳'));
    const answeredWrongCorrectChoice = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('ありがとう'));

    expect(answeredWrongSelectedChoice?.text()).toContain('YOUR PICK');
    expect(answeredWrongCorrectChoice?.text()).toContain('CORRECT');
  });

  it('正解時にそのレベルの最高記録を保存する', async () => {
    const wrapper = await mountSuspended(IndexPage);

    await startGame(wrapper);

    const answerButton = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    await answerButton?.trigger('click');
    await flushPromises();

    expect(window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe(
      '{"1":{"score":10,"streak":1},"2":{"score":0,"streak":0},"3":{"score":0,"streak":0}}'
    );
  });

  it('3連続で不正解になるとゲーム終了と記録更新表示を出す', async () => {
    window.localStorage.setItem(
      HIGH_SCORE_STORAGE_KEY,
      JSON.stringify({
        1: { score: 0, streak: 0 },
        2: { score: 0, streak: 0 },
        3: { score: 0, streak: 0 },
      })
    );

    const wrapper = await mountSuspended(IndexPage);
    await startGame(wrapper);

    const correctChoice = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    await correctChoice?.trigger('click');
    await flushPromises();
    await wrapper.get('button.primary-button').trigger('click');
    await flushPromises();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const wrongChoice = wrapper
        .findAll('.choice-card')
        .find((candidate) => candidate.text().includes('牛乳'));

      await wrongChoice?.trigger('click');
      await flushPromises();

      if (attempt < 2) {
        await wrapper.get('button.primary-button').trigger('click');
        await flushPromises();
      }
    }

    expect(wrapper.text()).toContain('Game Over');
    expect(wrapper.text()).toContain('新記録達成');
    expect(wrapper.text()).toContain('今回のプレイで自己ベストを更新しました');
    expect(wrapper.text()).toContain('NEW BEST');
    expect(wrapper.text()).toContain('Score');
    expect(wrapper.text()).toContain('Best Streak');
    expect(wrapper.text()).toContain('Level Best');
    expect(wrapper.text()).toContain('10');
    expect(wrapper.text()).toContain('1');
    expect(wrapper.text()).toContain('自己ベストを更新');
    expect(wrapper.text()).toContain('もう一度始める');
    expect(wrapper.text()).toContain('トップへ戻る');
  });

  it('ゲームオーバー後にもう一度始めると同じレベルで即再開する', async () => {
    const wrapper = await mountSuspended(IndexPage);
    await startGame(wrapper);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const wrongChoice = wrapper
        .findAll('.choice-card')
        .find((candidate) => candidate.text().includes('牛乳'));

      await wrongChoice?.trigger('click');
      await flushPromises();

      if (attempt < 2) {
        await wrapper.get('button.primary-button').trigger('click');
        await flushPromises();
      }
    }

    await wrapper.get('button.primary-button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('你好');
    expect(wrapper.text()).not.toContain('ゲームを始める');
    expect(wrapper.find('.level-panel').exists()).toBe(false);
  });

  it('ゲームオーバー後にトップへ戻ると開始画面へ戻る', async () => {
    const wrapper = await mountSuspended(IndexPage);
    await startGame(wrapper);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const wrongChoice = wrapper
        .findAll('.choice-card')
        .find((candidate) => candidate.text().includes('牛乳'));

      await wrongChoice?.trigger('click');
      await flushPromises();

      if (attempt < 2) {
        await wrapper.get('button.primary-button').trigger('click');
        await flushPromises();
      }
    }

    const topButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().includes('トップへ戻る'));

    await topButton?.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('ゲームを始める');
    expect(wrapper.find('.level-panel').exists()).toBe(true);
  });

  it('次の問題への切り替え失敗は回答済み状態のままエラー表示する', async () => {
    const trainer = createTrainerStub();
    trainer.nextQuestion.mockImplementation(() => {
      throw new Error('next question failed');
    });
    useTraditionalTrainerMock.mockReturnValue(trainer);

    const wrapper = await mountSuspended(IndexPage, {
      global: {
        config: {
          errorHandler() {},
        },
      },
    });

    await startGame(wrapper);

    const answerButton = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    await answerButton?.trigger('click');
    await flushPromises();

    const nextButton = wrapper.get('button.primary-button');
    await nextButton.trigger('click');
    await flushPromises();

    expect(trainer.nextQuestion).toHaveBeenCalled();
    expect(wrapper.text()).toContain('next question failed');
    expect(wrapper.text()).toContain('正解');
    expect(wrapper.text()).toContain('次の問題');
    expect(wrapper.find('.game-over-panel').exists()).toBe(false);
  });

  it('不正解時は正解と終了までの残り回数を表示する', async () => {
    const wrapper = await mountSuspended(IndexPage);

    await startGame(wrapper);

    const wrongChoice = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('牛乳'));

    await wrongChoice?.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('不正解。正解は「こんにちは」。残り2回で終了します。');
  });

  it('旧形式の最高記録も読み込める', async () => {
    window.localStorage.setItem(
      HIGH_SCORE_STORAGE_KEY,
      JSON.stringify({
        1: 50,
        2: 90,
        3: 30,
      })
    );

    const wrapper = await mountSuspended(IndexPage);

    expect(wrapper.text()).toContain('50');
    expect(wrapper.text()).toContain('90');
    expect(wrapper.text()).toContain('30');
  });

  it('外部確認リンクは回答後に別タブで表示する', async () => {
    const wrapper = await mountSuspended(IndexPage);

    await startGame(wrapper);

    expect(wrapper.findAll('a.lookup-link')).toHaveLength(0);

    const answerButton = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    await answerButton?.trigger('click');
    await flushPromises();

    expect(wrapper.find('.lookup-panel').exists()).toBe(true);
    const lookupLinks = wrapper.findAll('a.lookup-link');

    expect(lookupLinks).toHaveLength(2);
    expect(lookupLinks[0]?.text()).toContain('Google 翻訳で調べる');
    expect(lookupLinks[0]?.attributes('href')).toBe(
      'https://translate.google.com/?sl=zh-TW&tl=ja&text=%E4%BD%A0%E5%A5%BD&op=translate'
    );
    expect(lookupLinks[1]?.text()).toContain('Weblio で調べる');
    expect(lookupLinks[1]?.attributes('href')).toBe(
      'https://cjjc.weblio.jp/content/%E4%BD%A0%E5%A5%BD'
    );

    for (const link of lookupLinks) {
      expect(link.attributes('target')).toBe('_blank');
      expect(link.attributes('rel')).toBe('noopener noreferrer');
    }
  });

  it('回答後に正誤表示を更新し、次の問題で音声を自動再生する', async () => {
    const wrapper = await mountSuspended(IndexPage);

    await startGame(wrapper);

    const answerButton = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    await answerButton?.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('正解');

    const nextButton = wrapper.get('button.primary-button');
    await nextButton.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('謝謝');
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('数字キーで回答し Enter で次の問題へ進める', async () => {
    const wrapper = await mountSuspended(IndexPage);

    await startGame(wrapper);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    await flushPromises();

    expect(wrapper.text()).toContain('正解');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await flushPromises();

    expect(wrapper.text()).toContain('謝謝');
  });

  it('metadata 読み込み失敗時もゲーム本体は表示する', async () => {
    loadVocabularyMetadataMock.mockRejectedValue(new Error('metadata missing'));

    const wrapper = await mountSuspended(IndexPage);

    expect(wrapper.text()).toContain('ゲームを始める');
    expect(wrapper.text()).toContain('語数未取得');
    expect(wrapper.text()).not.toContain('語数を読み込み中');
    expect(wrapper.text()).toContain('Lobby');
    expect(wrapper.text()).not.toContain('学習を始める');
    expect(wrapper.text()).not.toContain('辞書データ未生成');
  });

  it('metadata が応答しなくても初期化失敗はすぐに表示する', async () => {
    const trainer = createTrainerStub();
    const deferred = createDeferred<never>();
    trainer.game.value = {
      ...trainer.game.value,
      currentQuestion: null,
    };
    trainer.initialize.mockRejectedValue(new Error('wordlist missing'));
    useTraditionalTrainerMock.mockReturnValue(trainer);
    loadVocabularyMetadataMock.mockReturnValue(deferred.promise);

    const wrapper = await mountSuspended(IndexPage);
    await flushPromises();

    expect(wrapper.text()).toContain('辞書データがありません');
    expect(wrapper.text()).toContain('wordlist missing');
    expect(wrapper.text()).toContain('npm run setup:data');
  });

  it('localStorage の読み込みに失敗しても開始画面は表示できる', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    const wrapper = await mountSuspended(IndexPage);

    expect(wrapper.text()).toContain('ゲームを始める');
    expect(wrapper.text()).toContain('レベルごとの最高記録');
  });

  it('localStorage の保存に失敗してもゲーム本体は継続できる', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    });

    const wrapper = await mountSuspended(IndexPage);
    await startGame(wrapper);

    const answerButton = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    await answerButton?.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('正解');
    expect(wrapper.text()).toContain('Score');
  });

  it('レベル変更失敗時は UI にエラーを表示する', async () => {
    const trainer = createTrainerStub();
    trainer.setLevel.mockRejectedValue(new Error('level 2 missing'));
    useTraditionalTrainerMock.mockReturnValue(trainer);

    const wrapper = await mountSuspended(IndexPage);
    const levelButton = wrapper
      .findAll('.level-card')
      .find((candidate) => candidate.text().includes('Level 2'));

    await levelButton?.trigger('click');
    await flushPromises();

    expect(trainer.setLevel).toHaveBeenCalledWith(2);
    expect(wrapper.text()).toContain('level 2 missing');
    expect(wrapper.text()).toContain('ゲームを始める');
    expect(wrapper.find('.session-start-panel').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('你好');
    expect(wrapper.text()).not.toContain('辞書データ未生成');
    expect(levelButton?.attributes('disabled')).toBeUndefined();
  });

  it('開始前のレベル変更失敗後にゲームを始めると古いエラーを残さない', async () => {
    const trainer = createTrainerStub();
    trainer.setLevel.mockRejectedValueOnce(new Error('level 2 missing'));
    useTraditionalTrainerMock.mockReturnValue(trainer);

    const wrapper = await mountSuspended(IndexPage);
    const levelButton = wrapper
      .findAll('.level-card')
      .find((candidate) => candidate.text().includes('Level 2'));

    await levelButton?.trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('level 2 missing');

    await wrapper.get('button.session-start-button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).not.toContain('level 2 missing');
    expect(wrapper.text()).toContain('4つの選択肢から、意味に合うものを1つ選んでください。');
  });

  it('レベル切替中はゲーム開始を受け付けない', async () => {
    const trainer = createTrainerStub();
    const deferred = createDeferred<void>();

    trainer.setLevel.mockImplementation(async () => {
      trainer.isLoading.value = true;
      await deferred.promise;
      trainer.isLoading.value = false;
    });
    useTraditionalTrainerMock.mockReturnValue(trainer);

    const wrapper = await mountSuspended(IndexPage);
    const levelButton = wrapper
      .findAll('.level-card')
      .find((candidate) => candidate.text().includes('Level 2'));

    await levelButton?.trigger('click');
    await flushPromises();

    const startButton = wrapper.get('button.session-start-button');
    expect(startButton.attributes('disabled')).toBeDefined();

    await startButton.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('ゲームを始める');
    expect(wrapper.text()).not.toContain('4つの選択肢から、意味に合うものを1つ選んでください。');
    expect(trainer.game.value.level).toBe(1);

    deferred.resolve();
    await flushPromises();

    expect(wrapper.get('button.session-start-button').attributes('disabled')).toBeUndefined();
  });

  it('リセット失敗時は UI にエラーを表示する', async () => {
    const trainer = createTrainerStub();
    trainer.resetSession.mockRejectedValue(new Error('session reset failed'));
    useTraditionalTrainerMock.mockReturnValue(trainer);

    const wrapper = await mountSuspended(IndexPage);
    await startGame(wrapper);
    const resetButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().includes('最初からやり直す'));

    await resetButton?.trigger('click');
    await flushPromises();

    expect(trainer.resetSession).toHaveBeenCalled();
    expect(wrapper.text()).toContain('session reset failed');
  });

  it('ゲームオーバー後の再開失敗時も UI にエラーを表示する', async () => {
    const trainer = createTrainerStub();
    trainer.resetSession.mockRejectedValue(new Error('restart failed'));
    useTraditionalTrainerMock.mockReturnValue(trainer);

    const wrapper = await mountSuspended(IndexPage);
    await startGame(wrapper);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const wrongChoice = wrapper
        .findAll('.choice-card')
        .find((candidate) => candidate.text().includes('牛乳'));

      await wrongChoice?.trigger('click');
      await flushPromises();

      if (attempt < 2) {
        await wrapper.get('button.primary-button').trigger('click');
        await flushPromises();
      }
    }

    await wrapper.get('button.primary-button').trigger('click');
    await flushPromises();

    expect(trainer.resetSession).toHaveBeenCalled();
    expect(wrapper.text()).toContain('restart failed');
    expect(wrapper.text()).toContain('Game Over');
  });

  it('音声未対応環境では音声開始案内を表示しない', async () => {
    Reflect.deleteProperty(window as unknown as Record<string, unknown>, 'speechSynthesis');
    Reflect.deleteProperty(
      window as unknown as Record<string, unknown>,
      'SpeechSynthesisUtterance'
    );
    Reflect.deleteProperty(globalThis as Record<string, unknown>, 'SpeechSynthesisUtterance');

    const wrapper = await mountSuspended(IndexPage);

    expect(wrapper.text()).toContain('ゲームを始める');
    expect(wrapper.text()).not.toContain('音声開始が必要');
  });

  it('voiceschanged で再読み上げ中の音声を再キューしない', async () => {
    let voicesChangedHandler: (() => void) | undefined;

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speaking: true,
        getVoices: vi.fn(
          () => [{ lang: 'zh-TW', name: 'Mock Taiwanese' }] as SpeechSynthesisVoice[]
        ),
        addEventListener: vi.fn((eventName: string, handler: () => void) => {
          if (eventName === 'voiceschanged') {
            voicesChangedHandler = handler;
          }
        }),
        removeEventListener: vi.fn(),
        cancel: vi.fn(),
        speak: vi.fn(),
      } satisfies Partial<SpeechSynthesis>,
    });

    const wrapper = await mountSuspended(IndexPage);
    await startGame(wrapper);
    await flushPromises();

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);

    voicesChangedHandler?.();
    await flushPromises();

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('回答時は進行中の読み上げを停止する', async () => {
    const speechSynthesisMock: {
      speaking: boolean;
      getVoices: ReturnType<typeof vi.fn>;
      addEventListener: ReturnType<typeof vi.fn>;
      removeEventListener: ReturnType<typeof vi.fn>;
      cancel: ReturnType<typeof vi.fn>;
      speak: ReturnType<typeof vi.fn>;
    } = {
      speaking: false,
      getVoices: vi.fn(() => [{ lang: 'zh-TW', name: 'Mock Taiwanese' }] as SpeechSynthesisVoice[]),
      addEventListener: vi.fn(),
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

    const wrapper = await mountSuspended(IndexPage);
    await startGame(wrapper);
    await flushPromises();

    const cancelCallsBeforeAnswer = speechSynthesisMock.cancel.mock.calls.length;
    const answerButton = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    await answerButton?.trigger('click');
    await flushPromises();

    expect(speechSynthesisMock.cancel).toHaveBeenCalledTimes(cancelCallsBeforeAnswer + 1);
    expect(speechSynthesisMock.speaking).toBe(false);
  });

  it('リセット後は開始パネルに戻る', async () => {
    const wrapper = await mountSuspended(IndexPage);

    await startGame(wrapper);
    const answerButton = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    await answerButton?.trigger('click');
    await flushPromises();

    const resetButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().includes('最初からやり直す'));

    await resetButton?.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Arcade Lobby');
    expect(wrapper.text()).toContain('準備OK。');
    expect(wrapper.text()).not.toContain('你好');
  });

  it('リセット中は先に開始パネルへ切り替える', async () => {
    const trainer = createTrainerStub();
    const deferred = createDeferred<void>();
    trainer.resetSession.mockImplementation(() => {
      trainer.game.value = {
        ...createGameState(),
        level: trainer.game.value.level,
        currentQuestion: questionTwo,
      };

      return deferred.promise;
    });
    useTraditionalTrainerMock.mockReturnValue(trainer);

    const wrapper = await mountSuspended(IndexPage);
    await startGame(wrapper);

    const resetButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().includes('最初からやり直す'));

    await resetButton?.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Arcade Lobby');
    expect(wrapper.text()).toContain('準備OK。');
    expect(wrapper.text()).not.toContain('再見');

    deferred.resolve();
    await flushPromises();
  });

  it('再生中に音声ボタンを押すと停止する', async () => {
    const speechSynthesisMock: {
      speaking: boolean;
      getVoices: ReturnType<typeof vi.fn>;
      addEventListener: ReturnType<typeof vi.fn>;
      removeEventListener: ReturnType<typeof vi.fn>;
      cancel: ReturnType<typeof vi.fn>;
      speak: ReturnType<typeof vi.fn>;
    } = {
      speaking: false,
      getVoices: vi.fn(() => [{ lang: 'zh-TW', name: 'Mock Taiwanese' }] as SpeechSynthesisVoice[]),
      addEventListener: vi.fn(),
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

    const wrapper = await mountSuspended(IndexPage);
    await startGame(wrapper);
    await flushPromises();

    const audioButton = wrapper.get('button.audio-button');
    const cancelCallsBeforeStop = speechSynthesisMock.cancel.mock.calls.length;

    expect(audioButton.text()).toContain('停止');

    await audioButton.trigger('click');
    await flushPromises();

    expect(speechSynthesisMock.cancel).toHaveBeenCalledTimes(cancelCallsBeforeStop + 1);
    expect(wrapper.get('button.audio-button').text()).toContain('読み上げ');
  });
});

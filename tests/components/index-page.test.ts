import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

import { getScoreForCorrectAnswer } from '~/composables/useTraditionalTrainer';
import IndexPage from '~/pages/index.vue';
import type { GameState } from '~~/shared/types/vocabulary';

import { questionOne, questionTwo } from '../fixtures/vocabulary';

const preferredReducedMotion = vi.hoisted(() => ({
  value: 'no-preference' as 'no-preference' | 'reduce',
}));
const unlockAudioEffectsMock = vi.hoisted(() => vi.fn(async () => undefined));
const playFeedbackSoundMock = vi.hoisted(() => vi.fn(async () => undefined));
const playGameOverSoundMock = vi.hoisted(() => vi.fn(async () => undefined));
const playRecordCelebrationSoundMock = vi.hoisted(() => vi.fn(async () => undefined));
const playLevelSelectSoundMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('@vueuse/core', () => ({
  usePreferredReducedMotion: () => preferredReducedMotion,
}));

vi.mock('~/composables/useFeedbackAudio', () => ({
  useFeedbackAudio: () => ({
    audioEffectsSupported: ref(true),
    unlockAudioEffects: unlockAudioEffectsMock,
    playFeedbackSound: playFeedbackSoundMock,
    playGameOverSound: playGameOverSoundMock,
    playRecordCelebrationSound: playRecordCelebrationSoundMock,
    playLevelSelectSound: playLevelSelectSoundMock,
    setup: vi.fn(),
    cleanup: vi.fn(),
  }),
}));

const useTraditionalTrainerMock = vi.hoisted(() => vi.fn());
const loadVocabularyMetadataMock = vi.hoisted(() => vi.fn());
const HIGH_SCORE_STORAGE_KEY = 'lexi-formosa-high-scores-v2';

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
    unlockAudioEffectsMock.mockReset();
    playFeedbackSoundMock.mockReset();
    playGameOverSoundMock.mockReset();
    playRecordCelebrationSoundMock.mockReset();
    playLevelSelectSoundMock.mockReset();
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

  it('開始後に読み方を表示する', async () => {
    const wrapper = await mountSuspended(IndexPage);

    await startGame(wrapper);

    expect(wrapper.find('.hero-panel').exists()).toBe(false);
    expect(wrapper.text()).toContain('Level 1');
    expect(wrapper.text()).toContain('Score');
    expect(wrapper.find('.level-panel').exists()).toBe(false);
    expect(wrapper.find('.result-banner').exists()).toBe(false);
    expect(wrapper.find('.feedback-row').exists()).toBe(false);
    expect(wrapper.find('.answer-support-row').exists()).toBe(false);
    expect(wrapper.find('.game-over-panel').exists()).toBe(false);
    expect(wrapper.find('.choice-grid').exists()).toBe(true);
    expect(wrapper.text()).toContain('你好');
    expect(wrapper.text()).toContain('ニ ハオ');
    expect(wrapper.text()).toContain('nǐ hǎo');
    expect(wrapper.get('button.audio-button').text()).toContain('音声を再生');
  });

  it('開始前パネルに選択中レベルの要約と記録をまとめて表示し、レベル変更で追従する', async () => {
    window.localStorage.setItem(
      HIGH_SCORE_STORAGE_KEY,
      JSON.stringify({
        1: { score: 11, streak: 1 },
        2: { score: 22, streak: 2 },
        3: { score: 33, streak: 3 },
      })
    );

    const trainer = createTrainerStub();
    trainer.setLevel.mockImplementation(async (level: 1 | 2 | 3) => {
      trainer.game.value = {
        ...trainer.game.value,
        level,
      };
    });
    useTraditionalTrainerMock.mockReturnValue(trainer);

    const wrapper = await mountSuspended(IndexPage);
    await flushPromises();

    const currentLevelPanel = () => wrapper.get('.session-start-current-level');

    expect(currentLevelPanel().text()).toContain('Level 1');
    expect(currentLevelPanel().text()).toContain('45 words');
    expect(currentLevelPanel().text()).toContain('11');
    expect(currentLevelPanel().text()).not.toContain('22');

    const levelButton = wrapper
      .findAll('.level-card')
      .find((candidate) => candidate.text().includes('Level 2'));

    await levelButton?.trigger('click');
    await flushPromises();

    expect(currentLevelPanel().text()).toContain('Level 2');
    expect(currentLevelPanel().text()).toContain('38 words');
    expect(currentLevelPanel().text()).toContain('22');
    expect(currentLevelPanel().text()).not.toContain('11');
  });

  it('TOP の補助情報には繁体字のみを表示しない', async () => {
    const wrapper = await mountSuspended(IndexPage);
    await flushPromises();

    expect(wrapper.find('.hero-meta').text()).not.toContain('繁体字のみ');
  });

  it('開始前のルール見出しは表示しない', async () => {
    const wrapper = await mountSuspended(IndexPage);
    await flushPromises();

    expect(wrapper.find('.session-start-rules').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('ルール');
  });

  it('TOP のレコードカードを押すと同じ効果音でレベルを切り替える', async () => {
    const trainer = createTrainerStub();
    useTraditionalTrainerMock.mockReturnValue(trainer);

    const wrapper = await mountSuspended(IndexPage);
    const recordButton = wrapper
      .findAll('button.record-card')
      .find((candidate) => candidate.text().includes('Level 2'));

    await recordButton?.trigger('click');
    await flushPromises();

    expect(trainer.setLevel).toHaveBeenCalledWith(2);
    expect(playLevelSelectSoundMock).toHaveBeenCalledTimes(1);
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
    expect(wrapper.find('.game-over-panel').exists()).toBe(true);
    expect(wrapper.find('.game-over-panel')?.classes()).toContain('game-over-panel--celebration');
    expect(wrapper.findAll('.game-over-achievement')).toHaveLength(0);
    const levelBestPanel = wrapper
      .findAll('.game-over-level-best')
      .find((candidate) => candidate.text().includes('Level Best'));
    expect(levelBestPanel?.text()).toContain('NEW BEST');
    expect(levelBestPanel?.text()).toContain('自己ベストを更新');
    expect(wrapper.find('.answer-support-row').exists()).toBe(true);
    expect(wrapper.find('.lookup-panel').exists()).toBe(true);
    expect(wrapper.find('.answer-support-actions').exists()).toBe(false);
    expect(wrapper.find('.game-over-actions').exists()).toBe(true);
    expect(playFeedbackSoundMock).toHaveBeenCalledTimes(3);
    expect(playGameOverSoundMock).toHaveBeenCalledTimes(1);
    expect(playRecordCelebrationSoundMock).toHaveBeenCalledWith('double');
  });

  it('ゲームオーバー時は再開を先に案内する', async () => {
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

    expect(wrapper.findAll('.game-over-actions button').map((button) => button.text())).toEqual([
      'もう一度始める',
      'トップへ戻る',
    ]);
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

  it('HUD の Life は数字ではなく残機バーとして表示する', async () => {
    const wrapper = await mountSuspended(IndexPage);

    await startGame(wrapper);

    const wrongChoice = () =>
      wrapper.findAll('.choice-card').find((candidate) => candidate.text().includes('牛乳'));

    await wrongChoice()?.trigger('click');
    await flushPromises();
    await wrapper.get('button.primary-button').trigger('click');
    await flushPromises();

    await wrongChoice()?.trigger('click');
    await flushPromises();

    const remainingStat = wrapper.get('.question-stage__stat--remaining');
    const lifeSlots = remainingStat.findAll('.life-meter__slot');
    const activeLifeSlots = remainingStat.findAll('.life-meter__slot--active');

    expect(remainingStat.text()).toContain('Life');
    expect(remainingStat.find('.life-meter').attributes('aria-label')).toBe('Life 残り1');
    expect(lifeSlots).toHaveLength(3);
    expect(activeLifeSlots).toHaveLength(1);
    expect(remainingStat.get('dd').text()).toBe('残り1');
    expect(remainingStat.classes()).not.toContain('question-stage__stat--alert');
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
    await flushPromises();

    expect(wrapper.text()).toContain('ゲームを始める');
    expect(wrapper.findAll('.level-count').map((candidate) => candidate.text())).toEqual([
      'Words unavailable',
      'Words unavailable',
      'Words unavailable',
    ]);
    expect(wrapper.find('.session-start-panel').exists()).toBe(true);
    expect(wrapper.find('.audio-start-notice').exists()).toBe(false);
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
    expect(wrapper.find('.question-stage').exists()).toBe(false);
    expect(wrapper.find('.audio-start-notice').exists()).toBe(false);
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

    expect(wrapper.find('.session-start-error').exists()).toBe(false);
    expect(wrapper.find('.session-start-panel').exists()).toBe(false);
    expect(wrapper.find('.choice-grid').exists()).toBe(true);
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
    expect(wrapper.find('.session-start-panel').exists()).toBe(true);
    expect(wrapper.find('.choice-grid').exists()).toBe(false);
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
    const answerButton = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    await answerButton?.trigger('click');
    await flushPromises();

    const resetButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().includes('トップへ戻る'));

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

  it('記録更新がないゲームオーバーでは自己ベストを簡潔表示する', async () => {
    window.localStorage.setItem(
      HIGH_SCORE_STORAGE_KEY,
      JSON.stringify({
        1: { score: 100, streak: 8 },
        2: { score: 0, streak: 0 },
        3: { score: 0, streak: 0 },
      })
    );

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

    expect(wrapper.find('.game-over-level-best--compact').exists()).toBe(true);
    expect(wrapper.find('.game-over-stats').exists()).toBe(false);
    expect(wrapper.text()).toContain('100');
    expect(wrapper.text()).toContain('8');
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
    const answerButton = wrapper
      .findAll('.choice-card')
      .find((candidate) => candidate.text().includes('こんにちは'));

    await answerButton?.trigger('click');
    await flushPromises();

    const resetButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().includes('トップへ戻る'));

    await resetButton?.trigger('click');
    await flushPromises();

    expect(wrapper.find('.session-start-panel').exists()).toBe(true);
    expect(wrapper.find('.workspace-grid--play').exists()).toBe(false);

    deferred.resolve();
    await flushPromises();
  });
});

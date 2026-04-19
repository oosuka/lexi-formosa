import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFeedbackAudio } from '~/composables/useFeedbackAudio';

class TestAudioParam {
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class TestGainNode {
  gain = new TestAudioParam();
  connect = vi.fn();
}

class TestOscillatorNode {
  type: OscillatorType = 'sine';
  frequency = new TestAudioParam();
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class TestAudioContext {
  static instances: TestAudioContext[] = [];
  gainNodes: TestGainNode[] = [];
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  resume = vi.fn(async () => undefined);
  close = vi.fn(async () => undefined);
  createOscillator = vi.fn(() => new TestOscillatorNode());
  createGain = vi.fn(() => {
    const gainNode = new TestGainNode();
    this.gainNodes.push(gainNode);
    return gainNode;
  });

  constructor() {
    TestAudioContext.instances.push(this);
  }
}

describe('useFeedbackAudio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    TestAudioContext.instances = [];
    Reflect.deleteProperty(window as unknown as Record<string, unknown>, 'matchMedia');
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      configurable: true,
      value: 0,
    });
    Reflect.deleteProperty(
      window.navigator as Navigator & { audioSession?: unknown },
      'audioSession'
    );
  });

  it('AudioContext 非対応環境では no-op で継続する', async () => {
    Reflect.deleteProperty(window as unknown as Record<string, unknown>, 'AudioContext');
    Reflect.deleteProperty(globalThis as Record<string, unknown>, 'AudioContext');

    const feedbackAudio = useFeedbackAudio();
    feedbackAudio.setup();

    await expect(feedbackAudio.playFeedbackSound(true)).resolves.toBeUndefined();
    expect(feedbackAudio.audioEffectsSupported.value).toBe(false);
  });

  it('正解時は3音、不正解時は2音を再生する', async () => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: TestAudioContext,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: TestAudioContext,
    });

    const feedbackAudio = useFeedbackAudio();
    feedbackAudio.setup();

    await feedbackAudio.playFeedbackSound(true);
    expect(TestAudioContext.instances).toHaveLength(1);
    expect(TestAudioContext.instances[0]?.createOscillator).toHaveBeenCalledTimes(3);
    expect(
      TestAudioContext.instances[0]?.gainNodes[0]?.gain.exponentialRampToValueAtTime.mock
        .calls[0]?.[0]
    ).toBe(0.24);

    await feedbackAudio.playFeedbackSound(false);
    expect(TestAudioContext.instances[0]?.createOscillator).toHaveBeenCalledTimes(5);
  });

  it('対応環境では Web Audio が消音スイッチに巻き込まれないよう audioSession を playback にする', () => {
    const audioSession = { type: 'auto' };

    Object.defineProperty(window.navigator, 'audioSession', {
      configurable: true,
      value: audioSession,
    });

    const feedbackAudio = useFeedbackAudio();
    feedbackAudio.setup();

    expect(audioSession.type).toBe('playback');
  });

  it('TOP のレベル選択で短い効果音を鳴らす', async () => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: TestAudioContext,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: TestAudioContext,
    });

    const feedbackAudio = useFeedbackAudio();
    feedbackAudio.setup();

    await feedbackAudio.playLevelSelectSound();
    expect(TestAudioContext.instances).toHaveLength(1);
    expect(TestAudioContext.instances[0]?.createOscillator).toHaveBeenCalledTimes(2);
  });

  it('スマホ環境では正誤とレベル選択の効果音ゲインを上げる', async () => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: TestAudioContext,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: TestAudioContext,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: query === '(pointer: coarse)',
      })),
    });

    const feedbackAudio = useFeedbackAudio();
    feedbackAudio.setup();

    await feedbackAudio.playFeedbackSound(true);
    await feedbackAudio.playFeedbackSound(false);
    await feedbackAudio.playLevelSelectSound();

    const context = TestAudioContext.instances[0];
    const correctFirstGain =
      context?.gainNodes[0]?.gain.exponentialRampToValueAtTime.mock.calls[0]?.[0];
    const incorrectFirstGain =
      context?.gainNodes[3]?.gain.exponentialRampToValueAtTime.mock.calls[0]?.[0];
    const levelSelectFirstGain =
      context?.gainNodes[5]?.gain.exponentialRampToValueAtTime.mock.calls[0]?.[0];

    expect(correctFirstGain).toBeCloseTo(1.25);
    expect(incorrectFirstGain).toBeCloseTo(1.25);
    expect(levelSelectFirstGain).toBeCloseTo(0.58);
  });

  it('pointer 判定が外れてもタッチ端末では効果音ゲインを上げる', async () => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: TestAudioContext,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: TestAudioContext,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: query === '(hover: none)',
      })),
    });
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    });

    const feedbackAudio = useFeedbackAudio();
    feedbackAudio.setup();

    await feedbackAudio.playFeedbackSound(false);

    const boostedGain =
      TestAudioContext.instances[0]?.gainNodes[0]?.gain.exponentialRampToValueAtTime.mock
        .calls[0]?.[0];

    expect(boostedGain).toBeCloseTo(1.25);
  });

  it('スマホ環境ではゲームオーバー音を正誤音と同じ大きさで鳴らす', async () => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: TestAudioContext,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: TestAudioContext,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: query === '(pointer: coarse)',
      })),
    });

    const feedbackAudio = useFeedbackAudio();
    feedbackAudio.setup();

    await feedbackAudio.playGameOverSound();

    const gameOverFirstGain =
      TestAudioContext.instances[0]?.gainNodes[0]?.gain.exponentialRampToValueAtTime.mock
        .calls[0]?.[0];

    expect(gameOverFirstGain).toBeCloseTo(1.25);
  });

  it('resume 失敗時も例外を外へ漏らさない', async () => {
    class SuspendedAudioContext extends TestAudioContext {
      override state: AudioContextState = 'suspended';
      override resume = vi.fn(async () => {
        throw new Error('resume failed');
      });
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: SuspendedAudioContext,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: SuspendedAudioContext,
    });

    const feedbackAudio = useFeedbackAudio();
    feedbackAudio.setup();

    await expect(feedbackAudio.playFeedbackSound(true)).resolves.toBeUndefined();
    expect(SuspendedAudioContext.instances).toHaveLength(1);
    expect(SuspendedAudioContext.instances[0]?.createOscillator).not.toHaveBeenCalled();
  });

  it('ユーザー操作中に無音ノードで AudioContext をアンロックできる', async () => {
    class SuspendedAudioContext extends TestAudioContext {
      override state: AudioContextState = 'suspended';
      override resume = vi.fn(async () => {
        this.state = 'running';
      });
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: SuspendedAudioContext,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: SuspendedAudioContext,
    });

    const feedbackAudio = useFeedbackAudio();
    feedbackAudio.setup();

    await feedbackAudio.unlockAudioEffects();

    const context = SuspendedAudioContext.instances[0];

    expect(context?.resume).toHaveBeenCalledTimes(1);
    expect(context?.createOscillator).toHaveBeenCalledTimes(1);
    expect(context?.createGain).toHaveBeenCalledTimes(1);
  });

  it('cleanup は開いている AudioContext を閉じて次回再生成できる', async () => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: TestAudioContext,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: TestAudioContext,
    });

    const feedbackAudio = useFeedbackAudio();
    feedbackAudio.setup();

    await feedbackAudio.playFeedbackSound(true);
    expect(TestAudioContext.instances).toHaveLength(1);

    feedbackAudio.cleanup();
    expect(TestAudioContext.instances[0]?.close).toHaveBeenCalledTimes(1);

    await feedbackAudio.playFeedbackSound(false);
    expect(TestAudioContext.instances).toHaveLength(2);
  });
});

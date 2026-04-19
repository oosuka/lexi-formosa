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

  it('正誤効果音はスマホの読み上げ音に埋もれにくい gain を使う', async () => {
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

    const gainNodes = TestAudioContext.instances[0]?.gainNodes ?? [];

    expect(gainNodes).toHaveLength(3);
    expect(gainNodes[0]?.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.24, 0.03);
    expect(gainNodes[1]?.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.3, 0.11);
    expect(gainNodes[2]?.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.24, 0.23);
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

  it('ゲームオーバー時は下降する3音で終了感を出す', async () => {
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

    await feedbackAudio.playGameOverSound();

    expect(TestAudioContext.instances).toHaveLength(1);
    expect(TestAudioContext.instances[0]?.createOscillator).toHaveBeenCalledTimes(3);

    const gainNodes = TestAudioContext.instances[0]?.gainNodes ?? [];

    expect(gainNodes).toHaveLength(3);
    expect(gainNodes[0]?.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.24, 0.03);
    expect(gainNodes[1]?.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.2, 0.19);
    expect(gainNodes[2]?.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.18, 0.39);
  });

  it('新記録演出時はゲームオーバー音より明るい上昇音を追加する', async () => {
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

    await feedbackAudio.playRecordCelebrationSound('single');
    await feedbackAudio.playRecordCelebrationSound('double');

    expect(TestAudioContext.instances).toHaveLength(1);
    expect(TestAudioContext.instances[0]?.createOscillator).toHaveBeenCalledTimes(7);
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

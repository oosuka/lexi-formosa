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
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  resume = vi.fn(async () => undefined);
  close = vi.fn(async () => undefined);
  createOscillator = vi.fn(() => new TestOscillatorNode());
  createGain = vi.fn(() => new TestGainNode());

  constructor() {
    TestAudioContext.instances.push(this);
  }
}

describe('useFeedbackAudio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    TestAudioContext.instances = [];
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

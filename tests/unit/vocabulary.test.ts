import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VocabularyMetadata } from '~/types/vocabulary';

const fetchMock = vi.fn();

const createEntry = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'seed-1',
  trad: '你好',
  ja: 'こんにちは',
  level: 1,
  length: 2,
  category: 'greeting',
  taiwanPriority: true,
  sources: ['seed'],
  ...overrides,
});

const validMetadata: VocabularyMetadata = {
  total: 3,
  counts: {
    1: 1,
    2: 1,
    3: 1,
  },
};

describe('vocabulary utilities', () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    vi.stubGlobal('$fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('レベル語彙を読み込み、同じレベルはキャッシュを再利用する', async () => {
    fetchMock.mockResolvedValue([createEntry()]);

    const { loadVocabularyLevel } = await import('~/utils/vocabulary');

    const first = await loadVocabularyLevel(1);
    const second = await loadVocabularyLevel(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/wordlists/vocabulary-level-1.json');
    expect(first).toEqual([createEntry()]);
    expect(second).toBe(first);
  });

  it('レベル語彙の取得失敗時はセットアップ案内付きで失敗する', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const { loadVocabularyLevel } = await import('~/utils/vocabulary');

    await expect(loadVocabularyLevel(1)).rejects.toThrow('npm run setup:data');
  });

  it('レベル不整合の語彙データを拒否する', async () => {
    fetchMock.mockResolvedValue([createEntry({ level: 2, length: 3, trad: '便利商店' })]);

    const { loadVocabularyLevel } = await import('~/utils/vocabulary');

    await expect(loadVocabularyLevel(1)).rejects.toThrow('expected level 1, got 2');
  });

  it('文字数が実データと合わない語彙データを拒否する', async () => {
    fetchMock.mockResolvedValue([createEntry({ trad: '早安', length: 3 })]);

    const { loadVocabularyLevel } = await import('~/utils/vocabulary');

    await expect(loadVocabularyLevel(1)).rejects.toThrow('expected 3, got 2');
  });

  it('レベルの長さ範囲に合わない語彙データを拒否する', async () => {
    fetchMock.mockResolvedValue([createEntry({ trad: '國際電話卡', level: 2, length: 5 })]);

    const { loadVocabularyLevel } = await import('~/utils/vocabulary');

    await expect(loadVocabularyLevel(2)).rejects.toThrow('does not fit level 2');
  });

  it('metadata を読み込み、同じ結果はキャッシュを再利用する', async () => {
    fetchMock.mockResolvedValue(validMetadata);

    const { loadVocabularyMetadata } = await import('~/utils/vocabulary');

    const first = await loadVocabularyMetadata();
    const second = await loadVocabularyMetadata();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/wordlists/metadata.json');
    expect(first).toEqual(validMetadata);
    expect(second).toBe(first);
  });

  it('app.baseURL 配下の wordlists を読む', async () => {
    fetchMock.mockResolvedValue([createEntry()]);
    vi.stubGlobal('__NUXT__', {
      config: {
        app: {
          baseURL: '/lexi-formosa/',
        },
      },
    });

    const { loadVocabularyLevel } = await import('~/utils/vocabulary');

    await loadVocabularyLevel(1);

    expect(fetchMock).toHaveBeenCalledWith('/lexi-formosa/wordlists/vocabulary-level-1.json');
  });

  it('metadata も app.baseURL 配下の wordlists を読む', async () => {
    fetchMock.mockResolvedValue(validMetadata);
    vi.stubGlobal('__NUXT__', {
      config: {
        app: {
          baseURL: '/lexi-formosa/',
        },
      },
    });

    const { loadVocabularyMetadata } = await import('~/utils/vocabulary');

    await loadVocabularyMetadata();

    expect(fetchMock).toHaveBeenCalledWith('/lexi-formosa/wordlists/metadata.json');
  });

  it('metadata の取得失敗時はセットアップ案内付きで失敗する', async () => {
    fetchMock.mockRejectedValue(new Error('metadata missing'));

    const { loadVocabularyMetadata } = await import('~/utils/vocabulary');

    await expect(loadVocabularyMetadata()).rejects.toThrow('npm run setup:data');
  });

  it('metadata の不正な構造を拒否する', async () => {
    fetchMock.mockResolvedValue({
      total: 3,
      counts: {
        1: 1,
        2: 1,
      },
    });

    const { loadVocabularyMetadata } = await import('~/utils/vocabulary');

    await expect(loadVocabularyMetadata()).rejects.toThrow();
  });
});

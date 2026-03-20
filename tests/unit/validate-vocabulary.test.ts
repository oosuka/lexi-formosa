// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { validateVocabularyEntries } from '../../scripts/validate-vocabulary.mjs';

const createEntry = (overrides = {}) => ({
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

describe('validate vocabulary script', () => {
  it('4択を組めるだけの distinct な日本語ラベルが各レベルに必要', () => {
    expect(() =>
      validateVocabularyEntries([
        createEntry(),
        createEntry({ id: 'seed-2', trad: '早安', ja: 'こんにちは' }),
        createEntry({ id: 'seed-3', trad: '晚安', ja: 'こんばんは' }),
        createEntry({ id: 'seed-4', trad: '謝謝', ja: 'ありがとう' }),
      ])
    ).toThrow('does not have enough distinct Japanese labels');
  });

  it('各レベルで4つ以上の distinct な日本語ラベルがあれば通る', () => {
    expect(() =>
      validateVocabularyEntries([
        createEntry(),
        createEntry({ id: 'seed-2', trad: '早安', ja: 'おはよう' }),
        createEntry({ id: 'seed-3', trad: '晚安', ja: 'こんばんは' }),
        createEntry({ id: 'seed-4', trad: '謝謝', ja: 'ありがとう' }),
        createEntry({ id: 'seed-5', trad: '公車', ja: 'バス' }),
        createEntry({
          id: 'seed-6',
          trad: '便利商店',
          ja: 'コンビニ',
          level: 2,
          length: 4,
          category: 'place',
        }),
        createEntry({
          id: 'seed-7',
          trad: '百貨公司',
          ja: 'デパート',
          level: 2,
          length: 4,
          category: 'place',
        }),
        createEntry({
          id: 'seed-8',
          trad: '週末行程',
          ja: '週末の予定',
          level: 2,
          length: 4,
          category: 'schedule',
        }),
        createEntry({
          id: 'seed-9',
          trad: '公車站牌',
          ja: 'バス停',
          level: 2,
          length: 4,
          category: 'place',
        }),
        createEntry({
          id: 'seed-10',
          trad: '國際電話卡',
          ja: '国際電話カード',
          level: 3,
          length: 5,
          category: 'object',
        }),
        createEntry({
          id: 'seed-11',
          trad: '臺灣高速鐵路',
          ja: '台湾高速鉄道',
          level: 3,
          length: 6,
          category: 'transport',
        }),
        createEntry({
          id: 'seed-12',
          trad: '自助洗衣店鋪',
          ja: 'コインランドリー',
          level: 3,
          length: 6,
          category: 'place',
        }),
        createEntry({
          id: 'seed-13',
          trad: '觀光夜市地圖',
          ja: '観光夜市地図',
          level: 3,
          length: 6,
          category: 'object',
        }),
      ])
    ).not.toThrow();
  });

  it('簡体字や未翻訳の中国語ラベルを拒否する', () => {
    expect(() =>
      validateVocabularyEntries([
        createEntry({ ja: '丝' }),
        createEntry({ id: 'seed-2', trad: '早安', ja: 'おはよう' }),
        createEntry({ id: 'seed-3', trad: '晚安', ja: 'こんばんは' }),
        createEntry({ id: 'seed-4', trad: '謝謝', ja: 'ありがとう' }),
      ])
    ).toThrow('Untranslated or simplified Chinese gloss detected');
  });
});

// @vitest-environment node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { validateVocabularyEntries } from '../../scripts/validate-vocabulary.mjs';

const createEntry = (overrides = {}) => ({
  id: 'seed-1',
  trad: '茶',
  ja: 'お茶',
  level: 1,
  length: 1,
  category: 'food',
  taiwanPriority: true,
  sources: ['seed'],
  ...overrides,
});

const createValidVocabularyEntries = () => [
  createEntry(),
  createEntry({ id: 'seed-2', trad: '書', ja: '本', category: 'object' }),
  createEntry({ id: 'seed-3', trad: '雨', ja: '雨', category: 'weather' }),
  createEntry({ id: 'seed-4', trad: '魚', ja: '魚', category: 'food' }),
  createEntry({
    id: 'seed-5',
    trad: '你好',
    ja: 'こんにちは',
    level: 2,
    length: 2,
    category: 'greeting',
  }),
  createEntry({
    id: 'seed-6',
    trad: '早安',
    ja: 'おはよう',
    level: 2,
    length: 2,
    category: 'greeting',
  }),
  createEntry({
    id: 'seed-7',
    trad: '謝謝',
    ja: 'ありがとう',
    level: 2,
    length: 2,
    category: 'greeting',
  }),
  createEntry({
    id: 'seed-8',
    trad: '地圖',
    ja: '地図',
    level: 2,
    length: 2,
    category: 'object',
  }),
  createEntry({
    id: 'seed-9',
    trad: '便利商店',
    ja: 'コンビニ',
    level: 3,
    length: 4,
    category: 'place',
  }),
  createEntry({
    id: 'seed-10',
    trad: '公車站',
    ja: 'バス停',
    level: 3,
    length: 3,
    category: 'place',
  }),
  createEntry({
    id: 'seed-11',
    trad: '週末行程',
    ja: '週末の予定',
    level: 3,
    length: 4,
    category: 'schedule',
  }),
  createEntry({
    id: 'seed-12',
    trad: '自助洗衣店',
    ja: 'コインランドリー',
    level: 3,
    length: 5,
    category: 'place',
  }),
];

const tempDirectories = [];
const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));
const validateVocabularyScriptPath = fileURLToPath(
  new URL('../../scripts/validate-vocabulary.mjs', import.meta.url)
);
const vocabularyLevelsScriptPath = fileURLToPath(
  new URL('../../scripts/lib/vocabulary-levels.mjs', import.meta.url)
);
const vocabularyJaQualityScriptPath = fileURLToPath(
  new URL('../../scripts/lib/vocabulary-ja-quality.mjs', import.meta.url)
);

const createTempRepo = () => {
  const directory = fs.mkdtempSync(path.join(workspaceRoot, '.tmp-lexi-formosa-validate-'));
  tempDirectories.push(directory);
  return directory;
};

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('validate vocabulary script', () => {
  it('4択を組めるだけの distinct な日本語ラベルが各レベルに必要', () => {
    expect(() =>
      validateVocabularyEntries([
        createEntry(),
        createEntry({ id: 'seed-2', trad: '書', ja: 'お茶' }),
        createEntry({ id: 'seed-3', trad: '雨', ja: '雨' }),
        createEntry({ id: 'seed-4', trad: '魚', ja: '魚' }),
      ])
    ).toThrow('does not have enough distinct Japanese labels');
  });

  it('各レベルで4つ以上の distinct な日本語ラベルがあれば通る', () => {
    expect(() => validateVocabularyEntries(createValidVocabularyEntries())).not.toThrow();
  });

  it('日本語ラベルに簡体字が混ざっていたら拒否する', () => {
    expect(() =>
      validateVocabularyEntries([
        createEntry({ ja: '丝' }),
        createEntry({ id: 'seed-2', trad: '書', ja: '本' }),
        createEntry({ id: 'seed-3', trad: '雨', ja: '雨' }),
        createEntry({ id: 'seed-4', trad: '魚', ja: '魚' }),
      ])
    ).toThrow('Simplified Chinese label detected');
  });

  it('辞書メタ説明のような日本語ラベルは拒否する', () => {
    expect(() =>
      validateVocabularyEntries([
        createEntry({ id: 'bad-meta', trad: '墨', ja: '墨西哥の姓Mo' }),
        ...createValidVocabularyEntries(),
      ])
    ).toThrow('Dictionary metadata Japanese gloss detected');

    expect(() =>
      validateVocabularyEntries([
        createEntry({ id: 'bad-see', trad: '宏亮', ja: 'see 洪亮', level: 2, length: 2 }),
        ...createValidVocabularyEntries(),
      ])
    ).toThrow('Dictionary metadata Japanese gloss detected');
  });

  it('中国語を含む用例説明や記号だけの日本語ラベルは拒否する', () => {
    for (const ja of [
      '啊の代わりに使われる',
      '吗啡で使われている',
      '自个儿で使われる',
      '丁寧な你',
      '丁寧な您',
      'polite form of you',
      '谈得来のように',
      '太阳穴のための太陽',
      '家用电器',
      '诗经と史書經',
      '网络',
      '赢家に対する敗者',
      '月份とも書く',
      '金銀銅鐵錫',
    ]) {
      expect(() =>
        validateVocabularyEntries([
          createEntry({ id: `bad-${ja}`, trad: '哪', ja }),
          ...createValidVocabularyEntries(),
        ])
      ).toThrow(/Dictionary metadata Japanese gloss detected|Simplified Chinese label detected/);
    }

    expect(() =>
      validateVocabularyEntries([
        createEntry({ id: 'bad-symbol', trad: '星', ja: '*' }),
        ...createValidVocabularyEntries(),
      ])
    ).toThrow('Invalid Japanese gloss detected');

    expect(() =>
      validateVocabularyEntries([
        createEntry({ id: 'bad-machine-translation', trad: '細', ja: 'トリフな' }),
        ...createValidVocabularyEntries(),
      ])
    ).toThrow('Machine-translated Japanese gloss detected');
  });

  it('単位や数量の定義文断片は拒否する', () => {
    for (const ja of ['10分の1テール兩', '3分の1メートル', '中国の通貨単位', '光度の単位']) {
      expect(() =>
        validateVocabularyEntries([
          createEntry({ id: `bad-unit-${ja}`, trad: '錢', ja }),
          ...createValidVocabularyEntries(),
        ])
      ).toThrow(/Dictionary metadata Japanese gloss detected|Simplified Chinese label detected/);
    }
  });

  it('レベル範囲外の文字数は原因が分かる文言で拒否する', () => {
    expect(() =>
      validateVocabularyEntries([
        createEntry({
          trad: '便利商店',
          ja: 'コンビニ',
          level: 2,
          length: 4,
          category: 'place',
        }),
        createEntry({
          id: 'seed-2',
          trad: '你好',
          ja: 'こんにちは',
          level: 2,
          length: 2,
          category: 'greeting',
        }),
        createEntry({
          id: 'seed-3',
          trad: '早安',
          ja: 'おはよう',
          level: 2,
          length: 2,
          category: 'greeting',
        }),
        createEntry({
          id: 'seed-4',
          trad: '謝謝',
          ja: 'ありがとう',
          level: 2,
          length: 2,
          category: 'greeting',
        }),
      ])
    ).toThrow('Length out of range');
  });

  it('繁体字が重複していたら拒否する', () => {
    expect(() =>
      validateVocabularyEntries([
        ...createValidVocabularyEntries(),
        createEntry({
          id: 'seed-duplicate-trad',
          trad: '你好',
          ja: 'やあ',
        }),
      ])
    ).toThrow('Duplicate trad detected');
  });

  it('出題語彙に簡体字が混ざっていたら拒否する', () => {
    expect(() =>
      validateVocabularyEntries([
        createEntry({ trad: '汉', ja: '漢', length: 1 }),
        createEntry({ id: 'seed-2', trad: '書', ja: '本' }),
        createEntry({ id: 'seed-3', trad: '雨', ja: '雨' }),
        createEntry({ id: 'seed-4', trad: '魚', ja: '魚' }),
      ])
    ).toThrow('Possible simplified character detected');
  });

  it('CLI でも妥当な語彙ファイルを検証できる', () => {
    const repoRoot = createTempRepo();
    const scriptDirectory = path.join(repoRoot, 'scripts');
    const scriptLibDirectory = path.join(scriptDirectory, 'lib');
    const dataDirectory = path.join(repoRoot, 'data');

    fs.mkdirSync(scriptDirectory, { recursive: true });
    fs.mkdirSync(scriptLibDirectory, { recursive: true });
    fs.mkdirSync(dataDirectory, { recursive: true });
    fs.copyFileSync(
      validateVocabularyScriptPath,
      path.join(scriptDirectory, 'validate-vocabulary.mjs')
    );
    fs.copyFileSync(
      vocabularyLevelsScriptPath,
      path.join(scriptLibDirectory, 'vocabulary-levels.mjs')
    );
    fs.copyFileSync(
      vocabularyJaQualityScriptPath,
      path.join(scriptLibDirectory, 'vocabulary-ja-quality.mjs')
    );
    fs.writeFileSync(
      path.join(dataDirectory, 'vocabulary.json'),
      `${JSON.stringify(createValidVocabularyEntries(), null, 2)}\n`
    );

    const result = spawnSync(
      process.execPath,
      [path.join(scriptDirectory, 'validate-vocabulary.mjs')],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Validated 12 vocabulary entries across 3 levels.');
  });
});

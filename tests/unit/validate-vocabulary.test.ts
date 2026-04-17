// @vitest-environment node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

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

const createValidVocabularyEntries = () => [
  createEntry(),
  createEntry({ id: 'seed-2', trad: '早安', ja: 'おはよう' }),
  createEntry({ id: 'seed-3', trad: '晚安', ja: 'こんばんは' }),
  createEntry({ id: 'seed-4', trad: '謝謝', ja: 'ありがとう' }),
  createEntry({
    id: 'seed-5',
    trad: '便利商店',
    ja: 'コンビニ',
    level: 2,
    length: 4,
    category: 'place',
  }),
  createEntry({
    id: 'seed-6',
    trad: '百貨公司',
    ja: 'デパート',
    level: 2,
    length: 4,
    category: 'place',
  }),
  createEntry({
    id: 'seed-7',
    trad: '公車站牌',
    ja: 'バス停',
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
    trad: '國際電話卡',
    ja: '国際電話カード',
    level: 3,
    length: 5,
    category: 'object',
  }),
  createEntry({
    id: 'seed-10',
    trad: '臺灣高速鐵路',
    ja: '台湾高速鉄道',
    level: 3,
    length: 6,
    category: 'transport',
  }),
  createEntry({
    id: 'seed-11',
    trad: '自助洗衣店鋪',
    ja: 'コインランドリー',
    level: 3,
    length: 6,
    category: 'place',
  }),
  createEntry({
    id: 'seed-12',
    trad: '觀光夜市地圖',
    ja: '観光夜市地図',
    level: 3,
    length: 6,
    category: 'object',
  }),
];

const tempDirectories = [];
const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));
const validateVocabularyScriptPath = fileURLToPath(
  new URL('../../scripts/validate-vocabulary.mjs', import.meta.url)
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
        createEntry({ id: 'seed-2', trad: '早安', ja: 'こんにちは' }),
        createEntry({ id: 'seed-3', trad: '晚安', ja: 'こんばんは' }),
        createEntry({ id: 'seed-4', trad: '謝謝', ja: 'ありがとう' }),
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
        createEntry({ id: 'seed-2', trad: '早安', ja: 'おはよう' }),
        createEntry({ id: 'seed-3', trad: '晚安', ja: 'こんばんは' }),
        createEntry({ id: 'seed-4', trad: '謝謝', ja: 'ありがとう' }),
      ])
    ).toThrow('Simplified Chinese label detected');
  });

  it('レベル範囲外の文字数は原因が分かる文言で拒否する', () => {
    expect(() =>
      validateVocabularyEntries([
        createEntry({
          trad: '國際電話卡',
          ja: '国際電話カード',
          level: 2,
          length: 5,
          category: 'object',
        }),
        createEntry({
          id: 'seed-2',
          trad: '便利商店',
          ja: 'コンビニ',
          level: 2,
          length: 4,
          category: 'place',
        }),
        createEntry({
          id: 'seed-3',
          trad: '百貨公司',
          ja: 'デパート',
          level: 2,
          length: 4,
          category: 'place',
        }),
        createEntry({
          id: 'seed-4',
          trad: '公車站牌',
          ja: 'バス停',
          level: 2,
          length: 4,
          category: 'place',
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
        createEntry({ trad: '汉堡', ja: 'ハンバーガー' }),
        createEntry({ id: 'seed-2', trad: '早安', ja: 'おはよう' }),
        createEntry({ id: 'seed-3', trad: '晚安', ja: 'こんばんは' }),
        createEntry({ id: 'seed-4', trad: '謝謝', ja: 'ありがとう' }),
      ])
    ).toThrow('Possible simplified character detected');
  });

  it('CLI でも妥当な語彙ファイルを検証できる', () => {
    const repoRoot = createTempRepo();
    const scriptDirectory = path.join(repoRoot, 'scripts');
    const dataDirectory = path.join(repoRoot, 'data');

    fs.mkdirSync(scriptDirectory, { recursive: true });
    fs.mkdirSync(dataDirectory, { recursive: true });
    fs.copyFileSync(
      validateVocabularyScriptPath,
      path.join(scriptDirectory, 'validate-vocabulary.mjs')
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

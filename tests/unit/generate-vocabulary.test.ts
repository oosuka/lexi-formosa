// @vitest-environment node
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const tempDirectories = [];
const generateVocabularyModuleUrl = new URL(
  '../../scripts/generate-vocabulary.mjs',
  import.meta.url
);
let importSequence = 0;

const createTempRepo = () => {
  const directory = fs.mkdtempSync(path.join(tmpdir(), 'lexi-formosa-generate-'));
  tempDirectories.push(directory);
  return directory;
};

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const writeText = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
};

const loadGenerateVocabularyModule = async (cwd) => {
  const previousCwd = process.cwd();
  process.chdir(cwd);

  try {
    importSequence += 1;
    return await import(`${generateVocabularyModuleUrl.href}?case=${importSequence}`);
  } finally {
    process.chdir(previousCwd);
  }
};

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('generate vocabulary script', () => {
  it('seed・台湾華語寄りソース・却下理由から配信用データとメタデータを生成する', async () => {
    const repoRoot = createTempRepo();

    writeJson(path.join(repoRoot, 'data', 'manual-vocabulary.json'), [
      {
        id: 'manual-hello',
        trad: '你好',
        ja: 'こんにちは',
        category: 'greeting',
      },
      {
        id: 'manual-hello-duplicate',
        trad: '你好',
        ja: '重複候補',
        category: 'greeting',
      },
      {
        id: 'manual-store',
        trad: '便利商店',
        ja: 'コンビニ',
        category: 'place',
      },
      {
        id: 'manual-laundry',
        trad: '自助洗衣店',
        ja: 'コインランドリー',
        category: 'place',
      },
    ]);
    writeJson(path.join(repoRoot, 'data', 'source-snapshots', 'tocfl_words.json'), [
      {
        id: 1,
        text: '你好',
        pinyin: 'nǐ hǎo',
        zhuyin: 'ㄋㄧˇ ㄏㄠˇ',
        tocfl_level: 1,
        category: 'greeting',
      },
      {
        id: 2,
        text: '爸',
        pinyin: 'bà',
        zhuyin: 'ㄅㄚˋ',
        tocfl_level: 1,
        category: 'people',
      },
      {
        id: 3,
        text: '爸爸',
        pinyin: 'bà ba',
        zhuyin: 'ㄅㄚˋ ㄅㄚ',
        tocfl_level: 1,
        category: 'people',
      },
      {
        id: 4,
        text: '東西',
        pinyin: 'dōng xi',
        zhuyin: 'ㄉㄨㄥ ㄒㄧ',
        tocfl_level: 1,
        category: 'noun',
      },
      {
        id: 5,
        text: '摩托車',
        pinyin: 'mó tuō chē',
        zhuyin: 'ㄇㄛˊ ㄊㄨㄛ ㄔㄜ',
        tocfl_level: 2,
        category: 'transport',
      },
      {
        id: 5,
        text: 'A1',
        pinyin: 'ei wan',
        zhuyin: 'ㄟ ㄨㄢ',
        tocfl_level: 1,
        category: 'misc',
      },
    ]);
    writeText(
      path.join(repoRoot, 'data', 'source-snapshots', 'mjdic.csv'),
      [
        'trad,simp,pronunciation,means,meansJa',
        '你好,你好,ni3 hao3,hello,こんにちは',
        '爸,爸,ba4,father,父さん',
        '爸爸,爸爸,ba4 ba,dad,お父さん',
        '東西,东西,dong1 xi5,thing,何か',
        '圍棋,围棋,wei2 qi2,go,囲碁',
        '便利商店,便利商店,bian4 li4 shang1 dian4,convenience store,コンビニ',
        '自助洗衣店,自助洗衣店,zi4 zhu4 xi3 yi1 dian4,laundromat,コインランドリー',
        '觀光夜市地圖,观光夜市地图,guan1 guang1 ye4 shi4 di4 tu2,night market map,観光夜市地図',
        '巴彥淖爾市,巴彦淖尔市,ba1 yan4 nao4 er3 shi4,Bayan Nur prefecture-level city in Inner Mongolia,内モンゴル自治区バヤン・ヌール県級市',
        '摩托車,摩托车,mo2 tuo1 che1,motorbike,バイク',
      ].join('\n')
    );

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { generateVocabulary } = await loadGenerateVocabularyModule(repoRoot);

    generateVocabulary();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Generated 7 entries (3 manual seeds, 4 publishable candidates, 3 rejected candidates).'
    );
    consoleLogSpy.mockRestore();

    const vocabulary = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'data', 'vocabulary.json'), 'utf8')
    );
    const metadata = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'public', 'wordlists', 'metadata.json'), 'utf8')
    );
    const candidates = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'data', 'vocabulary-candidates.json'), 'utf8')
    );
    const levelOneVocabulary = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'public', 'wordlists', 'vocabulary-level-1.json'), 'utf8')
    );

    expect(vocabulary).toHaveLength(7);
    expect(vocabulary.find((entry) => entry.id === 'manual-hello')).toMatchObject({
      trad: '你好',
      tocflLevel: 1,
      pronunciation: 'ni3 hao3',
      level: 2,
    });
    expect(vocabulary.find((entry) => entry.id === 'manual-store')).toMatchObject({
      trad: '便利商店',
      pronunciation: 'bian4 li4 shang1 dian4',
      level: 3,
    });
    expect(vocabulary.find((entry) => entry.id === 'tocfl-00002')).toMatchObject({
      trad: '爸',
      ja: '父さん',
      level: 1,
      pronunciation: 'ba4',
      category: 'tocfl:people',
    });
    expect(vocabulary.find((entry) => entry.id === 'tocfl-00003')).toMatchObject({
      trad: '爸爸',
      ja: 'お父さん',
      level: 2,
      pronunciation: 'ba4 ba',
      category: 'tocfl:people',
    });
    expect(vocabulary.find((entry) => entry.id === 'tocfl-00004')).toMatchObject({
      trad: '東西',
      ja: 'もの',
      level: 2,
    });
    expect(vocabulary.find((entry) => entry.id === 'tocfl-00005')).toMatchObject({
      trad: '摩托車',
      ja: 'バイク',
      level: 3,
      category: 'tocfl:transport',
      pronunciation: 'mo2 tuo1 che1',
    });
    expect(vocabulary.some((entry) => entry.trad === '圍棋')).toBe(false);
    expect(vocabulary.some((entry) => entry.trad === '觀光夜市地圖')).toBe(false);
    expect(vocabulary.some((entry) => entry.trad === '巴彥淖爾市')).toBe(false);

    expect(metadata).toEqual({
      total: 7,
      counts: {
        1: 1,
        2: 3,
        3: 3,
      },
    });
    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          trad: '觀光夜市地圖',
          publishable: false,
          rejectionReasons: expect.arrayContaining(['source:mjdic-only']),
        }),
        expect.objectContaining({
          trad: '巴彥淖爾市',
          publishable: false,
          rejectionReasons: expect.arrayContaining(['source:mjdic-only', 'word:proper-noun']),
        }),
        expect.objectContaining({
          trad: '爸爸',
          canonicalJa: 'お父さん',
          publishable: true,
        }),
      ])
    );
    expect(levelOneVocabulary.map((entry) => entry.trad)).toEqual(['爸']);
  });

  it('辞書ソースが欠けていると生成を中断する', async () => {
    const repoRoot = createTempRepo();

    writeJson(path.join(repoRoot, 'data', 'manual-vocabulary.json'), []);
    const { generateVocabulary } = await loadGenerateVocabularyModule(repoRoot);

    expect(() => generateVocabulary()).toThrow('TOCFL source not found');
  });

  it('manual-vocabulary.json に再計算項目が含まれていると生成を中断する', async () => {
    const repoRoot = createTempRepo();

    writeJson(path.join(repoRoot, 'data', 'manual-vocabulary.json'), [
      {
        id: 'manual-hello',
        trad: '你好',
        ja: 'こんにちは',
        category: 'greeting',
        pronunciation: 'ni3 hao3',
        level: 2,
      },
    ]);
    writeJson(path.join(repoRoot, 'data', 'source-snapshots', 'tocfl_words.json'), []);
    writeText(
      path.join(repoRoot, 'data', 'source-snapshots', 'mjdic.csv'),
      ['trad,simp,pronunciation,means,meansJa'].join('\n')
    );
    const { generateVocabulary } = await loadGenerateVocabularyModule(repoRoot);

    expect(() => generateVocabulary()).toThrow(
      'manual-vocabulary.json entry 1 (manual-hello) must not include generated fields: level'
    );
  });

  it('旧 editorial-overrides.json は生成結果に影響しない', async () => {
    const repoRoot = createTempRepo();

    writeJson(path.join(repoRoot, 'data', 'manual-vocabulary.json'), []);
    writeJson(path.join(repoRoot, 'data', 'editorial-overrides.json'), [
      {
        trad: '爸爸',
        status: 'rejected',
        canonicalJa: '父さん',
      },
      {
        trad: '東西',
        status: 'rejected',
        canonicalJa: 'もの',
      },
    ]);
    writeJson(path.join(repoRoot, 'data', 'source-snapshots', 'tocfl_words.json'), [
      {
        id: 2,
        text: '爸爸',
        pinyin: 'bà ba',
        zhuyin: 'ㄅㄚˋ ㄅㄚ',
        tocfl_level: 1,
        category: 'people',
      },
      {
        id: 3,
        text: '東西',
        pinyin: 'dōng xi',
        zhuyin: 'ㄉㄨㄥ ㄒㄧ',
        tocfl_level: 1,
        category: 'noun',
      },
    ]);
    writeText(
      path.join(repoRoot, 'data', 'source-snapshots', 'mjdic.csv'),
      [
        'trad,simp,pronunciation,means,meansJa',
        '爸爸,爸爸,ba4 ba,dad,お父さん',
        '東西,东西,dong1 xi5,thing,何か',
      ].join('\n')
    );

    const { generateVocabulary } = await loadGenerateVocabularyModule(repoRoot);

    generateVocabulary();

    const vocabulary = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'data', 'vocabulary.json'), 'utf8')
    );

    expect(vocabulary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          trad: '爸爸',
          ja: 'お父さん',
          senseTag: 'category.people',
          distractorTags: ['category.people', 'length.2'],
        }),
        expect.objectContaining({
          trad: '東西',
          ja: 'もの',
        }),
      ])
    );
  });
});

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
  it('手修正語彙・TOCFL・MJdic から配信用データとメタデータを生成する', async () => {
    const repoRoot = createTempRepo();

    writeJson(path.join(repoRoot, 'data', 'manual-vocabulary.json'), [
      {
        id: 'manual-hello',
        trad: '你好',
        ja: 'こんにちは',
        level: 1,
        length: 2,
        category: 'greeting',
        taiwanPriority: true,
        sources: ['manual'],
      },
      {
        id: 'manual-hello-duplicate',
        trad: '你好',
        ja: '重複候補',
        level: 1,
        length: 2,
        category: 'greeting',
        taiwanPriority: true,
        sources: ['manual'],
      },
      {
        id: 'manual-store',
        trad: '便利商店',
        ja: 'コンビニ',
        level: 2,
        length: 4,
        category: 'place',
        taiwanPriority: true,
        sources: ['manual'],
      },
      {
        id: 'manual-laundry',
        trad: '自助洗衣店',
        ja: 'コインランドリー',
        level: 3,
        length: 5,
        category: 'place',
        taiwanPriority: true,
        sources: ['manual'],
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
      {
        id: 4,
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
        '爸爸,爸爸,ba4 ba,dad,お父さん',
        '東西,东西,dong1 xi5,thing,何か',
        '圍棋,围棋,wei2 qi2,go,囲碁',
        '便利商店,便利商店,bian4 li4 shang1 dian4,convenience store,コンビニ',
        '自助洗衣店,自助洗衣店,zi4 zhu4 xi3 yi1 dian4,laundromat,コインランドリー',
        '觀光夜市地圖,观光夜市地图,guan1 guang1 ye4 shi4 di4 tu2,night market map,観光夜市地図',
        '巴彥淖爾市,巴彦淖尔市,ba1 yan4 nao4 er3 shi4,Bayan Nur prefecture-level city in Inner Mongolia,内モンゴル自治区バヤン・ヌール県級市',
        '摩托車,摩托车,mo2 tuo1 che1,motorbike,部',
      ].join('\n')
    );

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { generateVocabulary } = await loadGenerateVocabularyModule(repoRoot);

    generateVocabulary();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Generated 8 entries (4 manual, 3 TOCFL, 2 MJdic level-3).'
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

    expect(vocabulary).toHaveLength(8);
    expect(vocabulary.find((entry) => entry.id === 'manual-hello')).toMatchObject({
      trad: '你好',
      tocflLevel: 1,
      pronunciation: 'ni3 hao3',
    });
    expect(vocabulary.find((entry) => entry.id === 'manual-store')).toMatchObject({
      trad: '便利商店',
      pronunciation: 'bian4 li4 shang1 dian4',
    });
    expect(vocabulary.find((entry) => entry.id === 'tocfl-00002')).toMatchObject({
      trad: '爸爸',
      ja: 'お父さん',
      level: 1,
      pronunciation: 'ba4 ba',
      category: 'tocfl:people',
    });
    expect(vocabulary.find((entry) => entry.id === 'tocfl-00003')).toMatchObject({
      trad: '東西',
      ja: 'もの',
      level: 1,
    });
    expect(vocabulary.find((entry) => entry.trad === '觀光夜市地圖')).toMatchObject({
      trad: '觀光夜市地圖',
      ja: '観光夜市地図',
      level: 3,
      category: 'extended:觀',
      pronunciation: 'guan1 guang1 ye4 shi4 di4 tu2',
    });
    expect(vocabulary.some((entry) => entry.trad === '圍棋')).toBe(false);
    expect(vocabulary.some((entry) => entry.trad === '巴彥淖爾市')).toBe(true);
    expect(vocabulary.some((entry) => entry.trad === '摩托車')).toBe(true);

    expect(metadata).toEqual({
      total: 8,
      counts: {
        1: 3,
        2: 2,
        3: 3,
      },
    });
    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          trad: '爸爸',
          canonicalJa: 'お父さん',
        }),
      ])
    );
    expect(levelOneVocabulary.map((entry) => entry.trad)).toEqual(['你好', '東西', '爸爸']);
  });

  it('辞書ソースが欠けていると生成を中断する', async () => {
    const repoRoot = createTempRepo();

    writeJson(path.join(repoRoot, 'data', 'manual-vocabulary.json'), []);
    const { generateVocabulary } = await loadGenerateVocabularyModule(repoRoot);

    expect(() => generateVocabulary()).toThrow('TOCFL source not found');
  });

  it('editorial override で候補の採否と日本語ラベルを調整できる', async () => {
    const repoRoot = createTempRepo();

    writeJson(path.join(repoRoot, 'data', 'manual-vocabulary.json'), []);
    writeJson(path.join(repoRoot, 'data', 'editorial-overrides.json'), [
      {
        trad: '爸爸',
        status: 'approved',
        canonicalJa: '父さん',
        acceptedJa: ['お父さん'],
        senseTag: 'people.family',
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

    expect(vocabulary).toEqual([
      expect.objectContaining({
        trad: '爸爸',
        ja: '父さん',
        acceptedJa: ['お父さん'],
        senseTag: 'people.family',
      }),
    ]);
  });

  it('editorial override で参照ラベルしかない候補を教材ラベルへ救済できる', async () => {
    const repoRoot = createTempRepo();

    writeJson(path.join(repoRoot, 'data', 'manual-vocabulary.json'), []);
    writeJson(path.join(repoRoot, 'data', 'editorial-overrides.json'), [
      {
        trad: '無稽之談',
        status: 'approved',
        canonicalJa: 'でたらめな話',
      },
    ]);
    writeJson(path.join(repoRoot, 'data', 'source-snapshots', 'tocfl_words.json'), [
      {
        id: 13209,
        text: '無稽之談',
        pinyin: 'wú jī zhī tán',
        zhuyin: 'ㄨˊ ㄐㄧ ㄓ ㄊㄢˊ',
        tocfl_level: 7,
        category: '精熟',
      },
    ]);
    writeText(
      path.join(repoRoot, 'data', 'source-snapshots', 'mjdic.csv'),
      [
        'trad,simp,pronunciation,means,meansJa',
        '無稽之談,无稽之谈,wu2 ji1 zhi1 tan2,complete nonsense (idiom),珍糞漢糞',
      ].join('\n')
    );

    const { generateVocabulary } = await loadGenerateVocabularyModule(repoRoot);

    generateVocabulary();

    const vocabulary = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'data', 'vocabulary.json'), 'utf8')
    );

    expect(vocabulary).toEqual([
      expect.objectContaining({
        trad: '無稽之談',
        ja: 'でたらめな話',
      }),
    ]);
  });
});

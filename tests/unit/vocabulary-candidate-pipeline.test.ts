// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('vocabulary candidate pipeline', () => {
  it('却下理由は自動品質ゲートだけで決まる', async () => {
    const { buildCandidates } = await import('../../scripts/lib/vocabulary-candidate-pipeline.mjs');

    const candidates = buildCandidates({
      tocflRows: [{ trad: '東西', tocflLevel: 1, category: '基礎', source: 'tocfl' }],
      tbclRows: [],
      mjdicEntries: [
        {
          trad: '東西',
          meansJa: 'もの',
          means: 'thing',
          pronunciation: 'dong1 xi5',
        },
      ],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        trad: '東西',
        canonicalJa: 'もの',
        status: 'approved',
        publishable: true,
        rejectionReasons: [],
      }),
    ]);
  });

  it('category から senseTag と distractorTags を自動付与できる', async () => {
    const { buildCandidates } = await import('../../scripts/lib/vocabulary-candidate-pipeline.mjs');

    const candidates = buildCandidates({
      tocflRows: [{ trad: '爸爸', tocflLevel: 1, category: '基礎', source: 'tocfl' }],
      tbclRows: [],
      mjdicEntries: [
        {
          trad: '爸爸',
          meansJa: 'お父さん',
          means: 'dad',
          pronunciation: 'ba4 ba',
        },
      ],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        trad: '爸爸',
        canonicalJa: 'お父さん',
        senseTag: 'category.基礎',
        distractorTags: ['category.基礎', 'length.2'],
        publishable: true,
      }),
    ]);
  });

  it('分類詞だけの日本語ラベルは非公開にして却下理由を残す', async () => {
    const { buildCandidates } = await import('../../scripts/lib/vocabulary-candidate-pipeline.mjs');

    const candidates = buildCandidates({
      tocflRows: [{ trad: '摩托車', tocflLevel: 2, category: '交通', source: 'tocfl' }],
      tbclRows: [],
      mjdicEntries: [
        {
          trad: '摩托車',
          meansJa: '部',
          means: 'motorbike',
          pronunciation: 'mo2 tuo1 che1',
        },
      ],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        trad: '摩托車',
        publishable: false,
        rejectionReasons: expect.arrayContaining(['ja:classifier-only']),
      }),
    ]);
  });

  it('分類詞併記があっても有効な日本語ラベルは公開候補に残す', async () => {
    const { buildCandidates } = await import('../../scripts/lib/vocabulary-candidate-pipeline.mjs');

    const candidates = buildCandidates({
      tocflRows: [{ trad: '公車', tocflLevel: 1, category: '交通', source: 'tocfl' }],
      tbclRows: [],
      mjdicEntries: [
        {
          trad: '公車',
          meansJa: 'バス,台',
          means: 'bus',
          pronunciation: 'gong1 che1',
        },
      ],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        trad: '公車',
        canonicalJa: 'バス',
        publishable: true,
        rejectionReasons: [],
      }),
    ]);
  });

  it('ASCII だけの日本語ラベルは非公開にして却下理由を残す', async () => {
    const { buildCandidates } = await import('../../scripts/lib/vocabulary-candidate-pipeline.mjs');

    const candidates = buildCandidates({
      tocflRows: [{ trad: '箭', tocflLevel: 1, category: '基礎', source: 'tocfl' }],
      tbclRows: [],
      mjdicEntries: [
        {
          trad: '箭',
          meansJa: 'arrow',
          means: 'arrow',
          pronunciation: 'jian4',
        },
      ],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        trad: '箭',
        canonicalJa: 'arrow',
        publishable: false,
        rejectionReasons: expect.arrayContaining(['ja:ascii-label']),
      }),
    ]);
  });

  it('1文字語の姓メタ情報は生成時に個別拒否せず監査対象へ寄せる', async () => {
    const { buildCandidates } = await import('../../scripts/lib/vocabulary-candidate-pipeline.mjs');

    const candidates = buildCandidates({
      tocflRows: [{ trad: '朱', tocflLevel: 1, category: '基礎', source: 'tocfl' }],
      tbclRows: [],
      mjdicEntries: [
        {
          trad: '朱',
          meansJa: '朱姓',
          means: 'surname Zhu',
          pronunciation: 'zhu1',
        },
      ],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        trad: '朱',
        canonicalJa: '朱姓',
        publishable: true,
        rejectionReasons: [],
      }),
    ]);
  });

  it('TOCFL 初級の false friend は教材向けラベルへ補正する', async () => {
    const { buildCandidates } = await import('../../scripts/lib/vocabulary-candidate-pipeline.mjs');

    const candidates = buildCandidates({
      tocflRows: [
        { trad: '告訴', tocflLevel: 1, category: '基礎', source: 'tocfl' },
        { trad: '公車', tocflLevel: 1, category: '基礎', source: 'tocfl' },
        { trad: '馬上', tocflLevel: 1, category: '基礎', source: 'tocfl' },
      ],
      tbclRows: [],
      mjdicEntries: [
        {
          trad: '告訴',
          meansJa: '告訴する',
          means: 'to tell; to inform',
          pronunciation: 'gao4 su4',
        },
        {
          trad: '公車',
          meansJa: 'バス／公共汽車の略／組織に属し、その構成員が使用する車',
          means: 'bus',
          pronunciation: 'gong1 che1',
        },
        {
          trad: '馬上',
          meansJa: 'ただちに／すぐに／馬に乗って',
          means: 'immediately',
          pronunciation: 'ma3 shang4',
        },
      ],
    });

    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ trad: '告訴', canonicalJa: '伝える' }),
        expect.objectContaining({ trad: '公車', canonicalJa: 'バス' }),
        expect.objectContaining({ trad: '馬上', canonicalJa: 'すぐに' }),
      ])
    );
  });

  it('MJdic 単独根拠の候補は公開デッキに出さない', async () => {
    const { buildCandidates } = await import('../../scripts/lib/vocabulary-candidate-pipeline.mjs');

    const candidates = buildCandidates({
      tocflRows: [],
      tbclRows: [],
      mjdicEntries: [
        {
          trad: '觀光夜市地圖',
          meansJa: '観光夜市地図',
          means: 'night market map',
          pronunciation: 'guan1 guang1 ye4 shi4 di4 tu2',
        },
      ],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        trad: '觀光夜市地圖',
        level: 3,
        publishable: false,
        rejectionReasons: expect.arrayContaining(['source:mjdic-only']),
      }),
    ]);
  });

  it('新しいレベル定義で 1文字 / 2文字 / 3文字以上に分類する', async () => {
    const { buildCandidates } = await import('../../scripts/lib/vocabulary-candidate-pipeline.mjs');

    const candidates = buildCandidates({
      tocflRows: [
        { trad: '爸', tocflLevel: 1, category: 'people', source: 'tocfl' },
        { trad: '爸爸', tocflLevel: 1, category: 'people', source: 'tocfl' },
        { trad: '便利商店', tocflLevel: 2, category: 'place', source: 'tocfl' },
      ],
      tbclRows: [],
      mjdicEntries: [
        { trad: '爸', meansJa: '父', means: 'father', pronunciation: 'ba4' },
        { trad: '爸爸', meansJa: 'お父さん', means: 'dad', pronunciation: 'ba4 ba5' },
        {
          trad: '便利商店',
          meansJa: 'コンビニ',
          means: 'convenience store',
          pronunciation: 'bian4 li4 shang1 dian4',
        },
      ],
    });

    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ trad: '爸', level: 1 }),
        expect.objectContaining({ trad: '爸爸', level: 2 }),
        expect.objectContaining({ trad: '便利商店', level: 3 }),
      ])
    );
  });
});

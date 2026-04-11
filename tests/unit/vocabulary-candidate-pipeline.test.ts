// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('vocabulary candidate pipeline', () => {
  it('姓・分類語・固有名詞寄り語義を Level 1 候補から落とす', async () => {
    const { buildCandidates } = await import('../../scripts/lib/vocabulary-candidate-pipeline.mjs');

    const candidates = buildCandidates({
      tocflRows: [{ trad: '三', tocflLevel: 1, category: '基礎', source: 'tocfl' }],
      tbclRows: [],
      mjdicEntries: [
        {
          trad: '三',
          meansJa: 'サン姓',
          means: 'surname San',
          pronunciation: 'san1',
        },
      ],
    });

    expect(candidates).toEqual([]);
  });

  it('MJdic 単独の固有名詞寄り候補を Level 3 でも落とす', async () => {
    const { buildCandidates } = await import('../../scripts/lib/vocabulary-candidate-pipeline.mjs');

    const candidates = buildCandidates({
      tocflRows: [],
      tbclRows: [],
      mjdicEntries: [
        {
          trad: '巴彥淖爾市',
          meansJa: '内モンゴル自治区バヤン・ヌール県級市',
          means: 'Bayan Nur prefecture-level city in Inner Mongolia',
          pronunciation: 'ba1 yan4 nao4 er3 shi4',
        },
      ],
    });

    expect(candidates).toEqual([]);
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
});

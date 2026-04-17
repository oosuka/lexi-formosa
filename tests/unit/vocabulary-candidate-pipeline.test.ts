// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('vocabulary candidate pipeline', () => {
  it('editorial override で候補を除外できる', async () => {
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
      editorialOverrides: [{ trad: '東西', status: 'rejected', canonicalJa: 'もの' }],
    });

    expect(candidates).toEqual([]);
  });

  it('editorial override で日本語ラベルを補正できる', async () => {
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
      editorialOverrides: [
        {
          trad: '爸爸',
          status: 'approved',
          canonicalJa: '父さん',
          acceptedJa: ['お父さん'],
          senseTag: 'people.family',
        },
      ],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        trad: '爸爸',
        canonicalJa: '父さん',
        acceptedJa: ['お父さん'],
        senseTag: 'people.family',
      }),
    ]);
  });

  it('分類詞だけの日本語ラベルは公開候補にしない', async () => {
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

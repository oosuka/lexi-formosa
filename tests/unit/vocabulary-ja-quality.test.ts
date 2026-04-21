// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('vocabulary ja quality', () => {
  it('姓・クラシファイア説明・長い定義文より自然なラベルを優先する', async () => {
    const { pickBestJapaneseLabel } = await import('../../scripts/lib/vocabulary-ja-quality.mjs');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: '歳／年／年（作物の収穫年）のクラシファイア',
            means: 'classifier for years (of age)/year/year (of crop harvests)',
          },
        ],
      }).canonicalJa
    ).toBe('歳');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: 'ニャン姓',
            means: 'surname Nian',
          },
          {
            meansJa: '年/CL:個|个[ge4]。',
            means: 'year/CL:個|个[ge4]',
          },
        ],
      }).canonicalJa
    ).toBe('年');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: 'み',
            means: 'surname Mi',
          },
          {
            meansJa: '米/CL:粒[li4]/メートル（分類器）',
            means: 'rice/CL:粒[li4]/meter (classifier)',
          },
        ],
      }).canonicalJa
    ).toBe('米');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: 'を支払う／引き渡す／ペアやセットのものを分類する',
            means: 'to pay/to hand over to/classifier for pairs or sets of things',
          },
        ],
      }).canonicalJa
    ).toBe('支払う');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa:
              'を隠す／（ドアや本などを）閉める／（共）ドアや蓋を閉めるときに（指などを）挟む／（文）奇襲攻撃を仕掛ける',
            means:
              "to cover up; to conceal/to close (a door, book etc)/(coll.) to get (one's fingers etc) caught when closing a door or lid/(literary) to launch a surprise attack",
          },
        ],
      }).canonicalJa
    ).toBe('隠す');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa:
              '香ばしい／甘いにおいがする／芳香がある／香ばしいまたは食欲をそそる／（眠りの）音がする／香水または香辛料／ジョスまたは線香／CL:根[gen1].',
            means:
              'fragrant/sweet smelling/aromatic/savory or appetizing/(to eat) with relish/(of sleep) sound/perfume or spice/joss or incense stick/CL:根[gen1]',
          },
        ],
      }).canonicalJa
    ).toBe('香ばしい');
  });
});

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

  it('辞書の参照・略語・発音注・姓説明を日本語ラベルにしない', async () => {
    const { pickBestJapaneseLabel } = await import('../../scripts/lib/vocabulary-ja-quality.mjs');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: '墨西哥[Mo4 xi1 ge1]の姓Mo/abbr.、メキシコ',
            means: 'surname Mo/abbr. for 墨西哥[Mo4 xi1 ge1], Mexico',
          },
          {
            meansJa: '墨/中国墨/CL:塊|块[kuai4]/被害者の額に文字を彫る体罰',
            means:
              "ink stick/China ink/CL:塊|块[kuai4]/corporal punishment consisting of tattooing characters on the victim's forehead",
          },
        ],
      }).canonicalJa
    ).toBe('墨');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: '船舶用クラシファイア／台湾 pr.[sao1]',
            means: 'classifier for ships/Taiwan pr. [sao1]',
          },
        ],
      }).canonicalJa
    ).toBeNull();

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: '先祖；祖父／SBの亡父',
            means: 'ancestors/grandfather/deceased father of sb',
          },
        ],
      }).canonicalJa
    ).toBe('先祖');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: '',
            means: 'see 洪亮[hong2 liang4]',
          },
        ],
      }).canonicalJa
    ).toBeNull();

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: 'apex/crown of the head/top/roof/most/headwear, hat, veilsなどの分類語。',
            means: 'classifier for headwear, hats, veils etc',
          },
        ],
      }).canonicalJa
    ).not.toBe('veilsなどの分類語');
  });
});

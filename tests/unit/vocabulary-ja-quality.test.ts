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

  it('辞書の参照・略語・分類詞メタを日本語ラベルにしない', async () => {
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

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: 'ショーの分類記号',
            means: 'classifier for shows',
          },
        ],
      }).canonicalJa
    ).toBeNull();
  });

  it('中国語を含む用例説明は日本語ラベルにしない', async () => {
    const { pickBestJapaneseLabel } = await import('../../scripts/lib/vocabulary-ja-quality.mjs');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: 'どのように',
            means: 'how/which',
          },
          {
            meansJa: '啊[a5]の代わりに使われる。',
            means: '(emphatic sentence-final particle, used instead of 啊[a5])',
          },
          {
            meansJa: 'どれ',
            means: 'which?',
          },
        ],
      }).canonicalJa
    ).toBe('どれ');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: '何？',
            means: '(coll.) what?',
          },
          {
            meansJa: '嗎啡|吗啡[ma3 fei1]で使われている。',
            means: 'used in 嗎啡|吗啡[ma3 fei1]',
          },
          {
            meansJa: '(「はい・いいえ」の質問の助詞)',
            means: 'question particle for yes-no questions',
          },
        ],
      }).canonicalJa
    ).not.toBe('吗啡で使われている');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa:
              '(文語)(多麼|多么[duo1 me5]に似ていて、感嘆詞の形容詞の前に使われる)いかに(幸運など); そう(たくさんなど)',
            means:
              '(literary) (similar to 多麼|多么[duo1 me5], used before an adjective in exclamations) how (fortunate etc); so (many etc)',
          },
        ],
      }).canonicalJa
    ).not.toBe('多么に似ていて');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: '你（非公式な你[ni3]に対して、丁寧な你[ni3]。',
            means: 'polite form of 你[ni3], as opposed to informal 你[ni3]',
          },
        ],
      }).canonicalJa
    ).toBeNull();

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: '谈得来のように',
            means: 'as in 談得來|谈得来[tan2 de5 lai2]',
          },
          {
            meansJa: '来る',
            means: 'to come',
          },
        ],
      }).canonicalJa
    ).toBe('来る');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: '诗经と史書經',
            means: 'Book of Songs and history books',
          },
        ],
      }).canonicalJa
    ).toBeNull();
  });

  it('単位や数量の定義文断片は監査対象に寄せる', async () => {
    const { pickBestJapaneseLabel } = await import('../../scripts/lib/vocabulary-ja-quality.mjs');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: 'コイン/お金/CL:筆|笔[bi3]/重さの単位、10分の1テール兩|两[liang3]。',
            means: 'coin/money/CL:筆|笔[bi3]/unit of weight, one tenth of a tael 兩|两[liang3]',
          },
        ],
      }).canonicalJa
    ).toBe('お金');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: '親指の単位／3分の1メートル',
            means: 'a unit of length, one third of a meter',
          },
        ],
      }).canonicalJa
    ).toBe('親指の単位');

    expect(
      pickBestJapaneseLabel({
        rawGlosses: [
          {
            meansJa: '中国の通貨単位',
            means: 'Chinese unit of currency',
          },
        ],
      }).canonicalJa
    ).toBe('中国の通貨単位');
  });
});

// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  isRejectedJapaneseGlossCandidate,
  parseTocflSource,
  pickBestGloss,
} from '../../scripts/generate-vocabulary.mjs';

describe('generate vocabulary script', () => {
  it('簡体字のまま残っている候補を訳語に採用しない', () => {
    expect(isRejectedJapaneseGlossCandidate('丝')).toBe(true);
    expect(pickBestGloss([['丝', 'silk']])).toBeNull();
  });

  it('中国語の未翻訳候補より日本語候補を優先する', () => {
    expect(
      pickBestGloss([
        ['东南亚国家联盟と同じ', 'same as ASEAN'],
        ['東南アジア諸国連合', 'association of southeast asian nations'],
      ])
    ).toBe('東南アジア諸国連合');
  });

  it('自然な日本語候補は引き続き採用する', () => {
    expect(pickBestGloss([['ありがとう', 'thanks']])).toBe('ありがとう');
    expect(pickBestGloss([['国境', 'border']])).toBe('国境');
  });

  it('分類詞の断片を訳語として採用しない', () => {
    expect(
      pickBestGloss([
        [
          '(借用語) motorbike; motorcycle/CL:輛|辆[liang4],部[bu4]。',
          '(loanword) motorbike; motorcycle/CL:輛|辆[liang4],部[bu4]',
        ],
      ])
    ).toBeNull();
  });

  it('TOCFL ソースの JSON 配列を読み込める', () => {
    expect(
      parseTocflSource(
        JSON.stringify([
          { id: 1, text: '八' },
          { id: 2, text: '爸爸' },
        ])
      )
    ).toEqual([
      { id: 1, text: '八' },
      { id: 2, text: '爸爸' },
    ]);
  });

  it('TOCFL ソースの JSONL も引き続き読み込める', () => {
    expect(parseTocflSource('{"id":1,"text":"八"}\n{"id":2,"text":"爸爸"}\n')).toEqual([
      { id: 1, text: '八' },
      { id: 2, text: '爸爸' },
    ]);
  });
});

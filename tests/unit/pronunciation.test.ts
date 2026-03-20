import { describe, expect, it } from 'vitest';

import { formatKatakanaReading, formatPinyinReading } from '~/utils/pronunciation';

describe('pronunciation utilities', () => {
  it('ピンインの声調数字を声調記号へ変換する', () => {
    expect(formatPinyinReading('ma1 mei2 dou3 nv3 hm2')).toBe('mā méi dǒu nǚ hm');
  });

  it('読みが未設定なら空文字を返す', () => {
    expect(formatPinyinReading()).toBe('');
    expect(formatKatakanaReading()).toBe('');
  });

  it('既知の音節はカタカナ補助へ変換する', () => {
    expect(formatKatakanaReading('zhi1 xue2')).toBe('ジー シュエ');
  });

  it('母音始まりの音節もカタカナ補助へ変換する', () => {
    expect(formatKatakanaReading('ao1 an1 quan2')).toBe('アオ アン チュァン');
  });

  it('声調数字なしの母音始まりも自然に補助表示する', () => {
    expect(formatKatakanaReading('ou')).toBe('オウ');
  });

  it('未対応の音節でもそのまま劣化表示する', () => {
    expect(formatKatakanaReading('hm2 yo1')).toBe('hm yo');
  });
});

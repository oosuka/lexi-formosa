const TONE_MARKS: Record<string, [string, string, string, string]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

const SPECIAL_SYLLABLES: Record<string, string> = {
  zhi: 'ジー',
  chi: 'チー',
  shi: 'シー',
  ri: 'リー',
  zi: 'ズ',
  ci: 'ツ',
  si: 'ス',
  er: 'アル',
  yi: 'イー',
  ya: 'ヤー',
  yao: 'ヤオ',
  ye: 'イエ',
  you: 'ヨウ',
  yan: 'イェン',
  yang: 'ヤン',
  yin: 'イン',
  ying: 'イン',
  yong: 'ヨン',
  yu: 'ユー',
  yue: 'ユエ',
  yuan: 'ユエン',
  yun: 'ユン',
  wu: 'ウー',
  wa: 'ワ',
  wai: 'ワイ',
  wei: 'ウェイ',
  wan: 'ワン',
  wang: 'ワン',
  wen: 'ウェン',
  weng: 'ウォン',
  wo: 'ウォ',
};

const INITIALS = [
  'zh',
  'ch',
  'sh',
  'b',
  'p',
  'm',
  'f',
  'd',
  't',
  'n',
  'l',
  'g',
  'k',
  'h',
  'j',
  'q',
  'x',
  'r',
  'z',
  'c',
  's',
  'y',
  'w',
] as const;

const INITIAL_ROWS: Record<string, Record<string, string>> = {
  b: { a: 'バ', e: 'ベ', i: 'ビ', o: 'ボ', u: 'ブ', ü: 'ビュ' },
  p: { a: 'パ', e: 'ペ', i: 'ピ', o: 'ポ', u: 'プ', ü: 'ピュ' },
  m: { a: 'マ', e: 'メ', i: 'ミ', o: 'モ', u: 'ム', ü: 'ミュ' },
  f: { a: 'ファ', e: 'フェ', i: 'フィ', o: 'フォ', u: 'フ', ü: 'フュ' },
  d: { a: 'ダ', e: 'デ', i: 'ディ', o: 'ド', u: 'ドゥ', ü: 'デュ' },
  t: { a: 'タ', e: 'テ', i: 'ティ', o: 'ト', u: 'トゥ', ü: 'テュ' },
  n: { a: 'ナ', e: 'ネ', i: 'ニ', o: 'ノ', u: 'ヌ', ü: 'ニュ' },
  l: { a: 'ラ', e: 'レ', i: 'リ', o: 'ロ', u: 'ル', ü: 'リュ' },
  g: { a: 'ガ', e: 'ゲ', i: 'ギ', o: 'ゴ', u: 'グ', ü: 'ギュ' },
  k: { a: 'カ', e: 'ケ', i: 'キ', o: 'コ', u: 'ク', ü: 'キュ' },
  h: { a: 'ハ', e: 'ヘ', i: 'ヒ', o: 'ホ', u: 'フ', ü: 'ヒュ' },
  j: { a: 'ジャ', e: 'ジェ', i: 'ジ', o: 'ジョ', u: 'ジュ', ü: 'ジュ' },
  q: { a: 'チャ', e: 'チェ', i: 'チ', o: 'チョ', u: 'チュ', ü: 'チュ' },
  x: { a: 'シャ', e: 'シェ', i: 'シ', o: 'ショ', u: 'シュ', ü: 'シュ' },
  zh: { a: 'ジャ', e: 'ジェ', i: 'ジ', o: 'ジョ', u: 'ジュ', ü: 'ジュ' },
  ch: { a: 'チャ', e: 'チェ', i: 'チ', o: 'チョ', u: 'チュ', ü: 'チュ' },
  sh: { a: 'シャ', e: 'シェ', i: 'シ', o: 'ショ', u: 'シュ', ü: 'シュ' },
  r: { a: 'ラ', e: 'レ', i: 'リ', o: 'ロ', u: 'ル', ü: 'リュ' },
  z: { a: 'ザ', e: 'ゼ', i: 'ジ', o: 'ゾ', u: 'ズ', ü: 'ジュ' },
  c: { a: 'ツァ', e: 'ツェ', i: 'ツィ', o: 'ツォ', u: 'ツ', ü: 'ツュ' },
  s: { a: 'サ', e: 'セ', i: 'シ', o: 'ソ', u: 'ス', ü: 'シュ' },
};

const VOWEL_INITIAL_HEADS: Record<string, string> = {
  a: 'ア',
  e: 'エ',
  i: 'イ',
  o: 'オ',
  u: 'ウ',
  ü: 'ユ',
};

const FINAL_PARTS: Record<string, { group: string; suffix: string }> = {
  a: { group: 'a', suffix: '' },
  ai: { group: 'a', suffix: 'イ' },
  an: { group: 'a', suffix: 'ン' },
  ang: { group: 'a', suffix: 'ン' },
  ao: { group: 'a', suffix: 'オ' },
  e: { group: 'e', suffix: '' },
  ei: { group: 'e', suffix: 'イ' },
  en: { group: 'e', suffix: 'ン' },
  eng: { group: 'e', suffix: 'ン' },
  i: { group: 'i', suffix: '' },
  ia: { group: 'i', suffix: 'ャ' },
  ian: { group: 'i', suffix: 'ェン' },
  iang: { group: 'i', suffix: 'ャン' },
  iao: { group: 'i', suffix: 'ャオ' },
  ie: { group: 'i', suffix: 'エ' },
  in: { group: 'i', suffix: 'ン' },
  ing: { group: 'i', suffix: 'ン' },
  iong: { group: 'i', suffix: 'ョン' },
  iu: { group: 'i', suffix: 'ョウ' },
  o: { group: 'o', suffix: '' },
  ong: { group: 'o', suffix: 'ン' },
  ou: { group: 'o', suffix: 'ウ' },
  u: { group: 'u', suffix: '' },
  ua: { group: 'u', suffix: 'ァ' },
  uai: { group: 'u', suffix: 'ァイ' },
  uan: { group: 'u', suffix: 'ァン' },
  uang: { group: 'u', suffix: 'ァン' },
  ue: { group: 'ü', suffix: 'エ' },
  uei: { group: 'u', suffix: 'ェイ' },
  ui: { group: 'u', suffix: 'ェイ' },
  un: { group: 'u', suffix: 'ン' },
  uo: { group: 'o', suffix: 'オ' },
  v: { group: 'ü', suffix: '' },
  van: { group: 'ü', suffix: 'ェン' },
  ve: { group: 'ü', suffix: 'エ' },
  vn: { group: 'ü', suffix: 'ン' },
};

const markTone = (plainSyllable: string, tone: number): string => {
  if (tone <= 0 || tone >= 5) {
    return plainSyllable.replace(/v/g, 'ü');
  }

  const normalized = plainSyllable.toLowerCase().replace(/v/g, 'ü');
  const markIndex =
    normalized.indexOf('a') >= 0
      ? normalized.indexOf('a')
      : normalized.indexOf('e') >= 0
        ? normalized.indexOf('e')
        : normalized.includes('ou')
          ? normalized.indexOf('o')
          : [...normalized].findLastIndex((char) => 'ioüu'.includes(char));

  if (markIndex < 0) {
    return normalized;
  }

  const chars = [...normalized];
  const vowel = chars[markIndex] as keyof typeof TONE_MARKS;
  const marked = TONE_MARKS[vowel]?.[tone - 1];

  if (!marked) {
    return normalized;
  }

  chars[markIndex] = marked;
  return chars.join('');
};

const splitInitialAndFinal = (plainSyllable: string) => {
  for (const initial of INITIALS) {
    if (plainSyllable.startsWith(initial)) {
      return {
        initial,
        final: plainSyllable.slice(initial.length),
      };
    }
  }

  return {
    initial: '',
    final: plainSyllable,
  };
};

const kanaForSyllable = (syllable: string): string => {
  const plain = syllable.toLowerCase().replace(/[1-5]/g, '');

  if (!plain) {
    return '';
  }

  if (SPECIAL_SYLLABLES[plain]) {
    return SPECIAL_SYLLABLES[plain];
  }

  const { initial, final } = splitInitialAndFinal(plain);
  const finalParts = FINAL_PARTS[final];

  if (!finalParts) {
    return markTone(plain, 5);
  }

  const row = INITIAL_ROWS[initial];
  const head = initial ? row?.[finalParts.group] : VOWEL_INITIAL_HEADS[finalParts.group];

  if (!head) {
    return markTone(plain, 5);
  }

  return `${head}${finalParts.suffix}`;
};

export const formatPinyinReading = (numericPinyin?: string): string => {
  if (!numericPinyin) {
    return '';
  }

  return numericPinyin
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((syllable) => {
      const tone = Number.parseInt(syllable.slice(-1), 10);
      const plain = Number.isNaN(tone) ? syllable : syllable.slice(0, -1);
      return markTone(plain, Number.isNaN(tone) ? 5 : tone);
    })
    .join(' ');
};

export const formatKatakanaReading = (numericPinyin?: string): string => {
  if (!numericPinyin) {
    return '';
  }

  return numericPinyin
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((syllable) => kanaForSyllable(syllable))
    .join(' ');
};

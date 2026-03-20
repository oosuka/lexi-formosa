import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const defaultTocflPath = path.join(repoRoot, 'data', 'source-snapshots', 'tocfl_words.json');
const defaultMjdicPath = path.join(repoRoot, 'data', 'source-snapshots', 'mjdic.csv');
const manualVocabularyPath = path.join(repoRoot, 'data', 'manual-vocabulary.json');
const outputPath = path.join(repoRoot, 'data', 'vocabulary.json');
const publicWordlistDir = path.join(repoRoot, 'public', 'wordlists');
const metadataOutputPath = path.join(repoRoot, 'data', 'vocabulary-metadata.json');
const publicMetadataOutputPath = path.join(publicWordlistDir, 'metadata.json');
const splitOutputPaths = {
  1: path.join(repoRoot, 'data', 'vocabulary-level-1.json'),
  2: path.join(repoRoot, 'data', 'vocabulary-level-2.json'),
  3: path.join(repoRoot, 'data', 'vocabulary-level-3.json'),
};
const publicWordlistPaths = {
  1: path.join(publicWordlistDir, 'vocabulary-level-1.json'),
  2: path.join(publicWordlistDir, 'vocabulary-level-2.json'),
  3: path.join(publicWordlistDir, 'vocabulary-level-3.json'),
};

const tocflSourcePath = process.env.TOCFL_SOURCE_PATH ?? defaultTocflPath;
const mjdicSourcePath = process.env.MJDIC_SOURCE_PATH ?? defaultMjdicPath;

const importOverrides = new Map([
  ['爸爸', 'お父さん'],
  ['大家', 'みんな'],
  ['大學', '大学'],
  ['多少', 'いくつ'],
  ['今天', '今日'],
  ['可能', 'かもしれない'],
  ['可以', 'できる'],
  ['妹妹', '妹'],
  ['沒有', 'ない'],
  ['哪裡', 'どこ'],
  ['你們', 'あなたたち'],
  ['朋友', '友達'],
  ['請問', 'すみません'],
  ['上午', '午前'],
  ['什麼', 'なに'],
  ['時間', '時間'],
  ['他們', '彼ら'],
  ['太太', '奥さん'],
  ['同學', 'クラスメート'],
  ['晚上', '夜'],
  ['問題', '問題'],
  ['我們', '私たち'],
  ['現在', '今'],
  ['小孩', '子供'],
  ['小時', '時間'],
  ['謝謝', 'ありがとう'],
  ['喜歡', '好き'],
  ['一起', '一緒に'],
  ['英文', '英語'],
  ['怎麼', 'どう'],
  ['中文', '中国語'],
  ['中午', '正午'],
  ['包子', '肉まん'],
  ['不錯', '悪くない'],
  ['常常', 'よく'],
  ['多久', 'どのくらい'],
  ['地方', '場所'],
  ['先生', '先生'],
  ['對不起', 'ごめんなさい'],
  ['名字', '名前'],
  ['時候', 'タイミング'],
  ['學校', '学校'],
  ['學生', '学生'],
  ['老師', '先生'],
  ['哥哥', '兄'],
  ['姊姊', '姉'],
  ['弟弟', '弟'],
  ['媽媽', 'お母さん'],
  ['女兒', '娘'],
  ['兒子', '息子'],
  ['東西', 'もの'],
  ['車子', '車'],
  ['工作', '仕事'],
  ['手機', '携帯'],
  ['睡覺', '寝る'],
  ['早上', '朝'],
  ['下午', '午後'],
  ['早安', 'おはよう'],
  ['晚安', 'おやすみ'],
  ['沒關係', '大丈夫'],
  ['再見', 'さようなら'],
]);

const rejectionPatterns = [
  /謙譲表現/,
  /概念/,
  /御前方/,
  /人妻/,
  /長さ/,
  /質問に対する否定的な答え/,
  /台湾のpr\./i,
  /^\(/,
];
const allHanGlossPattern = /^[\p{Script=Han}々]+$/u;
const simplifiedChineseGlossPattern =
  /丝|东|亚|联|门|龙|云|广|务|听|汉|观|馆|铁|习|赔|语|图|气|车|动|词|类|这|样/u;
const untranslatedChineseGlossPattern = /什麼|甚麼|東南亞|山東|^[\p{Script=Han}々]+と同じ$/u;
const classifierLikeGlossPattern =
  /^(部|個|件|台|輛|名|位|條|張|本|家|把|面|隻|口|頭|瓶|杯|雙|份|粒|棵|艘|支|枚|匹)$/u;

const toneMap = new Map([
  ['ā', ['a', 1]],
  ['á', ['a', 2]],
  ['ǎ', ['a', 3]],
  ['à', ['a', 4]],
  ['ē', ['e', 1]],
  ['é', ['e', 2]],
  ['ě', ['e', 3]],
  ['è', ['e', 4]],
  ['ī', ['i', 1]],
  ['í', ['i', 2]],
  ['ǐ', ['i', 3]],
  ['ì', ['i', 4]],
  ['ō', ['o', 1]],
  ['ó', ['o', 2]],
  ['ǒ', ['o', 3]],
  ['ò', ['o', 4]],
  ['ū', ['u', 1]],
  ['ú', ['u', 2]],
  ['ǔ', ['u', 3]],
  ['ù', ['u', 4]],
  ['ǖ', ['v', 1]],
  ['ǘ', ['v', 2]],
  ['ǚ', ['v', 3]],
  ['ǜ', ['v', 4]],
  ['ü', ['v', 0]],
  ['ń', ['n', 2]],
  ['ň', ['n', 3]],
  ['ǹ', ['n', 4]],
  ['ḿ', ['m', 2]],
]);

const ensureFileExists = (filePath, label) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
};

const parseCsvLine = (line) => {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
};

const buildValidSyllables = (mjdicRows) => {
  const syllables = new Set();

  for (const row of mjdicRows) {
    const [, , pronunciation] = parseCsvLine(row.replace(/^\uFEFF/, ''));

    if (!pronunciation) {
      continue;
    }

    for (const syllable of pronunciation.toLowerCase().split(/\s+/)) {
      const plain = syllable.replace(/[1-5]/g, '');

      if (plain) {
        syllables.add(plain);
      }
    }
  }

  return syllables;
};

const accentToPlainAndTones = (input) => {
  const plainChars = [];
  const toneAtIndex = new Map();
  let plainIndex = 0;

  for (const char of input.toLowerCase().replace(/\s+/g, '').replace(/u:/g, 'v')) {
    const mapped = toneMap.get(char);

    if (mapped) {
      plainChars.push(mapped[0]);

      if (mapped[1] > 0) {
        toneAtIndex.set(plainIndex, mapped[1]);
      }

      plainIndex += 1;
      continue;
    }

    if (/[a-z]/.test(char)) {
      plainChars.push(char);
      plainIndex += 1;
    }
  }

  return {
    plain: plainChars.join(''),
    toneAtIndex,
  };
};

const segmentPinyin = (plain, syllableCount, validSyllables) => {
  const memo = new Map();

  const search = (start, remaining) => {
    const key = `${start}:${remaining}`;

    if (memo.has(key)) {
      return memo.get(key);
    }

    if (remaining === 0) {
      const result = start === plain.length ? [] : null;
      memo.set(key, result);
      return result;
    }

    const maxChunkLength = Math.min(6, plain.length - start);

    for (let length = 1; length <= maxChunkLength; length += 1) {
      const chunk = plain.slice(start, start + length);

      if (!validSyllables.has(chunk)) {
        continue;
      }

      const rest = search(start + length, remaining - 1);

      if (rest) {
        const result = [chunk, ...rest];
        memo.set(key, result);
        return result;
      }
    }

    memo.set(key, null);
    return null;
  };

  return search(0, syllableCount);
};

const normalizeTocflPronunciation = (pinyin, zhuyin, validSyllables) => {
  const syllableCount = zhuyin.trim().split(/\s+/).filter(Boolean).length;
  const { plain, toneAtIndex } = accentToPlainAndTones(pinyin);
  const segments = segmentPinyin(plain, syllableCount, validSyllables);

  if (!segments) {
    return null;
  }

  let cursor = 0;

  return segments
    .map((segment) => {
      let tone = 5;

      for (let index = cursor; index < cursor + segment.length; index += 1) {
        if (toneAtIndex.has(index)) {
          tone = toneAtIndex.get(index);
        }
      }

      cursor += segment.length;
      return tone === 5 ? segment : `${segment}${tone}`;
    })
    .join(' ');
};

const normalizeMjdicPronunciation = (pronunciation) => {
  if (typeof pronunciation !== 'string') {
    return null;
  }

  const normalized = pronunciation.toLowerCase().replace(/u:/g, 'v').trim().replace(/\s+/g, ' ');

  return normalized || null;
};

const collapseRepeatedSegments = (candidate) => {
  const segments = candidate
    .split(/[、，,]/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length > 1 && new Set(segments).size === 1) {
    return segments[0];
  }

  return candidate;
};

const normalizeGlossCandidate = (candidate) => {
  return collapseRepeatedSegments(candidate)
    .replace(/\u3000/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/<[^<>]*>/g, ' ')
    .replace(/\bI\.D\.\b/gi, 'ID')
    .replace(/\bD\.C\b/gi, 'DC')
    .replace(/\.com\b/gi, '')
    .replace(/\s*[（(][^()（）]{1,24}[)）]\s*/g, ' ')
    .replace(/\s*[（(][^()（）]{0,24}$/g, ' ')
    .replace(/^[^()（）]{1,24}[)）]\s*/g, ' ')
    .replace(/^[()（）]+|[()（）]+$/g, '')
    .replace(/^[「『"'“”]+|[」』"'“”]+$/g, '')
    .replace(/^(fig\.?|lit\.?|figurative|literal|図\.?|フィグ\.?|リット?\.?|比喩的に)\s*/i, '')
    .replace(/^[\s\-–—:：,，;；/／]+|[\s\-–—:：,，;；/／]+$/g, '')
    .replace(/[。．.!！?？]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const stripClassifierNotes = (gloss) =>
  gloss
    .replace(/\bCL:[^/／;；。]+/gi, '')
    .replace(/\b(?:classifier|measure words?|count(?:er| word)s?)\s*:[^/／;；。]+/gi, '');

const repeatedGlossPattern = /^(.{1,16}?)(?:[、，,]\1){1,}$/u;
const explanatoryGlossPattern =
  /に相当|を表す|の一種|の段階|仏教|旧暦|分類子|という|である|すること|のこと|を指す|として使|に使う|の意味|によれば|すべき|するのが|を得るため|ために/;

const isRejectedGlossCandidate = (candidate) => {
  if (!candidate) {
    return true;
  }

  if (/^[\p{P}\p{S}\s]+$/u.test(candidate)) {
    return true;
  }

  if (/[。{}<>|()（）]|\.\.\.|…|[?？!！]/.test(candidate) || /\(や\)|（や）/.test(candidate)) {
    return true;
  }

  if (repeatedGlossPattern.test(candidate)) {
    return true;
  }

  if (candidate.length > 18) {
    return true;
  }

  if (explanatoryGlossPattern.test(candidate)) {
    return true;
  }

  return false;
};

const extractCandidates = (...glosses) => {
  const candidates = [];

  for (const gloss of glosses) {
    if (!gloss) {
      continue;
    }

    const parts = stripClassifierNotes(gloss.replace(/\uFEFF/g, ''))
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\{[^{}]*\}/g, '')
      .split(/[／/]/)
      .flatMap((part) => part.split(/[;；]/))
      .flatMap((part) => part.split(/[、，,]/))
      .flatMap((part) => part.split(/\.{3,}|…+/))
      .flatMap((part) => part.split('|'))
      .flatMap((part) => part.split(/\(や\)|（や）/))
      .map((part) => part.replace(/^\([^)]*\)/, '').trim())
      .map((part) =>
        part.replace(/^(also|lit\.?|fig\.?|figurative|literal|variant of|図\.?)\s+/i, '').trim()
      )
      .map((part) => normalizeGlossCandidate(part))
      .filter(Boolean);

    for (const part of parts) {
      if (/^(surname|variant|classifier|see also|used in|Taiwan pr\.)/i.test(part)) {
        continue;
      }

      if (isRejectedGlossCandidate(part)) {
        continue;
      }

      candidates.push(part);
    }
  }

  return candidates;
};

export const isRejectedJapaneseGlossCandidate = (candidate, source = 'ja') => {
  if (!candidate) {
    return true;
  }

  if (simplifiedChineseGlossPattern.test(candidate)) {
    return true;
  }

  if (untranslatedChineseGlossPattern.test(candidate)) {
    return true;
  }

  if (source !== 'ja' && allHanGlossPattern.test(candidate)) {
    return true;
  }

  return false;
};

const isClassifierLikeGloss = (trad, candidate) =>
  [...trad].length > 1 && classifierLikeGlossPattern.test(candidate);

export const scoreCandidate = (candidate, source = 'ja') => {
  let score = 0;

  if (isRejectedJapaneseGlossCandidate(candidate, source)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (/[ぁ-んァ-ヶ]/.test(candidate)) {
    score += 6;
  }

  if (/[一-龯々]/u.test(candidate)) {
    score += 2;
  }

  if (/^[A-Za-z0-9 ?!.,'":;()-]+$/.test(candidate)) {
    score -= 2;
  }

  if (/CL:|surname|variant|classifier|abbr\.|old variant|Taiwan pr\./i.test(candidate)) {
    score -= 6;
  }

  if (explanatoryGlossPattern.test(candidate)) {
    score -= 5;
  }

  if (/\||\[|\]|pr\./.test(candidate)) {
    score -= 4;
  }

  if (candidate.length <= 12) {
    score += 2;
  }

  if (candidate.length > 18) {
    score -= 6;
  }

  if (rejectionPatterns.some((pattern) => pattern.test(candidate))) {
    score -= 8;
  }

  return score;
};

export const pickBestGloss = (glossPairs) => {
  const candidates = [];

  for (const [meansJa, means] of glossPairs) {
    candidates.push(
      ...extractCandidates(meansJa).map((candidate) => ({ candidate, source: 'ja' }))
    );
    candidates.push(
      ...extractCandidates(means).map((candidate) => ({ candidate, source: 'fallback' }))
    );
  }

  const candidateMap = new Map();

  for (const entry of candidates) {
    if (!candidateMap.has(entry.candidate) || entry.source === 'ja') {
      candidateMap.set(entry.candidate, entry);
    }
  }

  const uniqueCandidates = [...candidateMap.values()]
    .map((entry) => ({
      candidate: entry.candidate,
      score: scoreCandidate(entry.candidate, entry.source),
    }))
    .filter((entry) => entry.score >= 1)
    .sort(
      (left, right) => right.score - left.score || left.candidate.length - right.candidate.length
    );

  return uniqueCandidates[0]?.candidate ?? null;
};

const determineLevel = (length) => {
  if (length <= 2) {
    return 1;
  }

  if (length <= 4) {
    return 2;
  }

  return 3;
};

const buildLevelThreeCategory = (word) => {
  return `extended:${word[0]}`;
};

export const generateVocabulary = () => {
  const manualVocabulary = JSON.parse(fs.readFileSync(manualVocabularyPath, 'utf8'));

  ensureFileExists(tocflSourcePath, 'TOCFL source');
  ensureFileExists(mjdicSourcePath, 'MJdic source');
  fs.mkdirSync(publicWordlistDir, { recursive: true });

  const tocflRows = fs
    .readFileSync(tocflSourcePath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const mjdicRows = fs
    .readFileSync(mjdicSourcePath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(1);
  const validSyllables = buildValidSyllables(mjdicRows);
  const dictionary = new Map();
  const tocflByTrad = new Map(tocflRows.map((item) => [String(item.text).trim(), item]));
  const mjdicPronunciationByTrad = new Map();

  for (const row of mjdicRows) {
    const [trad, , pronunciation, means, meansJa] = parseCsvLine(row.replace(/^\uFEFF/, ''));

    if (!trad) {
      continue;
    }

    const normalizedPronunciation = normalizeMjdicPronunciation(pronunciation);

    if (normalizedPronunciation) {
      const exactKey = `${trad}\t${normalizedPronunciation}`;
      const exactEntries = dictionary.get(exactKey) ?? [];
      exactEntries.push([meansJa, means]);
      dictionary.set(exactKey, exactEntries);
    }

    const fallbackKey = `${trad}\t`;
    const fallbackEntries = dictionary.get(fallbackKey) ?? [];
    fallbackEntries.push([meansJa, means]);
    dictionary.set(fallbackKey, fallbackEntries);

    if (!mjdicPronunciationByTrad.has(trad) && normalizedPronunciation) {
      mjdicPronunciationByTrad.set(trad, normalizedPronunciation);
    }
  }

  const mergedVocabulary = [];
  const seenTrad = new Set();

  for (const entry of manualVocabulary) {
    if (seenTrad.has(entry.trad)) {
      continue;
    }

    const tocflItem = tocflByTrad.get(entry.trad);
    const normalizedPronunciation =
      entry.pronunciation ||
      (tocflItem
        ? (normalizeTocflPronunciation(tocflItem.pinyin, tocflItem.zhuyin, validSyllables) ??
          undefined)
        : mjdicPronunciationByTrad.get(entry.trad));

    seenTrad.add(entry.trad);
    mergedVocabulary.push({
      ...entry,
      tocflLevel: entry.tocflLevel ?? tocflItem?.tocfl_level,
      pronunciation: normalizedPronunciation,
    });
  }

  let tocflImported = 0;

  for (const item of tocflRows) {
    const trad = String(item.text).trim();

    if (seenTrad.has(trad) || !/^[\p{Script=Han}]+$/u.test(trad)) {
      continue;
    }

    const length = [...trad].length;

    if (length < 1 || length > 4) {
      continue;
    }

    const normalizedPronunciation = normalizeTocflPronunciation(
      item.pinyin,
      item.zhuyin,
      validSyllables
    );
    const exactMatches = normalizedPronunciation
      ? (dictionary.get(`${trad}\t${normalizedPronunciation}`) ?? [])
      : [];
    const fallbackMatches = dictionary.get(`${trad}\t`) ?? [];
    const bestGloss =
      importOverrides.get(trad) ??
      pickBestGloss(exactMatches.length > 0 ? exactMatches : fallbackMatches);

    if (!bestGloss || isClassifierLikeGloss(trad, bestGloss)) {
      continue;
    }

    seenTrad.add(trad);
    tocflImported += 1;
    mergedVocabulary.push({
      id: `tocfl-${String(item.id).padStart(5, '0')}`,
      trad,
      ja: bestGloss,
      level: determineLevel(length),
      length,
      category: `tocfl:${item.category}`,
      taiwanPriority: true,
      sources: ['tocfl', 'mjdic'],
      tocflLevel: item.tocfl_level,
      pronunciation: normalizedPronunciation ?? undefined,
    });
  }

  let levelThreeImported = 0;

  for (let index = 0; index < mjdicRows.length; index += 1) {
    const [trad, , pronunciation, means, meansJa] = parseCsvLine(
      mjdicRows[index].replace(/^\uFEFF/, '')
    );

    if (!trad || seenTrad.has(trad) || !/^[\p{Script=Han}]+$/u.test(trad)) {
      continue;
    }

    const length = [...trad].length;

    if (length < 5 || length > 6) {
      continue;
    }

    const bestGloss = pickBestGloss([[meansJa, means]]);

    if (!bestGloss || isClassifierLikeGloss(trad, bestGloss)) {
      continue;
    }

    seenTrad.add(trad);
    levelThreeImported += 1;
    mergedVocabulary.push({
      id: `mjdic-${String(index + 1).padStart(6, '0')}`,
      trad,
      ja: bestGloss,
      level: 3,
      length,
      category: buildLevelThreeCategory(trad),
      taiwanPriority: true,
      sources: ['mjdic'],
      pronunciation: normalizeMjdicPronunciation(pronunciation) ?? undefined,
    });
  }

  const sortedVocabulary = mergedVocabulary.sort((left, right) => {
    if (left.level !== right.level) {
      return left.level - right.level;
    }

    if (left.length !== right.length) {
      return left.length - right.length;
    }

    return left.trad.localeCompare(right.trad, 'zh-Hant');
  });

  fs.writeFileSync(outputPath, `${JSON.stringify(sortedVocabulary, null, 2)}\n`);

  const metadata = {
    total: sortedVocabulary.length,
    counts: {
      1: 0,
      2: 0,
      3: 0,
    },
  };

  for (const level of [1, 2, 3]) {
    const levelEntries = sortedVocabulary.filter((entry) => entry.level === level);
    metadata.counts[level] = levelEntries.length;
    fs.writeFileSync(splitOutputPaths[level], `${JSON.stringify(levelEntries, null, 2)}\n`);
    fs.writeFileSync(publicWordlistPaths[level], `${JSON.stringify(levelEntries, null, 2)}\n`);
  }

  fs.writeFileSync(metadataOutputPath, `${JSON.stringify(metadata, null, 2)}\n`);
  fs.writeFileSync(publicMetadataOutputPath, `${JSON.stringify(metadata, null, 2)}\n`);

  console.log(
    `Generated ${sortedVocabulary.length} entries (${manualVocabulary.length} manual, ${tocflImported} TOCFL, ${levelThreeImported} MJdic level-3).`
  );
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  generateVocabulary();
}

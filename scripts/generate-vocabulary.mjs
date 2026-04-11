import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { buildCandidates } from './lib/vocabulary-candidate-pipeline.mjs';
import { parseEditorialOverrides } from './lib/vocabulary-editorial-records.mjs';
import { buildPublishedVocabulary } from './lib/vocabulary-publish.mjs';
import {
  isCorruptedJapaneseGloss,
  isReferenceOnlyGloss,
} from './lib/vocabulary-quality-signals.mjs';
import { readTbclRows, readTocflRows } from './lib/vocabulary-source-readers.mjs';

const repoRoot = process.cwd();
const defaultTocflPath = path.join(repoRoot, 'data', 'source-snapshots', 'tocfl_words.json');
const defaultMjdicPath = path.join(repoRoot, 'data', 'source-snapshots', 'mjdic.csv');
const defaultTbclPath = path.join(repoRoot, 'data', 'source-snapshots', 'tbcl_words.json');
const manualVocabularyPath = path.join(repoRoot, 'data', 'manual-vocabulary.json');
const editorialOverridesPath = path.join(repoRoot, 'data', 'editorial-overrides.json');
const candidatesOutputPath = path.join(repoRoot, 'data', 'vocabulary-candidates.json');
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
const tbclSourcePath = process.env.TBCL_SOURCE_PATH ?? defaultTbclPath;

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

  if (isReferenceOnlyGloss(candidate)) {
    return true;
  }

  if (isCorruptedJapaneseGloss(candidate)) {
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

  if (isReferenceOnlyGloss(candidate)) {
    return true;
  }

  if (isCorruptedJapaneseGloss(candidate)) {
    return true;
  }

  if (source !== 'ja' && allHanGlossPattern.test(candidate)) {
    return true;
  }

  return false;
};

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

const buildLevelThreeCategory = (word) => {
  return `extended:${word[0]}`;
};

export const parseTocflSource = (sourceText) => {
  const trimmed = sourceText.trim().replace(/^\uFEFF/, '');

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed);

    if (!Array.isArray(parsed)) {
      throw new Error('TOCFL source must be a JSON array or JSONL.');
    }

    return parsed;
  }

  return trimmed
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
};

export const generateVocabulary = () => {
  const manualVocabulary = JSON.parse(fs.readFileSync(manualVocabularyPath, 'utf8'));
  const editorialOverrides = fs.existsSync(editorialOverridesPath)
    ? parseEditorialOverrides(JSON.parse(fs.readFileSync(editorialOverridesPath, 'utf8')))
    : [];

  ensureFileExists(tocflSourcePath, 'TOCFL source');
  ensureFileExists(mjdicSourcePath, 'MJdic source');
  fs.mkdirSync(publicWordlistDir, { recursive: true });

  const tocflRows = parseTocflSource(fs.readFileSync(tocflSourcePath, 'utf8'));
  const mjdicRows = fs
    .readFileSync(mjdicSourcePath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(1);
  const normalizedMjdicEntries = mjdicRows
    .map((row, index) => [parseCsvLine(row.replace(/^\uFEFF/, '')), index + 1])
    .map(([[trad, , pronunciation, means, meansJa], sourceIndex]) => ({
      trad,
      pronunciation: normalizeMjdicPronunciation(pronunciation) ?? undefined,
      means,
      meansJa,
      sourceIndex,
    }))
    .filter((entry) => entry.trad);
  const validSyllables = buildValidSyllables(mjdicRows);
  const normalizedTocflRows = readTocflRows(fs.readFileSync(tocflSourcePath, 'utf8')).map(
    (row) => ({
      ...row,
      pronunciation: {
        ...row.pronunciation,
        pinyin:
          normalizeTocflPronunciation(
            row.pronunciation?.pinyin ?? '',
            row.pronunciation?.zhuyin ?? '',
            validSyllables
          ) ??
          row.pronunciation?.pinyin ??
          '',
      },
    })
  );
  const normalizedTbclRows = fs.existsSync(tbclSourcePath)
    ? readTbclRows(fs.readFileSync(tbclSourcePath, 'utf8'))
    : [];
  const dictionary = new Map();
  const tocflByTrad = new Map(tocflRows.map((item) => [String(item.text).trim(), item]));
  const mjdicPronunciationByTrad = new Map();
  const mjdicSourceIndexByTrad = new Map();

  for (const entry of normalizedMjdicEntries) {
    const { trad, pronunciation: normalizedPronunciation, means, meansJa, sourceIndex } = entry;

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

    if (!mjdicSourceIndexByTrad.has(trad)) {
      mjdicSourceIndexByTrad.set(trad, sourceIndex);
    }
  }

  const manualEntries = [];
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
    manualEntries.push({
      ...entry,
      tocflLevel: entry.tocflLevel ?? tocflItem?.tocfl_level,
      pronunciation: normalizedPronunciation,
    });
  }

  const reviewCandidates = buildCandidates({
    tocflRows: normalizedTocflRows,
    tbclRows: normalizedTbclRows,
    mjdicEntries: normalizedMjdicEntries,
    editorialOverrides,
  });
  const publishedVocabulary = buildPublishedVocabulary({
    candidates: reviewCandidates
      .filter(
        (candidate) =>
          !seenTrad.has(candidate.trad) &&
          ((candidate.level <= 2 &&
            candidate.sources.some((source) => source === 'tocfl' || source === 'tbcl')) ||
            (candidate.level === 3 && candidate.sources.includes('mjdic')))
      )
      .map((candidate) => {
        const tocflItem = tocflByTrad.get(candidate.trad);
        const candidateId = tocflItem
          ? `tocfl-${String(tocflItem.id).padStart(5, '0')}`
          : candidate.sources.includes('tbcl')
            ? `tbcl-${candidate.trad}`
            : `mjdic-${String(mjdicSourceIndexByTrad.get(candidate.trad) ?? 0).padStart(6, '0')}`;

        return {
          ...candidate,
          id: candidateId,
          category:
            candidate.category ??
            (candidate.level === 3 ? buildLevelThreeCategory(candidate.trad) : 'uncategorized'),
          taiwanPriority: true,
          status: candidate.status ?? 'approved',
          acceptedJa: candidate.acceptedJa ?? [],
          senseTag: candidate.senseTag ?? null,
          distractorTags: candidate.distractorTags ?? [],
        };
      }),
    editorialRecords: editorialOverrides,
    seedEntries: manualEntries,
  });

  const sortedVocabulary = publishedVocabulary.sort((left, right) => {
    if (left.level !== right.level) {
      return left.level - right.level;
    }

    if (left.length !== right.length) {
      return left.length - right.length;
    }

    return left.trad.localeCompare(right.trad, 'zh-Hant');
  });

  fs.writeFileSync(candidatesOutputPath, `${JSON.stringify(reviewCandidates, null, 2)}\n`);
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

  const publishedSeedTradSet = new Set(manualEntries.map((entry) => entry.trad));
  const generatedEntries = sortedVocabulary.filter(
    (entry) => !publishedSeedTradSet.has(entry.trad)
  );
  const tocflImported = generatedEntries.filter((entry) => entry.sources.includes('tocfl')).length;
  const levelThreeImported = generatedEntries.filter(
    (entry) => entry.level === 3 && entry.sources.includes('mjdic')
  ).length;

  console.log(
    `Generated ${sortedVocabulary.length} entries (${manualVocabulary.length} manual, ${tocflImported} TOCFL, ${levelThreeImported} MJdic level-3).`
  );
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  generateVocabulary();
}

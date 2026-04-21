import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { parseManualVocabularySeeds } from './lib/manual-vocabulary-seeds.mjs';
import { buildCandidates } from './lib/vocabulary-candidate-pipeline.mjs';
import { determineLevel } from './lib/vocabulary-levels.mjs';
import { buildPublishedVocabulary } from './lib/vocabulary-publish.mjs';
import { parseJsonOrJsonl, readTbclRows, readTocflRows } from './lib/vocabulary-source-readers.mjs';

const repoRoot = process.cwd();
const defaultTocflPath = path.join(repoRoot, 'data', 'source-snapshots', 'tocfl_words.json');
const defaultMjdicPath = path.join(repoRoot, 'data', 'source-snapshots', 'mjdic.csv');
const defaultTbclPath = path.join(repoRoot, 'data', 'source-snapshots', 'tbcl_words.json');
const manualVocabularyPath = path.join(repoRoot, 'data', 'manual-vocabulary.json');
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

export const generateVocabulary = () => {
  const manualVocabulary = parseManualVocabularySeeds(
    JSON.parse(fs.readFileSync(manualVocabularyPath, 'utf8'))
  );

  ensureFileExists(tocflSourcePath, 'TOCFL source');
  ensureFileExists(mjdicSourcePath, 'MJdic source');
  fs.mkdirSync(publicWordlistDir, { recursive: true });

  const tocflSourceText = fs.readFileSync(tocflSourcePath, 'utf8');
  const tocflRows = parseJsonOrJsonl(tocflSourceText);
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
  const normalizedTocflRows = readTocflRows(tocflSourceText).map((row) => ({
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
  }));
  const normalizedTbclRows = fs.existsSync(tbclSourcePath)
    ? readTbclRows(fs.readFileSync(tbclSourcePath, 'utf8'))
    : [];
  const tocflByTrad = new Map(tocflRows.map((item) => [String(item.text).trim(), item]));
  const mjdicPronunciationByTrad = new Map();
  const mjdicSourceIndexByTrad = new Map();

  for (const entry of normalizedMjdicEntries) {
    const { trad, pronunciation: normalizedPronunciation, sourceIndex } = entry;

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
    const length = [...entry.trad].length;
    const normalizedPronunciation =
      entry.pronunciation ||
      (tocflItem
        ? (normalizeTocflPronunciation(tocflItem.pinyin, tocflItem.zhuyin, validSyllables) ??
          undefined)
        : mjdicPronunciationByTrad.get(entry.trad));

    seenTrad.add(entry.trad);
    manualEntries.push({
      ...entry,
      level: determineLevel(length),
      length,
      sources: ['seed'],
      tocflLevel: entry.tocflLevel ?? tocflItem?.tocfl_level,
      pronunciation: normalizedPronunciation,
    });
  }

  const generatedCandidates = buildCandidates({
    tocflRows: normalizedTocflRows,
    tbclRows: normalizedTbclRows,
    mjdicEntries: normalizedMjdicEntries,
  });
  const generatedDeckCandidates = generatedCandidates
    .filter((candidate) => !seenTrad.has(candidate.trad))
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
        category: candidate.category ?? 'uncategorized',
        taiwanPriority: true,
        status: candidate.status ?? 'approved',
        senseTag: candidate.senseTag ?? null,
        distractorTags: candidate.distractorTags ?? [],
      };
    });

  const publishedVocabulary = buildPublishedVocabulary({
    candidates: generatedDeckCandidates,
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

  fs.writeFileSync(candidatesOutputPath, `${JSON.stringify(generatedCandidates, null, 2)}\n`);
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
  const rejectedCandidates = generatedDeckCandidates.filter(
    (candidate) => candidate.publishable === false
  ).length;

  console.log(
    `Generated ${sortedVocabulary.length} entries (${manualEntries.length} manual seeds, ${generatedEntries.length} publishable candidates, ${rejectedCandidates} rejected candidates).`
  );
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  generateVocabulary();
}

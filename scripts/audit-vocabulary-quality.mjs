import vocabulary from '../data/vocabulary.json' with { type: 'json' };
import {
  isAsciiOnlyGloss,
  isClassifierLikeGloss,
  isCorruptedJapaneseGloss,
  isExplanatoryGloss,
  isProperNounLikeGloss,
  isReferenceOnlyGloss,
} from './lib/vocabulary-quality-signals.mjs';

const checks = [
  {
    name: 'punctuation_only',
    test: (entry) => /^[\p{P}\p{S}\s]+$/u.test(entry.ja),
  },
  {
    name: 'contains_parentheses',
    test: (entry) => /[()（）]/.test(entry.ja),
  },
  {
    name: 'contains_period',
    test: (entry) => /[。？！…]|\.{3,}/.test(entry.ja),
  },
  {
    name: 'contains_explanatory_phrase',
    test: (entry) => isExplanatoryGloss(entry.ja),
  },
  {
    name: 'reference_only',
    test: (entry) => isReferenceOnlyGloss(entry.ja),
  },
  {
    name: 'corrupted_japanese_gloss',
    test: (entry) => isCorruptedJapaneseGloss(entry.ja),
  },
  {
    name: 'too_long',
    test: (entry) => entry.ja.length > 18,
  },
  {
    name: 'ascii_only',
    test: (entry) => isAsciiOnlyGloss(entry.ja),
  },
  {
    name: 'classifier_like',
    test: (entry) => isClassifierLikeGloss(entry.ja),
  },
  {
    name: 'proper_noun_like',
    test: (entry) => isProperNounLikeGloss(entry.ja),
  },
];

for (const check of checks) {
  const matches = vocabulary.filter(check.test);

  console.log(`${check.name}: ${matches.length}`);

  for (const entry of matches.slice(0, 20)) {
    console.log(`- ${entry.trad}\t${entry.ja}\t[${entry.sources.join(',')}]`);
  }

  console.log('');
}

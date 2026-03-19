import vocabulary from '../data/vocabulary.json' with { type: 'json' };

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
    test: (entry) =>
      /に相当|を表す|の一種|の段階|仏教|旧暦|分類子|という|である|すること|のこと|を指す|として使|に使う|の意味|によれば|すべき|するのが|を得るため|ために/.test(
        entry.ja
      ),
  },
  {
    name: 'too_long',
    test: (entry) => entry.ja.length > 18,
  },
  {
    name: 'ascii_only',
    test: (entry) => /^[A-Za-z0-9 ?!.,'":;()/-]+$/.test(entry.ja),
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

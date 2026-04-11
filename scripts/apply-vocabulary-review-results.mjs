import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const defaultOverridesPath = path.join(repoRoot, 'data', 'editorial-overrides.json');

export const mergeReviewResults = ({ existingOverrides, reviewResults }) => {
  const merged = new Map(existingOverrides.map((item) => [item.trad, item]));

  for (const result of reviewResults) {
    merged.set(result.trad, {
      trad: result.trad,
      status: result.recommendedStatus,
      canonicalJa: result.canonicalJa,
      acceptedJa: result.acceptedJa ?? [],
    });
  }

  return [...merged.values()].sort((left, right) => left.trad.localeCompare(right.trad, 'zh-Hant'));
};

const main = () => {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error(
      'Usage: node scripts/apply-vocabulary-review-results.mjs <review-results.json>'
    );
  }

  const existingOverrides = fs.existsSync(defaultOverridesPath)
    ? JSON.parse(fs.readFileSync(defaultOverridesPath, 'utf8'))
    : [];
  const reviewResults = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const merged = mergeReviewResults({ existingOverrides, reviewResults });

  fs.writeFileSync(defaultOverridesPath, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`Updated ${defaultOverridesPath} with ${reviewResults.length} review results.`);
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}

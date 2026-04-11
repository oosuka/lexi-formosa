import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const candidatesPath = path.join(repoRoot, 'data', 'vocabulary-candidates.json');
const editorialOverridesPath = path.join(repoRoot, 'data', 'editorial-overrides.json');
const outputPath = path.join(repoRoot, 'data', 'review-batches', 'vocabulary-review-batch.jsonl');

const parseLimit = (argv) => {
  const limitArgument = argv.find((argument) => argument.startsWith('--limit='));

  if (!limitArgument) {
    return undefined;
  }

  const parsed = Number(limitArgument.replace('--limit=', ''));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const isPublishableCandidate = (candidate) =>
  (candidate.level <= 2 &&
    candidate.sources.some((source) => source === 'tocfl' || source === 'tbcl')) ||
  (candidate.level === 3 && candidate.sources.includes('mjdic'));

export const buildReviewBatch = (candidates, editorialOverrides = [], options = {}) => {
  const reviewedTradSet = new Set(editorialOverrides.map((override) => override.trad));
  const rows = candidates
    .filter((candidate) => {
      if (!isPublishableCandidate(candidate)) {
        return false;
      }

      if (reviewedTradSet.has(candidate.trad)) {
        return false;
      }

      if ((candidate.riskFlags?.length ?? 0) > 0 || candidate.confidence === 'low') {
        return true;
      }

      return candidate.level <= 2;
    })
    .map((candidate) => ({
      trad: candidate.trad,
      level: candidate.level,
      currentCanonicalJa: candidate.canonicalJa,
      confidence: candidate.confidence,
      riskFlags: candidate.riskFlags ?? [],
      sourceEvidence: candidate.sources,
      glossEvidence: candidate.rawGlosses,
      requestedFields: ['canonicalJa', 'acceptedJa', 'riskFlags', 'recommendedStatus'],
    }));

  return options.limit ? rows.slice(0, options.limit) : rows;
};

const main = () => {
  if (!fs.existsSync(candidatesPath)) {
    throw new Error(`Candidate file not found: ${candidatesPath}`);
  }

  const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
  const editorialOverrides = fs.existsSync(editorialOverridesPath)
    ? JSON.parse(fs.readFileSync(editorialOverridesPath, 'utf8'))
    : [];
  const batch = buildReviewBatch(candidates, editorialOverrides, {
    limit: parseLimit(process.argv.slice(2)),
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${batch.map((row) => JSON.stringify(row)).join('\n')}\n`);

  console.log(`Wrote ${batch.length} review rows to ${outputPath}`);
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}

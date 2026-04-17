import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const snapshotDir = path.join(repoRoot, 'data', 'source-snapshots');

const sources = [
  {
    label: 'TOCFL source',
    envPath: process.env.TOCFL_SOURCE_PATH,
    envUrl:
      process.env.TOCFL_SOURCE_URL ??
      'https://raw.githubusercontent.com/PSeitz/tocfl/main/tocfl_words.json',
    outputPath: path.join(snapshotDir, 'tocfl_words.json'),
  },
  {
    label: 'MJdic source',
    envPath: process.env.MJDIC_SOURCE_PATH,
    envUrl:
      process.env.MJDIC_SOURCE_URL ??
      'https://raw.githubusercontent.com/code4fukui/MJdic/main/cedict_ts.csv',
    outputPath: path.join(snapshotDir, 'mjdic.csv'),
  },
  {
    label: 'TBCL source',
    envPath: process.env.TBCL_SOURCE_PATH,
    envUrl: process.env.TBCL_SOURCE_URL,
    outputPath: path.join(snapshotDir, 'tbcl_words.json'),
    optional: true,
  },
];

const runNodeScript = (scriptPath) => {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const ensureSourceFile = async ({ label, envPath, envUrl, outputPath, optional = false }) => {
  if (envPath) {
    console.log(`Using local ${label}: ${envPath}`);
    fs.copyFileSync(envPath, outputPath);
    return;
  }

  if (!envUrl) {
    if (optional) {
      console.log(`Skipping ${label}: no source path or URL configured.`);
      return;
    }

    throw new Error(`Missing source for ${label}.`);
  }

  console.log(`Downloading ${label}...`);

  const response = await fetch(envUrl, {
    headers: {
      'user-agent': 'LexiFormosa setup-data script',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${label}: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  fs.writeFileSync(outputPath, text, 'utf8');
};

const main = async () => {
  fs.mkdirSync(snapshotDir, { recursive: true });

  console.log('Third-party dictionary data is not bundled in this repository.');
  console.log('Check source licenses before redistributing generated outputs.');

  for (const source of sources) {
    await ensureSourceFile(source);
  }

  runNodeScript(path.join(repoRoot, 'scripts', 'generate-vocabulary.mjs'));
  runNodeScript(path.join(repoRoot, 'scripts', 'validate-vocabulary.mjs'));

  console.log('Dictionary setup completed.');
  console.log('You can now run: npm run dev');
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

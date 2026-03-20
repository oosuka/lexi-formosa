import { spawn } from 'node:child_process';

const env = { ...process.env };
delete env.NO_COLOR;

const child = spawn(process.execPath, ['./node_modules/playwright/cli.js', 'test'], {
  cwd: process.cwd(),
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

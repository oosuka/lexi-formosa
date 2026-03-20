import { spawn } from 'node:child_process';

const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Command exited by signal: ${signal}`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
        return;
      }

      resolve();
    });
  });

await run(['./node_modules/nuxt/bin/nuxt.mjs', 'build']);

process.env.HOST = '127.0.0.1';
process.env.PORT = '4173';

await import('../.output/server/index.mjs');

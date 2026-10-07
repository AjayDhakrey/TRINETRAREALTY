import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const tsxPath = path.resolve(rootDir, 'node_modules/tsx/dist/cli.mjs');
const vitePath = path.resolve(rootDir, 'node_modules/vite/bin/vite.js');

console.log('🚀 Starting Trinetra Realty Fullstack (API Server + Vite Frontend)...');

const apiProcess = spawn(process.execPath, [tsxPath, 'backend/server.ts'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env },
});

const frontendProcess = spawn(
  process.execPath,
  [vitePath, 'frontend', '--config', 'frontend/vite.config.ts'],
  {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env },
  }
);

function cleanup() {
  try {
    if (process.platform === 'win32') {
      if (apiProcess.pid) spawn('taskkill', ['/pid', String(apiProcess.pid), '/f', '/t']);
      if (frontendProcess.pid) spawn('taskkill', ['/pid', String(frontendProcess.pid), '/f', '/t']);
    } else {
      apiProcess.kill('SIGTERM');
      frontendProcess.kill('SIGTERM');
    }
  } catch {
    // ignore errors on exit
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

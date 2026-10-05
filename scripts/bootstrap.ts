// `pnpm bootstrap`: one-command setup for a fresh clone.
// Uses only Node built-ins so it works before `pnpm install` has run.
import {copyFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {preflight} from './preflight.ts';
import {repoRoot, run} from './lib/util.ts';

run('pnpm', ['install', '--frozen-lockfile']);

const envPath = path.join(repoRoot, '.env');
if (existsSync(envPath)) {
  console.log('\n.env already exists — leaving it alone.');
} else {
  copyFileSync(path.join(repoRoot, '.env.example'), envPath);
  console.log('\nCreated .env from .env.example.');
}

// Agent context (.mcp.json, .adbt-config.json, ADBT steering doc and skills) is committed,
// so there's nothing to generate here; preflight verifies it's intact.
process.exit(preflight() ? 0 : 1);

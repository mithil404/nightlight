// Shared helpers for repo scripts. Runs directly on Node 24 (built-in type stripping):
// keep to erasable TypeScript syntax and import local files with their .ts extension.
import {spawnSync, type SpawnSyncOptions} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const isWindows = process.platform === 'win32';

/** Port of the local mock API (`pnpm mock`); the TV reaches it via reverse port forwarding. */
export const MOCK_PORT = Number(process.env.MOCK_PORT ?? 8787);

export interface Toolchain {
  node: string;
  vegaSdk: string;
  vegaCli: string;
  adbt: string;
}

export function readToolchain(): Toolchain {
  return JSON.parse(readFileSync(path.join(repoRoot, 'toolchain.json'), 'utf8')) as Toolchain;
}

export function readRootPackageJson(): {packageManager: string} {
  return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {packageManager: string};
}

export interface CaptureResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

/** Run a command and capture its output. Never throws; a missing binary is `ok: false`. */
export function capture(cmd: string, args: string[], opts: SpawnSyncOptions = {}): CaptureResult {
  const r = spawnSync(cmd, args, {encoding: 'utf8', shell: isWindows, cwd: repoRoot, ...opts});
  if (r.error) {
    return {ok: false, stdout: '', stderr: r.error.message};
  }
  return {ok: r.status === 0, stdout: String(r.stdout ?? ''), stderr: String(r.stderr ?? '')};
}

/** Run a command with inherited stdio. Exits the process if it fails. */
export function run(cmd: string, args: string[], opts: SpawnSyncOptions = {}): void {
  console.log(`\n$ ${[cmd, ...args].join(' ')}`);
  const r = spawnSync(cmd, args, {stdio: 'inherit', shell: isWindows, cwd: repoRoot, ...opts});
  if (r.status !== 0) {
    console.error(`\n✖ Command failed (${r.error?.message ?? `exit ${r.status}`}): ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

const vegaBinDir = path.join(homedir(), 'vega', 'bin');

/**
 * Environment with the Vega CLI on PATH, mirroring what `~/vega/env` does, so scripts
 * work even when the user's shell profile hasn't sourced it.
 */
export function vegaEnv(): NodeJS.ProcessEnv {
  const current = process.env.PATH ?? '';
  const parts = current.split(path.delimiter);
  return parts.includes(vegaBinDir) ? process.env : {...process.env, PATH: [vegaBinDir, current].join(path.delimiter)};
}

/** Returns `vega --version` output, or undefined if the CLI isn't installed. */
export function vegaVersion(): {sdk?: string; cli?: string} | undefined {
  if (!existsSync(vegaBinDir) && !capture('vega', ['--version']).ok) {
    return undefined;
  }
  const r = capture('vega', ['--version'], {env: vegaEnv()});
  if (!r.ok) {
    return undefined;
  }
  return {
    sdk: /Active SDK Version:\s*(\S+)/.exec(r.stdout)?.[1],
    cli: /Vega CLI Version:\s*(\S+)/.exec(r.stdout)?.[1],
  };
}

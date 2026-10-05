// `pnpm preflight`: check that this machine can build and run Nightlight.
// Required checks print ✅/❌ and fail the run; optional ones (AWS) print ⚠️ only.
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {capture, isWindows, readRootPackageJson, readToolchain, repoRoot, vegaEnv, vegaVersion} from './lib/util.ts';

interface Check {
  name: string;
  ok: boolean;
  detail?: string;
  fix?: string;
  /** Optional checks warn instead of failing the run. */
  optional?: boolean;
}

const BREW_PACKAGES = ['binutils', 'coreutils', 'gawk', 'findutils', 'grep', 'jq', 'lz4', 'gnu-sed', 'watchman'];

function toolchainChecks(): Check[] {
  const toolchain = readToolchain();
  const nodeMajor = process.versions.node.split('.')[0];
  const wantedPnpm = readRootPackageJson().packageManager.replace(/^pnpm@/, '');
  const pnpmVersion =
    /pnpm\/(\S+)/.exec(process.env.npm_config_user_agent ?? '')?.[1] ?? capture('pnpm', ['-v']).stdout.trim();
  return [
    {
      name: `Node ${toolchain.node}`,
      ok: nodeMajor === toolchain.node,
      detail: `found v${process.versions.node}`,
      fix: isWindows ? `install Node ${toolchain.node} (e.g. \`fnm use\`)` : 'nvm install && nvm use   (reads .nvmrc)',
    },
    {
      name: `pnpm ${wantedPnpm}`,
      ok: pnpmVersion === wantedPnpm,
      detail: pnpmVersion ? `found ${pnpmVersion}` : 'not found',
      fix: 'corepack enable pnpm   (Corepack ships with Node 24 and reads "packageManager" from package.json)',
    },
  ];
}

function vegaChecks(): Check[] {
  const toolchain = readToolchain();
  const supportedHost = process.platform === 'darwin' || process.platform === 'linux';
  if (!supportedHost) {
    return [
      {
        name: 'Host OS supported by the Vega SDK',
        ok: false,
        detail: `${process.platform} — the Vega SDK supports macOS 10.15+ and Ubuntu 20.04+ only`,
        fix: 'run this repo inside WSL2 Ubuntu (see README)',
      },
    ];
  }
  const checks: Check[] = [{name: 'Host OS supported by the Vega SDK', ok: true, detail: process.platform}];

  if (process.platform === 'darwin' && process.arch === 'arm64') {
    checks.push({
      name: 'Rosetta (Apple Silicon)',
      ok: capture('/usr/bin/pgrep', ['-q', 'oahd']).ok,
      fix: 'softwareupdate --install-rosetta --agree-to-license',
    });
  }
  if (process.platform === 'darwin') {
    const brew = capture('brew', ['list', '--formula']);
    const installed = new Set(brew.stdout.split(/\s+/));
    const missing = BREW_PACKAGES.filter(p => !installed.has(p));
    checks.push({
      name: 'Homebrew packages for the Vega SDK',
      ok: brew.ok && missing.length === 0,
      detail: !brew.ok ? 'Homebrew not found' : missing.length ? `missing: ${missing.join(' ')}` : undefined,
      fix: !brew.ok ? 'install Homebrew: https://brew.sh' : `brew install ${missing.join(' ')}`,
    });
  }

  const version = vegaVersion();
  checks.push({
    name: 'Vega CLI',
    ok: version !== undefined,
    detail: version ? `CLI ${version.cli ?? '?'}` : 'not found',
    fix: 'curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash && source ~/vega/env',
  });
  if (!version) {
    return checks;
  }
  checks.push({
    name: `Vega SDK ${toolchain.vegaSdk}`,
    ok: version.sdk === toolchain.vegaSdk,
    detail: `active: ${version.sdk ?? 'unknown'}`,
    fix: `vega sdk install ${toolchain.vegaSdk} && vega sdk use ${toolchain.vegaSdk}`,
  });
  checks.push({
    name: 'Vega Virtual Device (simulator)',
    ok: capture('vega', ['which', 'virtualdevice'], {env: vegaEnv()}).ok,
    fix: `reinstall the SDK: vega sdk install ${toolchain.vegaSdk}`,
  });
  const devices = capture('vega', ['device', 'list'], {env: vegaEnv()}).stdout;
  const deviceLines = devices.split('\n').filter(l => / : /.test(l));
  checks.push({
    name: 'Connected device or running simulator',
    ok: deviceLines.length > 0,
    optional: true,
    detail: deviceLines.length ? deviceLines.map(l => l.trim()).join('; ') : 'none (pnpm tv:sim starts the simulator for you)',
  });
  return checks;
}

function agentContextChecks(): Check[] {
  const toolchain = readToolchain();
  const mcpPath = path.join(repoRoot, '.mcp.json');
  const mcp = existsSync(mcpPath) ? readFileSync(mcpPath, 'utf8') : '';
  const skillsDir = path.join(repoRoot, '.claude', 'skills');
  const skills = existsSync(skillsDir) ? readdirSync(skillsDir).filter(d => d.startsWith('amazon-devices-')) : [];
  const restore = 'restore it from git: git checkout -- <path>';
  return [
    {
      name: `.mcp.json pins ADBT ${toolchain.adbt}`,
      ok: mcp.includes(`amazon-devices-buildertools-mcp@${toolchain.adbt}`),
      detail: mcp ? undefined : 'missing',
      fix: `set the ADBT package in .mcp.json to @amazon-devices/amazon-devices-buildertools-mcp@${toolchain.adbt}`,
    },
    {name: '.adbt-config.json', ok: existsSync(path.join(repoRoot, '.adbt-config.json')), fix: restore},
    {
      name: 'ADBT steering doc (docs/agent/adbt-steering.md)',
      ok: existsSync(path.join(repoRoot, 'docs', 'agent', 'adbt-steering.md')),
      fix: restore,
    },
    {name: 'ADBT skills (.claude/skills)', ok: skills.length > 0, detail: `${skills.length} skills`, fix: restore},
  ];
}

function awsChecks(): Check[] {
  const needed = 'needed for `pnpm aws:deploy` only — the app runs without AWS in demo/mock mode';
  const cli = capture('aws', ['--version']);
  const checks: Check[] = [
    {
      name: '.env',
      ok: existsSync(path.join(repoRoot, '.env')),
      optional: true,
      fix: 'pnpm bootstrap   (copies .env.example to .env)',
    },
    {
      name: 'AWS CLI',
      ok: cli.ok,
      optional: true,
      detail: cli.ok ? cli.stdout.trim().split(' ')[0] : needed,
      fix: 'https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html',
    },
  ];
  if (cli.ok) {
    const identity = capture('aws', ['sts', 'get-caller-identity', '--query', 'Account', '--output', 'text']);
    checks.push({
      name: 'AWS credentials',
      ok: identity.ok,
      optional: true,
      detail: identity.ok ? `account ${identity.stdout.trim()}` : needed,
      fix: 'aws configure sso   (or set AWS_PROFILE in .env)',
    });
  }
  return checks;
}

function print(section: string, checks: Check[]): boolean {
  console.log(`\n${section}`);
  let ok = true;
  for (const c of checks) {
    const icon = c.ok ? '✅' : c.optional ? '⚠️ ' : '❌';
    console.log(`  ${icon} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
    if (!c.ok && c.fix) {
      console.log(`       fix: ${c.fix}`);
    }
    if (!c.ok && !c.optional) {
      ok = false;
    }
  }
  return ok;
}

/** Prints all checks; returns false if any required check failed. */
export function preflight(): boolean {
  const results = [
    print('Toolchain', toolchainChecks()),
    print('Vega (Fire TV)', vegaChecks()),
    print('Agent context (ADBT + Claude Code)', agentContextChecks()),
    print('AWS (optional)', awsChecks()),
  ];
  const ok = results.every(Boolean);
  console.log(ok ? '\nAll required checks passed.\n' : '\nSome required checks failed — see the fixes above.\n');
  return ok;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(preflight() ? 0 : 1);
}

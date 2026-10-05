// `pnpm tv:sim` / `pnpm tv:device`: build the TV app, install it, and launch it.
// Usage: node scripts/tv.ts <sim|device> [--release]
import path from 'node:path';
import {capture, repoRoot, run, vegaEnv, vegaVersion} from './lib/util.ts';

const target = process.argv[2];
const buildType = process.argv.includes('--release') ? 'Release' : 'Debug';
if (target !== 'sim' && target !== 'device') {
  console.error('Usage: node scripts/tv.ts <sim|device> [--release]');
  process.exit(2);
}
if (!vegaVersion()) {
  console.error('Vega CLI not found. Run `pnpm preflight` for setup instructions.');
  process.exit(1);
}

const env = vegaEnv();
const tvDir = path.join(repoRoot, 'apps', 'tv');

/** Serials from `vega device list`, e.g. "VirtualDevice : tv - aarch64 - OS - …" -> "VirtualDevice". */
function listDevices(): {serial: string; virtual: boolean}[] {
  return capture('vega', ['device', 'list'], {env})
    .stdout.split('\n')
    .filter(line => / : /.test(line))
    .map(line => {
      const serial = line.split(' : ')[0].trim();
      return {serial, virtual: serial === 'VirtualDevice' || serial === 'Simulator'};
    });
}

let serial: string;
if (target === 'sim') {
  if (!listDevices().some(d => d.virtual)) {
    run('vega', ['virtual-device', 'start', '--timeout', '300'], {env});
  }
  const sim = listDevices().find(d => d.virtual);
  if (!sim) {
    console.error('The Vega Virtual Device did not come up. Check `vega virtual-device status`.');
    process.exit(1);
  }
  serial = sim.serial;
} else {
  const physical = listDevices().filter(d => !d.virtual);
  if (physical.length === 0) {
    console.error(
      'No physical Fire TV found. Enable Developer Mode on the device (`vega devmode --help`),\n' +
        'connect it, then check `vega device list`.',
    );
    process.exit(1);
  }
  if (physical.length > 1) {
    console.log(`Several devices connected; using ${physical[0].serial}.`);
  }
  serial = physical[0].serial;
}

run('pnpm', ['--filter', '@nightlight/tv', 'run', buildType === 'Release' ? 'build:release' : 'build:debug'], {env});
run('vega', ['device', 'install-app', '--dir', tvDir, '-b', buildType, '-d', serial], {env});
run('vega', ['device', 'launch-app', '--dir', tvDir, '-d', serial], {env});
console.log(`\n✔ Nightlight (${buildType}) is running on ${serial}.`);

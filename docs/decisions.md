# Decisions

Record of platform and architecture decisions, including any place where ADBT guidance overrides `PLAN.md`.

---

## D-001 · Toolchain pins (2026-10-05)
- **Node 24 LTS** (24.21.0 at time of writing). The ADBT docs warn about SQLite3 errors on Node 26.
- **ADBT `@amazon-devices/amazon-devices-buildertools-mcp@1.0.15`**, pinned exactly in `.mcp.json` and scripts (never `@latest`). See friction F-001.
- **Vega SDK 0.24.12112 / Vega CLI 1.4.2** (installed via `get_vvm.sh`, 2026-10-05). This meets ADBT's 0.22+ requirement. All pins live in `toolchain.json`.

## D-003 · TV app scaffold (2026-10-05)
- Generated with `vega project generate --template helloWorld` (React Native 0.83, `@amazon-devices/react-native-kepler` ~4.0.0) into `apps/tv`. App ID `com.nightlight.tv`, component `com.nightlight.tv.main`.
- `helloWorld-rn72` (RN 0.72) is also offered. We chose 0.83 because it's the current template and ADBT's DevTools workflow targets RN 0.83+.
- The template uses npm with caret ranges. Pinning exact versions and the pnpm move are done in the reproducibility step, after checking that the Vega RN build works under pnpm.

## D-002 · Host OS support for the Vega SDK (2026-10-05)
- Per ADBT `vega_sdk_installation.md`: **macOS 10.15+ or Ubuntu 20.04+**. Windows is not listed, so the team's Windows machines need **WSL2 Ubuntu**. This still has to be verified end to end, including simulator support under WSL2, before the README documents it.
- On Apple Silicon Macs, Rosetta is required. Homebrew packages needed: binutils, coreutils, gawk, findutils, grep, jq, lz4, gnu-sed, watchman.

## Open questions (PLAN.md §13)
1. Vega OS vs Fire OS: decide by end of Oct 6 once the simulator runs.
2. Audio playback and key-event modules on Vega RN: to look up via ADBT.
3. Nova Canvas conditioning mode: Phase 0 spike.
4. Bedrock region with all needed models: to check.
5. Physical Fire TV device available? Ask the team.

## D-004 · pnpm 12 workspace with a hoisted node_modules (2026-10-05)
- **pnpm 12.9.1 via Corepack** (`packageManager` field). Workspaces: `apps/*`, `packages/*`.
- **`nodeLinker: hoisted`** in `pnpm-workspace.yaml`. Metro and the Vega build expect a flat npm-style `node_modules`. pnpm 12 **ignores** pnpm settings in `.npmrc` (F-010), so all settings live in `pnpm-workspace.yaml`.
- `apps/tv/metro.config.js` adds the workspace root to `watchFolders` and `nodeModulesPaths`. Without it Metro can't resolve `react-native` (F-011).
- Verified 2026-10-05: Debug build → install → launch on the VVD works under pnpm, both through `pnpm tv:sim` and from a cold simulator start.
- **Open risk:** the Vega build reports "autolinking on 0 qualified npm packages". Once we add Vega native/turbo-module packages, confirm autolinking still finds them in the hoisted root `node_modules`.

## D-005 · Script names differ from PLAN.md (2026-10-05)
PLAN.md §0.2 names `pnpm setup`, `pnpm doctor` and `pnpm deploy`, but all three are **pnpm built-in commands** that take precedence over package scripts (`pnpm setup` edits the shell profile). Renamed:
| PLAN.md | Actual |
|---|---|
| `pnpm setup` | `pnpm bootstrap` |
| `pnpm doctor` | `pnpm preflight` |
| `pnpm deploy` / `pnpm destroy` | `pnpm aws:deploy` / `pnpm aws:destroy` (with the CDK app) |

## D-006 · Repo scripts run on Node 24 directly, no tsx (2026-10-05)
Node 24 strips TypeScript types natively, so `node scripts/x.ts` works with zero dependencies. That lets `pnpm bootstrap` run on a fresh clone *before* `pnpm install`. Constraints: erasable syntax only (enforced by `erasableSyntaxOnly`) and `.ts` extensions in relative imports. `tsc -p scripts` typechecks them as part of `pnpm check`.

## D-007 · Agent context is committed, not generated (2026-10-05)
`init-context` writes user-global state (F-001, F-002), so the repo commits its outputs instead:
- `.mcp.json`: ADBT pinned to 1.0.15 (project scope, which overrides the unpinned user-scope entry).
- `.adbt-config.json`: `platform.default = vega_os`.
- `docs/agent/adbt-steering.md`: the steering doc `init-context` wrote to `CLAUDE.md`, moved and imported from a short project `CLAUDE.md` via `@docs/agent/adbt-steering.md`. Side effect: ADBT `check-status` may no longer detect the context document, since it looks at `CLAUDE.md`.
- `.claude/skills/amazon-devices-vega-*`: the 17 Vega skills. Not committed: the 2 Android-only skills and the third-party community skill.
`pnpm bootstrap` doesn't re-run `init-context`; `pnpm preflight` checks that these files exist.

## D-008 · CI scope (2026-10-05)
GitHub Actions runs `pnpm install --frozen-lockfile && pnpm check` on Ubuntu and Windows. A Vega package build in CI is **not set up yet**: the SDK installer (`get_vvm.sh`) is interactive, and a headless install still needs investigating.

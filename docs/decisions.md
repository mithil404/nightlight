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
2. ~~Audio playback and key-event modules on Vega RN~~: key events answered in D-009. Audio: per the ADBT docs, use the `AudioPlayer` class from `@amazon-devices/react-native-w3cmedia` (HTMLAudioElement API, MP3, can prebuffer before play). Not tried yet; Phase 1.
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

## D-009 · Remote input and networking on the VVD, measured (2026-10-05)
Measured with a throwaway build that pinged the mock server for every event, read from the server log (the VVD can't take screenshots, F-008). Setup: SDK 0.24.12112, `@amazon-devices/react-native-kepler` 4.0.1, VVD OS 1.2, keys sent with `inputd-cli button_press`.
- **Select → `onPress` works** on `Pressable`. It fires on key-up. A community bug report (SDK 0.24.9914 / kepler 4.0.0) says `onPress` never fires; that's not the case on our versions, at least on the VVD. **Still to verify on a physical device**: the same thread says even `useTVEventHandler` missed Select there.
- **`useTVEventHandler` receives every key** as raw OS 1.2 names, with `eventKeyAction` 0 = down and 1 = up:
  | Remote key | `eventType` seen | Normalized name (future OS, per Amazon on the forum) |
  |---|---|---|
  | D-pad right | `right` | `right` |
  | Select | `enter` | `select` |
  | Play/Pause | `play` | (`playpause`?) |
  | Fast forward | `forward` | `skip_forward` |
  | Back | `back` | `back` |
  **Rule:** every key switch must match both the raw and the normalized names, and act on key-down only (`eventKeyAction === 0`).
- **Back exits the app by default.** The player and wizard must handle Back themselves (PLAN.md §8: "Back always works", meaning go to the previous step, not exit).
- **HTTP to the host works** through reverse port forwarding: the app fetches `http://localhost:8787` (plain HTTP, no manifest privilege or cleartext policy needed for RN `fetch`). `pnpm tv:sim` sets up the forward; `pnpm mock` serves the API on that port.

## D-010 · The TV app is a static showcase; no A/V generation (2026-10-05)
**Decision (user):** build the app as a static showcase instead of a live audio/visual generation pipeline, **for now**. Hackathon AWS credits were requested on 2026-10-05. Once they arrive, the AI features (Bedrock story text, Nova Canvas illustrations, Polly narration, drawing → hero) are layered back on top of the showcase. Until then:
- **No backend calls in the app.** Stories, heroes, worlds and the library are bundled data (`apps/tv/src/data/showcase.ts`), all original. `pnpm mock`, `packages/shared` and the AWS plan stay in the repo for a possible later live mode, but the showcase doesn't depend on them.
- **Illustrations are drawn in code** (`SceneArt`, `HeroAvatar`: layered shapes). The world sets the palette and the art style sets outline and softness. No generated images, no third-party art.
- **No narration audio.** A reading clock paced like a bedtime reader (2.6 words/s, slowing to 80% as energy falls, per PLAN.md §6.2) drives the caption highlight and page turns.
- **"Draw your own"** shows the pairing screen with a decorative QR. "Use the sample drawing" stands in for the phone upload, and the character card then shows drawing → storybook hero.
- **Still demonstrated:** the D-pad-only wizard, choice point with a 20 s auto-pick, Ken Burns pan/zoom, wind-down (warm tint + dimming + slower pace), goodnight → night-light sleep screen with timer, library/series, parent PIN, lesson whitelist and caption toggle.

**Navigation:** a minimal in-app screen stack (`navigation/router.tsx`) with one `BackHandler`, not `@amazon-devices/react-navigation`. With 8 screens and no deep links, the native navigation modules (and the RN 0.83 native-library crash risk reported on the forum) aren't worth it. Screens take over Back with `useBackOverride` (the wizard steps back). Child effects run before parent effects, so per-screen `BackHandler` registrations would fire in the wrong order.

**Verified on the VVD (2026-10-05):** full flows driven by `inputd-cli` (wizard → player → choice → page turns → sleep → Back; drawing → character card → accept; PIN; library). The app stayed in the foreground throughout, with no JS errors in `loggingctl`.

**Open risk for a future audio build:** on the VVD the platform logs `Unable connect to 'com.amazon.audio.system'` (from UISoundManager). Check that `AudioPlayer` works on the VVD before relying on it.

# Handoff: Nightlight (state as of 2026-10-07)

Context for an AI agent picking up this repo mid-project. Read this first, then `CLAUDE.md` (conventions and commands), `docs/decisions.md` (D-001…D-010, the *why* behind everything) and `docs/friction-log.md` (F-001…F-017). `PLAN.md` is the original plan. It is **partly out of date**: see "Scope right now" below.

---

## 1. What this is

Nightlight is a Fire TV (Vega OS, React Native for Vega) bedtime-story app for the Amazon Developer Hackathon 2026, Fire TV track. Repo: https://github.com/mithil404/nightlight (public, MIT, branch `main`).

**Deadlines:** submission Oct 23 2026 12:00 PT. Internal target: **Oct 22 EOD**. The submission needs a public repo, a demo video under 3 minutes, a text description, product feedback on every tool used, and the friction log (worth up to +10%).

## 2. Scope right now (important)

- The TV app is a **static showcase** (decision D-010, made by the user). It covers the full product flow on bundled original content, with **no backend, no AI, no network calls**: illustrations are drawn in code from shapes, and a reading clock replaces narration audio.
- **This is interim.** The user applied for hackathon AWS credits on 2026-10-05 and is waiting for them. When they arrive, the AI features from PLAN.md go back in *on top of* the showcase: Bedrock story text, Nova Canvas illustrations, Polly narration, and the drawing → hero vision step.
- **Don't do anything that spends AWS money** (deploys, Bedrock/Polly calls, the image-consistency spike) until the user says the credits have arrived.
- Timing risk: wiring the live features needs about a week. If the credits arrive after ~Oct 14, cut scope (e.g. illustrations and narration only).

## 3. Repo map

```
apps/tv/                    Vega RN 0.83 app (@nightlight/tv, app id com.nightlight.tv)
  src/App.tsx               providers + route switch
  src/navigation/router.tsx minimal screen stack, ONE BackHandler, useBackOverride(), popTo()
  src/state.tsx             in-memory household state (listener, drawn hero, captions, allowed lessons)
  src/data/showcase.ts      ALL content: heroes, worlds, art styles, lessons, story script, library
  src/theme.ts              1920x1080 design grid scaled via s(px); night palette; focusRing
  src/input/remote.ts       remoteKey(): raw OS 1.2 + normalized key names → logical keys
  src/components/           FocusTile, Screen, HeroAvatar (shape character), SceneArt (shape illustration)
  src/player/               narration.ts (pure timing), KenBurns, CaptionBar, ChoiceOverlay, WindDownOverlay
  src/screens/              Home, Wizard, Pairing, CharacterCard, Player, Sleep, Library, Parent
  test/                     App.spec.tsx (flows, Back, player), logic.spec.ts, setup.ts + mocks/BackHandler.ts
packages/shared/            API + WebSocket event types (PLAN.md §7). Not used by the showcase yet.
scripts/                    bootstrap, preflight, tv (sim|device), mock. Plain Node 24, no tsx.
docs/                       decisions.md, friction-log.md, agent/adbt-steering.md, agent/HANDOFF.md
.claude/skills/             17 committed ADBT Vega skills
.mcp.json                   ADBT MCP pinned to 1.0.15
.adbt-config.json           {"platform":{"default":"vega_os"}}
toolchain.json              node 24 / vegaSdk 0.24.12112 / vegaCli 1.4.2 / adbt 1.0.15
```

## 4. Environment on the user's Mac (macOS 26, Apple Silicon)

- **Node:** the nvm *default* is still 26.5. Every shell command must start with `source ~/.nvm/nvm.sh && nvm use 24 >/dev/null;`. Node 24.21.0 is installed.
- **pnpm 12.9.1** via Corepack (enabled under Node 24).
- **Vega SDK 0.24.12112 / CLI 1.4.2** is installed. `~/vega/env` is sourced in `~/.zshrc`; in tool shells, `source ~/vega/env` (the repo scripts add `~/vega/bin` to PATH themselves).
- **Vega Virtual Device (VVD):** `vega virtual-device start|status|stop`. In `vega device list` it appears as `VirtualDevice`; for `vda -s`, the serial is `emulator-5554`.
- **No physical Fire TV** has been connected so far. **No AWS CLI** is installed.
- `gh` is authenticated as the repo owner. Homebrew packages for the SDK are installed.
- `pnpm preflight` checks all of the above.

## 5. How to verify work (no screenshots available)

- `pnpm check`: lint + typecheck + 14 jest tests. Must pass; CI runs it on `ubuntu-24.04` and `windows-2025`.
- `pnpm tv:sim`: builds Debug, starts the VVD if needed, sets up reverse port-forward 8787, installs and launches. Check for `✔ Nightlight (Debug) is running on VirtualDevice.`
- **The VVD can't take screenshots** (F-008). Verify by:
  - driving keys: `vega exec vda -s emulator-5554 shell "inputd-cli button_press KEY_ENTER"` (KEY_UP/DOWN/LEFT/RIGHT/BACK/PLAYPAUSE/FASTFORWARD…);
  - checking the app is alive: `vega device running-apps | grep nightlight`;
  - reading logs: `vega exec vda -s emulator-5554 shell "loggingctl log -v com.nightlight.tv -p err -p warning -S '<YYYY-MM-DD HH:MM:SS>'"`. Ignore platform noise (`GWSI_LOG … MAC Address`, UISoundManager `com.amazon.audio.system` IPC errors). JS errors show as `[KeplerScript-JavaScript]`.
  - **Probe trick** (used in D-009): temporarily make the app `fetch('http://localhost:8787/v1/health?probe=<tag>')` while `pnpm mock` runs, then read which events fired from the mock's request log. Revert afterwards.
- **The UI has never been checked visually.** Ask the user to look at the VVD window, or to grant the terminal Screen Recording permission so `screencapture` works. Possible problems: non-ASCII glyphs (→ … · curly quotes) may not render in the Vega font, and layout scaling at the VVD's resolution is unverified.

## 6. Gotchas already paid for (don't relearn them)

- `pnpm setup` / `doctor` / `deploy` are **pnpm built-ins**, so ours are `bootstrap` / `preflight` / `aws:deploy` (D-005). `aws:deploy` doesn't exist yet.
- pnpm 12 **ignores pnpm settings in `.npmrc`**. They live in `pnpm-workspace.yaml` (`nodeLinker: hoisted` is required by Metro and the Vega build).
- `apps/tv/metro.config.js` must keep the workspace root in `watchFolders` and `nodeModulesPaths`.
- **Open risk:** Vega autolinking with the hoisted `node_modules` hasn't been tested with a native/turbo-module package yet. Test it when the first one is added (e.g. `@amazon-devices/react-native-w3cmedia`).
- **Remote keys:** OS 1.2 sends raw names (`enter`, `play`, `forward`), so always go through `remoteKey()` and act on key-down. Select *does* fire `onPress` on the VVD (on key-up). It's unverified on a physical device, where a forum thread says it fails.
- **Back exits the app** unless handled. Use the router's single BackHandler and `useBackOverride` in screens; don't register `BackHandler` per screen (child effects run first, so the order would be wrong).
- **Jest:** the Kepler preset's BackHandler mock is broken (F-015). `test/setup.ts` mocks both `.../BackHandler` and `.../BackHandler.kepler`, and exposes `mockPressBack()`. Countdown timers that re-arm per render need one `act()` per second under fake timers.
- **Animations:** use `useNativeDriver: true` (transform/opacity only) and **stop animations in effect cleanup**. Otherwise the native warning `[AnimatedNode] … released parent` appears.
- Avoid nested `<Text>` (the template flags it as unreliable). Captions use one `<Text>` per word.
- **ADBT MCP:** call `set_project_context({config: {platform: {default: "vega_os"}, project: {identifier: "nightlight"}}})` once per session before any other ADBT call. `list_documents`/`search_documentation` need `target_platform: {device_os: ["vega_os"]}`; `read_document` takes only `document_uri`. The ADBT steering doc's "feedback banner" rule only applies to the first message of a brand-new session.
- **Audio risk for later:** the VVD logs that it can't connect to `com.amazon.audio.system`. Prove `AudioPlayer` (`@amazon-devices/react-native-w3cmedia`) works on the VVD before building narration on it.

## 7. User preferences

- **Never add a `Co-Authored-By: Claude…` trailer** (or any Claude attribution) to commits.
- Commits go straight to `main` and get pushed, with CI watched (`gh run watch`). This has been the working pattern; confirm before anything outward-facing beyond that.
- Keep the user updated with concise findings. They decide scope (e.g. the static showcase, AWS timing).
- Log friction **as it happens**. It's a judged deliverable.

## 8. Uncommitted change at handoff

- `docs/decisions.md`: D-010 reworded to say the static showcase is interim until the AWS credits arrive. Commit it with the next change.
- This file (`docs/agent/HANDOFF.md`) is new.

## 9. Next steps (proposed to the user, awaiting a go-ahead)

Credit-free prep, so the live features become a data change rather than a UI rewrite:
1. **Data-source seam:** put story content behind an interface built on `packages/shared` types, with three implementations: static (today), `pnpm mock` (fixture story over HTTP), and the live API later. The player uses `imageUrl`/`audioUrl` when present and falls back to `SceneArt` and the reading clock otherwise.
2. **Audio de-risk:** a minimal `AudioPlayer` test on the VVD with a generated (original) tone, checking playback events through the probe trick.
3. **AWS groundwork (free):** after the user installs the AWS CLI and credentials: request Bedrock model access (Claude + Nova Canvas), pick a region, write a CDK skeleton (`cdk synth` in `pnpm check`, no deploy), and put model/voice IDs in `packages/shared/src/models.ts` (use the claude-api skill for current Bedrock model IDs).

Needed either way:
4. A visual check of every screen (needs the user's eyes or Screen Recording permission), then a polish pass.
5. An original **app icon and banner** (the manifest build warns that no icon is set). Look up icon specs with ADBT.
6. A **physical Fire TV** test, especially Select → `onPress` (`pnpm tv:device`, never run yet).
7. Update `PLAN.md` to match the showcase-then-AI scope (the D-005 renames, D-010).
8. `docs/product-feedback.md` (not started): for each tool (Vega SDK, VVD, RN for Vega, ADBT, Vega CLI, later the AWS services): what worked, what didn't, onboarding, would-build-again.
9. A fresh-clone acceptance test on a clean machine or WSL2. The WSL2/Windows path is untested (the Vega SDK supports macOS and Ubuntu only).
10. Demo video script rewrite, README final pass, Devpost submission (Fire TV track + Open Source; + AWS Builder if the live AI ships).

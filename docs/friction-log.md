# Friction Log

Each entry: what we tried, what we expected, what happened, severity (Critical / Important / Minor), workaround.

---

## 2026-10-05 — ADBT setup (Phase 0)

Environment: macOS 26.6.2 (Apple Silicon), Node 24.21.0 via nvm, ADBT 1.0.15, agent = Claude Code.

### F-001 · `init-context` registers the MCP server user-globally and unpinned · Important
- **Tried:** `npx -y @amazon-devices/amazon-devices-buildertools-mcp@1.0.15 init-context --agent claude-code-cli --force` from the project directory.
- **Expected:** a project-scoped MCP config (e.g. `.mcp.json`) that uses the version we ran.
- **Actual:** the server was written to the **user-global** `~/.claude.json` `mcpServers` with `@latest`, even though we invoked an exact version. Teammates get whatever version is current when their agent starts, so tool behavior can drift mid-hackathon.
- **Workaround:** commit a project-scoped `.mcp.json` that pins the exact version; don't rely on the global entry.

### F-002 · Skills install into user-global `~/.claude/skills`, plus a third-party skill from GitHub · Important
- **Tried:** same `init-context` run.
- **Expected:** skills in the workspace (`.claude/skills/`) so they can be committed alongside the project.
- **Actual:** 19 curated skills went to `~/.claude/skills/`, and a "community" skill (`vega-multi-tv-migration`) was cloned from `github.com/AmazonAppDev/devices-agent-skills` via the `skills` CLI into `~/.agents/skills/` and copied to `~/.claude/skills/`. There was no prompt or flag to opt out, and it also wrote `~/.agents/.skill-lock.json`. A fresh clone does not reproduce this agent context.
- **Workaround:** copy the needed skills into the repo's `.claude/skills/` and commit them; document the global side effects in the README.

### F-003 · `exec` CLI help omits the required `target_platform` argument shape · Minor
- **Tried:** `exec list_documents --args '{"documentType":"WORKFLOW"}'`, as shown in the tool's own example (`--args '{}'`).
- **Expected:** works, since `target_platform` isn't shown in the example.
- **Actual:** `Schema validation failed: data must have required property 'target_platform'`. Passing a string gave `must be object`. The help only says "object … with device_os array", with no example. `read_document`, by contrast, *rejects* `target_platform` ("must NOT have additional properties").
- **Workaround:** `--args '{"target_platform":{"device_os":["vega"]}}'` for `list_documents`; `{"document_uri":"<name>.md"}` only for `read_document`.

### F-004 · `init-context` overwrites the project `CLAUDE.md` with a ~200-line steering doc · Minor
- **Tried:** `init-context --force` in a repo where we planned to own `CLAUDE.md`.
- **Actual:** `CLAUDE.md` became the ADBT steering doc, which includes a "MANDATORY RULE" telling the agent to print a feedback banner as the first line of every session. That's noisy, and it competes with project instructions.
- **Workaround:** move the steering doc to a separate committed file and reference it from a short project `CLAUDE.md` (to do in the reproducibility step).

### F-005 · Node 26 is the default on fresh machines; ADBT recommends Node 24 · Minor
- **Tried:** running ADBT on the machine's existing Node 26.5.0.
- **Actual:** the ADBT docs warn of SQLite3 errors on Node 26. Node 25+ also no longer bundles Corepack, so `pnpm` via Corepack isn't available out of the box.
- **Workaround:** `nvm install 24` and pin it in `.nvmrc` / `.node-version`.

---

## 2026-10-05 — Vega SDK, scaffold, simulator (Phase 0)

Environment: Vega SDK 0.24.12112, Vega CLI 1.4.2, Vega Virtual Device (aarch64).

### F-006 · SDK install itself was smooth · (positive note)
- `get_vvm.sh` installed SDK 0.24.12112 and added `source ~/vega/env` to `~/.zshrc`. The helloWorld template built Debug packages for aarch64, armv7 and x86_64 on the first try. The VVD booted in under a minute, and `install-app` / `launch-app` worked first time.

### F-007 · `vega project generate` writes into the output dir itself, not a `<name>/` subfolder · Minor
- **Tried:** `vega project generate --template helloWorld --name Nightlight --packageId com.nightlight.tv` from `apps/`.
- **Expected:** `apps/Nightlight/…`, like most scaffolders (`create-react-app`, `npx react-native init`).
- **Actual:** the template files were spilled directly into `apps/`. The help's example ("in the current directory") hints at this, but it's easy to miss.
- **Workaround:** create the target dir first and pass `-o apps/tv`.

### F-008 · No way to take a screenshot of the Vega Virtual Device · Important
- **Tried:** (1) `vega device --help`: no screenshot command. (2) `vega exec vda shell gwsi-tool-screenshooter /tmp/x.png`, as recommended on the community forum: hangs and leaves a 0-byte file. (3) `screenshooter`: `creating a buffer file for 8294400 B failed: Permission denied` (the shell runs as `app_user`), still failing with `XDG_RUNTIME_DIR=/tmp WAYLAND_DISPLAY=/run/display/wayland-0`.
- **Expected:** a one-line CLI screenshot (like `adb exec-out screencap`) for docs, bug reports, and agent-driven visual checks.
- **Actual:** no supported path on the VVD. The forum points at Appium, which needs Node ≤ 22 and is reported flaky on the VVD.
- **Workaround:** capture the VVD window on the host (macOS needs Screen Recording permission for the terminal), or verify by eye.
- **Feature request:** `vega device screenshot [--out file.png]` that works on both the VVD and physical devices.

### F-009 · ADBT MCP refuses every call until `set_project_context`, but `init-context` doesn't create `.adbt-config.json` · Minor
- **Actual:** the first `read_document` call returned `PROJECT_CONTEXT_REQUIRED`. The steering doc describes the config file, but `init-context` never offers to create it, even though it knows the target platform.
- **Workaround:** commit `.adbt-config.json` with `{"platform":{"default":"vega_os"}}`.

---

## 2026-10-05 — pnpm monorepo (Phase 0)

### F-010 · pnpm 12 silently ignores `node-linker` in `.npmrc` · Minor (pnpm, not Vega)
- **Tried:** the widely documented React Native + pnpm recipe, `node-linker=hoisted` in `.npmrc`.
- **Actual:** the install still produced an isolated, symlinked layout, with no warning. pnpm 12 only reads its own settings from `pnpm-workspace.yaml` (`nodeLinker: hoisted`).
- **Workaround:** put pnpm settings in `pnpm-workspace.yaml`.

### F-011 · Vega template's Metro config isn't monorepo-aware · Minor
- **Tried:** `pnpm run build:debug` for `apps/tv` inside a pnpm workspace.
- **Actual:** `Unable to resolve module react-native from apps/tv/index.js`. Metro *did* list `../../node_modules` as a search path, but files outside `watchFolders` are invisible to it.
- **Workaround:** add the workspace root to `watchFolders` and `resolver.nodeModulesPaths` in `metro.config.js`.
- **Suggestion:** a monorepo note (or a commented-out block) in the Vega `helloWorld` template.

### F-012 · Template package name and versions need hand-editing · Minor
- `vega project generate` names the package `@amazon-devices/<name>`, which squats Amazon's npm scope and becomes the vpkg path (`build/.../@amazon-devices/nightlight_aarch64.vpkg`). Dependencies use `^`/`~` ranges, even though the ADBT guide says "use exact dependency versions — Vega has strict compatibility requirements".
- **Workaround:** renamed to `@nightlight/tv` and pinned every dependency to the resolved version (`@amazon-devices/react-native-kepler` 4.0.1, etc.).

---

## 2026-10-05 — Remote input and networking (Phase 0)

### F-013 · Remote key names on Vega OS 1.2 differ from the documented/normalized names · Important
- **Tried:** `useTVEventHandler` from `@amazon-devices/react-native-kepler` (RN 0.83), with keys sent via `inputd-cli`.
- **Expected:** the names used in RN 0.72-era docs and samples (`select`, `playPause`, `fastForward` / `skip_forward`).
- **Actual:** raw names: `enter` (Select), `play` (Play/Pause), `forward` (Fast Forward). Amazon confirmed on the forum that a future OS will normalize these. A `switch` on the documented names silently does nothing: no error, the button just looks dead.
- **Workaround:** match both raw and normalized names (see D-009).
- **Feature request:** export key-name constants (or a `normalizeKey()` helper) from `react-native-kepler`, so apps don't depend on string literals that change between OS versions.

### F-014 · Conflicting signals on "Select doesn't fire onPress" (SDK 0.24 / RN 0.83) · Minor
- A detailed, still-open forum bug (Aug 2026) says Select never fires `onPress` on 0.24 / RN 0.83. On SDK 0.24.12112 + kepler 4.0.1 it **does** fire on the VVD. There's no release note or forum update saying it was fixed, so we had to build a probe to find out, which cost about 20 minutes.
- **Suggestion:** link fixes back to the bug threads and changelogs.

---

## 2026-10-05 — Showcase app build (Phase 1)

### F-015 · Kepler jest preset's `BackHandler` mock is broken · Important
- **Tried:** rendering any component that registers `BackHandler.addEventListener` in a jest test, using the template's `@amazon-devices/react-native-kepler` preset.
- **Expected:** a working mock, as stock React Native provides.
- **Actual:** `TypeError: Cannot read properties of undefined (reading 'addEventListener')`. The preset's `jest/mocks/BackHandler.js` uses `module.exports = {...}`, but `index.js` reads `require('./Libraries/Utilities/BackHandler').default`. The mock's `addEventListener` also returns `undefined`, so `subscription.remove()` would throw anyway. Mocking `.../BackHandler` alone doesn't help: with `defaultPlatform: 'kepler'`, `index.js` resolves `BackHandler.kepler.js`.
- **Workaround:** `apps/tv/test/setup.ts` mocks both `.../BackHandler` and `.../BackHandler.kepler` with a working implementation (it also enables Back-button tests).
- **Time lost:** about 15 minutes.

### F-016 · SDK typedoc says Play/Pause is `playpause`; OS 1.2 sends `play` · Minor
- `Libraries/TV/TVTypes.d.ts` documents `playpause` for the Play/Pause key, but on the VVD it arrives as `play` (D-009). Our `remoteKey()` helper accepts both.

### F-017 · Debugging on the VVD without screenshots or visible logs · Important
- With no screenshot path (F-008), we verified UI flows by sending keys with `inputd-cli` and checking `vega device running-apps` plus `loggingctl log -v <pkg> -p err -p warning`. It works, but you have to piece it together from three docs. `loggingctl` also mixes in platform noise (`GWSI_LOG ... MAC Address`, UISoundManager `com.amazon.audio.system` IPC errors) under the app's package ID, which makes it hard to spot real app errors.
- **Feature request:** `vega device logs --app <id> --js-only`, plus a screenshot command.

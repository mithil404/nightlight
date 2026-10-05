# Nightlight

An AI bedtime story studio for Fire TV. A parent and child create an illustrated, narrated bedtime story together: the child picks the hero (or draws one), the world and the art style, steers the plot with the remote, and the story slowly winds down toward sleep.

Built for the Amazon Developer Hackathon 2026 (Fire TV track) on **Vega OS** with React Native for Vega. Design and roadmap: [PLAN.md](PLAN.md).

> **Status: static showcase.** The TV app runs the full product flow on bundled, original content with no backend and no AWS: the D-pad story wizard, "draw your own" hero, the illustrated player with captions, a choice point and wind-down, the sleep screen, the library and parent settings. Illustrations are drawn in code, and a reading clock stands in for narration. See [docs/decisions.md](docs/decisions.md) D-010.

## Try it (no AWS)
```bash
pnpm bootstrap && pnpm tv:sim
```
On the simulator: **Select** on *New story*, pick through the six steps, then *Begin story*. During playback: **Left/Right** turn pages, **Play/Pause** or **Select** pauses, **Back** leaves. The parent PIN is `1234`.

## Prerequisites

| | |
|---|---|
| **OS** | macOS 10.15+ or Ubuntu 20.04+ (what the Vega SDK supports). **Windows: use WSL2 Ubuntu.** That path isn't verified yet. |
| **Node** | 24 LTS. With nvm: `nvm install && nvm use` (reads `.nvmrc`). Node 26 is known to break the ADBT MCP server. |
| **pnpm** | `corepack enable pnpm`. The exact version comes from `packageManager` in `package.json`. |
| **Vega SDK** | See below. `pnpm preflight` checks the version against `toolchain.json`. |
| **AWS** | Only needed to generate new stories (`pnpm aws:deploy`, coming in Phase 1). |

### Installing the Vega SDK (macOS)
```bash
softwareupdate --install-rosetta --agree-to-license      # Apple Silicon only
brew install binutils coreutils gawk findutils grep jq lz4 gnu-sed watchman
curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash && source ~/vega/env
vega sdk install 0.24.12112 && vega sdk use 0.24.12112   # match toolchain.json
```
The installer is interactive and takes about 5–10 minutes. It adds `source ~/vega/env` to your shell profile.

## Setup and run
```bash
pnpm bootstrap   # install deps (frozen lockfile), create .env, run preflight checks
pnpm tv:sim      # build, start the Vega Virtual Device if needed, install and launch
```

## Commands
| Command | Does |
|---|---|
| `pnpm bootstrap` | `pnpm install --frozen-lockfile`, creates `.env` from `.env.example`, runs `preflight` |
| `pnpm preflight` | Checks Node, pnpm, Vega SDK + simulator, agent context and (optionally) AWS. Prints a fix for every ❌. |
| `pnpm tv:sim` | Builds the TV app (Debug), starts the simulator if it isn't running, installs and launches. Add `--release` for a Release build. |
| `pnpm tv:device` | Same, on a connected Fire TV with Developer Mode enabled |
| `pnpm mock` | Local mock API on port 8787. `tv:sim` / `tv:device` forward it to the TV, where the app reaches it as `http://localhost:8787`. |
| `pnpm check` | lint + typecheck + tests (what CI runs on Ubuntu and Windows) |

Why not `pnpm setup` / `pnpm doctor` / `pnpm deploy`? Those are built-in pnpm commands (`pnpm setup` even edits your shell profile), so a script with the same name would never run.

## Repo layout
```
apps/tv            Vega OS React Native app (RN 0.83): static showcase
packages/shared    API + realtime event types shared by tv / companion / api
scripts            preflight, bootstrap, tv: TypeScript run directly by Node 24
docs               decisions.md, friction-log.md, agent/ (ADBT steering doc)
.claude/skills     ADBT agent skills (committed copies)
.mcp.json          ADBT MCP server, pinned version
toolchain.json     pinned Node / Vega SDK / Vega CLI / ADBT versions
```

## AI agent context
The repo includes everything an AI coding agent needs for Vega work: `.mcp.json` (ADBT MCP server, pinned), `.adbt-config.json`, `CLAUDE.md`, the ADBT steering doc and skills. Claude Code asks you to approve the project MCP server the first time.

Note: running ADBT's own `init-context` also writes **outside the repo**. It registers the MCP server (unpinned) in `~/.claude.json`, installs skills into `~/.claude/skills`, and clones a community skill into `~/.agents/skills`. You don't need to run it; the committed copies are enough.

## License
[MIT](LICENSE)

# Nightlight — AI Bedtime Story Studio for Fire TV

> Build plan for the Amazon Developer Hackathon 2026 ("Build, Ship, Shape"), **Fire TV track**.
> This document is written to be handed to an implementation agent that has the Fire TV / Vega SDK MCP.
> "Nightlight" is a working name.

---

## 0. Instructions for the implementing agent

### 0.1 Tooling: Amazon Devices Builder Tools (ADBT)
ADBT (https://developer.amazon.com/docs/adbt/get-started) is the Fire TV/Vega SDK MCP. It installs three things: an **MCP server** (`@amazon-devices/amazon-devices-buildertools-mcp`), **Agent Skills**, and **steering documents**. Full support requires **Vega SDK v0.22+**; Fire OS support is limited, which is one more reason to build on Vega.

- Setup (Node 18+; use Node 24 if Node 26 gives SQLite3 errors):
  `npx -y @amazon-devices/amazon-devices-buildertools-mcp@latest init-context --agent <agent-name> --force`
- Check the setup: `npx -y @amazon-devices/amazon-devices-buildertools-mcp@latest check-status`, then ask the agent to "List the tools provided by Amazon Devices Builder Tools and Agent Skills".
- MCP tools and when to use them:
  | Tool | Use it for |
  |---|---|
  | `search_documentation`, `list_documents`, `read_document` | **Before writing any Vega-specific code** (project scaffold, focus/D-pad handling, key events, audio/media playback, image components, animations, network/WebSocket, storage, packaging, simulator and device deploy) |
  | `read_asset` | Sample code and templates from the docs |
  | `analyze_perfetto_traces`, `get_app_hot_functions` | Phase 4 performance work: player animation fps, startup time, wizard focus lag |
  | `symbolicate_acr` | Turning crash reports from the simulator or device into readable stack traces |
- Also follow the Agent Skills and steering docs installed by `init-context` (project setup, feature integration, testing). Where they conflict with this plan on platform specifics, **ADBT wins**; log the conflict in `docs/decisions.md`.
- ADBT is itself a tool to cover in `docs/product-feedback.md` and the friction log. Note setup problems, missing docs, and incorrect skill guidance.

### 0.2 Reproducibility: hard requirement
A teammate or judge on any machine must be able to go from `git clone` to a running app with **one setup command plus documented prerequisites**. If a step works only on your machine, treat it as a bug.

**Version pinning**
- Node: `.nvmrc` + `.node-version` (Node 24 LTS) and `"engines"` in the root `package.json`.
- Package manager: **pnpm via Corepack**, pinned with the `"packageManager": "pnpm@<exact>"` field. Commit `pnpm-lock.yaml`. Use `pnpm install --frozen-lockfile` in setup and CI.
- Vega SDK: record the exact version in `toolchain.json` (e.g. `{ "vegaSdk": "0.22.x", "node": "24", "adbt": "<exact>" }`). The SDK can't be vendored into the repo, so the doctor script compares the installed version with this file.
- ADBT: **pin an exact npm version** in scripts and in `.mcp.json`, not `@latest`, so every agent and teammate gets the same tools.
- AWS CDK, AWS SDKs, React Native/Vega packages: exact versions (no `^`/`~`) in every `package.json`.
- Bedrock model IDs, Polly voice IDs and the AWS region live in **one** config file (`packages/shared/src/models.ts`), not scattered through the code.

**Cross-platform scripts**
- Write all repo scripts in **Node/TypeScript** (run with `tsx`), not bash or PowerShell, so they behave the same on Windows, macOS and Linux.
- `.gitattributes`: `* text=auto eol=lf`. This stops Windows checkouts from breaking scripts or snapshot tests with CRLF line endings.
- No absolute paths, usernames or home directories in committed files.
- Host OS: find out from ADBT/Vega docs which OSes the Vega SDK and simulator support, then document it in the README. If Windows isn't native, document the **WSL2 Ubuntu** path step by step and test it, since the team's machines run Windows.

**One-command workflow** (root `package.json` scripts)
| Command | Does |
|---|---|
| `pnpm doctor` | Checks Node, pnpm, Vega SDK version vs `toolchain.json`, simulator present, AWS CLI + credentials, Bedrock model access in the configured region. Prints a ✅/❌ list with a fix hint for each item. |
| `pnpm setup` | `install --frozen-lockfile` → creates `.env` from `.env.example` if missing → runs `doctor` → writes the agent context (below) |
| `pnpm deploy` | `cdk bootstrap` (if needed) + `cdk deploy` for the current `STAGE`, then **writes the stack outputs** (API URL, WebSocket URL, CloudFront domain) into `apps/tv/src/config.generated.ts` and `apps/companion/config.generated.json` (both gitignored) |
| `pnpm destroy` | Tears down the stack for the current `STAGE` |
| `pnpm tv:sim` | Builds the TV app and runs it on the Vega simulator |
| `pnpm tv:device` | Builds the app and installs it on a connected Fire TV device |
| `pnpm mock` | Starts a **local mock API + WebSocket** that serves fixture stories from `/fixtures` (no AWS needed) |
| `pnpm demo` | TV app in demo mode against bundled assets (no network needed) |
| `pnpm check` | lint + typecheck + tests + `cdk synth` |

**Run without AWS** (judges may not deploy anything)
- The TV app must run fully in **demo mode** using a pre-generated story and character **committed to the repo** (`/fixtures/demo-story/`: images, mp3s, speech marks, JSON, kept under ~30 MB).
- `pnpm mock` serves the same fixtures through the real API contract, so the app can be developed and tested without spending credits.
- The README's first section is "Try it in 2 minutes (no AWS)".

**AWS isolation per developer**
- Stack names include `STAGE` (default: the OS username, cleaned up), so teammates' deploys don't collide: `Nightlight-<stage>`.
- Credentials come from the standard AWS profile chain (`AWS_PROFILE`). Never commit keys. `.env.example` lists every variable with comments, and `.env` is gitignored.
- The doctor script checks Bedrock model access and prints the console link to enable any missing models.

**Agent context reproducibility (ADBT + Claude Code)**
- Commit a **project-scoped** `.mcp.json` that runs the pinned ADBT version through `npx`. Keep only machine-specific overrides in local, gitignored settings.
- Commit the ADBT steering docs/skills that `init-context` generates, together with `CLAUDE.md`, so a fresh clone has the same agent context. `pnpm setup` re-runs `init-context` non-interactively at the pinned version **only if** they're missing. Check whether `init-context` writes into user-global locations; if it does, document that in the README and keep repo-level copies.
- `CLAUDE.md`: a short project brief, a link to `PLAN.md`, commands from the table above, and conventions.

**Generated assets**
- Style sample tiles, fallback backgrounds and intro audio are produced by `scripts/generate-assets.ts` (costs credits) and the **outputs are committed**, so a clone never needs to regenerate them.

**CI (GitHub Actions)**
- On push/PR: on a clean Ubuntu runner, `pnpm install --frozen-lockfile` → `pnpm check`. Add a Windows runner for the scripts and tests, since that's where the team works.
- If the Vega SDK can be installed headless in CI, also build the TV app package and upload it as an artifact. If it can't, record that in the friction log.

**Acceptance test: required at the end of Phase 0 and again in Phase 5**
Clone the repo into a **fresh directory** (ideally on a second machine or a clean WSL distro). Follow only the README, then run `pnpm setup` → `pnpm demo`, and with AWS: `pnpm deploy` → `pnpm tv:sim`. Fix every manual step or undocumented assumption you hit. Record the time taken (target: under 15 minutes excluding SDK download) in the README.

### 0.3 General rules
1. **Check SDK facts with the MCP before you rely on them.** Anything in this plan about Fire TV or Vega APIs (component names, audio playback, focus management, simulator commands, packaging) is a best guess. If the MCP docs say otherwise, follow the MCP and record the difference in `docs/friction-log.md`.
2. **Platform choice:** target **Vega OS with React Native (Vega SDK)** first. If the Vega toolchain or simulator blocks progress for more than half a day, fall back to **Fire OS** (Android: either React Native or Kotlin with a WebView shell). Note the decision and the reason in `docs/decisions.md`.
3. **Keep the friction log updated as you go** (`docs/friction-log.md`). It can add up to 10% to the judging score. Each entry needs: what you tried, what you expected, what actually happened, severity (Critical/Important/Minor), and the workaround.
4. **Keep the demo path working at all times.** At the end of every phase, the app must run in the simulator and on a device, and show at least a cached story end to end.
5. **No third-party IP anywhere:** no real characters, brands or copyrighted music, in the app or in the video. Use only generated or original assets.
6. Work in the order of the phases in §9. Don't start stretch goals (§10) until Phase 4 is done.

---

## 1. Hackathon constraints (source: devpost rules)

| Item | Value |
|---|---|
| Track | Fire TV (primary). Also enter the **AWS Builder** mini challenge. Optionally the **Open Source** mini challenge (public repo with an MIT license). |
| Fire TV requirement | A demo-ready app on Fire OS or Vega OS that runs on a real device or the simulator |
| Fire TV priority areas we target | AI-enhanced viewing, **family entertainment**, **multi-modal UX**, **computer vision** |
| Judging (equal weight) | Tech Implementation · Design · Potential Impact · Quality of Idea |
| Bonus | Friction logs, up to +10% |
| Submission | Text description, GitHub repo (public, or private and shared with testing@devpost.com plus the Amazon judges), **demo video under 3 minutes** (YouTube/Vimeo, English), product feedback on every tool used |
| AWS credits request deadline | **Oct 21, 2026, 12:00 PT** |
| **Submission deadline** | **Oct 23, 2026, 12:00 PT**. Internal target: submit by **Oct 22 EOD**. |

---

## 2. Product summary

A Fire TV app where a parent and child **create an illustrated, narrated bedtime story together**. The story is personalized: the hero, setting, art style and a lesson for the night. The child steers the plot with the remote. The story deliberately **winds down** toward sleep.

### Differentiators (these are the demo moments)
1. **Drawing → hero (computer vision):** the child draws a character on paper, a parent photographs it with a phone (by scanning a QR code on the TV), and the drawing becomes the story's illustrated hero, keeping its colors and features.
2. **Choose-your-path with the remote:** 1–2 choice points per story ("Should Pip open the glowing door or follow the firefly?"), answered with the D-pad.
3. **Wind-down mode:** story energy falls page by page, narration slows, the screen gets warmer and dimmer, and the story ends with a calm "goodnight" scene and a sleep timer.
4. **Persistent series:** characters and past adventures are saved, so "Tonight: Pip's next adventure" continues the story, with recaps.
5. **Parent controls:** a lesson for the night (sharing, bravery, first day of school…), length limit, content guardrails, and a PIN-protected settings screen.

### Non-goals
- No integrations with outside streaming services or IP.
- No free-form chat with the child.
- No accounts or login for the hackathon: a device-local household ID is enough.

---

## 3. User flows

### 3.1 First run
1. Splash → "Who's listening tonight?" Create a listener profile (name, age band 3–5 / 6–8 / 9–10). Name entry uses an on-screen keyboard; also offer preset avatar picks.
2. Parent sets a 4-digit PIN (it can be skipped in demo mode).

### 3.2 Create a story (wizard, all controllable with the D-pad, about 6 steps)
1. **Hero:** pick one of the saved characters · build one from presets (animal/robot/kid/dragon…) · **"Draw your own"**, which shows a QR code → phone companion (§3.3).
2. **World:** enchanted forest · ocean · space · cozy town · cloud kingdom · "surprise me".
3. **Art style:** watercolor · paper cut-out · soft crayon · claymation-look · storybook ink. Each tile shows a pre-generated sample image.
4. **Tonight's lesson (optional):** sharing · bravery · kindness · trying new things · it's OK to feel sad · none.
5. **Length:** short (~5 min, 6 pages) · medium (~8 min, 9 pages) · long (~12 min, 12 pages).
6. **Narrator voice:** 2–4 voices.
→ "Begin story". The first page has to start playing within about 8 seconds (§6.4).

### 3.3 Phone companion (drawing capture)
- The TV shows a QR code that encodes `https://<companion-host>/c/<sessionCode>`.
- The phone web page offers: take or upload a photo → crop → "Send to TV". Optionally name the character.
- The TV gets the event over WebSocket and shows "Bringing your drawing to life…", then a **character card**: the original drawing next to the generated storybook version. Options: "Use this hero" / "Try again".

### 3.4 Story playback
- Full-screen illustration with a slow pan/zoom (Ken Burns) effect, plus narration audio and optional captions (the current word highlighted using Polly speech marks).
- Pages advance automatically when the narration ends. Right/left = next/previous page. Play/Pause = pause.
- **Choice point:** narration asks a question, and 2 large option cards appear with an image thumbnail each, plus a 20-second soft countdown that picks a default.
- **Wind-down:** a warm-tint overlay increases and brightness falls over the last third of the story. The final page is a "goodnight" scene with a music-free ambient bed (generated or CC0 audio only), then the screen fades to black or a night-light screen (a dim star field) with a sleep timer.

### 3.5 Library / series
- Home rows: "Continue a series", "Your heroes", "Past stories" (replays cached assets instantly, no regeneration).

---

## 4. Architecture

```
┌────────────────────── Fire TV (Vega OS, React Native) ──────────────────────┐
│ Screens: Home · Wizard · CharacterCard · Player · Library · ParentSettings  │
│ Services: apiClient (REST) · realtime (WebSocket) · assetCache · audioPlayer │
└───────────────┬───────────────────────────────────────┬─────────────────────┘
                │ HTTPS (REST)                          │ WSS (events)
┌───────────────▼───────────────────────────────────────▼─────────────────────┐
│ AWS: API Gateway (HTTP API + WebSocket API) → Lambda (Node 20, TypeScript)   │
│                                                                              │
│  storyOrchestrator ──► Bedrock LLM (story bible + pages, JSON output)        │
│        │          ──► Bedrock Guardrails (child-safe filter, input+output)   │
│        │          ──► Bedrock image model (Nova Canvas) for illustrations    │
│        │          ──► Amazon Polly (neural/generative voice, SSML, marks)    │
│  characterFromDrawing ──► Bedrock vision LLM → character sheet → image gen   │
│                                                                              │
│  DynamoDB: households, listeners, characters, series, stories, pages         │
│  S3 + CloudFront: images, audio, speech-mark JSON, companion web app         │
└──────────────────────────────────────────────────────────────────────────────┘
          ▲
          │ HTTPS upload (presigned S3 URL)
   Phone companion web app (static, S3+CloudFront; plain HTML/TS, no framework needed)
```

### Why this shape
- **Lambda + API Gateway** keeps it serverless, cheap, and simple to explain for the AWS Builder challenge.
- Long generation runs **asynchronously**: the API returns a `storyId` right away, and the orchestrator pushes `page.ready` events over WebSocket. The TV also polls `GET /stories/:id` as a fallback.
- **Step Functions is optional.** Start with a single orchestrator Lambda (15-minute max timeout is enough). Move to Step Functions only if fan-out gets messy.

### Model choices (check availability and IDs in the Bedrock console for your region; us-east-1 is likely the simplest)
| Job | Model | Notes |
|---|---|---|
| Story bible + page text | Claude Sonnet (latest on Bedrock) | Strict JSON output via tool use or JSON schema |
| Fast page continuation / choices | Claude Haiku 4.5 | Faster first page |
| Drawing → character sheet | Claude Sonnet (vision) | Pull out shapes, colors and distinctive features into a structured description |
| Illustrations | Amazon Nova Canvas | Use a **fixed seed per story**, style prompt prefixes, and image-conditioning/variation from the character reference image for consistency. Check which conditioning modes Nova Canvas supports. Fallback: another Bedrock image model. |
| Narration | Amazon Polly (generative or neural voices) | SSML `<prosody rate>` for wind-down; request `SpeechMarkTypes=["word"]` for caption highlighting |
| Safety | Bedrock Guardrails | Deny topics: violence, scary content above the age band, romance, real brands/people; profanity filter; PII filter on names typed by users |

---

## 5. Data model (DynamoDB, single table `nightlight`)

| PK | SK | Attributes |
|---|---|---|
| `HH#<householdId>` | `META` | pinHash, createdAt, settings {maxLength, allowedThemes, captionsDefault} |
| `HH#<householdId>` | `LISTENER#<id>` | name, ageBand, avatar |
| `HH#<householdId>` | `CHAR#<id>` | name, source (`preset`/`drawing`), sheet (JSON), refImageKey, drawingKey?, styleId |
| `HH#<householdId>` | `SERIES#<id>` | title, heroId, worldId, styleId, episodeIds[], runningSummary |
| `STORY#<id>` | `META` | householdId, seriesId?, listenerId, params, bible (JSON), status (`generating`/`ready`/`failed`), seed, createdAt |
| `STORY#<id>` | `PAGE#<nn>` | text, ssml, imageKey, audioKey, marksKey, energy (0–1), choice? {prompt, options[{label, nextBranch}]}, status |
| `SESSION#<code>` | `META` | householdId, connectionId, ttl (15 min) — companion pairing |

Asset keys in S3: `stories/<storyId>/p<nn>.png|mp3|marks.json`, `chars/<charId>/ref.png`, `uploads/<sessionCode>/<uuid>.jpg`.

**Privacy:** delete original drawing photos after 24 hours (S3 lifecycle rule) unless the parent chooses to keep them. Store no personal data beyond a first name. Say this in the README (keep COPPA in mind).

---

## 6. Generation pipeline

### 6.1 Story bible (one LLM call)
Input: listener ageBand, hero sheet, world, style, lesson, length, series runningSummary (if continuing).
Output JSON:
```json
{
  "title": "Pip and the Lantern Moon",
  "logline": "...",
  "hero": {"name": "Pip", "visualDescription": "..."},
  "supportingCast": [{"name": "...", "visualDescription": "..."}],
  "styleToken": "soft watercolor storybook illustration, warm palette, ...",
  "pages": [
    {"n": 1, "beat": "...", "energy": 0.8},
    {"n": 4, "beat": "...", "energy": 0.6, "choice": {"prompt": "...", "options": ["A ...", "B ..."]}},
    {"n": 9, "beat": "goodnight resolution", "energy": 0.1}
  ]
}
```
Rules for the prompt: energy must decrease steadily; the final 2 pages must be calm, low-stakes and sleep-themed; reading level matches the age band; the lesson is shown through the story rather than lectured; no peril above "mild" for ages 3–5.

### 6.2 Per-page generation (pipelined)
For each page: LLM page text (+ SSML) → Guardrail check → **in parallel:** image generation + Polly synthesis → upload to S3 → write `PAGE#nn` → emit `page.ready`.

- Generate **pages 1–2 first**. Start the rest right away with **concurrency 3**, staying ahead of playback.
- **Choice pages:** once the bible is ready, generate the first page of **both** branches in the background so the reply after a choice is instant. Generate the remaining pages of a branch only after it's chosen (or pre-generate both if the budget allows).
- **Image consistency:** every image prompt = `styleToken` + hero `visualDescription` + scene + "consistent character design". Use the same seed for the whole story, plus the character reference image for conditioning if supported.
- **Wind-down audio:** Polly prosody rate falls linearly from about 100% at energy 1.0 to about 80% at energy 0.1. Volume goes slightly lower too.

### 6.3 Drawing → character
1. Phone uploads to a presigned S3 URL → `POST /sessions/:code/drawing`.
2. Vision LLM → `characterSheet` {name suggestion, species/type, colors[], distinctive features[], vibe}. Ask it to stay faithful to the child's drawing (keep odd features, like 3 legs or a purple sun hat).
3. Image generation: a reference portrait in the chosen style (image-conditioned on the drawing if supported, otherwise text-only from the sheet).
4. Push `character.ready` to the TV over WebSocket.

### 6.4 Latency budget (target: first narration audible ≤ 8 seconds after "Begin")
| Step | Target |
|---|---|
| Bible (Haiku, with a short bible for page 1–2 only, then the full bible in parallel) | ≤ 3 s |
| Page 1 text | ≤ 1.5 s |
| Image + Polly in parallel | ≤ 4 s |
**Cover-the-wait trick:** while page 1 generates, the TV shows an animated "opening the storybook" intro with a pre-recorded or Polly-cached generic opener ("Once upon a time, as the stars came out…"). That covers 5–10 seconds.

### 6.5 Failure handling
- Image fails → retry once → fall back to a style-matched generic background from a pre-generated pack (`assets/fallback/<style>/*.png`).
- Polly fails → captions-only page with a soft chime.
- Guardrail blocks → regenerate the page with stricter instructions (max 2 tries) → fall back to a safe template page.
- **Demo mode** (`?demo=1` or a hidden key combo): plays a fully pre-generated story from S3 or bundled assets. **Use this to record the video** if the network is unreliable.

---

## 7. API contract

REST (`https://api.<host>/v1`), JSON, header `x-household-id`:

| Method & path | Body / returns |
|---|---|
| `POST /households` | → `{householdId}` (stored on the device) |
| `GET/POST /listeners` | listener CRUD |
| `GET /characters` · `POST /characters` (preset build) | |
| `POST /sessions` | → `{code, qrUrl, expiresAt}` for the companion |
| `POST /sessions/:code/upload-url` | → presigned PUT URL (used by the phone) |
| `POST /sessions/:code/drawing` | `{s3Key, name?, styleId}` → `{characterJobId}` |
| `POST /stories` | `{listenerId, heroId, worldId, styleId, lesson?, length, voiceId, seriesId?}` → `{storyId}` |
| `GET /stories/:id` | `{meta, pages:[{n, status, text, imageUrl, audioUrl, marksUrl, choice?}]}` |
| `POST /stories/:id/choice` | `{page, optionIndex}` |
| `GET /library` | stories + series |
| `POST /parent/verify-pin` | |

WebSocket events (server → TV): `story.bible.ready`, `page.ready {n}`, `story.ready`, `story.failed {reason}`, `character.ready {characterId}`, `session.photoReceived`.
TV → server: `subscribe {storyId | sessionCode}`.

---

## 8. TV app (Vega OS / React Native)

### Repo layout (monorepo)
```
/apps/tv            # Vega OS React Native app
/apps/companion     # static phone web app (QR target)
/services/api       # Lambdas (TypeScript), shared prompt templates
/infra              # AWS CDK (TypeScript) — one `cdk deploy` stands up everything
/packages/shared    # TS types for API + events, used by tv/companion/api
/assets             # style samples, fallback images, intro audio (all original/generated)
/docs               # friction-log.md, decisions.md, product-feedback.md, architecture.png
/fixtures           # committed demo story + character (demo mode & mock API, no AWS needed)
/scripts            # cross-platform TS scripts: doctor, setup, deploy-config, generate-assets, mock
/.github/workflows  # CI: clean-clone install + check (ubuntu + windows)
.mcp.json           # project-scoped ADBT MCP server, pinned version
CLAUDE.md           # agent brief + commands (plus committed ADBT steering/skills)
toolchain.json      # pinned Node / Vega SDK / ADBT versions (read by doctor)
.nvmrc .node-version .gitattributes .env.example .gitignore
README.md           # "Try it in 2 min (no AWS)" first, then setup, deploy, sim/device, AWS services used
LICENSE             # MIT
```

### Screens & components
- `HomeScreen` — focusable rows (Continue series / Heroes / Past stories / "New story" hero tile).
- `WizardScreen` — a step indicator; each step is a focusable grid of large tiles (minimum ~240 px), and Back goes to the previous step.
- `QrPairingPanel` — QR code (generated client-side with a JS QR library that works under Vega's RN runtime; check this) plus live status.
- `CharacterCard` — drawing next to the generated hero, with Accept / Retry.
- `PlayerScreen` — `KenBurnsImage` (Animated transform), `NarrationPlayer` (audio playback through the Vega media/audio API; **check with the MCP**), `CaptionBar` (word highlight from speech marks), `ChoiceOverlay`, `WindDownOverlay` (a warm-color layer whose opacity follows page energy), `SleepScreen`.
- `ParentSettings` — PIN pad, lesson whitelist, max length, captions default, delete data.

### 10-foot UI rules
- 1920×1080 design grid, ≥ 5% safe-area margins, body text ≥ 28 px, titles ≥ 48 px.
- Always show a clear focus state (scale 1.08 + glow). Never trap focus, and Back always works.
- Every action must be reachable with the D-pad alone. Voice and phone are extras.
- Dark, warm palette (night theme). Avoid pure white in the player.
- Remote keys: Select, Back, Left/Right (page), Play/Pause, Menu (story options). Check the key event API in the Vega docs.

### Asset prefetch / cache
- Prefetch page n+1 and n+2 images and audio as soon as `page.ready` arrives.
- Keep the last ~5 stories cached on the device if storage APIs allow (check), otherwise stream from CloudFront.

---

## 9. Phased schedule (today = Mon Oct 5, 2026)

### Phase 0 — Setup (Oct 5–6)
- [ ] Install ADBT (§0.1) and check it with `check-status`. Make sure the Vega SDK is v0.22 or later.
- [ ] Scaffold the TV app the way the ADBT project-setup skill or docs describe.
- [ ] Install the Vega SDK, run the sample app on the **simulator** and on a **physical Fire TV device** if available. Log all friction.
- [ ] AWS account: request **Bedrock model access** (LLM, Nova Canvas), create a Guardrail, test Polly voices. **Request hackathon AWS credits now** (hard deadline Oct 21).
- [ ] Monorepo skeleton, CDK app that deploys an empty API + DynamoDB + S3/CloudFront.
- [ ] Spike: generate 6 consecutive images of the same character in 3 styles and judge the consistency. Choose the conditioning technique and record it in `decisions.md`.
- [ ] Reproducibility scaffolding (§0.2): pinned toolchain, `.gitattributes`, `pnpm doctor`/`setup`/`deploy`/`tv:sim`, `.env.example`, `.mcp.json`, `CLAUDE.md`, CI.
**Exit:** "hello world" app on the simulator calls a deployed `/health` endpoint, **and** the fresh-clone acceptance test (§0.2) passes.

### Phase 1 — End-to-end skeleton (Oct 7–10)
- [ ] Bible + page pipeline in a Lambda (sequential is fine for now), assets to S3, `GET /stories/:id` polling.
- [ ] Player screen: image + Ken Burns + narration + auto-advance + Back.
- [ ] Hard-coded story params (no wizard yet).
**Exit:** press "Begin" on the TV → a fully generated 6-page story plays.

### Phase 2 — Real product loop (Oct 11–14)
- [ ] Wizard (all steps), preset characters, style sample tiles.
- [ ] Parallel/pipelined generation + WebSocket `page.ready` + prefetch + intro cover animation. Meet the ≤ 8 s target.
- [ ] Choice points (overlay + branch pre-generation).
- [ ] Guardrails wired in for both input and output. Fallback images.
**Exit:** custom story with a choice, first audio ≤ 8 s on the simulator.

### Phase 3 — Differentiators (Oct 15–17)
- [ ] Companion web app + QR pairing + drawing → character + character card.
- [ ] Wind-down: prosody ramp, warm overlay, goodnight page, sleep screen and timer.
- [ ] Captions with word highlighting.
- [ ] Library + series continuation (runningSummary fed into the next bible).
- [ ] Parent settings + PIN.
**Exit:** the full demo script (§11) runs end to end without manual fixes.

### Phase 4 — Polish & hardening (Oct 18–20)
- [ ] Test on a real device: performance (animation fps, memory), focus edge cases, network loss. Record Perfetto traces and run ADBT `analyze_perfetto_traces` / `get_app_hot_functions`. Put the before/after numbers in the README, since that's evidence for Tech Implementation.
- [ ] Demo mode with a fully cached "hero story" for the video.
- [ ] Visual polish: transitions, loading states, empty states, app icon and banner art.
- [ ] Cost check: log the per-story cost (number of LLM tokens, images, Polly characters) and show it in the README.
- [ ] Architecture diagram (`docs/architecture.png`).

### Phase 5 — Submission (Oct 21–22, buffer Oct 23 AM)
- [ ] Record and edit the video (< 3:00, English, no third-party IP or music). Upload to YouTube (unlisted is OK if allowed; otherwise public).
- [ ] README: what it is, setup, deploy (`cdk deploy`), run on simulator/device, demo mode, AWS services used and **how** (for the AWS Builder challenge), what was built during the hackathon window.
- [ ] `docs/product-feedback.md`: for each tool (Vega SDK, simulator, RN for Vega, Bedrock, Nova Canvas, Polly, Guardrails, CDK) cover what worked, what needs improvement, onboarding experience, and "would build again: Yes/No".
- [ ] Final friction log with severity + feature requests (Critical/Important/Nice-to-have).
- [ ] Devpost form: Fire TV track + AWS Builder (+ Open Source if the repo is public with MIT). Share the repo if private.
- [ ] Re-run the fresh-clone acceptance test (§0.2) on a clean machine. Also check that `pnpm demo` works with no AWS credentials at all.
- [ ] **Submit by Oct 22 EOD.**

---

## 10. Stretch goals (only after Phase 4)
1. **Voice choices:** answer choice points by voice (through Alexa or the remote mic if the Vega SDK exposes it; check with the MCP), or through the phone companion using the Web Speech API.
2. **Alexa+ hook:** "Alexa, ask Nightlight for Pip's next adventure" (could be a small MCP server; this would be a separate track, so only a bonus).
3. **Parent voice clone:** not recommended (consent and safety complexity). Prefer an option for the parent to record the opening and closing lines.
4. **Printable storybook PDF** emailed to the parent.
5. **Short animated clips** for 1–2 key pages using a Bedrock video model (e.g. Nova Reel) if latency allows. Pre-generate these asynchronously for the replay version only.

---

## 11. Demo video script (target 2:45)

| Time | Shot |
|---|---|
| 0:00–0:15 | Problem: a tired parent at bedtime, a kid who wants "a story about MY monster". Hook line on screen. |
| 0:15–0:45 | Child's crayon drawing → parent scans the QR code on the TV → upload → the TV shows the drawing turning into a watercolor hero. **(Computer vision moment)** |
| 0:45–1:10 | Wizard with the D-pad: world, style, lesson "bravery", length. Begin → storybook intro covers the load. |
| 1:10–1:50 | Story plays: Ken Burns art, narration, captions. **Choice point**: the kid picks with the remote, and the story branches instantly. |
| 1:50–2:15 | Wind-down: the screen warms and dims, narration slows, goodnight page, night-light screen. |
| 2:15–2:35 | Library: "Pip's next adventure" continues the series. Parent settings and guardrails briefly. |
| 2:35–2:45 | Architecture slide (Vega OS + Bedrock + Nova Canvas + Polly + Guardrails) + tagline. |

Record on a **real Fire TV device** if possible (filmed screen or capture), with the simulator as backup. Use demo mode for any shot where network latency would show.

---

## 12. Judging alignment checklist

- **Tech Implementation:** Vega OS RN app; serverless AWS; pipelined multimodal generation; WebSocket streaming; consistent characters; guardrails; IaC with CDK.
- **Design:** works fully with the D-pad; 10-foot UI; the latency is hidden behind the intro; wind-down is designed for the actual bedtime situation.
- **Potential Impact:** every family has a bedtime routine; the stories are screen time that ends in sleep rather than more stimulation; lessons are personalized; the child's creativity (their drawing) is the input; parents stay in control.
- **Quality of Idea:** uses TV + phone + vision + voice together (multi-modal); fits Fire TV's family-entertainment focus; uses Amazon AI services throughout.
- **Bonus:** detailed friction log + product feedback.

---

## 13. Open questions to resolve early (record answers in `docs/decisions.md`)
1. Vega OS vs Fire OS: does the simulator and device workflow work for the team? (Decide by end of Oct 6.)
2. Audio playback and key event APIs on Vega RN: which modules? (MCP)
3. Nova Canvas: which image-conditioning mode gives the best character consistency? (Phase 0 spike.)
4. Which Bedrock region has all the models needed (LLM + Nova Canvas + Guardrails)?
5. Is a physical Fire TV device available for testing and video recording?

---
name: "amazon-devices-vega-app-performance"
description: |
  Performance optimization, KPI targets, and diagnostics for Vega applications — including which component is re-rendering, unnecessary or wasted re-renders, UI jank / stutter, dropped frames, slow app launch, key-input latency, and CPU hot functions. Also covers debugging Vega WebView apps (apps whose primary screen is web content in a WebView): a screen that won't render, a blank or white screen, a page that won't load, a wrong or broken DOM/CSS layout, a web page that throws a JavaScript error, or a WebView that is blank or slow.
  Use when improving app performance or diagnosing any performance, rendering, or re-render issue, even when phrased as a plain symptom or a code question (e.g., "which component is re-rendering?", "why isn't my screen rendering?", "my web page won't render", "the DOM is wrong", "my web app throws a JS error", "the WebView is blank or slow", "blank white screen", "my page won't load").
  
version: "1.2.0"
tags: ["vega", "performance", "optimization", "kpi", "diagnostics"]
---

# App Performance

## Prerequisites

This skill requires the `amazon-devices-buildertools-mcp` MCP server. Install the MCP server in your AI agent's MCP configuration. Example:

    {
      "amazon-devices-buildertools-mcp": {
        "command": "npx",
        "args": ["-y", "@amazon-devices/amazon-devices-buildertools-mcp@latest"]
      }
    }

## Overview

Vega apps have specific performance KPI targets enforced by the platform. Performance optimization should be integrated early — not as an afterthought.

## Core Concepts

Performance on Vega apps is measured against several KPIs. See [Measure App KPIs](https://developer.amazon.com/docs/vega/latest/measure-app-kpis.html) for the full reference. Key KPIs and guidelines:

| KPI | Test Scenario | Guideline |
|---|---|---|
| Time-to-First-Frame | Cool start | < 1.5s |
| Time-to-First-Frame | Warm start | < 0.5s |
| Time-to-Fully-Drawn | Cool start | < 8.0s |
| Time-to-Fully-Drawn | Warm start | < 1.5s |
| Foreground Memory | App in foreground | < 400 MiB |
| Background Memory | App in background | < 150 MiB |
| Video Fluidity | Video playback | > 99% |
| Time-to-First-Video-Frame | Video playback | < 2500 ms |
| UI Fluidity | UI interaction | > 99% |
| App Event Response Time - Focus | UI interaction | < 200 ms |
| Key pressed/released latency | Video playback | < 100 ms |

- Never bundle React/React Native — these are system-provided
- Use `React.memo()` and native animation drivers to minimize re-renders
- Use KPI Visualizer tool to measure KPIs before optimizing

## Common Mistakes

| Problem | Fix |
|---|---|
| Slow cold start | Defer non-critical initialization, use lazy loading for screens |
| High memory usage | Implement image downsampling, clear unused resources, use proper cache eviction |
| Janky UI scrolling | Use native drivers for animations, implement view recycling, minimize JS bridge traffic |
| Bundle too large | Never include React/React Native, use dynamic imports for large features |
| No performance data | Use `vega exec perf kpi-visualizer` to measure KPIs before optimizing |

Use `amazon-devices-buildertools-mcp:search_documentation` to find troubleshooting guides and learn more about any topic.

## Workflow

1. **Route via the debugging tool router FIRST — before any diagnosis.** For any performance, rendering, re-render, UI-fluidity, or "jank" request — including plain symptoms like "why isn't my screen rendering?", a blank/white screen, or a page that won't load — work through these sub-steps in order, before running any tool, analyzing a trace, or reading code:
   - **(a) Consult the router and let it classify the app type FIRST.** Use `amazon-devices-buildertools-mcp:read_document` to read `react_native_for_vega_debugging_tool_router.md`. Its app-type gate requires you to **run the Vega app-type detection contract yourself in this session** — `read_asset` the detector script and `execute_bash` it, then branch on its exit code (per `vega_app_type_detection.md`). Do NOT infer the app type by reading `package.json`/`manifest.toml`/`src/`, and do NOT hand the detector back to the developer to run — you run it and read its exit code before naming any tool. A **WebView app** (detector exit 3) follows the router's WebView decision matrix (web content debugs with Chrome DevTools; native-layer launch/input and KPI scoring use the same tools as any Vega app); a **VegaScript app** (exit 0) uses the RN version gate; an **ambiguous** result (exit 4) means STOP and ask the developer which surface to debug. The router is the single source of truth for tool selection.
   - **(b) For a VegaScript app, apply the version gate.** Detect the RN version from the app's `package.json` (`react-native`, `@amazon-devices/react-native-kepler`; React 19 indicates the RN 0.83 / Static Hermes stack) and follow the router's RN matrix.
   - **(c) Disambiguate a vague symptom.** If the request could map to more than one router row — a bare "slow", "laggy", "sluggish", or "not performing well" (app-launch TTFF/TTFD vs. navigation jank / re-render vs. key-input latency vs. CPU hot functions; and for a WebView app, web-content janky vs. native launch vs. KPI score) — ask the developer which symptom they mean before selecting a tool. Route directly only when the symptom clearly maps to one row (e.g., "which component is re-rendering", "slow to launch").
   - **(d) Invoke the selected tool — do not just name it.** On RN 0.83+ (Static Hermes), re-render / UI-fluidity debugging routes to the DevTools Profiler: `read_document` `react_native_for_vega_open_devtools_workflow.md` and execute that workflow to bring DevTools up on the device (it self-checks eligibility, needs a connected device + Metro, and hands off to the user). Do not stop at telling the user to "use RN DevTools" in prose.
   - **(e) Keep the right tool for the job.** Do not default to Perfetto trace analysis or manual code review for the re-render cause on 0.83+. App-launch (TTFF/TTFD) and key-input latency stay on `analyze_perfetto_traces` regardless of version.
2. Use `amazon-devices-buildertools-mcp:read_document` to read `react-native-for-vega-performance-best-practices.md` for optimization patterns
3. To measure KPIs, use `amazon-devices-buildertools-mcp:read_document` to read `vega_cli_commands_exec_perf.md` for the KPI Visualizer tool
4. Based on the results, use `amazon-devices-buildertools-mcp:list_documents` or `amazon-devices-buildertools-mcp:search_documentation` to find relevant diagnosis docs for the specific issue (slow launch, re-renders, memory leaks, fluidity)

## Dependencies

Tools used from `amazon-devices-buildertools-mcp`:
- `amazon-devices-buildertools-mcp:read_document`
- `amazon-devices-buildertools-mcp:list_documents`
- `amazon-devices-buildertools-mcp:search_documentation`
- `amazon-devices-buildertools-mcp:read_asset` (fetch the app-type detector script for the router's app-type gate)

Also required by the app-type gate (step 1a): `execute_bash` (run the detector script and read its exit code).

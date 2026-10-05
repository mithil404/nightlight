---
name: "amazon-devices-vega-caption-settings"
description: |
  Read the OS closed-captioning accessibility settings and render app-drawn captions that match them in a React Native for Vega video app, using @amazon-devices/kepler-a11y-settings-interface-turbo.
  Use when a Vega app draws its own captions and must honor the user's system caption on/off state and style (size, color, font, edge, opacity).
  
version: "1.0.0"
tags: ["vega", "captions", "closed-captioning", "accessibility", "a11y", "turbo-module"]
---

# Caption Settings (Accessibility)

## Prerequisites

This skill requires the `amazon-devices-buildertools-mcp` MCP server. Install the MCP server in your AI agent's MCP configuration. Example:

    {
      "amazon-devices-buildertools-mcp": {
        "command": "npx",
        "args": ["-y", "@amazon-devices/amazon-devices-buildertools-mcp@latest"]
      }
    }

**SDK requirement:** build the app with Vega SDK **0.24 or later** — the `@amazon-devices/kepler-a11y-settings-interface-turbo` module requires it.

## Overview

Vega apps that render their own captions must match the user's OS accessibility caption settings. The `@amazon-devices/kepler-a11y-settings-interface-turbo` Turbo Module exposes the closed-captioning on/off state and the user's `CaptioningProps` (size, color, font, edge, opacity, backgrounds). The app reads these once on launch, subscribes to live changes, maps the enums to React Native styles, and draws a caption overlay over its video surface — using read and listener APIs only (no privileged setters).

## Core Concepts

- The settings singleton `KeplerA11ySettingsInterface` is a **named** export — a default import resolves to `undefined` and crashes on first use; never call `new` on it
- Three-step pattern: **read once** on launch (`isClosedCaptioningEnabled`, `getCaptionPreferences`) → **subscribe** to `addClosedCaptioningStateListener` and `addCaptioningPreferencesListener` → **remove both listeners** on unmount (the module keeps one listener per type)
- Listener callbacks run on the JS thread, so calling `setState` directly is safe; preference callbacks may be partial — merge into previous state
- Getters never throw — they log and return safe fallbacks (`getCaptionPreferences()` returns `{}`); map every enum to a concrete value with legible defaults
- `getCaptionPreferences()` returns **customer-facing setting values** (the enum the user picked), not the rendered style — map them yourself using the authoritative tables in the KB (Section 2): `textSize` → logical dp (`very_small`=12, `small`=18, `normal`=24 default, `large`=36, `very_large`=48) and `textFont` → generic family (`'default'` → `sans-serif`; don't hardcode a face). There is no bold/weight setting, and italics/underline are per-character caption pen attributes (CEA-708), not font settings
- Apps that play through the platform caption view (W3C media / `IClosedCaptionView`) do NOT need this — the platform applies caption settings automatically
- If `libKeplerA11ySettingsInterfaceTurbo.so` is missing on a build, the import is `undefined`; feature-detect the methods and render with captions OFF instead of crashing
- **WebView apps**: if your player and captions live in a WebView, the page can't call this module directly — read the settings in the React Native host and bridge them into the page. See `amazon-devices-vega-webview-caption-settings` (SKILL) / `vega_a11y_webview_caption_settings.md` (KB)

## Common Mistakes

| Problem | Fix |
|---|---|
| `Cannot read property 'addClosedCaptioningStateListener' of undefined` | Use the NAMED import `{KeplerA11ySettingsInterface}`, not a default import |
| App crashes on device builds without the native module | Feature-detect the API surface; degrade to captions OFF (`available: false`) |
| Captions leak / fire after unmount | Remove BOTH listeners in the `useEffect` cleanup |
| Style changes drop unrelated fields | Merge partial `CaptioningProps` into previous state, don't replace |
| Captions steal D-Pad/remote input | Wrap the overlay with `pointerEvents="none"` |
| Empty styling when read fails | Guard the `{}` fallback and apply legible default color/size |
| Double-rendered captions | Don't draw your own captions when media plays through the platform caption view |

Use `amazon-devices-buildertools-mcp:search_documentation` to find troubleshooting guides and learn more about any topic.

## Workflow

1. Use `amazon-devices-buildertools-mcp:read_document` to read `vega_a11y_caption_settings.md` for the complete implementation guide (the hook, the enum-to-style mapping, the overlay, and graceful degradation)
2. Use `amazon-devices-buildertools-mcp:list_documents` to discover related docs (`react_native_for_vega_add_captions_and_subtitles`, `react_native_for_vega_media_player`)
3. Use `amazon-devices-buildertools-mcp:search_documentation` to find specific caption or accessibility topics

## Apply and build

After reading the KB, apply the changes to the app and build it:

1. Add the `@amazon-devices/kepler-a11y-settings-interface-turbo` dependency and run `npm install`.
2. Create/modify the files and wire the integration into the app's existing player / root component, following the KB.
3. Build and install the app: use `react_native_for_vega_app_build_and_install.md` (production build + install) or `react_native_for_vega_launch_app_with_fast_refresh.md` (live dev loop); `vega_cli_commands` documents the underlying `vega`/`kepler` commands.

## Dependencies

Tools used from `amazon-devices-buildertools-mcp`:
- `amazon-devices-buildertools-mcp:read_document`
- `amazon-devices-buildertools-mcp:list_documents`
- `amazon-devices-buildertools-mcp:search_documentation`

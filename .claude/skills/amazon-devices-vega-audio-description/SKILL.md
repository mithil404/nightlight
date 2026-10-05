---
name: "amazon-devices-vega-audio-description"
description: |
  Read the OS "audio description preferred" accessibility setting in a React Native for Vega app so the app can auto-select an audio description track based on the setting value, using @amazon-devices/kepler-a11y-settings-interface-turbo.
  Use when a Vega video app should honor the user's system audio-description preference by switching to a described audio track.
  
version: "1.0.0"
tags: ["vega", "audio-description", "accessibility", "a11y", "audio-track", "turbo-module"]
---

# Audio Description (Accessibility)

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

Audio Description (AD) is a secondary narration track that describes on-screen action for blind and low-vision viewers. The OS exposes whether the user prefers audio description as a single boolean through `@amazon-devices/kepler-a11y-settings-interface-turbo`. An app reads this once on launch, subscribes to live changes, and — when AD is preferred — selects the audio-described track from its media's audio-track list (and falls back to the main track when it is not). It uses read and listener APIs only (no privileged setters).

## Core Concepts

- The settings singleton `KeplerA11ySettingsInterface` is a **named** export — a default import resolves to `undefined` and crashes on first use; never call `new` on it
- Audio description is a single boolean preference: `isAudioDescriptionPreferred()` (read) and `addAudioDescriptionStateListener` / `removeAudioDescriptionStateListener` (subscribe)
- Three-step pattern: **read once** on launch → **subscribe** to the state listener → **remove the listener** on unmount (the module keeps one listener per type)
- The listener callback runs on the JS thread, so calling `setState` directly is safe
- The boolean getter never throws — on error it returns `false` (AD not preferred), a safe default
- The app must map the preference to an action: when AD is preferred, switch to the audio-described track using your player's audio-track API (match by `kind`/role/label metadata, not index), and re-apply when the preference changes and when a new title loads — the concrete selection mechanism is app/player-specific and out of scope for this skill
- Not every title has a described track — degrade gracefully to the main track when none is present, and never block playback
- **WebView apps**: if your player lives in a WebView, the page can't call this module directly — read the preference in the React Native host and bridge it into the page. See `amazon-devices-vega-webview-audio-description` (SKILL) / `vega_a11y_webview_audio_description.md` (KB)

## Common Mistakes

| Problem | Fix |
|---|---|
| `Cannot read property 'isAudioDescriptionPreferred' of undefined` | Use the NAMED import `{KeplerA11ySettingsInterface}`, not a default import |
| Preference read but track never switches | Re-apply track selection when a new title loads, not just once at mount |
| Crash when a title has no described track | Guard for "no AD track found" and keep the main track; never assume one exists |
| Listener leaks / fires after unmount | Remove the listener in the `useEffect` cleanup |
| Only reads once, ignores runtime changes | Subscribe with `addAudioDescriptionStateListener` and re-select the track on change |
| Selecting AD by index/hardcode | Match by track `kind`/role/label metadata, since track order varies per stream |

Use `amazon-devices-buildertools-mcp:search_documentation` to find troubleshooting guides and learn more about any topic.

## Workflow

1. Use `amazon-devices-buildertools-mcp:read_document` to read `vega_a11y_audio_description.md` for the complete implementation guide (the preference hook, described-track selection, and graceful fallback)
2. Use `amazon-devices-buildertools-mcp:read_document` to read `react_native_for_vega_media_player.md` for how audio tracks are exposed by the Vega media player
3. Use `amazon-devices-buildertools-mcp:search_documentation` to find specific audio or accessibility topics

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

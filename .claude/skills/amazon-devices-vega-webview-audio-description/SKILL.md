---
name: "amazon-devices-vega-webview-audio-description"
description: |
  Bridge the OS "audio description preferred" accessibility setting from a React Native for Vega host into a WebView page so the page's own player selects the described audio track, using @amazon-devices/kepler-a11y-settings-interface-turbo and @amazon-devices/webview.
  Use when a Vega app plays video inside a WebView (its own non-Kepler player) and must honor the user's system audio-description preference.
  
version: "1.0.0"
tags: ["vega", "audio-description", "webview", "accessibility", "a11y", "audio-track", "turbo-module"]
---

# Audio Description in WebView Apps (Accessibility)

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

A WebView-based Vega app plays video with its own player inside a web page (`@amazon-devices/webview`). The page's JavaScript **cannot call** the accessibility Turbo Module directly — it runs in the React Native host. The host reads the "audio description preferred" boolean via `@amazon-devices/kepler-a11y-settings-interface-turbo`, subscribes to changes, and **bridges** it into the page via the WebView messaging APIs; the page selects the described audio track in its own player. Read + listener APIs only (no privileged setters).

## Core Concepts

- The Turbo Module runs in the **RN host**, not the WebView page — page JS cannot import or call it; never try to
- Audio description is a **single boolean** (`isAudioDescriptionPreferred` + `addAudioDescriptionStateListener`); the bridged payload is trivial — the real work is track selection in the page's player
- Bridge pattern: the host **reads + subscribes** and **injects** the boolean into the page (`webRef.injectJavaScript`, re-pushing on change); the page **requests on load** (`window.ReactNativeWebView.postMessage`) and the host answers via the WebView `onMessage` prop
- The page maps the boolean to an action: select the described track using **its own** player's audio-track API (match by `kind`/role/label metadata, not index), re-applying on preference change and when a new title loads — the concrete selection mechanism is app/player-specific and out of scope for this skill
- The boolean getter never throws — it returns `false` on error; not every title has a described track, so degrade to the main track and never block playback
- `injectJavaScript` payloads must end with `true;`; guard non-JSON messages in `onMessage`; feature-detect the module on the host and skip the bridge if it is absent

## Common Mistakes

| Problem | Fix |
|---|---|
| `Cannot read property 'isAudioDescriptionPreferred' of undefined` in page JS | The module runs in the RN host, not the page — bridge via `injectJavaScript`/`onMessage`; don't import it in page JS |
| Track never switches when the user toggles the setting | Subscribe with `addAudioDescriptionStateListener` on the host and re-inject on the callback |
| `injectJavaScript` silently no-ops | End the injected script with `true;` |
| Page starts on the wrong track on cold start | Have the page `postMessage` a request on load; the host also pushes on WebView `onLoad` |
| Crash when a title has no described track | Guard the "not found" case, keep the main track, and never block playback |
| Selecting AD by index/hardcode | Match by track `kind`/role/label metadata, since track order varies per stream |

Use `amazon-devices-buildertools-mcp:search_documentation` to find troubleshooting guides and learn more about any topic.

## Workflow

1. Use `amazon-devices-buildertools-mcp:read_document` to read `vega_a11y_webview_audio_description.md` for the full host↔page bridge implementation (host read + subscribe + inject, page receive glue, and the track-selection rules)
2. Use `amazon-devices-buildertools-mcp:read_document` to read `react_native_for_vega_media_player.md` for how audio tracks are exposed by the Vega media player
3. Use `amazon-devices-buildertools-mcp:read_document` to read `react_native_for_vega_webview.md` for WebView setup (dependency, manifest services, messaging)
4. Use `amazon-devices-buildertools-mcp:search_documentation` to find specific audio, accessibility, or WebView topics

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

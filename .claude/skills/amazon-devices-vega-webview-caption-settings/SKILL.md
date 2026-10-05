---
name: "amazon-devices-vega-webview-caption-settings"
description: |
  Bridge the OS closed-captioning accessibility settings from a React Native for Vega host into a WebView page and render app-drawn captions that match them, using @amazon-devices/kepler-a11y-settings-interface-turbo and @amazon-devices/webview.
  Use when a Vega app plays media and draws captions inside a WebView (its own non-Kepler player) and must honor the user's system caption on/off state and style.
  
version: "1.0.0"
tags: ["vega", "captions", "closed-captioning", "webview", "accessibility", "a11y", "turbo-module"]
---

# Caption Settings in WebView Apps (Accessibility)

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

A WebView-based Vega app renders its player and captions inside a web page (`@amazon-devices/webview`). The page's JavaScript **cannot call** the accessibility Turbo Module directly — it runs in the React Native host. The host reads the closed-captioning on/off state and the user's `CaptioningProps` via `@amazon-devices/kepler-a11y-settings-interface-turbo`, subscribes to changes, and **bridges** them into the page via the WebView messaging APIs; the page applies them to its own player / caption renderer. Read + listener APIs only (no privileged setters).

## Core Concepts

- The Turbo Module runs in the **RN host**, not the WebView page — page JS cannot import or call it; never try to
- Bridge pattern: the host **reads + subscribes** (`isClosedCaptioningEnabled`, `getCaptionPreferences`, `addClosedCaptioningStateListener`, `addCaptioningPreferencesListener`) and **injects** into the page (`webRef.injectJavaScript`, re-pushing on every change); the page **requests on load** (`window.ReactNativeWebView.postMessage`) and the host answers via the WebView `onMessage` prop
- The page applies the values: on/off toggles its caption track/layer; style maps `CaptioningProps` to `::cue` (HTML5 `<track>`) or the custom player's caption API — reuse the authoritative size/font mapping from the React Native caption KB
- `getCaptionPreferences()` returns **customer-facing setting values** (not rendered styles) and returns `{}` on error — apply legible fallbacks and merge partial preference updates
- `injectJavaScript` payloads must end with `true;`; guard non-JSON messages in `onMessage`
- Feature-detect the module on the host; if it is missing on a build, skip the bridge and let the page keep its defaults instead of crashing

## Common Mistakes

| Problem | Fix |
|---|---|
| `Cannot read property '...' of undefined` when calling the module in page JS | The module runs in the RN host, not the page — bridge via `injectJavaScript`/`onMessage`; don't import it in page JS |
| Page captions never update when the user changes settings | Subscribe with the listeners on the host and re-inject on every callback |
| `injectJavaScript` silently no-ops | End the injected script with `true;` |
| Page starts with the wrong caption state on cold start | Have the page `postMessage` a request on load; the host also pushes on WebView `onLoad` |
| Styling drops fields or crashes on `{}` | `getCaptionPreferences()` returns `{}` on error — apply legible fallbacks and merge partial updates |

Use `amazon-devices-buildertools-mcp:search_documentation` to find troubleshooting guides and learn more about any topic.

## Workflow

1. Use `amazon-devices-buildertools-mcp:read_document` to read `vega_a11y_webview_caption_settings.md` for the full host↔page bridge implementation (host read + subscribe + inject, page receive + apply, `::cue` mapping, and graceful degradation)
2. Use `amazon-devices-buildertools-mcp:read_document` to read `vega_a11y_caption_settings.md` for the authoritative `CaptioningProps` → style mapping (textSize dp, textFont family, colors, opacity) reused on the web side
3. Use `amazon-devices-buildertools-mcp:read_document` to read `react_native_for_vega_webview.md` for WebView setup (dependency, manifest services, messaging)
4. Use `amazon-devices-buildertools-mcp:search_documentation` to find specific caption, accessibility, or WebView topics

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

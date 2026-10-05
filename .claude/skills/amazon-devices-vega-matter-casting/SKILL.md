---
name: "amazon-devices-vega-matter-casting"
description: |
  Matter Casting for Vega content apps — declaring Matter identity in the app manifest, providing the Content Launcher, Media Controls, and Account Login platform clusters, and reporting state back to the phone.
  Use when adding Matter Casting support to a Vega application.
  Use when a phone app needs to launch content on a Fire TV running Vega, or control playback on it.
  Use when implementing or debugging cluster handlers for casting, such as handleLaunchContent, handlePlay, or handleGetSetupPin.
  Use when casting fails — the phone reports "app not installed on TV", a cast command does nothing, or the phone shows stale playback state.
  
version: "1.0.0"
tags: ["vega", "matter-casting", "casting", "content-app", "content-launcher", "media-controls", "account-login"]
---

# Matter Casting

## Prerequisites

This skill requires the `amazon-devices-buildertools-mcp` MCP server. Install the MCP server in your AI agent's MCP configuration. Example:

    {
      "amazon-devices-buildertools-mcp": {
        "command": "npx",
        "args": ["-y", "@amazon-devices/amazon-devices-buildertools-mcp@latest"]
      }
    }

## Overview

Matter Casting lets a phone app launch content on a Fire TV running Vega and control playback on it. The content app never handles the Matter protocol: the platform Matter Casting service owns discovery, commissioning, attestation, and all protocol translation, then delivers translated commands to the app.

A content app contributes three things — a Matter identity in `manifest.toml`, a declaration of which platform clusters it provides, and handlers that run when a command arrives. Casting rides on the existing Vega media clusters rather than a separate stack, so most of the work is ordinary cluster integration and the Matter-specific surface is small.

Official documentation:

> https://developer.amazon.com/docs/vega/latest/vega-matter-casting-integration.html

## Core Concepts

- The platform builds the app's Matter endpoint from the manifest before the app runs. Identity comes from `[offers.matter-casting]`; the cluster surface comes from the `interface.provider` extras block.
- Matter identity is not optional. Without it the phone finds no endpoint for the app and reports the app as not installed, even when it is.
- Vendor and product IDs must match the app's Device Attestation Certificate.
- The component that registers handlers must declare the `com.amazon.category.kepler.media` category.
- Declaring a command and implementing its handler are separate steps, and both are required. A declared command with no handler looks broken to the user; an implemented handler that is not declared is unreachable.
- Feature flags gate whole groups of commands. Seek needs `AdvancedSeek`; Rewind and FastForward need `VariableSpeed`; track selection needs `AudioTracks` or `TextTracks`.
- Core Media Controls commands are always delivered and need no declaration. Only optional commands go in `command_options`.
- Every handler must settle its Promise. The platform enforces a 25-second command timeout, so handlers should resolve or reject within 20 seconds, including on error paths.
- State changes must be reported back, or the phone's UI goes stale. This includes changes the phone did not cause, such as playback advancing on its own.
- Handlers must be bound before the first command can arrive, and bound only once.
- Each cluster binds its handler differently — Media Controls uses a static accessor, while Content Launcher and Account Login are instantiated.

## Common Mistakes

| Problem | Fix |
|---|---|
| Phone reports "app not installed on TV" although the app is installed | Declare Matter identity in the manifest, with vendor and product IDs matching what the phone app expects |
| Phone cannot find the TV at all | Not a content app problem. Check network, TV casting settings, and the phone app's local-network permission |
| A cast command does nothing | Declare the command and implement its handler; both are required |
| Seek or variable-speed commands unavailable | Declare the gating feature flag, not just the handler |
| Phone shows stale playback position or sign-in state | Report state after every change, including changes the app makes on its own |
| Phone times out waiting for a command | Settle the Promise on every path; an exception that is thrown and swallowed leaves it pending |
| First command after launch is missed | Bind handlers on mount, not on user interaction or after data loads |
| Handlers appear to fire twice | Guard registration so re-renders do not bind a second time |
| Sign-in status cannot be read while the app is closed | Route the attribute to a component that answers without the UI running |
| Module resolution fails after adding a cluster | Take the module ID from the reference doc; several published examples carry outdated IDs |
| Copying a manifest example wholesale | Runtime modules differ by React Native version, and each cluster needs configuration of its own beyond the casting declarations |

Use `amazon-devices-buildertools-mcp:search_documentation` to find troubleshooting guides and learn more about any topic.

## Workflow

1. Use `amazon-devices-buildertools-mcp:read_document` to read `vega_matter_casting_api.md` for the complete reference — manifest declarations, the Matter command to handler mapping, handler binding, attribute reporting, and troubleshooting.
2. Use `amazon-devices-buildertools-mcp:read_document` to read `react_native_for_vega_add_matter_casting_integration_workflow.md` for the step-by-step integration procedure.
3. Use `amazon-devices-buildertools-mcp:read_document` to read the guide for each cluster being implemented: `vega_content_launcher_api.md`, `vega_media_controls_api.md`, or `vega_account_login_api.md`.
4. Use `amazon-devices-buildertools-mcp:read_document` to read `vega_app_manifest.md` for manifest structure and the `interface.provider` extras block.
5. Use `amazon-devices-buildertools-mcp:list_documents` to discover related media and casting documents.
6. Use `amazon-devices-buildertools-mcp:search_documentation` to find specific topics on demand.

## Dependencies

Tools used from `amazon-devices-buildertools-mcp`:
- `amazon-devices-buildertools-mcp:read_document`
- `amazon-devices-buildertools-mcp:list_documents`
- `amazon-devices-buildertools-mcp:search_documentation`

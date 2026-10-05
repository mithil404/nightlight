---
name: "amazon-devices-vega-developer-mode-init"
description: |
  Guides developers through enabling Developer Mode on Fire TV (Vega OS) devices.
  Use when a developer needs to activate developer shell access and VDA connectivity.
  Use when a developer asks how to set up their Fire TV for development or debugging.
  Use when a developer encounters issues connecting to their Fire TV device for app deployment.
  
version: "1.0.0"
tags: ["vega", "developer-mode", "devmode", "device-setup", "fire-tv"]
---

# Enable Developer Mode

## Prerequisites

This skill requires the `amazon-devices-buildertools-mcp` MCP server. Install the MCP server in your AI agent's MCP configuration. Example:

    {
      "amazon-devices-buildertools-mcp": {
        "command": "npx",
        "args": ["-y", "@amazon-devices/amazon-devices-buildertools-mcp@latest"]
      }
    }

## Overview

Guides 3P developers through enabling Developer Mode on Fire TV devices running Vega OS. The workflow covers prerequisites verification, authentication detection, login via browser-based auth, device enablement with OTP code entry, vendor selection, and post-enablement verification. Developer Mode unlocks developer shell access and VDA connectivity over network or USB — required before any app development or debugging.

## Core Concepts

- **Authentication detection**: Run `vega devmode login` to check auth status. If it returns exit code 2 with "Already logged in", the developer is already authenticated — skip to device enablement. (Note: exit code 2 from `vega devmode login` means "Already logged in", which is different from exit code 2 on `vega devmode enable-device` which means "Authentication required".) If it returns exit code 0 and starts the login flow, the developer was not authenticated — wait for login to complete.
- **OTP handling**: Two interaction modes are supported:
  - **Mode A (agent-driven)**: The developer reads the 6-character code from their TV screen and shares it in chat. The agent runs `vega devmode enable-device --code <CODE>`.
  - **Mode B (user-driven)**: The developer runs the command themselves and reports the result.
- **OTP expiration**: The code displayed on the device expires after 5 minutes. If expired, the developer must restart the device enablement process to get a new code.
- **Vendor selection**: Use `vega devmode list-vendors` to get available vendors as JSON. If only one vendor exists, it auto-selects. If multiple exist, present the list to the developer and pass their choice with `--vendor <ID>` on the enable command. This avoids the interactive prompt that the agent cannot control.
- **Device reboot**: After successful enablement, the device reboots automatically. Wait for the reboot to complete before verifying.
- **Scope boundaries**: This skill does NOT cover SDK installation (use `amazon-devices-vega-setup-sdk`) or app building/deployment (use `amazon-devices-vega-build-and-run`).

**Exit Code Reference for `vega devmode list-vendors`:**

| Exit Code | Meaning |
|---|---|
| 0 | Success — vendors returned as JSON |
| 1 | Failed to initialize authentication client |
| 2 | Authentication required (not logged in) — run `vega devmode login` first |
| 3 | Failed to fetch vendors / 401 session expired — re-authenticate |

**Exit Code Reference for `vega devmode enable-device`:**

| Exit Code | Meaning |
|---|---|
| 1 | Missing `--code` flag |
| 2 | Authentication required (not logged in) |
| 3 | Failed to fetch vendors / 401 session expired |
| 4 | No vendors found for account |
| 5 | Vendor selection failed |
| 6 | Enable failed (400 invalid/expired OTP or 404 vendor not found) |

## SDK Version Safeguards

Before proceeding with any devmode commands, verify that `vega devmode` is available in the developer's SDK:

```bash
vega devmode --help
```

If the command is not recognized (error, "unknown command", or exit code 1 with no valid output), **STOP** and inform the developer that their SDK version does not include Developer Mode support. Direct them to update their SDK to the latest version using the `amazon-devices-vega-setup-sdk` skill, then retry.

## Common Mistakes

| Problem | Fix |
|---|---|
| `vega devmode` command not recognized | SDK version too old — update to the latest SDK via `amazon-devices-vega-setup-sdk` |
| Running interactive install (`get_vvm.sh`) from agent | The install script is interactive — instruct the user to run it manually and confirm when done |
| Running `vega devmode login` from a headless/remote agent | Login opens a browser and polls indefinitely — instruct the developer to run it in their own terminal and confirm when done |
| Attempting `vega devmode enable-device` without checking auth first | Always run `vega devmode login` first — if exit code 2, you're already auth'd and can proceed to enable |
| OTP code expired before submitting | The code expires in 5 minutes — inform the developer immediately and have them enter it promptly |
| Not waiting for device reboot | The device reboots automatically after enablement — wait 30–60 seconds before running `vega device list` |
| Vendor fetch returns 401 (exit code 3) | Session expired — re-authenticate with `vega devmode login` |

Use `amazon-devices-buildertools-mcp:search_documentation` to find troubleshooting guides and learn more about any topic.

## Workflow

1. Use `amazon-devices-buildertools-mcp:read_document` to read `vega_developer_mode_enablement_workflow.md` for the complete step-by-step enablement workflow
2. Use `amazon-devices-buildertools-mcp:read_document` to read `vega_developer_mode_enablement.md` for detailed troubleshooting and error code reference
3. Use `amazon-devices-buildertools-mcp:search_documentation` to find specific troubleshooting topics when errors occur

## Dependencies

Tools used from `amazon-devices-buildertools-mcp`:
- `amazon-devices-buildertools-mcp:read_document`
- `amazon-devices-buildertools-mcp:list_documents`
- `amazon-devices-buildertools-mcp:search_documentation`

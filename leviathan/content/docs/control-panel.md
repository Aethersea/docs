---
title: "Control Panel"
description: "The Leviathan desktop GUI for configuration, credentials, paired clients, and the installed service."
---

Leviathan ships with a desktop control panel, `leviathan-panel` (`leviathan-panel.exe` on Windows). It is a resident system-tray / menu-bar app for the operator of a host: it edits the same `config.toml` the server reads, manages pairing credentials, lists and revokes paired clients, and starts or stops the installed service. It does not run the streaming server itself.

## Starting the Panel

| Platform | How to start |
|----------|--------------|
| macOS | Open `Leviathan.app` from the Dock, from Finder, or with `open -a Leviathan`. |
| Windows / Linux | Launch the `leviathan-panel` (`leviathan-panel.exe`) binary. |

If you build from source:

```bash
make panel       # build the panel binary
make run-panel   # build and launch it
```

The panel lives in the system tray (Windows / Linux) or the menu bar (macOS). Closing its window **hides** it rather than quitting — reopen it from the tray menu, and quit it from there too.

## On macOS: opening the app starts the panel, not the server

This is the part that surprises people. On macOS the panel is the app bundle's main executable, so **opening `Leviathan.app` launches the control panel, not the streaming server.** The panel opens as a normal foreground app — Dock icon and menu-bar item included — and closing its window hides it to the menu bar rather than quitting. The server is a separate binary inside the same bundle at `Contents/MacOS/leviathan` and runs as the launchd LaunchAgent described in [Getting Started](./getting-started). Opening the app and running the server are independent; both can run at the same time.

If you opened `Leviathan.app` expecting the host to start streaming, use the **Service** page in the panel to verify the installed agent is running, or follow the CLI / launchd path in [Getting Started](./getting-started).

## Pages

All five pages exist on every platform; only **Permissions** behaves differently by platform (see below).

### Settings

Edits the server's `config.toml` directly — the same file documented in [Configuration](./configuration). Two buttons, and the difference matters:

- **Save** writes the file and stops there. A running server keeps using its current settings until it is restarted.
- **Save & Apply** writes the file and makes the running server pick it up. Most settings are consumed by the streaming child process, which is recycled in place. Changing the `[network]` section is the exception: the public port and bind address are read once when the service starts, so those changes trigger a full service restart, which can take a few seconds.

#### Virtual Display (Windows only)

The **Virtual Display** category edits the `[virtual_display]` section of [Configuration](./configuration) — the bundled Virtual Display Driver that lets a host stream without a physical monitor. It shows a live status badge queried from the service (**ACTIVE**, **DISABLED**, **NOT CREATED**, **DRIVER MISSING**, or **SERVICE OFFLINE** when the service is not running) with the device's instance ID and whether it is managed by Leviathan or was installed outside it, a **Refresh** button, and the settings themselves: an **Enable** checkbox, monitors, global refresh rates, resolutions (one `WxH@Hz` per line), the render GPU (a drop-down of the machine's adapter names, free text allowed), **Make it the primary display when streaming starts**, hardware cursor and driver logging.

Saving this category applies immediately: the service stops the capture process, reloads the driver device, and restarts capture, while the panel shows *Applying…* and polls the status until it settles. A reconcile failure is reported in a dialog; the configuration itself is still saved.

The driver package is only present when the **Virtual Display Driver** component was selected in the installer (it is unchecked by default because it adds the driver's code-signing publisher, SignPath Foundation, to the machine's Trusted Publishers). The installer runs `leviathan vdd install-driver` to stage it and the uninstaller runs `leviathan vdd uninstall`; `leviathan vdd status` shows the same state as the badge.

### Credentials & TOTP

Sets the server username and password used during [pairing](./pairing), and enrolls or clears the TOTP (2FA) shared secret. This is the GUI equivalent of `leviathan set-credentials` and `leviathan totp enroll` / `totp disable`.

### Paired Clients

Lists the trusted clients in `trusted_clients.json` and revokes one by its `client_id` — the GUI equivalent of `ManagementService.Unpair`. Revocation takes effect for new sessions; an already-connected client is not kicked mid-stream.

### Permissions

On **macOS**, this page manages the two grants the streaming server needs:

- It shows the live state of **Screen Recording** and **Accessibility**.
- A button opens the matching System Settings pane; another raises the macOS consent prompt.
- A **Restart service** button restarts the installed server.

The restart matters because macOS only evaluates a **Screen Recording** grant when a process starts. Granting it does **not** fix a server that is already running — that server keeps sending a frozen wallpaper image until it restarts. **Accessibility** takes effect immediately, so a restart is only needed after granting Screen Recording. See [Capture](./capture) for the underlying rule.

On **Windows and Linux**, this page reports that the platform has no user-grantable capture or input permissions: access is enforced by ACLs, and failures surface as errors when a stream starts rather than as consent prompts to grant here.

### Service

Starts, stops, and restarts the installed system service — the Windows SCM service or the macOS launchd LaunchAgent. Use it when you have changed `config.toml` and want the server to pick it up, or to stop the host from serving without uninstalling. Installing and uninstalling the service themselves remain CLI (`leviathan service install` / `service uninstall`).
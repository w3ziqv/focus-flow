# Physical Windows acceptance — cloud test candidate

Prepared: 2026-10-11. This is an unsigned **3.0.0-alpha.2** test installer,
not a stable release. Linux acceptance does not establish Windows readiness.

## Owner results — 2026-10-18

The owner confirmed that Google login, synchronization and operation after app
restart work on a physical Windows computer. These three scenarios are accepted
as owner-reported results. The question referred to alpha.2; the exact installer
hash and Windows version were not supplied. In a subsequent explicit question,
the owner also accepted Windows/Linux notifications, autostart after login,
sleep/resume, tray/mini and screen-reader operation. Physical Windows audio,
offline retry, production OAuth, revocation/store fallback and update/rollback
retain their separate status.

## Exact download

Download these three assets from [alpha.2](https://github.com/w3ziqv/focus-flow/releases/tag/v3.0.0-alpha.2):

- `Focus-Flow_3.0.0-alpha.2_x64-setup.exe`.
- `SHA256SUMS.txt`.
- `desktop-build.json`, containing the exact build commit and test-cloud target.

Firebase must be `focus-flow-v3-test-20261010` with `mode: test`, also used by the
[web Preview](https://focus-flow-git-test-v30-cloud-w3ziqvs-projects.vercel.app/).

In PowerShell, from the download directory:

```powershell
Get-FileHash '.\Focus-Flow_3.0.0-alpha.2_x64-setup.exe' -Algorithm SHA256
```

Compare the result with the entry for that exact filename in `SHA256SUMS.txt`.
The release notes identify the build commit and successful checks; compare it
with `desktop-build.json`. The older alpha.1 release assets lack these fixes and
cloud configuration. The alpha.2 release is published only after new installer
and installed-runtime checks pass.

## Before installation

Use a Windows x64 computer. If Focus Flow is already installed, export a full JSON
backup, Quit the app, copy `%APPDATA%\ink.focusflow.desktop\` and retain the old
installer before changing it. See [installation and rollback](INSTALL-UPDATE.md).
Run the new installer as the current user. An unsigned installer may trigger
SmartScreen; verify the exact download/hash before deciding whether to run it.
Do not disable Windows security settings. WebView2 is required by the native app.

## First test pass

1. Open the app, start/pause/reset a timer, and play rain or waves. Check that
   desktop settings match the rest of the app.
2. Open Cloud synchronization and sign in with the same Google account used in
   the web Preview. The system browser should open and return a connected account
   and successful synchronization. Check that error details, if present, name
   the test project above. Report only the error code; never send tokens or the
   callback URL.
3. Quit from the tray and reopen. The account should restore and synchronize
   without another Google login. Confirm history/settings remain available.
4. Open the floating timer, control the session, close the main window with X,
   and restore it through the tray's `Show Focus Flow` item. Check that the
   floating timer and main window show the same session state.
5. Temporarily disconnect the network. Complete a short test session, reconnect,
   retry synchronization and confirm that session appears once in the web Preview.
   Keep the web timer paused; active timers intentionally remain device-local.

Record the Windows version, installer hash, each result and any safe error code.
These results supplement automated installed-runtime tests; they do not close all
release gates.

## Remaining physical checks

- Finish a short session and verify actual sound/notification delivery. Record
  whether Windows notification permissions or Focus Assist affect delivery.
- Enable autostart, Quit, sign out of Windows and sign in again. Confirm startup;
  restore your preferred autostart setting afterward.
- Test sleep/resume with keep-awake disabled, then inspect timer/session history
  and cloud reconnection for duplicate or lost completions.
- Check keyboard navigation, 200% scaling, high contrast and a real screen reader.
- Exercise consent revocation, unavailable credential storage, logout,
  update/rollback with backups, older-data migration and the full two-device
  scenarios in [TESTING-CLOUD.md](TESTING-CLOUD.md). Record separate evidence;
  a same-version reinstall alone does not establish update/rollback readiness.

Keep [PR #4](https://github.com/w3ziqv/focus-flow/pull/4) open until the remaining
gates in [VERIFICATION-3.0.md](VERIFICATION-3.0.md) pass. Do not publish `v3.0.0`
based on automated tests or the first manual pass alone.

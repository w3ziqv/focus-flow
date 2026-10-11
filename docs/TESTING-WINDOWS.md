# Physical Windows acceptance — cloud test candidate

Prepared: 2026-10-11. This is an unsigned **3.0.0-alpha.1** test installer,
not a stable release. Linux acceptance does not establish Windows readiness.

## Exact download

- [Windows artifact ZIP](https://github.com/w3ziqv/focus-flow/actions/runs/38088756415/artifacts/11683242423)
  from the successful [cloud Desktop run](https://github.com/w3ziqv/focus-flow/actions/runs/38088756415).
  Sign in to GitHub if required. Extract the ZIP before installation.
- Installer: `nsis/Focus Flow_3.0.0-alpha.1_x64-setup.exe`.
- Source: `5aa55b5bcf0852c79034bcff0a02362884f5de55`.
- Firebase: `focus-flow-v3-test-20261010`, also used by the
  [web Preview](https://focus-flow-git-test-v30-cloud-w3ziqvs-projects.vercel.app/).
- SHA-256:
  `0b8aee8a208c75bd431449c6f8e6db44153e6fc93c12c03f84bbc9fa13c5da81`.

In PowerShell, from the extracted ZIP directory:

```powershell
Get-FileHash '.\nsis\Focus Flow_3.0.0-alpha.1_x64-setup.exe' -Algorithm SHA256
```

Compare the result with both the value above and the extracted `SHA256SUMS.txt`.
`desktop-build.json` must match the source/project above and `mode: test`.
The older published alpha release assets do not contain these fixes/configuration.
Actions artifacts expire; if this link expires, obtain a newly verified candidate.

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

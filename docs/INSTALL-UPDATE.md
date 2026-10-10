# Installation, updates and rollback

This release remains `3.0.0-alpha.1`. CI installers and the published alpha are
test builds, not evidence of stable readiness. **Installers are unsigned**:
Windows may show SmartScreen, and macOS is not notarized and remains experimental.
SHA-256 verifies downloaded file integrity; it does not establish publisher identity.

## Download and verify

Download the installer and `SHA256SUMS.txt` from the same GitHub Actions run or
the same GitHub Release. Preserve the directory structure listed in the manifest
and run `sha256sum -c SHA256SUMS.txt` on Linux. Release assets use a flat manifest;
keep its files together. On Windows, compare
`Get-FileHash .\Focus-Flow-setup.exe -Algorithm SHA256` with the entry for the exact
downloaded filename. Installer names vary by version.

Linux: Ubuntu 24.04 CI builds x86_64 `.deb` and `.AppImage` packages. Install a
`.deb` using `sudo apt install ./<file>.deb` to resolve required libraries.
For AppImage, grant execute permission (`chmod +x <file>.AppImage`) and run it.
If the distribution requires FUSE, use its FUSE package or the `.deb` on Ubuntu.
A local Arch-built `.deb` proves packaging, not Ubuntu ABI compatibility;
distribution uses the Ubuntu runner artifact.

Windows: CI produces an NSIS `.exe` installer. Close the application, run the
installer as the current user and preserve the same installation scope when
updating. Check the source, version and file hash before responding to OS warnings.

## Before updating

1. Export a complete JSON backup from data settings. Custom audio stays local;
   also preserve the `sounds` folder if you use your own recordings.
2. Finish or pause the active session and close the application using Quit.
3. Copy the complete application data directory to a separate location:
   - Linux: `${XDG_DATA_HOME:-~/.local/share}/ink.focusflow.desktop/`.
   - Windows: `%APPDATA%\ink.focusflow.desktop\`.
4. Keep the previous installer. Updates retain the application identifier and
   do not intentionally remove its data directory. Avoid uninstaller data cleanup
   if you need to preserve the profile.

Native persistence retains `data.json` and the previous valid `data.json.bak`.
Corruption does not replace the source with empty data; recovery preserves the
damaged file as `data.json.corrupt`. History-migration and account-switch backups
use `ff3_history_source_<uid>` and `ff3_account_backup_<uid>` inside the same file.
Keep them until history consistency is confirmed. Refresh tokens are not part
of the JSON backup; they remain in the OS credential store.

## Rollback

Close the application, preserve the newer data directory separately, reinstall
the previous version and restore **the backup made before updating**. Do not
experiment by opening newer-schema data in an older client. Sign out of cloud
before rollback so an older client cannot overwrite the new schema. New rules
reject legacy history maps; older clients may need to remain offline. For web/PWA,
keep a JSON export: browser storage does not replace an independent backup.

Release acceptance still requires real installation and update on Linux and
Windows, plus tray/mini/audio/notifications/autostart and suspend/resume checks.
Building installers and automated fresh-install smoke do not close those gates.

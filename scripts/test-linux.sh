#!/usr/bin/env bash
set -euo pipefail
# Install the actual CI bundle, then exercise it in a fresh X11/DBus profile.
installer=$(find src-tauri/target/release/bundle/deb -maxdepth 1 -name '*.deb' -print -quit)
[[ -n "$installer" ]] || { echo 'Debian installer was not built' >&2; exit 1; }
sudo apt-get install -y "$(realpath "$installer")"
profile=$(mktemp -d)
cleanup() {
  # The document portal can outlive its private DBus session and leave a FUSE
  # mount here. Detach only this mktemp profile's mount before removing it.
  if mountpoint -q "$profile/runtime/doc"; then
    fusermount3 -uz "$profile/runtime/doc"
  fi
  rm -rf "$profile"
}
trap cleanup EXIT
export XDG_DATA_HOME="$profile/data" XDG_CONFIG_HOME="$profile/config" XDG_CACHE_HOME="$profile/cache"
export XDG_RUNTIME_DIR="$profile/runtime"
mkdir -p "$XDG_RUNTIME_DIR"
chmod 700 "$XDG_RUNTIME_DIR"
export GDK_BACKEND=x11 XDG_SESSION_TYPE=x11 XDG_CURRENT_DESKTOP=GNOME
unset WAYLAND_DISPLAY
export FOCUS_FLOW_BINARY=/usr/bin/focus-flow
export FOCUS_FLOW_TEST_AUTOSTART=1 FOCUS_FLOW_TEST_HOTKEYS=1
export FOCUS_FLOW_SCREENSHOT="${RUNNER_TEMP:-/tmp}/focus-flow-linux.png"
xvfb-run -a dbus-run-session -- bash -c '
  set -euo pipefail
  tauri-driver --native-driver /usr/bin/WebKitWebDriver > "${RUNNER_TEMP:-/tmp}/tauri-driver-linux.log" 2>&1 &
  driver_pid=$!
  trap "kill $driver_pid 2>/dev/null || true" EXIT
  for attempt in {1..100}; do
    if curl -fsS http://127.0.0.1:4444/status >/dev/null; then break; fi
    sleep .1
  done
  curl -fsS http://127.0.0.1:4444/status >/dev/null
  python3 scripts/test-native.py
'
# Shell tray/audio/notification delivery, update/rollback and physical sleep
# remain separate OS acceptance gates even after this installed smoke passes.

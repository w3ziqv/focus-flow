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
export FOCUS_FLOW_TEST_AUTOSTART=1 FOCUS_FLOW_TEST_HOTKEYS=1
native_smoke() {
  xvfb-run -a dbus-run-session -- bash -c '
  set -euo pipefail
  # Provide a private audio server instead of probing absent hardware/OpenAL.
  export PULSE_SERVER="unix:$XDG_RUNTIME_DIR/pulse/native"
  pulseaudio --daemonize=no --file=/dev/null --exit-idle-time=-1 \
    --load=module-native-protocol-unix \
    --load="module-null-sink sink_name=focus_flow_ci" > "$FOCUS_FLOW_DRIVER_LOG.pulse.log" 2>&1 &
  pulse_pid=$!
  driver_pid=""
  trap "kill ${driver_pid:-} $pulse_pid 2>/dev/null || true" EXIT
  for attempt in {1..100}; do
    [[ -S "$XDG_RUNTIME_DIR/pulse/native" ]] && break
    sleep .1
  done
  [[ -S "$XDG_RUNTIME_DIR/pulse/native" ]]
  driver_env=()
  if [[ -n "${FOCUS_FLOW_NATIVE_LIBRARY_PATH:-}" ]]; then
    # The portable app and automation driver must load the same WebKit runtime.
    driver_env+=("LD_LIBRARY_PATH=$FOCUS_FLOW_NATIVE_LIBRARY_PATH")
    env "${driver_env[@]}" ldd /usr/bin/WebKitWebDriver > "$FOCUS_FLOW_DRIVER_LOG.libraries.log"
  fi
  if [[ "${FOCUS_FLOW_DIRECT_WEBKIT_DRIVER:-}" == "1" ]]; then
    # Avoid the proxy connection-pool reset while retaining all native assertions.
    env "${driver_env[@]}" TAURI_AUTOMATION=true TAURI_WEBVIEW_AUTOMATION=true \
      /usr/bin/WebKitWebDriver --port=4444 --host=127.0.0.1 > "$FOCUS_FLOW_DRIVER_LOG" 2>&1 &
  else
    env "${driver_env[@]}" tauri-driver --native-driver /usr/bin/WebKitWebDriver > "$FOCUS_FLOW_DRIVER_LOG" 2>&1 &
  fi
  driver_pid=$!
  trap "kill $driver_pid $pulse_pid 2>/dev/null || true" EXIT
  for attempt in {1..100}; do
    if curl -fsS http://127.0.0.1:4444/status >/dev/null; then break; fi
    sleep .1
  done
  curl -fsS http://127.0.0.1:4444/status >/dev/null
  python3 scripts/test-native.py
'
}
export FOCUS_FLOW_BINARY=/usr/bin/focus-flow
export FOCUS_FLOW_SCREENSHOT="${RUNNER_TEMP:-/tmp}/focus-flow-linux.png"
export FOCUS_FLOW_DRIVER_LOG="${RUNNER_TEMP:-/tmp}/tauri-driver-linux.log"
native_smoke

# Exercise the portable package too. The installed .deb uses host GStreamer,
# which previously hid the AppImage's missing media plugins on minimal systems.
appimage=$(find src-tauri/target/release/bundle/appimage -maxdepth 1 -name '*.AppImage' -print -quit)
[[ -n "$appimage" ]] || { echo 'AppImage installer was not built' >&2; exit 1; }
appimage=$(realpath "$appimage")
chmod u+x "$appimage"
mkdir -p "$profile/appimage-package"
(cd "$profile/appimage-package" && "$appimage" --appimage-extract > /dev/null)
appdir="$profile/appimage-package/squashfs-root"
for plugin in app autodetect audioconvert audioresample pulseaudio; do
  [[ -f "$appdir/usr/lib/gstreamer-1.0/libgst$plugin.so" ]] || {
    echo "AppImage is missing the $plugin media plugin" >&2; exit 1;
  }
done
[[ -x "$appdir/usr/lib/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner" ]]
[[ -f "$appdir/apprun-hooks/linuxdeploy-plugin-gstreamer.sh" ]]
# Exclude host plugin discovery even if the runtime runner has codecs installed.
export GST_PLUGIN_SYSTEM_PATH_1_0="$appdir/usr/lib/gstreamer-1.0"
export GST_PLUGIN_PATH_1_0="$appdir/usr/lib/gstreamer-1.0"
export GST_PLUGIN_SCANNER_1_0="$appdir/usr/lib/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner"
export APPDIR="$appdir"
export FOCUS_FLOW_NATIVE_LIBRARY_PATH="$appdir/usr/lib"
export FOCUS_FLOW_DIRECT_WEBKIT_DRIVER=1
export XDG_DATA_HOME="$profile/appimage-data" XDG_CONFIG_HOME="$profile/appimage-config" XDG_CACHE_HOME="$profile/appimage-cache"
export FOCUS_FLOW_BINARY="$appdir/AppRun"
export FOCUS_FLOW_SCREENSHOT="${RUNNER_TEMP:-/tmp}/focus-flow-linux-appimage.png"
export FOCUS_FLOW_DRIVER_LOG="${RUNNER_TEMP:-/tmp}/tauri-driver-linux-appimage.log"
native_smoke
echo 'PASS: AppImage native smoke with bundled GStreamer and host plugins excluded'
# Shell tray/audio/notification delivery, update/rollback and physical sleep
# remain separate OS acceptance gates even after this installed smoke passes.

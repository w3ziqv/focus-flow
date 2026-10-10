"""Smoke the built Tauri app through tauri-driver using an isolated OS profile.
Start tauri-driver first; set FOCUS_FLOW_BINARY to the absolute packaged binary.
"""
import base64
import json
import os
from pathlib import Path
import time
import urllib.request
import urllib.error

endpoint = os.environ.get('TAURI_DRIVER_URL', 'http://127.0.0.1:4444')
binary = os.environ['FOCUS_FLOW_BINARY']

def http(method, url, data=None):
    payload = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=payload, method=method,
                                 headers={'Content-Type': 'application/json'})
    try:
        # The native driver can spend up to a minute starting a fresh WebView2.
        timeout = 120 if method == 'POST' and url.endswith('/session') else 35
        return json.load(urllib.request.urlopen(req, timeout=timeout))['value']
    except urllib.error.HTTPError as error:
        raise RuntimeError(f'{method} {url}: {error.read().decode()}') from error

capabilities = {'tauri:options': {'application': binary}}
if os.environ.get('FOCUS_FLOW_DIRECT_WEBKIT_DRIVER'):
    # This is the same native capability mapping used by tauri-driver on Linux.
    capabilities = {'webkitgtk:browserOptions': {'binary': binary, 'args': []}}
if os.environ.get('FOCUS_FLOW_DIRECT_EDGE_DRIVER'):
    # Native EdgeDriver exposes WebView2 directly; retain verbose driver logs.
    capabilities = {'browserName': 'webview2', 'ms:edgeOptions': {
        'binary': binary, 'webviewOptions': {
            'userDataFolder': os.environ['FOCUS_FLOW_WEBVIEW_PROFILE']}}}
session = http('POST', endpoint + '/session', {'capabilities': {
    'alwaysMatch': capabilities}})['sessionId']
base = endpoint + '/session/' + session

def request(method, path, data=None):
    return http(method, base + path, data)

def script(js):
    return request('POST', '/execute/sync', {'script': js, 'args': []})

def invoke(command, args=None, expected=True):
    result = request('POST', '/execute/async', {
        'script': 'const done=arguments[arguments.length-1];window.__TAURI_INTERNALS__.invoke(arguments[0],arguments[1]).then(value=>done({ok:true,value})).catch(error=>done({ok:false,error:String(error)}))',
        'args': [command, args or {}]})
    assert result['ok'] == expected, result
    return result.get('value')

try:
    startup_error = None
    for _ in range(100):
        try:
            if script('return !!document.querySelector("input")'): break
        except RuntimeError as error:
            # WebKit can publish its window before the first document exists.
            # Retry only this startup condition, never a crashed/deleted session.
            if '"error":"unknown error"' not in str(error): raise
            startup_error = error
        time.sleep(.1)
    else: raise AssertionError(f'Application UI did not load: {startup_error or script("return document.body.innerText")}')
    script('document.querySelector("button[aria-label=Close]")?.click()')
    cloud = invoke('cloud_status')
    assert isinstance(cloud['configured'], bool) and isinstance(cloud['persistent'], bool), cloud
    if not cloud['configured']:
        invoke('cloud_sign_in', expected=False)
        assert cloud['user'] is None
    recordings = request('POST', '/execute/async', {
        'script': """const done=arguments[arguments.length-1];(async()=>{
          const ctx=new AudioContext();
          try {
            const results=[];
            for (const sound of ['rain','waves']) {
              const response=await fetch(`/sounds/moodist/${sound}.mp3`);
              if (!response.ok) throw Error(`Missing recording: ${sound}`);
              const buffer=await ctx.decodeAudioData(await response.arrayBuffer());
              results.push({sound,duration:buffer.duration,channels:buffer.numberOfChannels});
            }
            const notice=await fetch('/sounds/moodist/NOTICE.txt');
            if (!notice.ok || !(await notice.text()).includes('Pixabay')) throw Error('Missing attribution');
            return results;
          } finally {await ctx.close();}
        })().then(value=>done({ok:true,value})).catch(error=>done({ok:false,error:String(error)}))""",
        'args': []})
    assert recordings['ok'], recordings
    for recording in recordings['value']:
        assert abs(recording['duration'] - 58) < .1 and recording['channels'] == 2, recording
    print('PASS: bundled rain/wave MP3s decode in the native WebView; attribution is embedded')
    current = invoke('timer_display')
    if current['running']: invoke('desktop_action', {'name': 'toggle'})
    invoke('desktop_action', {'name': 'reset'})
    time.sleep(.2)
    for _ in range(3):
        if invoke('timer_display')['mode'] == 'focus': break
        invoke('desktop_action', {'name': 'skip'})
        time.sleep(.2)

    script('const el=document.querySelector("input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"Native smoke verification");el.dispatchEvent(new Event("input",{bubbles:true}));el.blur()')
    invoke('desktop_action', {'name': 'toggle'})
    time.sleep(1.5)
    timer = invoke('timer_display')
    assert timer['running'] and timer['remainingMs'] < timer['totalMs'], timer
    invoke('desktop_action', {'name': 'toggle'})
    time.sleep(.3)
    assert not invoke('timer_display')['running']
    if os.environ.get('FOCUS_FLOW_TEST_HOTKEYS'):
        import ctypes
        x11 = ctypes.CDLL('libX11.so.6')
        xtest = ctypes.CDLL('libXtst.so.6')
        x11.XOpenDisplay.restype = ctypes.c_void_p
        x11.XOpenDisplay.argtypes = [ctypes.c_char_p]
        x11.XStringToKeysym.restype = ctypes.c_ulong
        x11.XStringToKeysym.argtypes = [ctypes.c_char_p]
        x11.XKeysymToKeycode.argtypes = [ctypes.c_void_p, ctypes.c_ulong]
        x11.XKeysymToKeycode.restype = ctypes.c_uint
        x11.XFlush.argtypes = [ctypes.c_void_p]
        x11.XCloseDisplay.argtypes = [ctypes.c_void_p]
        xtest.XTestFakeKeyEvent.argtypes = [ctypes.c_void_p, ctypes.c_uint, ctypes.c_int, ctypes.c_ulong]
        display = x11.XOpenDisplay(None)
        assert display, 'X display unavailable'
        keys = [x11.XKeysymToKeycode(display, x11.XStringToKeysym(key)) for key in [b'Control_L', b'Alt_L', b'space']]
        def toggle_key():
            for key in keys: xtest.XTestFakeKeyEvent(display, key, 1, 0)
            for key in reversed(keys): xtest.XTestFakeKeyEvent(display, key, 0, 0)
            x11.XFlush(display)
            time.sleep(.4)
        toggle_key()
        assert invoke('timer_display')['running'], 'Global hotkey failed'
        toggle_key()
        assert not invoke('timer_display')['running'], 'Global hotkey double toggle failed'
        x11.XCloseDisplay(display)
        print('PASS: Linux X11 Ctrl+Alt+Space global shortcut')
    assert 'Native smoke verification'  in invoke('load_data')['values']['ff2_session']
    file_test = request('POST', '/execute/async', {
        'script': """const done=arguments[arguments.length-1];(async()=>{
          const invoke=window.__TAURI_INTERNALS__.invoke;
          const options={baseDir:14}; const path='sounds/native-smoke.bin';
          await invoke('plugin:fs|mkdir',{path:'sounds',options:{...options,recursive:true}});
          await invoke('plugin:fs|write_file',new Uint8Array([1,2,3]),{headers:{path:encodeURIComponent(path),options:JSON.stringify(options)}});
          const data=await invoke('plugin:fs|read_file',{path,options});
          const bytes=data instanceof ArrayBuffer ? Array.from(new Uint8Array(data)) : Array.from(data);
          await invoke('plugin:fs|remove',{path,options});
          return bytes;
        })().then(value=>done({ok:true,value})).catch(error=>done({ok:false,error:String(error)}))""",
        'args': []})
    assert file_test == {'ok': True, 'value': [1,2,3]}, file_test
    invoke('plugin:fs|read_file', {'path': 'outside-scope.bin', 'options': {'baseDir': 14}}, expected=False)
    assert isinstance(invoke('plugin:notification|is_permission_granted'), bool)
    if os.environ.get('FOCUS_FLOW_TEST_AUTOSTART'):
        initial = invoke('plugin:autostart|is_enabled')
        try:
            invoke('plugin:autostart|enable')
            assert invoke('plugin:autostart|is_enabled')
            invoke('plugin:autostart|disable')
            assert not invoke('plugin:autostart|is_enabled')
        finally:
            if initial: invoke('plugin:autostart|enable')
        print('PASS: native autostart enable/query/disable')
    print('PASS: native binary sound file round trip, file scope denial, notification permission IPC')
    main = request('GET', '/window')
    invoke('toggle_mini')
    time.sleep(1)
    handles = request('GET', '/window/handles')
    assert len(handles) == 2, handles
    request('POST', '/window', {'handle': next(h for h in handles if h != main)})
    assert script('return innerWidth') == 220
    assert script('return innerHeight') == 80
    output = os.environ.get('FOCUS_FLOW_SCREENSHOT')
    if output:
        image_path = Path(output)
        image_path.with_name(image_path.stem + '-mini.png').write_bytes(base64.b64decode(request('GET', '/screenshot')))
    invoke('desktop_action', {'name': 'quit'}, expected=False)
    invoke('desktop_action', {'name': 'reset'}, expected=False)
    invoke('toggle_mini', expected=False)
    invoke('cloud_status', expected=False)
    invoke('cloud_sign_in', expected=False)
    invoke('cloud_commit', {'operations': []}, expected=False)
    invoke('desktop_warnings', expected=False)
    invoke('load_data', expected=False)
    invoke('save_data', {'snapshot': {'version': 3, 'values': {}}}, expected=False)
    invoke('desktop_action', {'name': 'toggle'})
    time.sleep(.4)
    assert invoke('timer_display')['running']
    request('POST', '/window', {'handle': main})
    # Exercise both the asynchronous command and the UI-event action path.
    assert invoke('plugin:window|is_visible', {'label': 'mini'})
    invoke('desktop_action', {'name': 'mini'})
    for _ in range(100):
        if not invoke('plugin:window|is_visible', {'label': 'mini'}): break
        time.sleep(.1)
    else: raise AssertionError('Mini action did not hide the window')
    invoke('toggle_mini')
    assert invoke('plugin:window|is_visible', {'label': 'mini'})
    print('PASS: mini command and UI-event action return without blocking')
    invoke('desktop_action', {'name': 'reset'})
    time.sleep(.3)
    assert not invoke('timer_display')['running']
    invoke('desktop_action', {'name': 'skip'})
    time.sleep(.3)
    assert invoke('timer_display')['mode'] in ('short', 'long')
    invoke('discovery_start', {'device': 'native_smoke_device', 'name': 'Smoke test'})
    invoke('discovery_stop')
    output = os.environ.get('FOCUS_FLOW_SCREENSHOT')
    if output: Path(output).write_bytes(base64.b64decode(request('GET', '/screenshot')))
    assert 'org.freedesktop.DBus.Error' not in script('return document.body.innerText'), 'Technical OS error leaked into the user message'
    print('PASS: native timer/actions, file persistence, mini 220x80, single timer, IPC isolation, discovery lifecycle')
    capability = script('return typeof RTCPeerConnection')
    print('WebRTC capability:', capability)
    script('document.querySelector("button[aria-label=App]").click()')
    time.sleep(.5)
    assert 'does not support WebRTC' not in script('return document.body.innerText'), 'Advanced pairing details leaked into the main list'
    if output:
        p = Path(output)
        p.with_name(p.stem + '-settings.png').write_bytes(base64.b64decode(request('GET', '/screenshot')))
    script('Array.from(document.querySelectorAll("button")).find(button=>button.textContent.includes("Desktop application")).click()')
    for _ in range(50):
        if 'Only while the timer is running.' in script('return document.body.innerText'): break
        time.sleep(.1)
    else: raise AssertionError('Desktop settings detail did not load')
    assert script('return document.querySelectorAll("button[role=switch]").length') == 2
    if output:
        p = Path(output)
        p.with_name(p.stem + '-desktop-settings.png').write_bytes(base64.b64decode(request('GET', '/screenshot')))
    script('Array.from(document.querySelectorAll("button")).find(button=>button.textContent.trim()==="Back").click()')
    print('PASS: desktop settings detail navigation and advanced pairing separation')
    if capability == 'undefined':
        script('document.querySelector("summary").click();Array.from(document.querySelectorAll("button")).find(button=>button.textContent.includes("Local synchronization")).click()')
        for _ in range(50):
            if 'does not support WebRTC' in script('return document.body.innerText'): break
            time.sleep(.1)
        assert 'does not support WebRTC' in script('return document.body.innerText')
        assert script('return Array.from(document.querySelectorAll("button[role=switch]")).some(button=>button.disabled)')
        print('PASS: unsupported WebRTC is explained and pairing is disabled')
finally:
    request('DELETE', '')

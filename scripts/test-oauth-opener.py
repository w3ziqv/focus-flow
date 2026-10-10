#!/usr/bin/python3
"""CI-only browser replacement: validate the native launch, never authenticate."""
import json
import os
from pathlib import Path
import subprocess
import sys
from urllib.parse import parse_qs, urlsplit

url = urlsplit(sys.argv[1])
query = parse_qs(url.query)
redirect = urlsplit(query.get('redirect_uri', [''])[0])
appdir = os.environ.get('APPDIR')
library_paths = os.environ.get('LD_LIBRARY_PATH', '').split(':')
clean = not appdir or all(
    not Path(path).is_relative_to(Path(appdir)) for path in library_paths if path)
gio = subprocess.run(['/usr/bin/gio', 'version'], capture_output=True, timeout=5)
checks = {
    'hostLibraries': clean,
    'hostGio': gio.returncode == 0,
    'googleEndpoint': url.scheme == 'https' and url.netloc == 'accounts.google.com'
        and url.path == '/o/oauth2/v2/auth',
    'pkce': query.get('code_challenge_method') == ['S256']
        and len(query.get('code_challenge', [''])[0]) == 43,
    'state': len(query.get('state', [''])[0]) == 43,
    'loopback': redirect.scheme == 'http' and redirect.hostname == '127.0.0.1'
        and redirect.path == '/callback' and bool(redirect.port),
    'scopes': query.get('scope') == ['openid email profile'],
}
# Store only assertions, never the URL, state, PKCE verifier or tokens.
record = Path(os.environ['FOCUS_FLOW_BROWSER_PROBE'])
record.write_text(json.dumps(checks))
sys.exit(0 if all(checks.values()) else 1)

$ErrorActionPreference = 'Stop'
$installer = Get-ChildItem 'src-tauri/target/release/bundle/nsis/*.exe' | Select-Object -First 1
if (-not $installer) { throw 'NSIS installer was not built' }
$installDirectory = Join-Path $env:RUNNER_TEMP 'focus-flow-install'
$installation = Start-Process -FilePath $installer.FullName -ArgumentList @('/S', "/D=$installDirectory") -Wait -PassThru
if ($installation.ExitCode -ne 0) { throw "Installer exited with $($installation.ExitCode)" }
$application = Join-Path $installDirectory 'focus-flow.exe'
if (-not (Test-Path $application)) { throw "Installed application missing: $application" }
$runtime = Get-ChildItem "${env:ProgramFiles(x86)}/Microsoft/EdgeWebView/Application/*/msedgewebview2.exe" | Sort-Object { [version] $_.VersionInfo.ProductVersion } -Descending | Select-Object -First 1
if (-not $runtime) { throw 'WebView2 runtime unavailable; Windows runtime gate remains open' }
$version = $runtime.VersionInfo.ProductVersion
$archive = Join-Path $env:RUNNER_TEMP 'edgedriver.zip'
$driverDirectory = Join-Path $env:RUNNER_TEMP 'edgedriver'
Invoke-WebRequest "https://msedgedriver.microsoft.com/$version/edgedriver_win64.zip" -OutFile $archive
Expand-Archive $archive -DestinationPath $driverDirectory -Force
$nativeDriver = Join-Path $driverDirectory 'msedgedriver.exe'
$signature = Get-AuthenticodeSignature $nativeDriver
if ($signature.Status -ne 'Valid') { throw 'Microsoft WebDriver signature validation failed' }
$driver = Start-Process -FilePath (Join-Path $env:USERPROFILE '.cargo/bin/tauri-driver.exe') -ArgumentList @('--native-driver', $nativeDriver) -PassThru -RedirectStandardOutput (Join-Path $env:RUNNER_TEMP 'tauri-driver.log') -RedirectStandardError (Join-Path $env:RUNNER_TEMP 'tauri-driver-error.log')
try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 100; $attempt++) {
    try { Invoke-WebRequest 'http://127.0.0.1:4444/status' -TimeoutSec 1 | Out-Null; $ready = $true; break } catch { Start-Sleep -Milliseconds 100 }
  }
  if (-not $ready) { throw 'Tauri driver did not start' }
  $env:FOCUS_FLOW_BINARY = $application
  $env:FOCUS_FLOW_TEST_AUTOSTART = '1'
  $env:FOCUS_FLOW_SCREENSHOT = Join-Path $env:RUNNER_TEMP 'focus-flow-windows.png'
  python scripts/test-native.py
  if ($LASTEXITCODE -ne 0) { throw 'Installed Windows app failed native smoke' }
} finally {
  Stop-Process -Id $driver.Id -ErrorAction SilentlyContinue
}
# This checks a fresh install and native interactions. Real login/autostart,
# physical sleep/wake, tray shell behavior and update/rollback still need OS acceptance.

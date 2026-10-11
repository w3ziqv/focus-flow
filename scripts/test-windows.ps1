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
# Diagnose application startup separately from a driver's connection timeout.
$startup = Start-Process -FilePath $application -PassThru -RedirectStandardOutput (Join-Path $env:RUNNER_TEMP 'tauri-driver-app.log') -RedirectStandardError (Join-Path $env:RUNNER_TEMP 'tauri-driver-app-error.log')
Start-Sleep -Seconds 5
$startup.Refresh()
if ($startup.HasExited) {
  Get-Content (Join-Path $env:RUNNER_TEMP 'tauri-driver-app-error.log')
  throw "Installed application exited before automation: $($startup.ExitCode)"
}
try {
  Add-Type -AssemblyName System.Windows.Forms,System.Drawing
  $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $bitmap = [System.Drawing.Bitmap]::new($bounds.Width, $bounds.Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
    $bitmap.Save((Join-Path $env:RUNNER_TEMP 'focus-flow-windows-startup.png'))
  } finally { $graphics.Dispose(); $bitmap.Dispose() }
} finally { Stop-Process -Id $startup.Id -ErrorAction SilentlyContinue }
$archive = Join-Path $env:RUNNER_TEMP 'edgedriver.zip'
$driverDirectory = Join-Path $env:RUNNER_TEMP 'edgedriver'
Invoke-WebRequest "https://msedgedriver.microsoft.com/$version/edgedriver_win64.zip" -OutFile $archive
Expand-Archive $archive -DestinationPath $driverDirectory -Force
$nativeDriver = Join-Path $driverDirectory 'msedgedriver.exe'
$signature = Get-AuthenticodeSignature $nativeDriver
if ($signature.Status -ne 'Valid') { throw 'Microsoft WebDriver signature validation failed' }
$env:FOCUS_FLOW_DIRECT_EDGE_DRIVER = '1'
$env:FOCUS_FLOW_WEBVIEW_PROFILE = Join-Path $env:RUNNER_TEMP 'focus-flow-webview-profile'
# Hosted runners are elevated. WebView2 150+ intentionally ignores user-writable
# WEBVIEW2_* environment overrides in elevated hosts. Use app-specific HKLM
# policies only in this disposable runner; restore them after the test.
# https://github.com/MicrosoftEdge/WebView2Feedback/issues/5640
$policyState = @()
foreach ($setting in @(
  @{ Name = 'AdditionalBrowserArguments'; Value = '--remote-debugging-port=0' },
  @{ Name = 'UserDataFolder'; Value = $env:FOCUS_FLOW_WEBVIEW_PROFILE }
)) {
  $policyPath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge\WebView2\$($setting.Name)"
  $policyKey = New-Item -Path $policyPath -Force
  $existed = $policyKey.GetValueNames() -contains 'focus-flow.exe'
  $policyState += @{ Path = $policyPath; Existed = $existed; Value = $policyKey.GetValue('focus-flow.exe'); Kind = $(if ($existed) { $policyKey.GetValueKind('focus-flow.exe') } else { $null }) }
  New-ItemProperty -Path $policyPath -Name 'focus-flow.exe' -Value $setting.Value -PropertyType String -Force | Out-Null
}
$driverLog = Join-Path $env:RUNNER_TEMP 'tauri-driver-native.log'
$driver = Start-Process -FilePath $nativeDriver -ArgumentList @('--port=4444', '--verbose', "--log-path=$driverLog") -PassThru -RedirectStandardOutput (Join-Path $env:RUNNER_TEMP 'tauri-driver.log') -RedirectStandardError (Join-Path $env:RUNNER_TEMP 'tauri-driver-error.log')
Write-Host "WebView2 $version; EdgeDriver $($signature.SignerCertificate.Subject)"
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
  Get-Process -Name focus-flow,msedgewebview2 -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,Responding,Path | Format-Table
  Stop-Process -Id $driver.Id -ErrorAction SilentlyContinue
  foreach ($policy in $policyState) {
    if ($policy.Existed) { (Get-Item $policy.Path).SetValue('focus-flow.exe', $policy.Value, $policy.Kind) }
    else { Remove-ItemProperty -Path $policy.Path -Name 'focus-flow.exe' -ErrorAction SilentlyContinue }
  }
}
# This checks a fresh install and native interactions. Real login/autostart,
# physical sleep/wake, tray shell behavior and update/rollback still need OS acceptance.

$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_OS -ne 'Windows') {
  throw 'This destructive synthetic-profile test requires a disposable Windows Actions runner'
}

$candidate = (Get-ChildItem 'src-tauri/target/release/bundle/nsis/*.exe' | Select-Object -First 1).FullName
if (-not $candidate) { throw 'Candidate installer missing' }
$baselineDirectory = Join-Path $env:RUNNER_TEMP 'focus-flow-upgrade-baseline'
New-Item -ItemType Directory -Path $baselineDirectory | Out-Null
$baselineName = 'Focus-Flow_3.0.0-alpha.2_x64-setup.exe'
gh release download v3.0.0-alpha.2 --repo w3ziqv/focus-flow --pattern $baselineName --dir $baselineDirectory
if ($LASTEXITCODE -ne 0) { throw 'Could not download the accepted baseline installer' }
$baseline = Join-Path $baselineDirectory $baselineName
# Pin the previously downloaded/verified alpha.2 binary, not a mutable latest asset.
if ((Get-FileHash $baseline -Algorithm SHA256).Hash.ToLowerInvariant() -ne '159b4c5d35c7b79cb9396e81130ba085cf89d15a62c9271abcf8ece7eb0430b6') {
  throw 'Baseline installer hash differs from accepted alpha.2'
}

$dataDirectory = Join-Path $env:APPDATA 'ink.focusflow.desktop'
$backupDirectory = Join-Path $env:RUNNER_TEMP 'focus-flow-before-upgrade'
$candidateBackup = Join-Path $env:RUNNER_TEMP 'focus-flow-before-rollback'
$mode = $env:FOCUS_FLOW_CLOUD_MODE
$project = $env:FOCUS_FLOW_EXPECT_CLOUD_PROJECT
$installDirectory = Join-Path $env:RUNNER_TEMP 'focus-flow-install'

function Uninstall-SyntheticApp {
  if (Get-Process -Name focus-flow -ErrorAction SilentlyContinue) { throw 'Application must exit before installer/data operations' }
  $uninstaller = Get-ChildItem (Join-Path $installDirectory '*uninstall*.exe') | Select-Object -First 1
  if ($uninstaller) {
    $result = Start-Process $uninstaller.FullName -ArgumentList '/S' -Wait -PassThru
    if ($result.ExitCode -ne 0) { throw 'Synthetic installation could not be removed' }
  }
}

function Smoke-Version($installer, $cloudMode, $cloudProject, $savedTask, $expectedTask, $phase) {
  $env:FOCUS_FLOW_INSTALLER = $installer
  $env:FOCUS_FLOW_CLOUD_MODE = $cloudMode
  $env:FOCUS_FLOW_EXPECT_CLOUD_PROJECT = $cloudProject
  $env:FOCUS_FLOW_RETENTION_TASK = $savedTask
  $env:FOCUS_FLOW_EXPECT_RETAINED_TASK = $expectedTask
  $env:FOCUS_FLOW_SCREENSHOT = Join-Path $env:RUNNER_TEMP "focus-flow-windows-$phase.png"
  & "$PSScriptRoot/test-windows.ps1"
  for ($attempt = 0; $attempt -lt 50; $attempt++) {
    if (-not (Get-Process -Name focus-flow -ErrorAction SilentlyContinue)) { break }
    Start-Sleep -Milliseconds 100
  }
  if (Get-Process -Name focus-flow -ErrorAction SilentlyContinue) { throw 'Native smoke did not exit the application' }
}

try {
  # The preceding fresh-install smoke used only this runner's synthetic profile.
  Uninstall-SyntheticApp
  if (Test-Path $dataDirectory) { Remove-Item $dataDirectory -Recurse -Force }
  Smoke-Version $baseline 'test' 'focus-flow-v3-test-20261010' 'TEST before upgrade' '' 'baseline'
  Copy-Item $dataDirectory $backupDirectory -Recurse
  Smoke-Version $candidate $mode $project 'TEST after upgrade' 'TEST before upgrade' 'upgraded'
  Copy-Item $dataDirectory $candidateBackup -Recurse
  Uninstall-SyntheticApp
  Remove-Item $dataDirectory -Recurse -Force
  Copy-Item $backupDirectory $dataDirectory -Recurse
  Smoke-Version $baseline 'test' 'focus-flow-v3-test-20261010' '' 'TEST before upgrade' 'rollback'
  Write-Host 'PASS: actual Windows baseline install, in-place candidate upgrade, saved-task retention and rollback from the pre-update backup'
} finally {
  $env:FOCUS_FLOW_CLOUD_MODE = $mode
  $env:FOCUS_FLOW_EXPECT_CLOUD_PROJECT = $project
  foreach ($name in @('FOCUS_FLOW_INSTALLER','FOCUS_FLOW_RETENTION_TASK','FOCUS_FLOW_EXPECT_RETAINED_TASK','FOCUS_FLOW_SCREENSHOT')) {
    Remove-Item "Env:$name" -ErrorAction SilentlyContinue
  }
}

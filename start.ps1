param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\database\runtime.ps1"
Import-RoomMateEnvironment
& (Get-RoomMatePython) -B (Join-Path $PSScriptRoot 'database\check_backend_contract.py')
if ($LASTEXITCODE -ne 0) { throw 'Backend sürümü frontend veri sözleşmesini karşılamıyor. database/BACKEND_UYUM_NOTU.md dosyasını Yaren ile inceleyin.' }
$localPath = Join-Path $PSScriptRoot '.local'
New-Item -ItemType Directory -Force -Path $localPath | Out-Null
$backendListener = Get-NetTCPConnection -State Listen -LocalPort 8000 -ErrorAction SilentlyContinue
if (-not $backendListener) {
    $backendScript = Join-Path $PSScriptRoot 'database\run-backend.ps1'
    $backendProcess = Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $backendScript + '"')) -WorkingDirectory $PSScriptRoot -RedirectStandardOutput (Join-Path $localPath 'backend.log') -RedirectStandardError (Join-Path $localPath 'backend-error.log') -PassThru
    $backendProcess.Id | Set-Content (Join-Path $localPath 'backend.pid')
}
$frontendListener = Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue
if (-not $frontendListener) {
    $frontendScript = Join-Path $PSScriptRoot 'frontend\run-frontend.ps1'
    $frontendProcess = Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $frontendScript + '"')) -WorkingDirectory (Join-Path $PSScriptRoot 'frontend') -RedirectStandardOutput (Join-Path $localPath 'frontend.log') -RedirectStandardError (Join-Path $localPath 'frontend-error.log') -PassThru
    $frontendProcess.Id | Set-Content (Join-Path $localPath 'frontend.pid')
}
Write-Host 'RoomMate AI: http://127.0.0.1:5173'
Write-Host 'Günlükler: .local klasörü. Bu betik migration uygulamaz ve veri silmez.'
if (-not $NoBrowser) { Start-Process 'http://127.0.0.1:5173' }

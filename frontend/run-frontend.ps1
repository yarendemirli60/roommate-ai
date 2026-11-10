$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
& npm.cmd run dev
exit $LASTEXITCODE

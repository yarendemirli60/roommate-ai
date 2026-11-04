. "$PSScriptRoot\runtime.ps1"
Import-RoomMateEnvironment
Set-Location (Join-Path $RoomMateRoot 'backend')
& (Get-RoomMatePython) -B manage.py runserver 127.0.0.1:8000 --noreload
exit $LASTEXITCODE

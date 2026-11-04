. "$PSScriptRoot\runtime.ps1"
Import-RoomMateEnvironment
& (Get-RoomMatePython) -B "$PSScriptRoot\verify_system.py"
if ($LASTEXITCODE -ne 0) { throw 'Doğrulama başarısız oldu.' }

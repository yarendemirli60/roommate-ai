param([Parameter(ValueFromRemainingArguments = $true)][string[]]$DjangoArgs)
. "$PSScriptRoot\runtime.ps1"
Import-RoomMateEnvironment
Push-Location (Join-Path $RoomMateRoot 'backend')
try {
    & (Get-RoomMatePython) -B manage.py @DjangoArgs
    if ($LASTEXITCODE -ne 0) { throw 'Django komutu başarısız oldu.' }
} finally { Pop-Location }

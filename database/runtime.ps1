$ErrorActionPreference = 'Stop'
$RoomMateRoot = Split-Path -Parent $PSScriptRoot

function Import-RoomMateEnvironment {
    $envPath = Join-Path $RoomMateRoot '.env'
    if (-not (Test-Path -LiteralPath $envPath)) { throw 'Proje kökünde .env bulunamadı. .env.example dosyasını kopyalayıp doldurun.' }
    foreach ($line in [IO.File]::ReadAllLines($envPath)) {
        $entry = $line.Trim()
        if (-not $entry -or $entry.StartsWith('#')) { continue }
        $parts = $entry.Split('=', 2)
        if ($parts.Length -ne 2 -or $parts[0].Trim() -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') { throw 'Geçersiz .env satırı.' }
        $value = $parts[1].Trim()
        if ($value.Length -ge 2 -and (($value.StartsWith("'") -and $value.EndsWith("'")) -or ($value.StartsWith('"') -and $value.EndsWith('"')))) { $value = $value.Substring(1, $value.Length - 2) }
        [Environment]::SetEnvironmentVariable($parts[0].Trim(), $value, 'Process')
    }
    if (-not $env:DJANGO_SECRET_KEY -or -not $env:DB_PASSWORD) { throw '.env içinde DJANGO_SECRET_KEY ve DB_PASSWORD zorunludur.' }
    $env:PYTHONDONTWRITEBYTECODE = '1'
}

function Get-RoomMatePython {
    foreach ($relativePath in @('.venv\Scripts\python.exe', 'backend\.venv\Scripts\python.exe')) {
        $pythonPath = Join-Path $RoomMateRoot $relativePath
        if (Test-Path -LiteralPath $pythonPath) { return $pythonPath }
    }
    throw 'Python ortamı bulunamadı. README içindeki .venv kurulum adımlarını uygulayın.'
}

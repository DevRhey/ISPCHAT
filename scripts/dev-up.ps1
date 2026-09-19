# Sobe / repara stack local ISPCHAT (Windows)
# Uso: powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Write-Step "Postgres + Redis"
docker compose -f docker/docker-compose-dev.yml up -d postgres redis | Out-Host

Write-Step "Build backend (tsc)"
Push-Location "$Root\backend"
npm run build 2>&1 | Select-Object -Last 15
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "backend build failed" }
Pop-Location

Write-Step "Backend container"
docker compose -f docker/docker-compose-dev.yml up -d backend | Out-Host

Write-Step "Aguardando /health"
$ok = $false
for ($i = 1; $i -le 30; $i++) {
  try {
    $r = Invoke-RestMethod -Uri "http://127.0.0.1:8080/health" -TimeoutSec 3
    if ($r.ok) { Write-Host "Backend OK (uptime=$([math]::Round($r.uptime,1))s)"; $ok = $true; break }
  } catch {
    Write-Host " wait $i ..."
    Start-Sleep -Seconds 2
  }
}
if (-not $ok) { throw "Backend health failed" }

# Libera porta 3000 se processo zumbi
$listeners = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $listeners) {
  Write-Step "Encerrando processo antigo na :3000 (PID $procId)"
  Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
}

Write-Step "Frontend local (API = localhost:8080, eslint off)"
$env:BROWSER = "none"
$env:PORT = "3000"
$env:DISABLE_ESLINT_PLUGIN = "true"
$env:REACT_APP_BACKEND_URL = "http://localhost:8080"
$env:NODE_OPTIONS = "--max-old-space-size=3072"
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$Root\frontend'; `$env:BROWSER='none'; `$env:PORT='3000'; `$env:DISABLE_ESLINT_PLUGIN='true'; `$env:REACT_APP_BACKEND_URL='http://localhost:8080'; `$env:NODE_OPTIONS='--max-old-space-size=3072'; npm start"
) | Out-Null

Write-Host "`nPronto. Frontend: http://localhost:3000  |  API: http://localhost:8080/health" -ForegroundColor Green
Write-Host "Watchdog (opcional): powershell -File scripts/dev-watchdog.ps1"

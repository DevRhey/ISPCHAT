# Mantém backend (Docker) e frontend (:3000) vivos.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/dev-watchdog.ps1

$Root = Split-Path -Parent $PSScriptRoot
$IntervalSec = 20

function Test-Backend {
  try {
    $r = Invoke-RestMethod -Uri "http://127.0.0.1:8080/health" -TimeoutSec 4
    return [bool]$r.ok
  } catch { return $false }
}

function Test-Frontend {
  try {
    $resp = Invoke-WebRequest -Uri "http://127.0.0.1:3000/" -TimeoutSec 4 -UseBasicParsing
    return $resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500
  } catch { return $false }
}

function Repair-Backend {
  Write-Host "[$(Get-Date -Format HH:mm:ss)] Backend down — restarting container..." -ForegroundColor Yellow
  docker start whaticket-backend 2>$null | Out-Null
  Start-Sleep 3
  if (-not (Test-Backend)) {
    docker compose -f "$Root\docker\docker-compose-dev.yml" up -d backend | Out-Null
  }
}

function Repair-Frontend {
  Write-Host "[$(Get-Date -Format HH:mm:ss)] Frontend down — starting npm..." -ForegroundColor Yellow
  $env:BROWSER = "none"
  $env:PORT = "3000"
  $env:DISABLE_ESLINT_PLUGIN = "true"
  $env:REACT_APP_BACKEND_URL = "http://localhost:8080"
  $env:NODE_OPTIONS = "--max-old-space-size=3072"
  Start-Process powershell -WindowStyle Minimized -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$Root\frontend'; `$env:BROWSER='none'; `$env:PORT='3000'; `$env:DISABLE_ESLINT_PLUGIN='true'; `$env:REACT_APP_BACKEND_URL='http://localhost:8080'; `$env:NODE_OPTIONS='--max-old-space-size=3072'; npm start"
  ) | Out-Null
}

Write-Host "Watchdog ISPCHAT ativo (Ctrl+C para parar). Intervalo ${IntervalSec}s." -ForegroundColor Cyan

while ($true) {
  if (-not (Test-Backend)) { Repair-Backend } else { Write-Host "[$(Get-Date -Format HH:mm:ss)] backend ok" }
  if (-not (Test-Frontend)) { Repair-Frontend } else { Write-Host "[$(Get-Date -Format HH:mm:ss)] frontend ok" }
  Start-Sleep -Seconds $IntervalSec
}

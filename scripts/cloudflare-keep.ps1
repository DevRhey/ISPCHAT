# Keep Cloudflare quick tunnels alive (FE :3000 + API :8080) and sync CRA.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/cloudflare-keep.ps1

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$Cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$StateFile = Join-Path $Root "scripts\.tunnel-state.json"
$ReadyFile = Join-Path $Root "scripts\ISPCHAT_PUBLIC.txt"
$LogDir = Join-Path $Root "scripts\.tunnel-logs"
$IntervalSec = 25

Write-Host "[cloudflare-keep] starting..." -ForegroundColor Cyan

if (-not (Test-Path $Cloudflared)) {
  Write-Host "cloudflared not found: $Cloudflared" -ForegroundColor Red
  exit 1
}
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Log($msg) {
  $ts = Get-Date -Format "HH:mm:ss"
  Write-Host "[$ts] $msg"
}

function Get-TunnelUrlFromLog($logPath) {
  if (-not (Test-Path $logPath)) { return $null }
  $content = Get-Content $logPath -Raw -ErrorAction SilentlyContinue
  if (-not $content) { return $null }
  $m = [regex]::Match($content, "https://[a-z0-9-]+\.trycloudflare\.com")
  if ($m.Success) { return $m.Value }
  return $null
}

function Test-PublicUrl($url) {
  if (-not $url) { return $false }
  try {
    $r = Invoke-WebRequest -Uri $url -TimeoutSec 12 -UseBasicParsing
    return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500)
  } catch { return $false }
}

function Stop-CloudflaredForPort($port) {
  Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.CommandLine -match [regex]::Escape(":$port")) {
      Write-Log "stop cloudflared PID $($_.ProcessId) port $port"
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
  }
}

function Start-QuickTunnel($name, $port) {
  $outLog = Join-Path $LogDir "$name.out.log"
  $errLog = Join-Path $LogDir "$name.err.log"
  Remove-Item $outLog, $errLog -Force -ErrorAction SilentlyContinue
  Stop-CloudflaredForPort $port
  Start-Sleep -Seconds 1

  $args = @(
    "tunnel",
    "--url", "http://127.0.0.1:$port",
    "--protocol", "http2",
    "--edge-ip-version", "4"
  )
  $p = Start-Process -FilePath $Cloudflared -ArgumentList $args `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -WindowStyle Hidden -PassThru

  $url = $null
  for ($i = 1; $i -le 50; $i++) {
    Start-Sleep -Seconds 1
    $url = Get-TunnelUrlFromLog $errLog
    if (-not $url) { $url = Get-TunnelUrlFromLog $outLog }
    if ($url) { break }
    if ($i % 10 -eq 0) { Write-Log "waiting $name tunnel... $i" }
  }

  if (-not $url) {
    Write-Log "FAIL tunnel $name - see $errLog"
    if (Test-Path $errLog) { Get-Content $errLog -Tail 15 | ForEach-Object { Write-Log $_ } }
    return @{ Url = $null; Pid = $p.Id }
  }

  Write-Log "$name => $url (pid $($p.Id))"
  return @{ Url = $url; Pid = $p.Id }
}

function Save-State($apiUrl, $feUrl) {
  $obj = @{
    updatedAt = (Get-Date).ToString("o")
    api = $apiUrl
    frontend = $feUrl
  }
  $obj | ConvertTo-Json | Set-Content -Path $StateFile -Encoding ASCII
  @(
    "ISPCHAT public links",
    "Updated: $($obj.updatedAt)",
    "",
    "Frontend: $feUrl",
    "API:      $apiUrl",
    "Health:   $apiUrl/health",
    "",
    "Local:    http://localhost:3000"
  ) | Set-Content -Path $ReadyFile -Encoding ASCII
}

function Test-LocalStack {
  try {
    $h = Invoke-RestMethod "http://127.0.0.1:8080/health" -TimeoutSec 4
    if (-not $h.ok) { return $false }
  } catch { return $false }
  try {
    $null = Invoke-WebRequest "http://127.0.0.1:3000/" -TimeoutSec 4 -UseBasicParsing
  } catch { return $false }
  return $true
}

function Restart-FrontendForCloudflare($apiUrl) {
  Write-Log "restart CRA with Cloudflare API URL"
  $envCf = Join-Path $Root "frontend\.env.cloudflare"
  @(
    "REACT_APP_BACKEND_URL=$apiUrl",
    "REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24",
    "DISABLE_ESLINT_PLUGIN=true",
    "BROWSER=none",
    "PORT=3000"
  ) | Set-Content -Path $envCf -Encoding ASCII

  $listeners = @()
  try {
    $listeners = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
  } catch {}
  foreach ($procId in $listeners) {
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 2

  $psCmd = "Set-Location '$Root\frontend'; `$env:BROWSER='none'; `$env:PORT='3000'; `$env:DISABLE_ESLINT_PLUGIN='true'; `$env:REACT_APP_BACKEND_URL='$apiUrl'; `$env:NODE_OPTIONS='--max-old-space-size=3072'; npm start"
  Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit","-Command",$psCmd | Out-Null
}

# --- bootstrap ---
if (-not (Test-LocalStack)) {
  Write-Log "WARN: local API/FE not healthy yet - tunnels still start"
}

$api = Start-QuickTunnel "api" 8080
$fe = Start-QuickTunnel "frontend" 3000

if (-not $api.Url -or -not $fe.Url) {
  Write-Log "could not create both tunnels"
  exit 1
}

Save-State $api.Url $fe.Url
Restart-FrontendForCloudflare $api.Url
Write-Log "PUBLIC_FE=$($fe.Url)"
Write-Log "PUBLIC_API=$($api.Url)"

$lastApi = $api.Url
$lastFe = $fe.Url

while ($true) {
  Start-Sleep -Seconds $IntervalSec

  if (-not (Test-LocalStack)) {
    Write-Log "local origins down - skip public check"
    continue
  }

  $apiOk = Test-PublicUrl ($lastApi + "/health")
  $feOk = Test-PublicUrl $lastFe

  if (-not $apiOk) {
    Write-Log "API tunnel down - recreate"
    $api = Start-QuickTunnel "api" 8080
    if ($api.Url) {
      $lastApi = $api.Url
      Save-State $lastApi $lastFe
      Restart-FrontendForCloudflare $lastApi
    }
  }

  if (-not $feOk) {
    Write-Log "FE tunnel down - recreate"
    $fe = Start-QuickTunnel "frontend" 3000
    if ($fe.Url) {
      $lastFe = $fe.Url
      Save-State $lastApi $lastFe
    }
  }

  if ($apiOk -and $feOk) {
    Write-Log "ok FE=$lastFe API=$lastApi"
  }
}

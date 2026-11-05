# Sửa lỗi Docker Desktop không khởi động: tắt Docker và WSL, đổi tên thư mục socket cũ, mở lại Docker.

$ErrorActionPreference = 'Stop'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

Write-Host 'Tat Docker Desktop...'
Get-Process | Where-Object { $_.Name -in @('Docker Desktop', 'com.docker.backend', 'com.docker.build', 'com.docker.diagnose') } |
  Stop-Process -Force -Confirm:$false -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host 'Tat WSL...'
wsl --shutdown
Start-Sleep -Seconds 5

foreach ($dir in @("$env:LOCALAPPDATA\Docker\run", "$env:LOCALAPPDATA\docker-secrets-engine")) {
  if (Test-Path -LiteralPath $dir) {
    $newName = (Split-Path $dir -Leaf) + ".old-$stamp"
    Rename-Item -LiteralPath $dir -NewName $newName
    Write-Host "Doi ten $dir -> $newName"
  }
}

Write-Host 'Mo lai Docker Desktop...'
Start-Process "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe"

for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 4
  $v = docker version --format '{{.Server.Version}}' 2>$null
  if ($v) { Write-Host "Docker da chay (engine $v)."; exit 0 }
}
Write-Host 'Sau 4 phut Docker van chua chay. Mo Docker Desktop xem thong bao loi.'
exit 1

# Run this script to place your school logo
# Usage: Right-click → Run with PowerShell

$source = Read-Host "Paste the full path to your school logo file (e.g. C:\Users\srima\Desktop\logo.png)"
$dest = "$PSScriptRoot\frontend\public\logo.png"

if (Test-Path $source) {
    Copy-Item $source $dest -Force
    Write-Host "✅ Logo copied to $dest" -ForegroundColor Green
} else {
    Write-Host "❌ File not found: $source" -ForegroundColor Red
}

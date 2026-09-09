# Build script: package n8n_ezeeflo for TezHost cPanel Node.js deployment
$ErrorActionPreference = "Stop"

$srcDir  = "c:\Yasir\ERPMultiTenant\ERPMTSuite\n8n_ezeeflo"
$deployDir = "c:\Yasir\ERPMultiTenant\ERPMTSuite\deploy-tezhost\n8n_ezeeflo"
$zipPath = "c:\Yasir\ERPMultiTenant\ERPMTSuite\deploy-tezhost\n8n_ezeeflo.zip"

# 1. Clean
Write-Host "=== Cleaning deploy folder ==="
if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
New-Item -ItemType Directory -Force -Path $deployDir | Out-Null

# 2. Copy project (exclude heavy/secret/generated items)
Write-Host "=== Copying n8n_ezeeflo ==="
$excludeDirs = @('node_modules', '.n8n', 'logs')
$srcDirs = Get-ChildItem $srcDir -Directory | Where-Object { $_.Name -notin $excludeDirs }
foreach ($dir in $srcDirs) {
    Copy-Item $dir.FullName -Destination "$deployDir\" -Recurse -Force
}
$excludeFiles = @('.env', '.gitignore')
$srcFiles = Get-ChildItem $srcDir -File | Where-Object { $_.Name -notin $excludeFiles }
foreach ($file in $srcFiles) {
    Copy-Item $file.FullName -Destination "$deployDir\" -Force
}

# 3. Verify
Write-Host "=== Verification ==="
$checks = @(
    @{Path="$deployDir\server.js"; Label="server.js"},
    @{Path="$deployDir\package.json"; Label="package.json"},
    @{Path="$deployDir\.env.example"; Label=".env.example"},
    @{Path="$deployDir\TEZHOST-DEPLOY.md"; Label="TEZHOST-DEPLOY.md"}
)
$allOk = $true
foreach ($c in $checks) {
    $exists = Test-Path $c.Path
    $status = if ($exists) { "[OK]" } else { "[MISSING]" }
    Write-Host "  $status $($c.Label)"
    if (-not $exists) { $allOk = $false }
}
if (-not $allOk) {
    Write-Host "ERROR: Some files missing!" -ForegroundColor Red
    exit 1
}

# 4. Create zip
Write-Host "=== Creating zip ==="
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
$baseLen = $deployDir.Length
Get-ChildItem -Path $deployDir -Recurse -File | ForEach-Object {
    $relPath = $_.FullName.Substring($baseLen).TrimStart('\').Replace('\', '/')
    $entry = $zip.CreateEntry($relPath, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    $fileStream = [System.IO.File]::OpenRead($_.FullName)
    $fileStream.CopyTo($entryStream)
    $fileStream.Dispose()
    $entryStream.Dispose()
}
$zip.Dispose()
$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)

# 5. Verify zip structure
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$zipEntries = @($zip.Entries | ForEach-Object { $_.FullName })
$zip.Dispose()

Write-Host ""
Write-Host "=== BUILD COMPLETE ==="
Write-Host "Zip: n8n_ezeeflo.zip ($sizeMB MB)"
Write-Host "Zip entries: $($zipEntries.Count)"
Write-Host "  server.js: $($zipEntries -contains 'server.js')"
Write-Host "  package.json: $($zipEntries -contains 'package.json')"
Write-Host "  .env.example: $($zipEntries -contains '.env.example')"
Write-Host "  TEZHOST-DEPLOY.md: $($zipEntries -contains 'TEZHOST-DEPLOY.md')"
Write-Host ""
Write-Host "Next: upload to cPanel, create Node.js app with startup file 'server.js',"
Write-Host "      then Run NPM Install and set env vars (see TEZHOST-DEPLOY.md)."

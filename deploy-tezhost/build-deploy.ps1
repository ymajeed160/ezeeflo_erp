# Clean build script for Tezhost deployment
$ErrorActionPreference = "Stop"

$deployDir = "c:\Yasir\ERPMultiTenant\ERPMTSuite\deploy-tezhost\nodejs_app"
$srcBackend = "c:\Yasir\ERPMultiTenant\ERPMTSuite\back-end"
$srcFrontendBuild = "c:\Yasir\ERPMultiTenant\ERPMTSuite\front-end\build"
$zipPath = "c:\Yasir\ERPMultiTenant\ERPMTSuite\deploy-tezhost\nodejs_app.zip"

# 1. Clean
Write-Host "=== Cleaning deploy folder ==="
if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
New-Item -ItemType Directory -Force -Path $deployDir | Out-Null

# 2. Copy backend (dirs first, then files)
Write-Host "=== Copying backend ==="
$excludeDirs = @('node_modules', 'logs', 'uploads', '.env', '.env.local')
$srcDirs = Get-ChildItem $srcBackend -Directory | Where-Object { $_.Name -notin $excludeDirs }
foreach ($dir in $srcDirs) {
    Copy-Item $dir.FullName -Destination "$deployDir\" -Recurse -Force
}
$srcFiles = Get-ChildItem $srcBackend -File
foreach ($file in $srcFiles) {
    Copy-Item $file.FullName -Destination "$deployDir\" -Force
}
$backendCount = (Get-ChildItem $deployDir -Recurse -File).Count
Write-Host "Backend files: $backendCount"

# 3. Copy frontend build to front-end/build/
Write-Host "=== Copying frontend build ==="
$frontendDeploy = "$deployDir\front-end\build"
New-Item -ItemType Directory -Force -Path $frontendDeploy | Out-Null
Copy-Item "$srcFrontendBuild\*" $frontendDeploy -Recurse -Force
$frontendCount = (Get-ChildItem $frontendDeploy -Recurse -File).Count
Write-Host "Frontend build files: $frontendCount"

# 4. Verify
Write-Host "=== Verification ==="
$checks = @(
    @{Path="$deployDir\server.js"; Label="server.js"},
    @{Path="$deployDir\app.js"; Label="app.js"},
    @{Path="$deployDir\package.json"; Label="package.json"},
    @{Path="$deployDir\models\ItemDefinition.js"; Label="models/ItemDefinition.js"},
    @{Path="$deployDir\controllers\SystemConfigController.js"; Label="controllers/SystemConfigController.js"},
    @{Path="$deployDir\routes\systemConfigRoutes.js"; Label="routes/systemConfigRoutes.js"},
    @{Path="$frontendDeploy\index.html"; Label="front-end/build/index.html"},
    @{Path="$frontendDeploy\static"; Label="front-end/build/static/"}
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

# 5. Create zip
Write-Host "=== Creating zip ==="
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($deployDir, $zipPath)
$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)

# Verify zip structure
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$zipEntries = @($zip.Entries | ForEach-Object { $_.FullName })
$zip.Dispose()

$rootCount = ($zipEntries | Where-Object { $_ -notmatch '/' }).Count
$buildCount = ($zipEntries | Where-Object { $_ -like "front-end/build/*" }).Count
$hasServer = ($zipEntries -contains "server.js")
$hasBuild = ($zipEntries -contains "front-end/build/index.html")

Write-Host ""
Write-Host "=== BUILD COMPLETE ==="
Write-Host "Zip: nodejs_app.zip ($sizeMB MB)"
Write-Host "Zip entries: $($zipEntries.Count)"
Write-Host "  Root files: $rootCount"
Write-Host "  front-end/build: $buildCount files"
Write-Host "  server.js: $hasServer"
Write-Host "  front-end/build/index.html: $hasBuild"
Write-Host ""
Write-Host "Deploy structure: root = backend files, front-end/build/ = React app"

# Clean build script for HR Payroll Tezhost deployment
$ErrorActionPreference = "Stop"

$deployDir = "c:\Yasir\ERPMultiTenant\ERPMTSuite\deploy-tezhost\hr_payroll_nodejs_app"
$srcBackend = "c:\Yasir\ERPMultiTenant\ERPMTSuite\hr_payroll_backend"
$srcFrontendBuild = "c:\Yasir\ERPMultiTenant\ERPMTSuite\hr_payroll_frontend\build"
$zipPath = "c:\Yasir\ERPMultiTenant\ERPMTSuite\deploy-tezhost\hr_payroll_nodejs_app.zip"

# 1. Clean
Write-Host "=== Cleaning deploy folder ==="
if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
New-Item -ItemType Directory -Force -Path $deployDir | Out-Null

# 2. Copy backend
Write-Host "=== Copying backend ==="
$excludeDirs = @('node_modules', 'logs', 'uploads', '.env', '.env.local')
$srcDirs = Get-ChildItem $srcBackend -Directory | Where-Object { $_.Name -notin $excludeDirs }
foreach ($dir in $srcDirs) {
    Copy-Item $dir.FullName -Destination "$deployDir\" -Recurse -Force
}
$excludeFiles = @('.env', '.env.local', '.env.production', '.env.development')
$srcFiles = Get-ChildItem $srcBackend -File | Where-Object { $_.Name -notin $excludeFiles }
foreach ($file in $srcFiles) {
    Copy-Item $file.FullName -Destination "$deployDir\" -Force
}
$backendCount = (Get-ChildItem $deployDir -Recurse -File).Count
Write-Host "Backend files: $backendCount"

# 2.5. Copy shared/ folder (workspace-level dependency) and fix paths
Write-Host "=== Copying shared/ folder ==="
$srcShared = "c:\Yasir\ERPMultiTenant\ERPMTSuite\shared"
if (Test-Path $srcShared) {
    $excludeShared = @('node_modules')
    Get-ChildItem $srcShared -Directory | Where-Object { $_.Name -notin $excludeShared } | ForEach-Object {
        Copy-Item $_.FullName -Destination "$deployDir\shared\" -Recurse -Force
    }
    Get-ChildItem $srcShared -File | ForEach-Object {
        Copy-Item $_.FullName -Destination "$deployDir\shared\" -Force
    }
    Write-Host "Shared files: $((Get-ChildItem "$deployDir\shared" -Recurse -File).Count)"
}

# Fix require paths: ../../shared/ → ../shared/ (deploy structure)
$fixFiles = @(
    "$deployDir\middleware\hrAuthMiddleware.js",
    "$deployDir\services\BranchService.js",
    "$deployDir\services\CostCenterService.js",
    "$deployDir\services\DepartmentService.js",
    "$deployDir\services\DesignationService.js",
    "$deployDir\services\EmployeeService.js"
)
foreach ($f in $fixFiles) {
    if (Test-Path $f) {
        $content = Get-Content $f -Raw
        $content = $content.Replace("require('../../shared/", "require('../shared/")
        Set-Content $f -Value $content -NoNewline
        $leaf = Split-Path $f -Leaf
        Write-Host "  [OK] Fixed paths in $leaf"
    }
}

# Fix cross-references inside shared/ → ../../hr_payroll_backend/ → ../
$sharedErpFile = "$deployDir\shared\services\erpIntegration.js"
if (Test-Path $sharedErpFile) {
    $content = Get-Content $sharedErpFile -Raw
    $content = $content.Replace("require('../../hr_payroll_backend/", "require('../../")
    Set-Content $sharedErpFile -Value $content -NoNewline
    Write-Host "  [OK] Fixed cross-refs in shared/services/erpIntegration.js"
}

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
    @{Path="$deployDir\config\database.js"; Label="config/database.js"},
    @{Path="$deployDir\middleware\hrAuthMiddleware.js"; Label="middleware/hrAuthMiddleware.js"},
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

# 5. Verify SPA serving code in app.js
$appJs = Get-Content "$deployDir\app.js" -Raw
if ($appJs -match "front-end/build") {
    Write-Host "  [OK] app.js has SPA serving code"
} else {
    Write-Host "  [MISSING] app.js missing SPA serving code" -ForegroundColor Red
}

# 6. Create zip
Write-Host "=== Creating zip ==="
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($deployDir, $zipPath)
$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$totalEntries = @($zip.Entries).Count
$zip.Dispose()

Write-Host ""
Write-Host "=== BUILD COMPLETE ==="
Write-Host "Zip: hr_payroll_nodejs_app.zip ($sizeMB MB, $totalEntries entries)"
Write-Host ""
Write-Host "Deploy structure:"
Write-Host "  root = backend files (server.js, app.js, controllers/, models/, ...)"
Write-Host "  front-end/build/ = React HR application"

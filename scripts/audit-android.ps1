Write-Host "--- Iniciando Diagnóstico de Carpetas y Dependencias ---" -ForegroundColor Cyan

# 1. Verificar archivos esenciales en raíz
$requiredFiles = @("package.json", "vite.config.ts", "tsconfig.json", "index.html")
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "[OK] Encontrado: $file" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Falta archivo crítico: $file" -ForegroundColor Red
    }
}

# 2. Buscar archivos vacíos o corruptos en src/
if (Test-Path "src") {
    $emptyFiles = Get-ChildItem -Path "src" -Recurse -File | Where-Object { $_.Length -eq 0 }
    if ($emptyFiles) {
        Write-Host "[ALERTA] Archivos vacíos detectados en src/:" -ForegroundColor Yellow
        $emptyFiles | ForEach-Object { Write-Host "  - $($_.FullName)" -ForegroundColor Yellow }
    } else {
        Write-Host "[OK] No hay archivos de 0 bytes en src/" -ForegroundColor Green
    }
}

# 3. Verificar variables de entorno para Android
if (-not $env:ANDROID_HOME) {
    $defaultSdk = "$env:LOCALAPPDATA\Android\Sdk"
    if (Test-Path $defaultSdk) {
        $env:ANDROID_HOME = $defaultSdk
        Write-Host "[INFO] ANDROID_HOME configurado temporalmente en: $defaultSdk" -ForegroundColor Yellow
    } else {
        Write-Host "[ERROR] ANDROID_HOME no está definido y no se encontró el SDK en la ruta por defecto." -ForegroundColor Red
    }
} else {
    Write-Host "[OK] ANDROID_HOME detectado: $env:ANDROID_HOME" -ForegroundColor Green
}

# 4. Instalar dependencias y probar compilación Web
Write-Host "--- Ejecutando npm install ---" -ForegroundColor Cyan
npm install

Write-Host "--- Verificando compilación TypeScript / Vite (npm run build) ---" -ForegroundColor Cyan
npm run build

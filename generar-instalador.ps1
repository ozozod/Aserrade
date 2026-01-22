# Script para generar el instalador de Aserradero App
# Ejecutar con: powershell -ExecutionPolicy Bypass -File generar-instalador.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Generador de Instalador - Aserradero App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Limpiando builds anteriores..." -ForegroundColor Green
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}
Write-Host "Limpieza completada." -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Compilando React para produccion..." -ForegroundColor Green
Write-Host "Esto puede tardar varios minutos..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Fallo al compilar React" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}
Write-Host "Compilacion de React completada." -ForegroundColor Green
Write-Host ""

# IMPORTANTE: Copiar el icono DESPUÉS del build de React (porque build limpia la carpeta)
Write-Host "Copiando icono a build\icon.ico..." -ForegroundColor Yellow
if (Test-Path "icono.ico") {
    Copy-Item "icono.ico" "build\icon.ico" -Force
    Write-Host "Icono copiado exitosamente." -ForegroundColor Green
} else {
    Write-Host "[ERROR] No se encuentra icono.ico en la raiz del proyecto" -ForegroundColor Red
    Write-Host "El instalador fallará sin el icono. Por favor, coloca icono.ico en la raiz." -ForegroundColor Red
    Read-Host "Presiona Enter para continuar de todas formas o Ctrl+C para cancelar"
}
Write-Host ""

Write-Host "[3/3] Generando instalador Windows..." -ForegroundColor Green
Write-Host "Esto puede tardar 5-15 minutos..." -ForegroundColor Yellow
npm run build:electron
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Fallo al generar el instalador" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Instalador generado exitosamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
$installerPath = "dist\Aserradero App-1.0.0-Setup.exe"
if (Test-Path $installerPath) {
    $fileSize = (Get-Item $installerPath).Length / 1MB
    Write-Host "El instalador se encuentra en: $installerPath" -ForegroundColor Green
    Write-Host "Tamaño: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "[ADVERTENCIA] No se pudo encontrar el instalador en la ubicacion esperada" -ForegroundColor Yellow
    Write-Host "Revisa la carpeta dist\ para ver los archivos generados" -ForegroundColor Yellow
}
Write-Host ""
Read-Host "Presiona Enter para salir"


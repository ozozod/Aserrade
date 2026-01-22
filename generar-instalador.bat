@echo off
echo ========================================
echo   Generador de Instalador - Aserradero App
echo ========================================
echo.

echo [1/3] Limpiando builds anteriores...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
echo Limpieza completada.
echo.

echo [2/3] Compilando React para produccion...
call npm run build
if errorlevel 1 (
    echo ERROR: Fallo al compilar React
    pause
    exit /b 1
)
echo Compilacion de React completada.
echo.

echo Copiando icono a build\icon.ico...
if exist icono.ico (
    copy /Y icono.ico build\icon.ico >nul
    echo Icono copiado exitosamente.
) else (
    echo [ERROR] No se encuentra icono.ico
    echo El instalador puede fallar sin el icono.
    pause
)
echo.

echo [3/3] Generando instalador Windows...
call npm run build:electron
if errorlevel 1 (
    echo ERROR: Fallo al generar el instalador
    pause
    exit /b 1
)
echo.
echo ========================================
echo   Instalador generado exitosamente!
echo ========================================
echo.
echo El instalador se encuentra en: dist\Aserradero App-1.0.0-Setup.exe
echo.
pause


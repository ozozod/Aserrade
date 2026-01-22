@echo off
REM Script para ejecutar backup automático en Windows con Google Drive
REM Este archivo se puede programar en Task Scheduler

cd /d "%~dp0\.."
node scripts\backup-con-google-drive.js

REM Opcional: Abrir carpeta de backups en Google Drive
REM start "" "%USERPROFILE%\Google Drive\Backups_Aserradero"

REM No mostrar pause si se ejecuta desde Task Scheduler
if "%1"=="" pause


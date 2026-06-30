@echo off
title Simulador de Escalonamento
echo.
echo  Iniciando servidor local...
echo  Acesse: http://localhost:8080
echo.
echo  Pressione Ctrl+C para encerrar.
echo.

:: Encerra qualquer servidor anterior na porta 8080
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":8080" ^| find "LISTENING"') do (
  taskkill /F /PID %%a >nul 2>&1
)

cd /d "%~dp0main"
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8080/index.html"

python -m http.server 8080

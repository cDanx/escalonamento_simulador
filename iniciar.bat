@echo off
title Simulador de Escalonamento
echo.
echo  Iniciando servidor local...
echo  Acesse: http://localhost:8080
echo.
echo  Pressione Ctrl+C para encerrar.
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8080/index.html"

python -m http.server 8080

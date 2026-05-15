@echo off
title Round Robin - Servidor Local
echo.
echo  Iniciando servidor local...
echo  Acesse: http://localhost:8080/Round Robin.html
echo.
echo  Pressione Ctrl+C para encerrar o servidor.
echo.

:: Aguarda 1.5s e abre o navegador em background
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8080/Round%%20Robin.html"

:: Inicia o servidor Python na pasta atual
python -m http.server 8080

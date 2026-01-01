@echo off
title SellerGest Launcher
echo ========================================
echo    SellerGest - Demarrage des serveurs
echo ========================================
echo.

:: Installation des dependances backend
echo [*] Installation des dependances backend...
cd /d %~dp0backend
call npm i
echo.

:: Installation des dependances frontend
echo [*] Installation des dependances frontend...
cd /d %~dp0frontend
call npm i
echo.

:: Retour a la racine
cd /d %~dp0

:: Lancer le backend dans une nouvelle fenetre
echo [*] Demarrage du backend...
start "SellerGest Backend" cmd /k "cd /d %~dp0backend && npm run dev"

:: Attendre 2 secondes pour laisser le backend demarrer
timeout /t 2 /nobreak >nul

:: Lancer le frontend dans une nouvelle fenetre
echo [*] Demarrage du frontend...
start "SellerGest Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo [OK] Les deux serveurs ont ete lances !
echo.
echo     Backend:  http://localhost:3000
echo     Frontend: http://localhost:5173
echo.
pause

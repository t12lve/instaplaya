@echo off
title InstaPlaya - Precision Player
cd /d "%~dp0"

echo ===================================================
echo             INSTAPLAYA - PRECISION PLAYER
echo ===================================================

if not exist "frontend\node_modules" (
  echo Installation des dependances frontend...
  pushd frontend
  call npm install
  popd
)

echo Construction de l'application...
pushd frontend
call npm run build
popd

echo Demarrage sur http://localhost:8080 ...
start "" http://localhost:8080
python app.py
pause

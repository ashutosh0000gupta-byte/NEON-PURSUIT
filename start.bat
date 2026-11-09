@echo off
title NEON PURSUIT - 3D Racing & Dynamic Ad Engine
cls
echo ========================================================
echo       NEON PURSUIT - 3D RACING & DYNAMIC AD ENGINE
echo ========================================================
echo  Starting Node.js Backend Ad Server...
echo.
start "" http://localhost:3000/
start "" http://localhost:3000/dashboard.html
node server.js
pause


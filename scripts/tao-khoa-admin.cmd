@echo off
chcp 65001 >nul
cd /d "%~dp0.."
node scripts\tao-khoa-admin.js
pause

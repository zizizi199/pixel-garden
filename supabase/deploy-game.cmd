@echo off
rem ==========================================================================
rem  Vuon Pixel - cai / cap nhat may chu tro choi (Supabase Edge Function "game").
rem  Chay lai MOI LAN sua src\core hoac server\ (may chu va game phai cung logic).
rem    1. Gop server\game.js + src\core thanh supabase\functions\game\index.ts
rem    2. Deploy len du an Supabase trong package.json (can Access Token:
rem       supabase.com/dashboard/account/tokens -> Generate new token).
rem  Khong muon dung token? Mo Dashboard > Edge Functions > Deploy a new function
rem  > Via Editor, dat ten "game", dan noi dung index.ts, tat "Verify JWT".
rem ==========================================================================
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0.."
where node >nul 2>&1 || (echo LOI: khong tim thay Node.js trong PATH. & goto :fail)

echo === 1/2 Gop ma may chu ===
call node scripts\build-edge.js || (echo LOI: khong gop duoc ma may chu. & goto :fail)

for /f "usebackq delims=" %%r in (`node -e "const u=(require('./package.json').supabase||{}).url||'';const m=u.match(/^https:\/\/([a-z0-9]+)\.supabase\./);console.log(m?m[1]:'')"`) do set "REF=%%r"
if "%REF%"=="" (echo LOI: package.json chua co "supabase": { "url" } - chay supabase\cau-hinh-supabase.cmd truoc. & goto :fail)

echo.
echo === 2/2 Deploy len du an %REF% ===
if "%SUPABASE_ACCESS_TOKEN%"=="" set /p "SUPABASE_ACCESS_TOKEN=Dan Supabase Access Token (sbp_...): "
if "%SUPABASE_ACCESS_TOKEN%"=="" (echo LOI: chua co token. & goto :fail)
call npx --yes supabase@latest functions deploy game --project-ref %REF% --no-verify-jwt --use-api || (echo LOI: deploy that bai. & goto :fail)
echo.
echo XONG. May chu tro choi da cap nhat.
pause
exit /b 0

:fail
echo.
pause
exit /b 1

@echo off
setlocal
cd /d "%~dp0.."
set "LOG=%~dp0publish-release.log"
echo [%date% %time%] Bat dau > "%LOG%"
call :main >> "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
type "%LOG%"
echo.
if "%RC%"=="0" (
  echo XONG. GitHub dang dong goi ZIP va tao Release, khoang 5-10 phut.
  start "" "https://github.com/zizizi199/pixel-garden/actions"
) else (
  echo CO LOI - xem noi dung o tren hoac file scripts\publish-release.log
)
pause
exit /b %RC%

:main
where git || (echo LOI: khong tim thay git trong PATH & exit /b 1)
rem Thu muc .git do tai khoan/cong cu khac tao -> git bao "dubious ownership".
rem Chi tin cay thu muc nay cho cac lenh trong file (khong sua cau hinh git chung cua may).
set "REPO=%CD:\=/%"
set "G=git -c safe.directory=%REPO%"
for /f "usebackq delims=" %%v in (`powershell -NoProfile -Command "(Get-Content package.json -Raw | ConvertFrom-Json).version"`) do set "VER=%%v"
if "%VER%"=="" (echo LOI: khong doc duoc version trong package.json & exit /b 1)
echo Phien ban: v%VER%
%G% config user.email >nul || %G% config user.email "zizizi199@users.noreply.github.com"
%G% config user.name >nul || %G% config user.name "zizizi199"
%G% add .github/workflows/release-windows.yml docs/release-notes.md README.md scripts/publish-release.cmd || exit /b 1
%G% diff --cached --quiet || %G% commit -m "Tu dong tao GitHub Release khi day tag" || exit /b 1
%G% push origin main || (echo LOI: khong day duoc nhanh main & exit /b 1)
%G% rev-parse -q --verify "refs/tags/v%VER%" >nul || %G% tag "v%VER%" || exit /b 1
%G% push origin "v%VER%" || (echo LOI: khong day duoc tag v%VER% & exit /b 1)
%G% ls-remote --tags origin "v%VER%"
exit /b 0

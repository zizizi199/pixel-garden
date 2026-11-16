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
rem Them DUY NHAT thu muc nay vao danh sach tin cay cua git (dung lenh git goi y).
set "REPO=%CD:\=/%"
set "G=git"
git config --global --get-all safe.directory | findstr /x /c:"%REPO%" >nul || (
  echo Them %REPO% vao safe.directory cua git
  git config --global --add safe.directory "%REPO%" || exit /b 1
)
for /f "usebackq delims=" %%v in (`powershell -NoProfile -Command "(Get-Content package.json -Raw | ConvertFrom-Json).version"`) do set "VER=%%v"
if "%VER%"=="" (echo LOI: khong doc duoc version trong package.json & exit /b 1)
echo Phien ban: v%VER%
%G% config user.email >nul || %G% config user.email "zizizi199@users.noreply.github.com"
%G% config user.name >nul || %G% config user.name "zizizi199"
%G% add .github/workflows/release-windows.yml docs/release-notes.md README.md package.json scripts/publish-release.cmd scripts/build-share-zip.js || exit /b 1
%G% diff --cached --quiet || %G% commit -m "Cap nhat dong goi va phat hanh ban Windows" || exit /b 1
%G% push origin main || (echo LOI: khong day duoc nhanh main & exit /b 1)
rem Gan (lai) tag vao commit moi nhat roi day len -> GitHub Actions dong goi va tao/cap nhat Release.
%G% tag -f "v%VER%" || exit /b 1
%G% push -f origin "v%VER%" || (echo LOI: khong day duoc tag v%VER% & exit /b 1)
%G% ls-remote --tags origin "v%VER%"
exit /b 0

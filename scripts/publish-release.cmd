@echo off
rem ==========================================================================
rem  Vuon Pixel - day code len GitHub va phat hanh ban Windows moi.
rem  Chay moi lan sua code xong:  scripts\publish-release.cmd
rem    1. Chay test (loi thi dung, khong day gi len).
rem    2. Hoi phien ban moi (Enter = tang so cuoi, vd 0.2.0 -> 0.2.1).
rem    3. Hien danh sach file thay doi, hoi xac nhan.
rem    4. Commit tat ca thay doi (.gitignore van loai dist, save, CLAUDE.md...),
rem       day nhanh main va tag v<phien ban>.
rem    5. GitHub Actions tu dong goi ZIP va tao Release (5-10 phut).
rem    6. (Tuy chon) dong goi ZIP ngay tren may nay de choi thu.
rem ==========================================================================
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0.."
set "REPO_URL=https://github.com/zizizi199/pixel-garden"

where git >nul 2>&1 || (echo LOI: khong tim thay git trong PATH. & goto :fail)
where npm >nul 2>&1 || (echo LOI: khong tim thay Node.js/npm trong PATH. & goto :fail)

rem Thu muc .git do tai khoan/cong cu khac tao -> git bao "dubious ownership".
set "REPO=%CD:\=/%"
git config --global --get-all safe.directory | findstr /x /c:"%REPO%" >nul || git config --global --add safe.directory "%REPO%"
git config user.email >nul || git config user.email "zizizi199@users.noreply.github.com"
git config user.name >nul || git config user.name "zizizi199"

for /f "usebackq delims=" %%b in (`git rev-parse --abbrev-ref HEAD`) do set "BRANCH=%%b"
if /i not "%BRANCH%"=="main" (echo LOI: dang o nhanh "%BRANCH%", hay chuyen ve main truoc. & goto :fail)

echo.
echo === 1/5 Chay test ===
call npm test || (echo LOI: test that bai - sua loi roi chay lai. & goto :fail)
call node scripts\build-edge.js || (echo LOI: khong gop duoc ma may chu Edge Function. & goto :fail)
git diff --quiet -- supabase/functions/game || (echo. & echo CHU Y: ma may chu thay doi - chay supabase\deploy-game.cmd de cap nhat may chu TRUOC khi moi nguoi tai ban moi. & echo.)

echo.
echo === 2/5 Phien ban ===
for /f "usebackq delims=" %%v in (`powershell -NoProfile -Command "(Get-Content package.json -Raw | ConvertFrom-Json).version"`) do set "VER=%%v"
if "%VER%"=="" (echo LOI: khong doc duoc version trong package.json. & goto :fail)
for /f "usebackq delims=" %%v in (`powershell -NoProfile -Command "$p=('%VER%').Split('.'); $p[2]=[int]$p[2]+1; $p -join '.'"`) do set "NEXT=%%v"
echo Phien ban hien tai: %VER%
echo   Enter      = phat hanh %NEXT%
echo   go "giu"   = giu %VER% (ghi de Release cu)
echo   hoac go so khac, vd 0.3.0
set "NEWVER="
set /p "NEWVER=Phien ban moi: "
if "%NEWVER%"=="" set "NEWVER=%NEXT%"
if /i "%NEWVER%"=="giu" set "NEWVER=%VER%"
powershell -NoProfile -Command "if ('%NEWVER%' -notmatch '^\d+\.\d+\.\d+$') { exit 1 }" || (echo LOI: phien ban phai co dang so.so.so & goto :fail)
if not "%NEWVER%"=="%VER%" (
  call npm version %NEWVER% --no-git-tag-version --allow-same-version >nul || (echo LOI: khong cap nhat duoc package.json & goto :fail)
)

echo.
echo === 3/5 Thay doi se duoc day len ===
git add -A || goto :fail
git status --short
git diff --cached --quiet && echo [Khong co thay doi code moi - chi gan lai tag.]
set "MSG="
set /p "MSG=Mo ta ngan thay doi (Enter = Cap nhat Vuon Pixel v%NEWVER%): "
if "%MSG%"=="" set "MSG=Cap nhat Vuon Pixel v%NEWVER%"
set "OK="
set /p "OK=Day len GitHub? (y/N): "
if /i not "%OK%"=="y" (git reset -q & echo Da huy, chua day gi len. & goto :end)

echo.
echo === 4/5 Commit va day len GitHub ===
git diff --cached --quiet || git commit -m "%MSG%" || goto :fail
git push origin main || (echo LOI: khong day duoc nhanh main. & goto :fail)
git tag -f "v%NEWVER%" || goto :fail
git push -f origin "v%NEWVER%" || (echo LOI: khong day duoc tag v%NEWVER%. & goto :fail)
echo Da day v%NEWVER%. GitHub dang dong goi ZIP va tao Release (5-10 phut).
start "" "%REPO_URL%/actions"

echo.
echo === 5/5 Dong goi tren may nay (tuy chon) ===
set "BUILD="
set /p "BUILD=Dong goi ZIP ngay tren may nay de choi thu? (y/N): "
if /i "%BUILD%"=="y" (
  call npm run share:win || (echo LOI: dong goi that bai. & goto :fail)
  start "" "%CD%\dist"
)

echo.
echo XONG. Release: %REPO_URL%/releases
goto :end

:fail
echo.
echo CO LOI - xem thong bao o tren. Chua co gi bi xoa; sua loi roi chay lai script.
pause
exit /b 1

:end
pause
exit /b 0

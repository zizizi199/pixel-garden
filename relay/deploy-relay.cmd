@echo off
rem ==========================================================================
rem  Vuon Pixel - dua may trung chuyen phong Internet len Cloudflare (mien phi).
rem  Chi can chay 1 lan (hoac khi sua relay\src\index.js).
rem    1. Cai wrangler (cong cu cua Cloudflare) vao thu muc relay.
rem    2. Dang nhap Cloudflare tren trinh duyet (lan dau).
rem    3. Deploy Worker "pixel-garden-relay".
rem    4. Ghi dia chi wss://... vao "relayUrl" trong package.json cua game.
rem  Sau do chay scripts\publish-release.cmd de phat hanh ban co phong Internet.
rem ==========================================================================
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
where npm >nul 2>&1 || (echo LOI: khong tim thay Node.js/npm trong PATH. & goto :fail)

echo === 1/4 Cai wrangler ===
call npm install --no-audit --no-fund || goto :fail

echo.
echo === 2/4 Dang nhap Cloudflare ===
if defined CLOUDFLARE_API_TOKEN (echo Dung CLOUDFLARE_API_TOKEN co san. & goto :deploy)
call npx wrangler whoami 2>&1 | findstr /i /c:"not authenticated" >nul || goto :deploy
echo Cach A - dan API token (khuyen dung neu may cong ty chan mo trinh duyet tu dong):
echo   dash.cloudflare.com ^> My Profile ^> API Tokens ^> Create Token ^> mau "Edit Cloudflare Workers".
echo Cach B - bam Enter de dang nhap qua trinh duyet: script in ra mot duong link,
echo   ban tu copy link do mo trong trinh duyet, dang nhap va bam Allow.
set "TOKEN="
set /p "TOKEN=API token (Enter = cach B): "
if defined TOKEN (set "CLOUDFLARE_API_TOKEN=%TOKEN%" & goto :deploy)
rem --browser=false: khong tu mo trinh duyet (may cong ty co the chan -> loi "spawn EPERM").
call npx wrangler login --browser=false || goto :fail

:deploy
echo.
echo === 3/4 Deploy ===
echo (Neu Cloudflare hoi dang ky ten mien workers.dev, hay go mot ten bat ky, vd ten-cua-ban.)
rem --no-bundle: khong chay esbuild.exe (phan mem bao mat co the chan file .exe trong node_modules).
call npx wrangler deploy --no-bundle || goto :fail

echo.
echo === 4/4 Ghi dia chi vao game ===
echo Tim dong co dang https://pixel-garden-relay.XXX.workers.dev o tren.
set "URL="
set /p "URL=Dan dia chi do vao day roi Enter: "
if not defined URL goto :fail
set "URL=%URL: =%"
node -e "const u=process.argv[1].replace(/\/+$/,'');if(!/^https:\/\/[a-z0-9.-]+\.workers\.dev$/i.test(u)){console.error('Dia chi khong dung dang https://....workers.dev');process.exit(1)}const fs=require('fs');const f='../package.json';const p=JSON.parse(fs.readFileSync(f,'utf8'));p.relayUrl=u.replace(/^https:/,'wss:');fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');console.log('Da ghi relayUrl = '+p.relayUrl)" "%URL%" || goto :fail
echo.
echo XONG. Gio chay scripts\publish-release.cmd de phat hanh ban co "Mo phong Internet".
echo (Chay thu ngay: npm start trong thu muc game.)
pause
exit /b 0

:fail
echo.
echo CO LOI - xem thong bao o tren roi chay lai.
pause
exit /b 1

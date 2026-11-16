@echo off
rem Ghi dia chi + anon key cua Supabase vao package.json cua game (xem supabase\README.md).
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1 || (echo LOI: khong tim thay Node.js. & goto :fail)
echo Lay 2 gia tri o Supabase: Project Settings ^> API Keys (Project URL va anon/publishable key).
echo KHONG dung service_role / secret key.
set "URL="
set /p "URL=Project URL (https://xxxx.supabase.co): "
set "KEY="
set /p "KEY=anon / publishable key: "
if not defined URL goto :fail
if not defined KEY goto :fail
node -e "const [u,k]=process.argv.slice(1).map(s=>s.trim());if(!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/i.test(u)){console.error('URL phai co dang https://xxxx.supabase.co');process.exit(1)}if(/service_role|^sb_secret_/.test(k)||(k.split('.').length===3&&JSON.parse(Buffer.from(k.split('.')[1],'base64url')).role==='service_role')){console.error('Day la khoa service_role/secret - KHONG duoc dua vao game. Dung anon/publishable key.');process.exit(1)}const fs=require('fs');const f='../package.json';const p=JSON.parse(fs.readFileSync(f,'utf8'));p.supabase={url:u.replace(/\/+$/,''),anonKey:k};fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');console.log('Da ghi cau hinh Supabase vao package.json.')" "%URL%" "%KEY%" || goto :fail
echo.
echo XONG. Chay thu: npm start (hoac yarn start). Phat hanh: scripts\publish-release.cmd
pause
exit /b 0
:fail
echo.
echo CO LOI - xem thong bao o tren roi chay lai.
pause
exit /b 1

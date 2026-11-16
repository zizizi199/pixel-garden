'use strict';
/**
 * Đóng gói bản chia sẻ cho Windows: dist/VuonPixel-<version>-Windows.zip
 *   - VuonPixel.exe (Electron đổi tên) + DLL/runtime
 *   - resources/app.asar (src, assets/icon*.png, package.json)
 *   - Choi-Vuon-Pixel.cmd, DOC-TRUOC-KHI-CHOI.txt
 * Chạy: npm run share:win   (trên Windows dùng Electron trong node_modules)
 * Đóng gói từ máy khác: đặt ELECTRON_DIST=<thư mục Electron win32-x64 đã giải nén>.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const asar = require('@electron/asar');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Version trong package.json không hợp lệ.');

const dist = path.join(root, 'dist');
const name = `VuonPixel-${version}-Windows`;
const out = path.join(dist, name);
const stage = path.join(dist, '.share-stage');
const zip = path.join(dist, `${name}.zip`);
const shaFile = path.join(dist, `${name}.sha256`);

const step = (msg) => console.log(`>> ${msg}`);
const runtime = [process.env.ELECTRON_DIST, path.join(dist, 'win-unpacked'), path.join(root, 'node_modules', 'electron', 'dist')]
  .filter(Boolean).find((d) => fs.existsSync(path.join(d, 'electron.exe')));
if (!runtime) throw new Error('Không thấy electron.exe. Chạy npm install trên Windows, hoặc đặt ELECTRON_DIST.');
step(`Electron runtime: ${runtime}`);

// Trên Windows: dùng tar.exe của hệ thống (bsdtar, ghi được ZIP) bằng đường dẫn đầy đủ,
// vì máy có Git thường có tar GNU trong PATH – bản đó không ghi ZIP và hiểu "C:\\..." là máy chủ từ xa.
// Đường dẫn truyền vào đều là tương đối (cwd = thư mục cần nén). Nếu lỗi thì chuyển sang PowerShell.
function zipOnWindows() {
  const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
  const rel = path.relative(out, zip);
  try {
    if (!fs.existsSync(tar)) throw new Error(`Không có ${tar}`);
    execFileSync(tar, ['-a', '-c', '-f', rel, ...fs.readdirSync(out)], { cwd: out, stdio: 'inherit' });
  } catch (e) {
    console.warn(`tar.exe lỗi (${e.message}) – dùng PowerShell Compress-Archive.`);
    fs.rmSync(zip, { force: true });
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      `Compress-Archive -Path '${out.replace(/'/g, "''")}\\*' -DestinationPath '${zip.replace(/'/g, "''")}' -CompressionLevel Optimal`],
    { stdio: 'inherit' });
  }
  if (!fs.existsSync(zip)) throw new Error('Không tạo được file ZIP.');
}

async function main() {
  fs.mkdirSync(dist, { recursive: true });
  for (const p of [stage, out, zip, shaFile]) fs.rmSync(p, { recursive: true, force: true });

  step('Chép runtime Electron');
  fs.cpSync(runtime, out, { recursive: true, filter: (src) => !/[\\/](Vuon Pixel|VuonPixel)\.exe$/.test(src) });
  fs.renameSync(path.join(out, 'electron.exe'), path.join(out, 'VuonPixel.exe'));
  fs.rmSync(path.join(out, 'resources', 'default_app.asar'), { force: true });

  step('Đóng gói app.asar');
  fs.cpSync(path.join(root, 'src'), path.join(stage, 'src'), { recursive: true });
  fs.mkdirSync(path.join(stage, 'assets'), { recursive: true });
  for (const f of ['icon.png', 'icon-alert.png']) fs.copyFileSync(path.join(root, 'assets', f), path.join(stage, 'assets', f));
  fs.copyFileSync(path.join(root, 'package.json'), path.join(stage, 'package.json'));
  fs.mkdirSync(path.join(out, 'resources'), { recursive: true });
  await asar.createPackage(stage, path.join(out, 'resources', 'app.asar'));
  fs.rmSync(stage, { recursive: true, force: true });

  step('Tạo file khởi chạy và hướng dẫn');
  fs.writeFileSync(path.join(out, 'Choi-Vuon-Pixel.cmd'), '@echo off\r\ncd /d "%~dp0"\r\nstart "" "%~dp0VuonPixel.exe"\r\n');
  fs.writeFileSync(path.join(out, 'DOC-TRUOC-KHI-CHOI.txt'), [
    'VUON PIXEL - WINDOWS', '',
    '1. Extract the entire ZIP file.',
    '2. Double-click Choi-Vuon-Pixel.cmd to start the game.',
    '3. Keep all files in this folder together. Do not run from inside the ZIP.',
    '4. LAN play is off by default. Only share invitation codes privately.',
    "5. To close the game completely, use the tray icon's Exit command.", '',
    'The game stores your save in your own Windows app-data folder.', '',
  ].join('\r\n'));

  step('Nén ZIP');
  if (process.platform === 'win32') zipOnWindows();
  else execFileSync('zip', ['-qr', zip, '.'], { cwd: out, stdio: 'inherit' });

  const hash = crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex');
  fs.writeFileSync(shaFile, `${hash}  ${path.basename(zip)}\n`);
  console.log(`ZIP: ${zip}`);
  console.log(`SHA256: ${hash}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

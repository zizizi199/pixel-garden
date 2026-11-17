'use strict';
// Gộp server/game.js + src/core thành supabase/functions/game/index.ts (Edge Function "game").
// Chạy lại mỗi khi sửa src/core hoặc server/ rồi deploy lại (supabase\deploy-game.cmd) – máy chủ và game phải cùng logic.
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const dir = path.join(root, 'supabase', 'functions', 'game');
const out = path.join(dir, 'index.ts');
// khoá công khai Admin (scripts\tao-khoa-admin.cmd) → máy chủ chỉ nhận lệnh Admin ký bằng khoá bí mật trên máy admin
fs.writeFileSync(path.join(dir, 'admin-key.js'), `// TỰ SINH bởi scripts/build-edge.js từ "adminPublicKey" trong package.json.\nmodule.exports = ${JSON.stringify(pkg.adminPublicKey || '')};\n`);
const entry = path.join(dir, 'entry.js');
let esbuild = null;
try { esbuild = require('esbuild'); } catch (_) { /* dùng npx */ }
if (esbuild) {
  esbuild.buildSync({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', outfile: out, logLevel: 'warning' });
} else {
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['--yes', 'esbuild@0.25.10', entry, '--bundle', '--format=esm', '--platform=neutral', '--target=es2022', `--outfile=${out}`, '--log-level=warning'],
    { stdio: 'inherit', shell: process.platform === 'win32' });
}
const body = fs.readFileSync(out, 'utf8');
fs.writeFileSync(out, `// @ts-nocheck\n// TỰ SINH bởi scripts/build-edge.js từ server/game.js + src/core – đừng sửa tay.\n${body}`);
console.log(`Đã tạo ${path.relative(root, out)} (${Math.round(body.length / 1024)} KB).`);

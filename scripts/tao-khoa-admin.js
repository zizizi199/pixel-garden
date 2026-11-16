'use strict';
// Bật nút Admin CHỈ trên máy này (chạy: scripts\tao-khoa-admin.cmd).
//  - Lần đầu: tạo cặp khoá Ed25519. Khoá bí mật lưu ở %USERPROFILE%\.vuon-pixel-admin\ (ngoài repo, không đẩy lên GitHub);
//    khoá công khai ghi vào "adminPublicKey" trong package.json.
//  - Ký mã máy này → %APPDATA%\vuon-pixel-admin.key. Game (cả bản yarn start lẫn bản ZIP) thấy file hợp lệ thì hiện nút 🛠.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { machineId, signAdmin, verifyAdmin, KEY_FILE_NAME } = require('../src/main/admin-gate');

const root = path.resolve(__dirname, '..');
const pkgFile = path.join(root, 'package.json');
const secretDir = path.join(os.homedir(), '.vuon-pixel-admin');
const secretFile = path.join(secretDir, 'admin-private.pem');
const appData = process.env.APPDATA || path.join(os.homedir(), '.config');
const keyFile = path.join(appData, KEY_FILE_NAME);

const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
let pem = fs.existsSync(secretFile) ? fs.readFileSync(secretFile, 'utf8') : null;
if (!pem) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  pem = privateKey.export({ format: 'pem', type: 'pkcs8' });
  fs.mkdirSync(secretDir, { recursive: true });
  fs.writeFileSync(secretFile, pem, { mode: 0o600 });
  pkg.adminPublicKey = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
  fs.writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`Đã tạo khoá bí mật: ${secretFile}  (giữ kỹ, KHÔNG gửi cho ai)`);
  console.log('Đã ghi adminPublicKey vào package.json – cần phát hành bản mới để bản ZIP nhận khoá này.');
} else {
  const pub = crypto.createPublicKey(pem).export({ format: 'der', type: 'spki' }).toString('base64');
  if (pkg.adminPublicKey !== pub) {
    pkg.adminPublicKey = pub;
    fs.writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log('Đã cập nhật adminPublicKey trong package.json theo khoá bí mật hiện có.');
  }
}
fs.mkdirSync(path.dirname(keyFile), { recursive: true });
fs.writeFileSync(keyFile, JSON.stringify(signAdmin(pem)));
console.log(`Đã ký cho máy này: ${keyFile}`);
console.log(verifyAdmin(pkg.adminPublicKey, keyFile, machineId()) ? 'KIỂM TRA: OK – nút Admin sẽ hiện trên máy này.' : 'KIỂM TRA THẤT BẠI');

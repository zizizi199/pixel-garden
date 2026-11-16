'use strict';
// Nút Admin chỉ hiện trên máy của người phát triển.
// Máy đó có file khoá admin = chữ ký Ed25519 (khoá bí mật chỉ nằm trên máy đó, không có trong repo)
// trên mã máy (MachineGuid của Windows + tên tài khoản). App chỉ chứa khoá công khai ("adminPublicKey"
// trong package.json) nên người khác không tự tạo được file hợp lệ; chép file sang máy khác cũng không dùng được.
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

const KEY_FILE_NAME = 'vuon-pixel-admin.key';

function machineId() {
  let guid = '';
  if (process.platform === 'win32') {
    try {
      const out = execFileSync('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'],
        { encoding: 'utf8', windowsHide: true, timeout: 3000 });
      guid = (out.match(/MachineGuid\s+REG_SZ\s+(\S+)/i) || [])[1] || '';
    } catch (_) { /* dùng tên máy */ }
  }
  let user = '';
  try { user = os.userInfo().username; } catch (_) { user = ''; }
  return `vuon-pixel-admin|${guid || os.hostname()}|${user}`.toLowerCase();
}

/** true nếu file khoá admin là chữ ký hợp lệ của mã máy này. */
function verifyAdmin(publicKeyB64, keyFile, id = machineId()) {
  try {
    if (!publicKeyB64 || !keyFile || !fs.existsSync(keyFile)) return false;
    const { sig } = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
    const pub = crypto.createPublicKey({ key: Buffer.from(publicKeyB64, 'base64'), format: 'der', type: 'spki' });
    return crypto.verify(null, Buffer.from(id), pub, Buffer.from(String(sig), 'base64'));
  } catch (_) { return false; }
}

function signAdmin(privateKeyPem, id = machineId()) {
  return { sig: crypto.sign(null, Buffer.from(id), crypto.createPrivateKey(privateKeyPem)).toString('base64') };
}

module.exports = { machineId, verifyAdmin, signAdmin, KEY_FILE_NAME };

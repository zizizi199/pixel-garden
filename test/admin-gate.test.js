'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { verifyAdmin, signAdmin } = require('../src/main/admin-gate');

test('Admin chỉ bật khi có file khoá ký đúng cho máy này', () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pub = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
  const pem = privateKey.export({ format: 'pem', type: 'pkcs8' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pg-admin-'));
  const file = path.join(dir, 'admin.key');
  try {
    assert.equal(verifyAdmin(pub, file, 'may-a'), false, 'không có file');
    fs.writeFileSync(file, JSON.stringify(signAdmin(pem, 'may-a')));
    assert.equal(verifyAdmin(pub, file, 'may-a'), true);
    assert.equal(verifyAdmin(pub, file, 'may-b'), false, 'chép sang máy khác');
    assert.equal(verifyAdmin('', file, 'may-a'), false, 'bản không có khoá công khai');
    const other = crypto.generateKeyPairSync('ed25519').privateKey.export({ format: 'pem', type: 'pkcs8' });
    fs.writeFileSync(file, JSON.stringify(signAdmin(other, 'may-a')));
    assert.equal(verifyAdmin(pub, file, 'may-a'), false, 'tự tạo khoá khác');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

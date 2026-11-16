'use strict';
/** Lưu / đọc file save dạng JSON (ghi ra file tạm rồi đổi tên để tránh hỏng file khi tắt máy đột ngột). */
const fs = require('fs');
const path = require('path');
const G = require('./garden');

function load(file, now = Date.now()) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    return G.migrate(raw, now);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      try { fs.copyFileSync(file, `${file}.broken-${now}`); } catch (_) { /* bỏ qua */ }
    }
    return G.createState(now);
  }
}

function save(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 1), 'utf8');
  fs.renameSync(tmp, file);
}

module.exports = { load, save };

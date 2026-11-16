'use strict';
/**
 * Lưu / đọc file save (ghi ra file tạm rồi đổi tên để tránh hỏng file khi tắt máy đột ngột).
 *
 * Bản phát hành truyền `cipher` (Electron safeStorage – khoá Windows DPAPI của đúng tài khoản + app):
 * file save là dữ liệu mã hoá, không mở bằng Notepad để sửa chỉ số được. File bị sửa/hỏng → giải mã
 * hoặc kiểm tra thất bại → giữ bản sao `.broken-<thời điểm>` và bắt đầu vườn mới.
 * Không có `cipher` (test, máy không có khoá bảo vệ) thì dùng JSON thường như trước.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const G = require('./garden');

const FORMAT = 'vuon-pixel-save-v2';
const digest = (json) => crypto.createHash('sha256').update(`${FORMAT}|${json}`).digest('hex');

function note(state, text, now) {
  state.log.unshift({ at: now, type: 'system', text });
}

function readState(file, cipher) {
  const buf = fs.readFileSync(file);
  if (!cipher) return JSON.parse(buf.toString('utf8'));
  const box = JSON.parse(cipher.decrypt(buf));
  if (!box || box.format !== FORMAT || typeof box.data !== 'string' || box.sum !== digest(box.data)) throw new Error('save không hợp lệ');
  return JSON.parse(box.data);
}

/**
 * opts.cipher   { encrypt(string) → Buffer, decrypt(Buffer) → string }
 * opts.legacy   đường dẫn save.json của bản cũ: chỉ lấy lại phần Cài đặt (giờ vườn, âm thanh…),
 *               không lấy tiền/cấp/đồ vì bản cũ sửa tay được.
 */
function load(file, now = Date.now(), opts = {}) {
  try {
    return G.migrate(readState(file, opts.cipher), now);
  } catch (e) {
    const fresh = G.createState(now);
    if (e.code !== 'ENOENT') {
      try { fs.copyFileSync(file, `${file}.broken-${now}`); } catch (_) { /* bỏ qua */ }
      if (opts.cipher) note(fresh, 'File lưu bị sửa hoặc hỏng nên vườn được làm mới.', now);
      return fresh;
    }
    if (opts.legacy && fs.existsSync(opts.legacy)) {
      try { fresh.settings = G.migrate(JSON.parse(fs.readFileSync(opts.legacy, 'utf8')), now).settings; } catch (_) { /* giữ cài đặt mặc định */ }
      note(fresh, 'Phiên bản mới: mọi người chơi lại từ đầu, chỉ giữ phần Cài đặt.', now);
    }
    return fresh;
  }
}

function save(file, state, opts = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  if (opts.cipher) {
    const data = JSON.stringify(state);
    fs.writeFileSync(tmp, opts.cipher.encrypt(JSON.stringify({ format: FORMAT, sum: digest(data), data })));
  } else {
    fs.writeFileSync(tmp, JSON.stringify(state, null, 1), 'utf8');
  }
  fs.renameSync(tmp, file);
}

module.exports = { load, save, FORMAT };

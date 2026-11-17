'use strict';
/**
 * Giờ địa phương của người chơi.
 * - Trong app (Electron): mặc định dùng giờ của máy (offset = null).
 * - Trên máy chủ (Supabase Edge Function chạy giờ UTC): đặt offset theo múi giờ người chơi gửi lên
 *   (vd Việt Nam = +420 phút) trước khi tính vườn, để giờ làm 8:00–17:00 vẫn đúng giờ của họ.
 */
const DAY = 86400000;
let offsetMin = null;

function setOffset(min) {
  offsetMin = Number.isFinite(min) && min >= -720 && min <= 840 ? Math.round(min) : null;
}
function getOffset() { return offsetMin; }

/** Năm/tháng(0-11)/ngày/giờ/phút/giây/thứ(0 = CN) theo giờ địa phương. */
function parts(ms) {
  if (offsetMin === null) {
    const d = new Date(ms);
    return { y: d.getFullYear(), mo: d.getMonth(), d: d.getDate(), h: d.getHours(), mi: d.getMinutes(), s: d.getSeconds(), dow: d.getDay() };
  }
  const d = new Date(ms + offsetMin * 60000);
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds(), dow: d.getUTCDay() };
}

/** 00:00 (giờ địa phương) của ngày chứa `ms`. */
function dayStart(ms) {
  const p = parts(ms);
  if (offsetMin === null) return new Date(p.y, p.mo, p.d).getTime();
  return Date.UTC(p.y, p.mo, p.d) - offsetMin * 60000;
}

/** 00:00 của ngày hôm sau (an toàn với giờ mùa hè). */
function nextDay(dayStartMs) { return dayStart(dayStartMs + DAY + DAY / 2); }

module.exports = { DAY, setOffset, getOffset, parts, dayStart, nextDay };

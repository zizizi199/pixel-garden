'use strict';
/**
 * Giờ làm việc: vườn chỉ "chạy" (cây lớn, nước cạn) trong giờ làm.
 * Ngoài giờ (tối, cuối tuần, nghỉ trưa nếu bật) vườn "ngủ" → không cây nào chết khi bạn về nhà.
 *
 * Lịch tính theo giờ địa phương của người chơi (xem clock.js: trên máy chủ dùng múi giờ người chơi gửi lên).
 */
const CL = require('./clock');

const DEFAULT_SCHEDULE = {
  start: '08:00',
  end: '17:00',
  lunch: { enabled: true, start: '12:00', end: '13:00' },
  workdays: [1, 2, 3, 4, 5], // 0 = Chủ nhật ... 6 = Thứ bảy
};

const MIN = 60 * 1000;

function toMin(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
}

function fmtMin(total) {
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Các đoạn làm việc trong ngày, tính bằng phút kể từ 00:00. */
function dayIntervals(schedule) {
  const s = toMin(schedule.start);
  const e = toMin(schedule.end);
  if (e <= s) return [];
  const l = schedule.lunch;
  if (l && l.enabled) {
    const ls = Math.max(s, toMin(l.start));
    const le = Math.min(e, toMin(l.end));
    if (le > ls) return [[s, ls], [le, e]].filter(([a, b]) => b > a);
  }
  return [[s, e]];
}

function minuteOfDay(ms) {
  const p = CL.parts(ms);
  return p.h * 60 + p.mi + p.s / 60;
}

function isWorkTime(ms, schedule = DEFAULT_SCHEDULE) {
  if (!schedule.workdays.includes(CL.parts(ms).dow)) return false;
  const m = minuteOfDay(ms);
  return dayIntervals(schedule).some(([a, b]) => m >= a && m < b);
}

/**
 * Liệt kê các khoảng [from, to] (ms) là giờ làm nằm giữa t0 và t1.
 * Dùng để "tua" vườn khi app bị tắt một thời gian.
 */
function workSpans(t0, t1, schedule = DEFAULT_SCHEDULE) {
  const spans = [];
  if (t1 <= t0) return spans;
  const intervals = dayIntervals(schedule);
  let day = CL.dayStart(t0);
  for (let guard = 0; day <= t1 && guard < 4000; guard++) {
    if (schedule.workdays.includes(CL.parts(day + CL.DAY / 2).dow)) {
      for (const [a, b] of intervals) {
        const s = Math.max(day + a * MIN, t0);
        const e = Math.min(day + b * MIN, t1);
        if (e > s) spans.push([s, e]);
      }
    }
    day = CL.nextDay(day);
  }
  return spans;
}

function workMinutesBetween(t0, t1, schedule = DEFAULT_SCHEDULE) {
  return workSpans(t0, t1, schedule).reduce((sum, [s, e]) => sum + (e - s) / MIN, 0);
}

/** Phút làm việc mỗi ngày (để gợi ý nhịp tưới). */
function workMinutesPerDay(schedule = DEFAULT_SCHEDULE) {
  return dayIntervals(schedule).reduce((s, [a, b]) => s + (b - a), 0);
}

/** Khung giờ nở [HH:MM, HH:MM] có giao với giờ làm không (nếu không thì bỏ qua khung). */
function windowUsable(window, schedule = DEFAULT_SCHEDULE) {
  if (!window) return false;
  const a = toMin(window[0]);
  const b = toMin(window[1]);
  return dayIntervals(schedule).some(([s, e]) => Math.min(b, e) - Math.max(a, s) >= 15);
}

function inWindow(ms, window) {
  const m = minuteOfDay(ms);
  return m >= toMin(window[0]) && m < toMin(window[1]);
}

/** Trạng thái hiển thị cho HUD: đang làm / nghỉ trưa / hết giờ, còn bao lâu. */
function describeNow(ms, schedule = DEFAULT_SCHEDULE) {
  const working = isWorkTime(ms, schedule);
  const isWorkday = schedule.workdays.includes(CL.parts(ms).dow);
  const m = minuteOfDay(ms);
  const ints = dayIntervals(schedule);
  if (working) {
    const cur = ints.find(([a, b]) => m >= a && m < b);
    return { working, label: 'Giờ làm', detail: `còn ${fmtDuration(cur[1] - m)}` };
  }
  if (isWorkday && ints.length && m >= ints[0][0] && m < ints[ints.length - 1][1]) {
    return { working, label: 'Nghỉ trưa', detail: 'vườn tạm nghỉ' };
  }
  return { working, label: 'Ngoài giờ', detail: 'vườn đang ngủ' };
}

function fmtDuration(min) {
  min = Math.max(0, Math.round(min));
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}g${String(m).padStart(2, '0')}`;
  if (h) return `${h} giờ`;
  return `${m} phút`;
}

module.exports = {
  DEFAULT_SCHEDULE, MIN, toMin, fmtMin, fmtDuration, dayIntervals, isWorkTime, workSpans,
  workMinutesBetween, workMinutesPerDay, windowUsable, inWindow, describeNow,
};

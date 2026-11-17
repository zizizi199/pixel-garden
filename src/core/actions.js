'use strict';
/**
 * Bảng hành động của người chơi – dùng chung cho máy chủ (Supabase Edge Function, server/game.js)
 * và chế độ chơi offline khi bản build chưa cấu hình Supabase.
 * Mọi hàm sửa `state` tại chỗ và trả về { ok, msg, ... }.
 */
const G = require('./garden');
const MG = require('./minigames');
const CL = require('./clock');

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
// Tăng khi đổi cách game và máy chủ nói chuyện (game cũ sẽ được nhắc cập nhật).
const PROTOCOL = 1;

/** Cài đặt người chơi (đã kiểm tra hợp lệ). Phần chỉ ảnh hưởng cửa sổ (vị trí, luôn trên cùng…) app tự áp. */
function updateSettings(state, patch, now = Date.now()) {
  G.advance(state, now); // tính xong theo lịch cũ trước khi đổi lịch
  const s = state.settings;
  if (patch.schedule) {
    const sc = { ...s.schedule, ...patch.schedule };
    sc.lunch = { ...s.schedule.lunch, ...(patch.schedule.lunch || {}) };
    sc.lunch.enabled = !!sc.lunch.enabled;
    const times = [sc.start, sc.end, sc.lunch.start, sc.lunch.end];
    if (!times.every((t) => TIME_RE.test(t))) return { ok: false, msg: 'Giờ phải có dạng HH:MM.' };
    if (sc.end <= sc.start) return { ok: false, msg: 'Giờ kết thúc phải sau giờ bắt đầu.' };
    if (!Array.isArray(sc.workdays) || !sc.workdays.length) return { ok: false, msg: 'Chọn ít nhất 1 ngày vườn hoạt động.' };
    sc.workdays = [...new Set(sc.workdays.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    if (!sc.workdays.length) return { ok: false, msg: 'Chọn ít nhất 1 ngày vườn hoạt động.' };
    s.schedule = { start: sc.start, end: sc.end, lunch: { enabled: sc.lunch.enabled, start: sc.lunch.start, end: sc.lunch.end }, workdays: sc.workdays };
  }
  for (const k of ['ownerName', 'notify', 'usePacks', 'music', 'sfx']) if (k in patch) s[k] = k === 'ownerName' ? String(patch[k]).slice(0, 24) : !!patch[k];
  if ('petTalk' in patch) s.petTalk = !!patch.petTalk;
  if (['it', 'vua', 'nhieu'].includes(patch.talkRate)) s.talkRate = patch.talkRate;
  if ('volume' in patch) s.volume = Math.max(0, Math.min(100, Number(patch.volume) || 0));
  if (patch.position && ['top', 'bottom'].includes(patch.position)) s.position = patch.position;
  if (patch.barWidth && ['full', 'compact'].includes(patch.barWidth)) s.barWidth = patch.barWidth;
  if ('alwaysOnTop' in patch) s.alwaysOnTop = !!patch.alwaysOnTop;
  if ('autoStart' in patch) s.autoStart = !!patch.autoStart;
  return { ok: true, msg: 'Đã lưu cài đặt.' };
}

/**
 * Đặt lại giờ làm bắt đầu từ bây giờ, giữ nguyên độ dài ca (vd 8:00–17:00 = 9 tiếng → 9:30–18:30).
 * Dùng khi hôm nay đi làm lệch giờ. Giờ nghỉ trưa giữ nguyên. Đổi lại được trong Cài đặt.
 */
function resetShift(state, now = Date.now()) {
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const sc = state.settings.schedule;
  const len = toMin(sc.end) - toMin(sc.start);
  const d = CL.parts(now);
  const start = d.h * 60 + d.mi;
  const end = Math.min(start + len, 23 * 60 + 59);
  if (end - start < 30) return { ok: false, msg: 'Đã quá muộn trong ngày để bắt đầu lại.' };
  const workdays = sc.workdays.includes(d.dow) ? sc.workdays : [...sc.workdays, d.dow].sort();
  const r = updateSettings(state, { schedule: { start: fmt(start), end: fmt(end), workdays } }, now);
  return r.ok ? { ok: true, msg: 'Vườn bắt đầu tính thời gian từ bây giờ.' } : r;
}

const ACTIONS = {
  plant: (s, a) => G.plantSeed(s, a.slot, a.species),
  water: (s, a) => G.water(s, a.slot),
  waterAll: (s) => G.waterAll(s),
  harvest: (s, a) => G.harvest(s, a.slot),
  fertilize: (s, a) => G.fertilize(s, a.slot, a.item),
  equipPower: (s, a) => G.equipPower(s, a.id),
  gameStart: (s, a, c) => MG.start(s, a.game, c.now, c.rng, { bet: a.bet, bets: a.bets }),
  gameFinish: (s, a) => MG.finish(s, a.game, a.token, a.result && typeof a.result === 'object' ? a.result : {}),
  gameMove: (s, a) => MG.move(s, a.game, a.token, a.move),
  sellFish: (s, a) => MG.sellFish(s, a.id, a.all === true),
  remove: (s, a) => G.removePlant(s, a.slot),
  clearTheft: (s, a) => G.clearTheft(s, a.slot),
  buy: (s, a) => G.buy(s, a.kind, a.id, a.qty),
  equipScene: (s, a) => G.equipScene(s, a.kind, a.id),
  unlock: (s, a) => G.unlock(s, a.kind, a.id),
  daily: (s) => G.claimDaily(s),
  spin: (s, a) => G.spinWheel(s, a.count === 10 ? 10 : 1),
  ackSpin: (s) => G.ackSpin(s),
  buySlot: (s) => G.buySlot(s),
  placePot: (s, a) => G.placePot(s, a.slot, a.pot),
  placeDecor: (s, a) => G.placeDecor(s, a.slot, a.pos, a.id),
  placeHouseDecor: (s, a) => G.placeHouseDecor(s, a.pos, a.id),
  upgradeHouse: (s) => G.upgradeHouse(s),
  setPet: (s, a) => G.setPet(s, a.id),
  settings: (s, a, c) => updateSettings(s, a.patch && typeof a.patch === 'object' ? a.patch : {}, c.now),
  resetShift: (s, a, c) => resetShift(s, c.now),
  admin: (s, a, c) => (c.admin ? G.admin(s, a) : { ok: false, msg: 'Admin đã tắt.' }),
};

/**
 * Chạy 1 hành động. ctx = { now, rng, admin }.
 * Trả về { r, state } – state có thể là object mới (adminReset: chơi lại từ đầu, giữ Cài đặt).
 */
function run(state, a, ctx = {}) {
  const c = { now: ctx.now || Date.now(), rng: ctx.rng || Math.random, admin: !!ctx.admin };
  if (!a || typeof a !== 'object') return { r: { ok: false, msg: 'Hành động không hợp lệ.' }, state };
  G.advance(state, c.now);
  if (a.type === 'adminReset') {
    if (!c.admin) return { r: { ok: false, msg: 'Admin đã tắt.' }, state };
    const fresh = G.createState(c.now);
    fresh.settings = state.settings;
    return { r: { ok: true, msg: 'Đã chơi lại từ đầu.' }, state: fresh };
  }
  const fn = Object.prototype.hasOwnProperty.call(ACTIONS, a.type) ? ACTIONS[a.type] : null;
  if (!fn) return { r: { ok: false, msg: 'Hành động không hợp lệ.' }, state };
  return { r: fn(state, a, c) || { ok: false, msg: 'Không thực hiện được.' }, state };
}

// adminList / adminUser: bảng tài khoản người chơi – chỉ máy chủ xử lý (server/game.js)
const ADMIN_TYPES = new Set(['admin', 'adminReset', 'adminList', 'adminUser']);

module.exports = { PROTOCOL, ACTIONS, ADMIN_TYPES, run, updateSettings, resetShift, TIME_RE };

'use strict';
/**
 * Logic vườn — thuần JS, không phụ thuộc Electron để dễ test và để dùng lại
 * cho chế độ LAN (máy chủ vườn) sau này.
 *
 * Mọi hàm hành động đều sửa `state` tại chỗ và trả về { ok, msg, ... }.
 */
const MG = require('./minigames');
const C = require('./catalog');
const S = require('./schedule');
const D = require('./decor');

const STATE_VERSION = 1;
const LOG_MAX = 120;

function createState(now = Date.now()) {
  return {
    version: STATE_VERSION,
    simTime: now,
    money: C.RULES.startMoney,
    exp: 0,
    level: 1,
    slots: Array.from({ length: C.RULES.startSlots }, () => ({ pot: 'nhua', plant: null, decor: [null, null, null, null] })),
    house: { level: 1, decor: { roof: null, window: null, side: null, front: null } },
    scene: { object: null, background: null },
    inventory: { pots: {}, decor: {}, houseDecor: {}, sceneObjects: {}, backgrounds: {}, items: { phan_bon: 3 }, powers: { cu_huc: 1 }, fish: {}, seeds: { ...C.RULES.starterSeeds } },
    unlocked: { species: C.SPECIES.filter((x) => !x.unlock && !x.wheel).map((x) => x.id), pots: ['nhua'], decor: [], pets: [], sceneObjects: [], backgrounds: [] },
    wheel: { spins: 0, pityEpic: 0, pityLeg: 0, freeDay: null, history: [], pending: null },
    daily: { last: null, streak: 0 },
    pets: { owned: [], active: null, status: {} }, // status[id] = { sleepUntil, blocks }
    arena: { power: 'cu_huc', wins: 0, losses: 0 }, // Đấu trường thú (nhóm Supabase)
    minigames: { day: null, plays: {}, pending: null, best: {} }, // Bắt sâu, Ghép cặp, Câu cá (src/core/minigames.js)
    unlocks: {},
    stats: { harvested: 0, watered: 0, earned: 0, stolenFromMe: 0 },
    log: [],
    settings: defaultSettings(),
  };
}

function defaultSettings() {
  return {
    ownerName: '',
    schedule: JSON.parse(JSON.stringify(S.DEFAULT_SCHEDULE)),
    position: 'bottom', // bottom | top
    barWidth: 'full', // full | compact
    alwaysOnTop: true,
    notify: true,
    autoStart: false,
    usePacks: true,
    petTalk: true,
    talkRate: 'vua', // it | vua | nhieu
    music: false, // nhạc nền (mặc định tắt vì dùng ở văn phòng)
    sfx: true,
    volume: 50,
  };
}

/** Bổ sung trường còn thiếu khi đọc file lưu cũ. */
function migrate(raw, now = Date.now()) {
  const base = createState(now);
  if (!raw || typeof raw !== 'object') return base;
  const st = { ...base, ...raw };
  st.settings = { ...base.settings, ...(raw.settings || {}) };
  st.settings.schedule = { ...base.settings.schedule, ...((raw.settings || {}).schedule || {}) };
  st.inventory = { ...base.inventory, ...(raw.inventory || {}) };
  for (const k of ['pots', 'decor', 'houseDecor', 'sceneObjects', 'backgrounds', 'items', 'seeds', 'powers', 'fish']) st.inventory[k] = { ...(st.inventory[k] || {}) };
  st.inventory.powers.cu_huc = 1;
  st.arena = { ...base.arena, ...(raw.arena || {}) };
  if (!st.inventory.powers[st.arena.power]) st.arena.power = 'cu_huc';
  st.scene = { ...base.scene, ...(raw.scene || {}) };
  if (!D.SCENE_OBJECTS_BY_ID[st.scene.object] || !st.inventory.sceneObjects[st.scene.object]) st.scene.object = null;
  if (!D.BACKGROUNDS_BY_ID[st.scene.background] || !st.inventory.backgrounds[st.scene.background]) st.scene.background = null;
  // Bản cũ: trang trí chung cho cả vườn → hoàn tiền (đồ trang trí giờ gắn theo từng chậu).
  if (Array.isArray(raw.decor)) {
    const OLD = { hang_rao: 60, den_long: 150, chuong_gio: 140, ech_gom: 260, ghe_da: 200, meo_ngu: 320, bu_nhin: 420, dai_phun: 850 };
    let refund = 0;
    raw.decor.forEach((id) => { if (id && OLD[id]) refund += OLD[id]; });
    Object.entries((raw.inventory || {}).decor || {}).forEach(([id, n]) => { if (OLD[id]) refund += OLD[id] * n; });
    st.inventory.decor = {};
    if (refund) { st.money += refund; st.log.unshift({ at: now, type: 'refund', text: `Trang trí đã đổi sang kiểu theo từng chậu: hoàn ${refund} xu cho đồ trang trí cũ.` }); }
  }
  delete st.decor;
  st.slots = st.slots.map((x) => ({ ...x, decor: Array.isArray(x.decor) && x.decor.length === 4 ? x.decor : [null, null, null, null] }));
  st.house = { level: 1, ...(raw.house || {}) };
  st.house.decor = { roof: null, window: null, side: null, front: null, ...((raw.house || {}).decor || {}) };
  if (!raw.unlocked) { // save cũ (trước khi có mở khoá): mở sẵn những giống/chậu người chơi đã dùng
    const used = new Set(st.slots.map((x) => x.plant && x.plant.species).filter(Boolean));
    st.unlocked = {
      species: C.SPECIES.filter((x) => !x.unlock || used.has(x.id)).map((x) => x.id),
      pots: ['nhua', ...new Set([...Object.keys(st.inventory.pots), ...st.slots.map((x) => x.pot)].filter((x) => x !== 'nhua'))],
    };
    if (!raw.inventory || !raw.inventory.seeds) st.inventory.seeds = { ...C.RULES.starterSeeds };
  }
  st.unlocked = {
    species: [...(st.unlocked.species || [])], pots: [...(st.unlocked.pots || ['nhua'])],
    decor: [...(st.unlocked.decor || [])], pets: [...(st.unlocked.pets || [])],
    sceneObjects: [...(st.unlocked.sceneObjects || [])], backgrounds: [...(st.unlocked.backgrounds || [])],
  };
  // vật phẩm vòng quay người chơi đã có từ trước → coi như đã mở khoá
  for (const id of Object.keys(st.inventory.decor)) if (D.POT_DECOR_BY_ID[id] && D.POT_DECOR_BY_ID[id].wheel && !st.unlocked.decor.includes(id)) st.unlocked.decor.push(id);
  for (const sl of st.slots) for (const id of sl.decor || []) if (id && D.POT_DECOR_BY_ID[id] && D.POT_DECOR_BY_ID[id].wheel && !st.unlocked.decor.includes(id)) st.unlocked.decor.push(id);
  for (const id of (st.pets && st.pets.owned) || []) if (!st.unlocked.pets.includes(id)) st.unlocked.pets.push(id);
  st.wheel = { spins: 0, pityEpic: 0, pityLeg: 0, freeDay: null, history: [], pending: null, ...(raw.wheel || {}) };
  st.daily = { last: null, streak: 0, ...(raw.daily || {}) };
  st.stats = { ...base.stats, ...(raw.stats || {}) };
  st.pets = { ...base.pets, ...(raw.pets || {}) };
  if (!Array.isArray(st.pets.owned)) st.pets.owned = [];
  st.pets.status = { ...(st.pets.status || {}) };
  if (!Array.isArray(st.slots) || !st.slots.length) st.slots = base.slots;
  if (!Array.isArray(st.log)) st.log = [];
  if (typeof st.simTime !== 'number' || st.simTime > now) st.simTime = now;
  st.version = STATE_VERSION;
  return st;
}

// ---------------------------------------------------------------- hiệu ứng

/** (Giữ cho tương thích) – trang trí giờ tính theo từng chậu, xem mods(). */
function decorFx() {
  return {};
}

function potOf(slot) {
  return C.POTS_BY_ID[slot.pot] || C.POTS_BY_ID.nhua;
}

/** Tổng hiệu ứng của 1 ô: chậu + 4 món trang trí của chậu đó. */
function mods(slot) {
  const pot = potOf(slot);
  const m = { water: pot.water, growth: pot.growth || 0, sell: pot.sell || 0, exp: pot.exp || 0, guard: 0 };
  let dw = 0;
  for (const id of slot.decor || []) {
    const d = id && D.POT_DECOR_BY_ID[id];
    if (!d) continue;
    dw += d.fx.water || 0; m.growth += d.fx.growth || 0; m.sell += d.fx.sell || 0; m.exp += d.fx.exp || 0; m.guard += d.fx.guard || 0;
  }
  m.water *= 1 + dw;
  m.guard = Math.min(0.6, m.guard);
  return m;
}

function drainPerMin(species, m) {
  return 100 / (species.waterMinutes * m.water);
}

function growthMult(plant, m) {
  return 1 + (m.growth || 0);
}

function hasWindow(species, schedule) {
  return S.windowUsable(species.window, schedule);
}

// ---------------------------------------------------------------- mô phỏng

function log(state, type, text, extra = {}) {
  state.log.unshift({ at: Date.now(), type, text, ...extra });
  if (state.log.length > LOG_MAX) state.log.length = LOG_MAX;
}

/** Một phút làm việc của một cây. Trả về sự kiện (nếu có). */
function stepPlant(state, idx, t, fx, offline) {
  const slot = state.slots[idx];
  const p = slot.plant;
  if (!p || p.dead) return null;
  // Hoa đã nở: giữ nguyên vẻ đẹp tới khi thu hoạch – không úa/tàn, không cần tưới, không mất máu.
  if (p.bloomed) { p.faded = false; p.water = Math.max(p.water, C.RULES.thirstyAt); return null; }
  const sp = C.SPECIES_BY_ID[p.species];
  const m = mods(slot);
  const schedule = state.settings.schedule;
  let ev = null;

  const before = p.water;
  p.water = Math.max(0, p.water - drainPerMin(sp, m));
  if (before >= C.RULES.thirstyAt && p.water < C.RULES.thirstyAt) ev = 'thirsty';

  if (p.water <= 0) {
    // Khi app tắt / máy ngủ (nghỉ phép, họp cả ngày...) cây không chết, chỉ yếu đi.
    const floor = offline ? C.RULES.offlineMinHealth : 0;
    p.health = Math.max(Math.min(p.health, floor), p.health - C.RULES.dryHealthLossPerMin);
    if (p.health <= 0) {
      p.dead = true;
      return 'dead';
    }
  }

  if (p.old) return ev;

  let g = growthMult(p, m);
  if (p.water <= 0) g = 0;
  else if (p.water < C.RULES.thirstyAt) g *= 0.5;

  const windowed = hasWindow(sp, schedule);
  if (!p.bloomed) {
    p.progress = Math.min(1, p.progress + g / sp.bloomMinutes);
    p.waiting = false;
    if (p.progress >= 1) {
      if (!windowed || S.inWindow(t, sp.window)) {
        p.bloomed = true;
        p.faded = false;
        p.bloomAge = 0;
        ev = 'bloom';
      } else {
        p.waiting = true;
      }
    }
  }
  return ev;
}

/**
 * Tua vườn đến thời điểm `now`, chỉ tính các phút nằm trong giờ làm.
 * opts.offline: đoạn thời gian app không chạy → cây không chết (máu tối thiểu RULES.offlineMinHealth).
 * Trả về danh sách sự kiện [{type, slot, species}].
 */
function advance(state, now = Date.now(), opts = {}) {
  const offline = opts.offline ?? (now - state.simTime > C.RULES.offlineGapMs);
  const events = [];
  const schedule = state.settings.schedule;
  const fx = decorFx(state);
  let cursor = state.simTime;
  for (const [s, e] of S.workSpans(state.simTime, now, schedule)) {
    let t = Math.max(s, cursor);
    while (t + S.MIN <= e) {
      for (let i = 0; i < state.slots.length; i++) {
        const type = stepPlant(state, i, t, fx, offline);
        if (type) events.push({ type, slot: i, species: state.slots[i].plant.species, at: t });
      }
      t += S.MIN;
    }
    cursor = e >= now ? t : e;
  }
  state.simTime = Math.max(cursor, Math.min(now, state.simTime));
  if (!S.workSpans(state.simTime, now, schedule).length) state.simTime = now;
  for (const ev of events) {
    const name = C.SPECIES_BY_ID[ev.species].name;
    if (ev.type === 'bloom') log(state, 'bloom', `${name} (ô ${ev.slot + 1}) đã nở!`);
    if (ev.type === 'dead') log(state, 'dead', `${name} (ô ${ev.slot + 1}) đã chết vì thiếu nước.`);
    if (ev.type === 'faded') log(state, 'faded', `${name} (ô ${ev.slot + 1}) đã tàn, thu hoạch sẽ ít tiền hơn.`);
  }
  return events;
}

// ---------------------------------------------------------------- admin (chỉ để test)

/**
 * Tua nhanh `minutes` phút vườn, BỎ QUA lịch hoạt động (để test). Khung giờ nở dùng giờ hiện tại;
 * opts.ignoreWindows = true thì hoa có khung giờ cũng nở luôn.
 */
function fastForward(state, minutes, now = Date.now(), opts = {}) {
  const fx = decorFx(state);
  const events = [];
  const n = Math.max(0, Math.min(60 * 24 * 7, Math.round(minutes)));
  for (let m = 0; m < n; m++) {
    for (let i = 0; i < state.slots.length; i++) {
      const p = state.slots[i].plant;
      if (opts.ignoreWindows && p && p.progress >= 1 && !p.bloomed && !p.dead) { p.bloomed = true; p.bloomAge = 0; p.waiting = false; events.push({ type: 'bloom', slot: i, species: p.species, at: now }); continue; }
      const type = stepPlant(state, i, now, fx, false);
      if (type) events.push({ type, slot: i, species: state.slots[i].plant.species, at: now });
    }
  }
  log(state, 'admin', `[Admin] Tua nhanh ${n} phút vườn.`);
  return events;
}

const ADMIN = {
  money(state, a) { const n = Math.round(Number(a.amount) || 0); state.money = Math.max(0, state.money + n); return `${n >= 0 ? '+' : ''}${n} xu`; },
  exp(state, a) {
    const n = Math.round(Number(a.amount) || 0);
    if (n >= 0) { gainExp(state, n); return `+${n} EXP (cấp ${state.level})`; }
    let left = -n; // trừ EXP, tụt cấp nếu cần
    while (left > 0) {
      if (state.exp >= left) { state.exp -= left; left = 0; }
      else if (state.level > 1) { left -= state.exp + 1; state.level -= 1; state.exp = C.expToNext(state.level) - 1; }
      else { state.exp = 0; left = 0; }
    }
    return `${n} EXP (cấp ${state.level})`;
  },
  level(state, a) { state.level = Math.max(1, Math.min(99, state.level + (Number(a.amount) || 1))); state.exp = 0; return `Cấp ${state.level}`; },
  forward(state, a) { const ev = fastForward(state, Number(a.minutes) || 0, Date.now()); return `Đã tua ${a.minutes} phút (${ev.length} sự kiện).`; },
  bloomAll(state) {
    let n = 0;
    state.slots.forEach((sl) => { const p = sl.plant; if (p && !p.dead && !p.bloomed && !p.old) { p.progress = 1; p.bloomed = true; p.faded = false; p.bloomAge = 0; p.waiting = false; n++; } });
    return `Đã cho ${n} cây nở.`;
  },
  thirstAll(state) { state.slots.forEach((sl) => { if (sl.plant && !sl.plant.dead) sl.plant.water = 10; }); return 'Tất cả cây đang khát.'; },
  wakePet(state) { Object.values(state.pets.status).forEach((st) => { st.sleepUntil = 0; }); return 'Đã đánh thức pet.'; },
  freeSpin(state) { state.wheel.freeDay = null; return 'Có thêm 1 lượt quay miễn phí.'; },
  resetDaily(state) { state.daily.last = null; return 'Có thể mở quà hằng ngày lại.'; },
  seeds(state) { state.unlocked.species.forEach((id) => { state.inventory.seeds[id] = (state.inventory.seeds[id] || 0) + 5; }); return '+5 hạt mỗi giống đã mở khoá.'; },
  unlockAll(state) { state.unlocked.species = C.SPECIES.map((x) => x.id); state.unlocked.pots = C.POTS.map((x) => x.id); return 'Đã mở khoá tất cả giống và chậu.'; },
  fert(state) { state.inventory.items.phan_bon = (state.inventory.items.phan_bon || 0) + 10; return '+10 phân bón.'; },
  steal(state) {
    const i = state.slots.findIndex((sl) => sl.plant && sl.plant.bloomed && !sl.plant.faded && !sl.plant.dead);
    if (i < 0) return 'Không có hoa nở để thử hái trộm.';
    return `Khách test hái trộm ô ${i + 1}: ${visitSteal(state, i, 'Khách test').msg}`;
  },
};

function admin(state, a) {
  const fn = ADMIN[a.op];
  if (!fn) return fail('Lệnh admin không hợp lệ.');
  return okr(fn(state, a));
}

// ---------------------------------------------------------------- hành động

const fail = (msg, extra = {}) => ({ ok: false, msg, ...extra });
const okr = (msg, extra = {}) => ({ ok: true, msg, ...extra });

function getSlot(state, idx) {
  return Number.isInteger(idx) && idx >= 0 && idx < state.slots.length ? state.slots[idx] : null;
}

function plantSeed(state, idx, speciesId, now = Date.now()) {
  const slot = getSlot(state, idx);
  const sp = C.SPECIES_BY_ID[speciesId];
  if (!slot || !sp) return fail('Không tìm thấy ô hoặc loài cây.');
  if (slot.plant) return fail('Ô này đã có cây.');
  if (!((state.inventory.seeds[sp.id] || 0) > 0)) return fail(`Hết hạt ${sp.name} – mua thêm trong cửa hàng.`);
  state.inventory.seeds[sp.id] -= 1;
  slot.plant = {
    species: sp.id, progress: 0, water: 100, health: 100, bloomed: false, faded: false,
    waiting: false, bloomAge: 0, fert: 0, harvests: 0, old: false, dead: false,
    plantedAt: now, theft: [], visitors: [],
  };
  log(state, 'plant', `Gieo ${sp.name} vào ô ${idx + 1}.`);
  const lv = gainExp(state, C.RULES.plantExp);
  return okr(`Đã gieo ${sp.name}: +${C.RULES.plantExp} EXP`, { exp: C.RULES.plantExp, levelUp: lv });
}

function water(state, idx, by = null) {
  const slot = getSlot(state, idx);
  const p = slot && slot.plant;
  if (!p) return fail('Ô trống, chưa có cây để tưới.');
  if (p.dead) return fail('Cây đã chết, hãy nhổ đi.');
  if (p.bloomed) return fail('Hoa đã nở, không cần tưới nữa – thu hoạch thôi!');
  if (p.water > C.RULES.waterBlockAbove) return fail('Đất còn ẩm, chưa cần tưới.');
  const dry = p.water < C.RULES.waterExpBelow;
  p.water = 100;
  if (by) {
    p.visitors.unshift({ by, at: Date.now(), type: 'water' });
    p.visitors.length = Math.min(p.visitors.length, 10);
    log(state, 'visit_water', `${by} đã tưới hộ ${C.SPECIES_BY_ID[p.species].name} (ô ${idx + 1}).`);
    return okr('Đã tưới hộ.');
  }
  state.stats.watered += 1;
  // Chỉ cộng EXP khi đất đã khô dưới 50%: tránh tưới liên tục để cày EXP.
  if (!dry) return okr('Đã tưới nước (đất còn khá ẩm nên không có EXP).');
  const lv = gainExp(state, C.RULES.waterExp);
  return okr(`Đã tưới nước: +${C.RULES.waterExp} EXP`, { exp: C.RULES.waterExp, levelUp: lv });
}

function waterAll(state) {
  if (!state.unlocks.binh_lon) return fail('Cần mua "Bình tưới lớn" trong cửa hàng.');
  let n = 0;
  state.slots.forEach((s, i) => { if (water(state, i).ok) n++; });
  return n ? okr(`Đã tưới ${n} cây.`) : fail('Không có cây nào cần tưới.');
}

function harvestValue(state, slot) {
  const p = slot.plant;
  const sp = C.SPECIES_BY_ID[p.species];
  const m = mods(slot);
  let k = p.faded ? C.RULES.fadedValue : 1;
  if (p.health < 50) k *= 0.7;
  return {
    money: Math.round(sp.sell * k * (1 + m.sell)),
    exp: Math.round(sp.exp * k * (1 + m.exp)),
  };
}

/** Sau khi hoa bị hái (chủ hái hoặc bị trộm): cây lâu năm ra nụ lại, cây một mùa thì hết. */
function afterPick(slot) {
  const p = slot.plant;
  const sp = C.SPECIES_BY_ID[p.species];
  p.harvests += 1;
  if (!sp.regrow) {
    slot.plant = null;
    return;
  }
  p.bloomed = false;
  p.faded = false;
  p.bloomAge = 0;
  p.waiting = false;
  if (p.harvests >= sp.regrow.harvests) {
    p.old = true;
    p.progress = 0.7;
  } else {
    p.progress = Math.max(0, 1 - sp.regrow.minutes / sp.bloomMinutes);
  }
}

function harvest(state, idx) {
  const slot = getSlot(state, idx);
  const p = slot && slot.plant;
  if (!p) return fail('Ô trống.');
  if (p.dead) return fail('Cây đã chết.');
  if (!p.bloomed) return fail('Hoa chưa nở.');
  const sp = C.SPECIES_BY_ID[p.species];
  const v = harvestValue(state, slot);
  const wasFaded = p.faded;
  state.money += v.money;
  state.stats.earned += v.money;
  state.stats.harvested += 1;
  afterPick(slot);
  const lv = gainExp(state, v.exp);
  log(state, 'harvest', `Thu hoạch ${sp.name}${wasFaded ? ' (đã tàn)' : ''}: +${v.money} xu, +${v.exp} EXP.`);
  return okr(`+${v.money} xu, +${v.exp} EXP`, { ...v, levelUp: lv });
}

function fertilize(state, idx, id = 'phan_bon') {
  const it = C.ITEMS_BY_ID[id];
  if (!it || !it.fert) return fail('Loại phân bón không hợp lệ.');
  const slot = getSlot(state, idx);
  const p = slot && slot.plant;
  if (!p || p.dead) return fail('Không có cây để bón.');
  if (p.bloomed || p.old) return fail('Chỉ bón cho cây đang lớn.');
  if (p.progress >= 1) return fail('Cây đã ra nụ, chờ tới giờ nở – không cần bón nữa.');
  if ((state.inventory.items[id] || 0) <= 0) return fail(`Hết ${it.name}, mua thêm trong cửa hàng.`);
  const sp = C.SPECIES_BY_ID[p.species];
  const left = (1 - p.progress) * sp.bloomMinutes;
  const cut = Math.min(it.fert, left);
  state.inventory.items[id] -= 1;
  p.progress = Math.min(1, p.progress + it.fert / sp.bloomMinutes);
  const exp = Math.max(1, Math.round(it.fert * C.RULES.fertExpPerMin));
  const lv = gainExp(state, exp);
  log(state, 'fert', `Bón ${it.name} cho ${sp.name} (ô ${idx + 1}): nở sớm hơn ${Math.ceil(cut)} phút.`);
  return okr(`${it.name}: nở sớm hơn ${Math.ceil(cut)} phút, +${exp} EXP`, { exp, levelUp: lv });
}

function removePlant(state, idx) {
  const slot = getSlot(state, idx);
  if (!slot || !slot.plant) return fail('Ô trống.');
  const name = C.SPECIES_BY_ID[slot.plant.species].name;
  slot.plant = null;
  log(state, 'remove', `Nhổ ${name} ở ô ${idx + 1}.`);
  return okr(`Đã nhổ ${name}.`);
}

function clearTheft(state, idx) {
  const slot = getSlot(state, idx);
  if (!slot) return fail('Không có ô.');
  if (slot.theftMark) slot.theftMark = null;
  if (slot.plant) slot.plant.theft = [];
  return okr('Đã dọn dấu vết.');
}

function buy(state, kind, id, qty = 1) {
  const list = { pot: C.POTS_BY_ID, decor: D.POT_DECOR_BY_ID, hdecor: D.HOUSE_DECOR_BY_ID, scene: D.SCENE_OBJECTS_BY_ID, background: D.BACKGROUNDS_BY_ID, item: C.ITEMS_BY_ID, pet: C.PETS_BY_ID, seed: C.SPECIES_BY_ID, power: C.POWERS_BY_ID }[kind];
  const it = list && list[id];
  if (!it) return fail('Không có món này.');
  if (kind === 'seed') return buySeeds(state, id, qty);
  if (kind !== 'pet' && kind !== 'hdecor' && kind !== 'power' && state.level < it.level) return fail(`Cần cấp ${it.level}.`); // pet: chỉ cần đủ tiền
  if (kind === 'pot' && !state.unlocked.pots.includes(id)) return fail(`Cần mở khoá ${it.name} trước.`);
  if (it.once && state.unlocks[id]) return fail('Bạn đã có món này.');
  if (kind === 'pet' && state.pets.owned.includes(id)) return fail(`Bạn đã có ${it.name}.`);
  if (kind === 'scene' && state.inventory.sceneObjects[id]) return fail(`Bạn đã có ${it.name}.`);
  if (kind === 'background' && state.inventory.backgrounds[id]) return fail(`Bạn đã có ${it.name}.`);
  if (it.wheel && (kind === 'scene' || kind === 'background' || kind === 'item' || kind === 'power')) return fail(`${it.name} chỉ có từ Vòng quay may mắn.`);
  if (kind === 'power' && state.inventory.powers[id]) return fail(`Bạn đã có ${it.name}.`);
  if (kind === 'power' && !it.price) return fail(`${it.name} không bán.`);
  if (it.wheel && kind === 'decor' && !state.unlocked.decor.includes(id)) return fail(`${it.name} chỉ có khi quay trúng ở Vòng quay may mắn.`);
  if (it.wheel && kind === 'pet' && !state.unlocked.pets.includes(id)) return fail(`${it.name} chỉ có khi quay trúng ở Vòng quay may mắn.`);
  if (state.money < it.price) return fail(`Không đủ xu (cần ${it.price}).`);
  state.money -= it.price;
  if (kind === 'pot') state.inventory.pots[id] = (state.inventory.pots[id] || 0) + 1;
  if (kind === 'decor') state.inventory.decor[id] = (state.inventory.decor[id] || 0) + 1;
  if (kind === 'hdecor') state.inventory.houseDecor[id] = (state.inventory.houseDecor[id] || 0) + 1;
  if (kind === 'scene') { state.inventory.sceneObjects[id] = 1; state.scene.object = id; }
  if (kind === 'background') { state.inventory.backgrounds[id] = 1; state.scene.background = id; }
  if (kind === 'pet') {
    state.pets.owned.push(id);
    state.pets.status[id] = { sleepUntil: 0, blocks: 0 };
    if (!state.pets.active) state.pets.active = id; // pet đầu tiên tự ra vườn
  }
  if (kind === 'power') state.inventory.powers[id] = 1;
  if (kind === 'item') {
    if (it.once) state.unlocks[id] = true;
    else state.inventory.items[id] = (state.inventory.items[id] || 0) + 1;
  }
  log(state, 'buy', `Mua ${it.name} (-${it.price} xu).`);
  return okr(`Đã mua ${it.name}.`);
}

function equipPower(state, id) {
  if (!C.POWERS_BY_ID[id] || !state.inventory.powers[id]) return fail('Bạn chưa có chưởng lực này.');
  state.arena.power = id;
  return okr(`Pet sẽ dùng ${C.POWERS_BY_ID[id].name} ở Đấu trường.`);
}

/** Phần thưởng đấu trường: kho đồ có thể bị lấy (hạt giống, chậu chưa đặt) và nhận/mất 1 món. */
function arenaBag(state) {
  const seeds = Object.entries(state.inventory.seeds).filter(([id, n]) => n > 0 && C.SPECIES_BY_ID[id]).map(([id, n]) => ({ kind: 'seed', id, n }));
  const pots = Object.entries(state.inventory.pots).filter(([id, n]) => n > 0 && C.POTS_BY_ID[id]).map(([id, n]) => ({ kind: 'pot', id, n }));
  return [...seeds, ...pots].slice(0, 60);
}

function arenaTransfer(state, prize, gain, opponent) {
  const list = prize && (prize.kind === 'seed' ? state.inventory.seeds : prize.kind === 'pot' ? state.inventory.pots : null);
  const it = prize && (prize.kind === 'seed' ? C.SPECIES_BY_ID[prize.id] : C.POTS_BY_ID[prize.id]);
  if (gain) { state.arena.wins += 1; } else { state.arena.losses += 1; }
  if (!list || !it) { log(state, 'arena', gain ? `Thắng ${opponent} ở Đấu trường!` : `Thua ${opponent} ở Đấu trường.`); return; }
  const name = prize.kind === 'seed' ? `1 hạt ${it.name}` : `1 ${it.name}`;
  if (gain) {
    list[prize.id] = (list[prize.id] || 0) + 1; // chỉ nhận món, không mở khoá mua thêm
    log(state, 'arena', `Thắng ${opponent} ở Đấu trường, lấy được ${name}!`);
  } else {
    if ((list[prize.id] || 0) > 0) list[prize.id] -= 1;
    log(state, 'arena', `Thua ${opponent} ở Đấu trường, mất ${name}.`);
  }
}

/**
 * Rương mốc Thần mộc (cây chung của nhóm, mốc 1–10): mốc càng cao quà càng xịn.
 * Máy chủ nhóm đã kiểm tra quyền nhận (đủ mốc, có góp sức, chưa nhận); ở đây chỉ trao quà.
 */
function treeChest(state, milestone, rng = Math.random) {
  const m = Math.max(1, Math.min(10, Math.round(Number(milestone) || 1)));
  const gifts = [];
  const item = (id, n) => { state.inventory.items[id] = (state.inventory.items[id] || 0) + n; gifts.push(`${n} ${C.ITEMS_BY_ID[id].name}`); };
  const coin = (n) => { state.money += n; gifts.push(`${n} xu`); };
  const pickOne = (list) => list[Math.floor(rng() * list.length)];
  const seed = (minTier, maxTier, n) => {
    const sp = pickOne(C.SPECIES.filter((s) => s.tier >= minTier && s.tier <= maxTier));
    state.inventory.seeds[sp.id] = (state.inventory.seeds[sp.id] || 0) + n; gifts.push(`${n} hạt ${sp.name}`);
  };
  const pot = (minTier, maxTier) => {
    const p = pickOne(C.POTS.filter((x) => x.id !== 'nhua' && x.tier >= minTier && x.tier <= maxTier));
    state.inventory.pots[p.id] = (state.inventory.pots[p.id] || 0) + 1; gifts.push(`1 ${p.name}`);
  };
  const power = (wheelOnly, fallback) => {
    const list = C.POWERS.filter((x) => (wheelOnly ? x.wheel : !x.wheel && x.price) && !state.inventory.powers[x.id]);
    if (!list.length) { fallback(); return; }
    const pw = pickOne(list); state.inventory.powers[pw.id] = 1; gifts.push(`chưởng lực ${pw.name}`);
  };
  if (m === 1) { item('phan_bon', 2); seed(0, 1, 2); }
  else if (m === 2) { item('phan_npk', 2); seed(0, 2, 3); }
  else if (m === 3) { item('phan_sieu_toc', 1); coin(200); }
  else if (m === 4) { pot(1, 2); item('phan_npk', 2); }
  else if (m === 5) { item('phan_than_ky', 1); coin(500); }
  else if (m === 6) { pot(2, 3); item('phan_sieu_toc', 1); }
  else if (m === 7) power(false, () => coin(1500));
  else if (m === 8) { item('phan_than_ky', 2); seed(3, 4, 1); }
  else if (m === 9) { item('tien_duoc', 1); pot(3, 4); }
  else power(true, () => { item('tien_duoc', 2); coin(3000); });
  log(state, 'tree', `Rương Thần mộc mốc ${m}: ${gifts.join(', ')}.`);
  return okr(`🎁 Rương mốc ${m}: ${gifts.join(', ')}`, { gifts });
}

function equipScene(state, kind, id) {
  const isObject = kind === 'scene';
  if (!isObject && kind !== 'background') return fail('Loại cảnh không hợp lệ.');
  const list = isObject ? D.SCENE_OBJECTS_BY_ID : D.BACKGROUNDS_BY_ID;
  const owned = isObject ? state.inventory.sceneObjects : state.inventory.backgrounds;
  if (id !== null && (!list[id] || !owned[id])) return fail('Bạn chưa có cảnh này.');
  state.scene[isObject ? 'object' : 'background'] = id;
  return okr(id ? `Đã đặt ${list[id].name}.` : 'Đã cất cảnh vào kho.');
}

function buySeeds(state, id, qty) {
  const sp = C.SPECIES_BY_ID[id];
  const n = Math.max(1, Math.min(99, Math.round(Number(qty) || 1)));
  if (!state.unlocked.species.includes(id)) return fail(`Cần mở khoá giống ${sp.name} trước.`);
  const cost = sp.seed * n;
  if (state.money < cost) return fail(`Không đủ xu (cần ${cost}).`);
  state.money -= cost;
  state.inventory.seeds[id] = (state.inventory.seeds[id] || 0) + n;
  return okr(`Đã mua ${n} hạt ${sp.name}.`);
}

/** Mở khoá giống cây / loại chậu: đủ cấp + trả tiền 1 lần. */
function unlock(state, kind, id) {
  const it = kind === 'species' ? C.SPECIES_BY_ID[id] : kind === 'pot' ? C.POTS_BY_ID[id] : null;
  if (!it) return fail('Không có món này.');
  const list = kind === 'species' ? state.unlocked.species : state.unlocked.pots;
  if (list.includes(id)) return fail('Đã mở khoá rồi.');
  if (it.wheel) return fail(`${it.name} chỉ mở khoá được khi quay trúng ở Vòng quay may mắn.`);
  if (state.level < it.level) return fail(`Cần cấp ${it.level} để mở khoá ${it.name}.`);
  if (state.money < it.unlock) return fail(`Không đủ xu (cần ${it.unlock}).`);
  state.money -= it.unlock;
  list.push(id);
  log(state, 'unlock', `Mở khoá ${kind === 'species' ? 'giống' : ''} ${it.name} (-${it.unlock} xu).`);
  return okr(`Đã mở khoá ${it.name}!`);
}

// ---------------------------------------------------------------- quà hằng ngày

function dayKey(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dailyAvailable(state, now = Date.now()) {
  return state.daily.last !== dayKey(now);
}

function pickWeighted(items, weight, rng) {
  const total = items.reduce((s, x) => s + weight(x), 0);
  let r = rng() * total;
  for (const x of items) { r -= weight(x); if (r <= 0) return x; }
  return items[items.length - 1];
}

/** Mở quà hằng ngày. Tỉ lệ xem RULES.daily. */
function claimDaily(state, now = Date.now(), rng = Math.random) {
  if (!dailyAvailable(state, now)) return fail('Hôm nay đã nhận quà rồi, mai quay lại nhé!');
  const R = C.RULES.daily;
  const yesterday = dayKey(now - 86400000);
  state.daily.streak = state.daily.last === yesterday ? state.daily.streak + 1 : 1;
  state.daily.last = dayKey(now);
  const roll = rng();
  const pets = C.PETS.filter((p) => p.tier === 0 && !p.wheel && !state.pets.owned.includes(p.id));
  const pots = state.unlocked.pots.filter((id) => id !== 'nhua').map((id) => C.POTS_BY_ID[id]);
  let reward;
  if (roll < R.pet && pets.length) {
    const p = pets[Math.floor(rng() * pets.length)];
    state.pets.owned.push(p.id);
    state.pets.status[p.id] = { sleepUntil: 0, blocks: 0 };
    if (!state.pets.active) state.pets.active = p.id;
    reward = { kind: 'pet', id: p.id, qty: 1, name: p.name, rare: true };
  } else if (roll < R.pet + R.pot && pots.length) {
    const pot = pickWeighted(pots, (x) => 1 / Math.max(1, x.price), rng);
    state.inventory.pots[pot.id] = (state.inventory.pots[pot.id] || 0) + 1;
    reward = { kind: 'pot', id: pot.id, qty: 1, name: pot.name };
  } else {
    const sps = state.unlocked.species.map((id) => C.SPECIES_BY_ID[id]);
    const sp = pickWeighted(sps, (x) => 1 / x.seed, rng);
    const qty = pickWeighted(R.seedQty, (x) => x[1], rng)[0];
    state.inventory.seeds[sp.id] = (state.inventory.seeds[sp.id] || 0) + qty;
    reward = { kind: 'seed', id: sp.id, qty, name: sp.name };
  }
  log(state, 'gift', `Quà hằng ngày: ${reward.qty > 1 ? `${reward.qty} ` : ''}${reward.kind === 'seed' ? 'hạt ' : ''}${reward.name}${reward.rare ? ' (hiếm!)' : ''}.`);
  return okr(`Quà hôm nay: ${reward.qty > 1 ? `${reward.qty} ` : ''}${reward.kind === 'seed' ? 'hạt ' : ''}${reward.name}!`, { reward, streak: state.daily.streak });
}

// ---------------------------------------------------------------- vòng quay may mắn

/** Danh sách vật phẩm độc quyền của vòng quay, theo bậc. */
function wheelPool() {
  const pool = C.TIERS.map(() => []);
  C.SPECIES.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: 'species', id: x.id, name: x.name, tier: x.tier }));
  C.POTS.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: 'pot', id: x.id, name: x.name, tier: x.tier }));
  D.POT_DECOR.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: 'decor', id: x.id, name: x.name, tier: x.tier }));
  D.SCENE_OBJECTS.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: 'scene', id: x.id, name: x.name, tier: x.tier }));
  D.BACKGROUNDS.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: 'background', id: x.id, name: x.name, tier: x.tier }));
  C.PETS.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: 'pet', id: x.id, name: x.name, tier: x.tier }));
  C.POWERS.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: 'power', id: x.id, name: x.name, tier: x.tier }));
  C.ITEMS.filter((x) => x.wheel && x.fert).forEach((x) => pool[x.tier].push({ kind: 'fert', id: x.id, name: x.name, tier: x.tier }));
  return pool;
}

function wheelOwned(state, it) {
  if (it.kind === 'species') return state.unlocked.species.includes(it.id);
  if (it.kind === 'pot') return state.unlocked.pots.includes(it.id);
  if (it.kind === 'decor') return state.unlocked.decor.includes(it.id);
  if (it.kind === 'scene') return !!state.inventory.sceneObjects[it.id];
  if (it.kind === 'background') return !!state.inventory.backgrounds[it.id];
  if (it.kind === 'power') return !!state.inventory.powers[it.id];
  if (it.kind === 'fert') return false; // tiêu hao: trúng lúc nào cũng nhận
  return state.unlocked.pets.includes(it.id) || state.pets.owned.includes(it.id);
}

function rollTier(state, rng) {
  const W = C.RULES.wheel;
  let minTier = 0;
  if (state.wheel.pityLeg >= W.pityLegendary - 1) minTier = 4;
  else if (state.wheel.pityEpic >= W.pityEpic - 1) minTier = 2; // 10 lượt chắc chắn Rare+
  const rates = W.rates.map((r, i) => (i >= minTier ? r : 0));
  const total = rates.reduce((a, b) => a + b, 0);
  let x = rng() * total;
  for (let i = 0; i < rates.length; i++) { x -= rates[i]; if (x < 0) return i; }
  return rates.length - 1;
}

function spinOnce(state, rng) {
  const W = C.RULES.wheel;
  const tier = rollTier(state, rng);
  state.wheel.spins += 1;
  state.wheel.pityEpic = tier >= 2 ? 0 : state.wheel.pityEpic + 1;
  state.wheel.pityLeg = tier >= 4 ? 0 : state.wheel.pityLeg + 1;
  const items = wheelPool()[tier];
  if (!items.length || (tier === 0 && rng() >= W.commonItemChance)) { // quà an ủi
    const r = rng();
    if (r < 0.45) { const n = 60 + Math.floor(rng() * 10) * 10; state.money += n; return { tier, kind: 'coin', name: `${n} xu`, qty: n }; }
    if (r < 0.7) { state.inventory.items.phan_npk = (state.inventory.items.phan_npk || 0) + 2; return { tier, kind: 'item', id: 'phan_npk', name: '2 Phân NPK', qty: 2 }; }
    const sps = state.unlocked.species.map((id) => C.SPECIES_BY_ID[id]);
    const sp = pickWeighted(sps, (x) => 1 / x.seed, rng);
    state.inventory.seeds[sp.id] = (state.inventory.seeds[sp.id] || 0) + 3;
    return { tier, kind: 'seed', id: sp.id, name: `3 hạt ${sp.name}`, qty: 3 };
  }
  const fresh = items.filter((it) => !wheelOwned(state, it));
  const pickFrom = fresh.length && rng() < W.newItemChance ? fresh : items;
  const it = pickFrom[Math.floor(rng() * pickFrom.length)];
  const dup = wheelOwned(state, it);
  const res = { tier, kind: it.kind, id: it.id, name: it.name, dup };
  if (it.kind === 'species') {
    if (!dup) state.unlocked.species.push(it.id);
    const n = dup ? 3 : 2;
    state.inventory.seeds[it.id] = (state.inventory.seeds[it.id] || 0) + n;
    res.bonus = `${n} hạt`;
  } else if (it.kind === 'pot') {
    if (!dup) state.unlocked.pots.push(it.id);
    state.inventory.pots[it.id] = (state.inventory.pots[it.id] || 0) + 1;
    res.bonus = '1 chậu';
  } else if (it.kind === 'decor') {
    if (!dup) state.unlocked.decor.push(it.id);
    state.inventory.decor[it.id] = (state.inventory.decor[it.id] || 0) + 1;
    res.bonus = '1 món';
  } else if (it.kind === 'scene' || it.kind === 'background') {
    const isObject = it.kind === 'scene';
    const stock = isObject ? state.inventory.sceneObjects : state.inventory.backgrounds;
    const unlocks = isObject ? state.unlocked.sceneObjects : state.unlocked.backgrounds;
    if (dup) {
      const item = isObject ? D.SCENE_OBJECTS_BY_ID[it.id] : D.BACKGROUNDS_BY_ID[it.id];
      const n = Math.round(item.price * 0.1);
      state.money += n;
      res.bonus = `${n} xu (trùng)`;
    } else {
      unlocks.push(it.id);
      stock[it.id] = 1;
      state.scene[isObject ? 'object' : 'background'] = it.id;
      res.bonus = 'đã đặt vào vườn';
    }
  } else if (it.kind === 'power') {
    if (dup) { const n = 50 * (it.tier + 1); state.money += n; res.bonus = `${n} xu (trùng)`; }
    else { state.inventory.powers[it.id] = 1; res.bonus = 'chưởng lực mới'; }
  } else if (it.kind === 'fert') {
    state.inventory.items[it.id] = (state.inventory.items[it.id] || 0) + 2;
    res.bonus = '2 lọ';
  } else if (dup) { // pet trùng → đổi ra xu
    const n = Math.round(C.PETS_BY_ID[it.id].price * 0.1);
    state.money += n;
    res.bonus = `${n} xu (trùng)`;
  } else {
    state.unlocked.pets.push(it.id);
    res.bonus = 'mở khoá để mua';
  }
  return res;
}

/**
 * Quay `count` lượt (1 hoặc 10). Lượt miễn phí: 1 lần/ngày (chỉ khi quay 1).
 * Trả về kết quả từng lượt; bậc cao nhất dùng để quay bánh xe trên giao diện.
 */
function spinWheel(state, count = 1, now = Date.now(), rng = Math.random) {
  if (state.wheel.pending) return fail('Hãy xem phần thưởng vừa quay trước khi quay tiếp.');
  const W = C.RULES.wheel;
  const n = count === 10 ? 10 : 1;
  const today = dayKey(now);
  const free = n === 1 && state.wheel.freeDay !== today;
  const cost = free ? 0 : n === 10 ? W.cost10 : W.cost;
  if (state.money < cost) return fail(`Không đủ xu (cần ${cost}).`);
  state.money -= cost;
  if (free) state.wheel.freeDay = today;
  const results = Array.from({ length: n }, () => spinOnce(state, rng));
  const best = results.reduce((a, b) => (b.tier > a.tier ? b : a));
  for (const r of results) if (r.tier >= 3) log(state, 'wheel', `🎡 Vòng quay: trúng ${C.TIERS[r.tier].name} – ${r.name}${r.dup ? ' (trùng)' : ''}!`);
  state.wheel.history = [...results.map((r) => ({ ...r, at: now })), ...state.wheel.history].slice(0, 30);
  state.wheel.pending = { results, best, free };
  return okr(n === 1 ? `Trúng ${C.TIERS[best.tier].name}: ${best.name}!` : `Quay 10 lượt – cao nhất: ${C.TIERS[best.tier].name} ${best.name}`, { results, best, free });
}

function ackSpin(state) {
  if (!state.wheel.pending) return fail('Không có phần thưởng nào đang chờ xem.');
  state.wheel.pending = null;
  return okr('Đã xem phần thưởng.');
}

function buySlot(state) {
  if (state.slots.length >= C.RULES.maxSlots) return fail('Vườn đã đủ ô tối đa.');
  const needLv = C.RULES.slotLevel(state.slots.length);
  if (state.level < needLv) return fail(`Cần cấp ${needLv} để mở thêm ô chậu.`);
  const price = C.RULES.slotPrice(state.slots.length);
  if (state.money < price) return fail(`Không đủ xu (cần ${price}).`);
  state.money -= price;
  state.slots.push({ pot: 'nhua', plant: null, decor: [null, null, null, null] });
  return okr(`Đã mở thêm ô chậu thứ ${state.slots.length}.`);
}

/** Đặt chậu từ kho vào ô; chậu cũ (trừ chậu nhựa) trả về kho. Cây giữ nguyên. */
function placePot(state, idx, potId) {
  const slot = getSlot(state, idx);
  if (!slot || !C.POTS_BY_ID[potId]) return fail('Không hợp lệ.');
  if (potId !== 'nhua' && !(state.inventory.pots[potId] > 0)) return fail('Bạn chưa có chậu này.');
  if (slot.pot === potId) return fail('Ô đang dùng chậu này rồi.');
  if (potId !== 'nhua') state.inventory.pots[potId] -= 1;
  if (slot.pot !== 'nhua') state.inventory.pots[slot.pot] = (state.inventory.pots[slot.pot] || 0) + 1;
  slot.pot = potId;
  return okr(`Đã thay ${C.POTS_BY_ID[potId].name}.`);
}

/** Đặt / cất đồ trang trí ở 1 chỗ (soil|front|left|right) của chậu ô `idx`. id = null để cất về kho. */
function placeDecor(state, idx, pos, id) {
  const slot = getSlot(state, idx);
  const k = D.POT_SLOTS.indexOf(pos);
  if (!slot || k < 0) return fail('Chỗ trang trí không hợp lệ.');
  if (!slot.decor) slot.decor = [null, null, null, null];
  const old = slot.decor[k];
  if (id) {
    const d = D.POT_DECOR_BY_ID[id];
    if (!d) return fail('Không có món này.');
    const place = pos === 'left' || pos === 'right' ? 'side' : pos;
    if (d.place !== place) return fail(`${d.name} không đặt ở ${D.SLOT_NAMES[pos].toLowerCase()} được.`);
    if (!(state.inventory.decor[id] > 0)) return fail('Bạn chưa có món này – mua ở Cửa hàng › Trang trí.');
    state.inventory.decor[id] -= 1;
  }
  if (old) state.inventory.decor[old] = (state.inventory.decor[old] || 0) + 1;
  slot.decor[k] = id || null;
  return okr(id ? `Đã đặt ${D.POT_DECOR_BY_ID[id].name} cho chậu ô ${idx + 1}.` : 'Đã cất vào kho.');
}

// ---------------------------------------------------------------- nhà thú

function houseLevel(state) {
  return D.HOUSE_LEVELS[Math.max(1, Math.min(D.HOUSE_LEVELS.length, state.house.level)) - 1];
}

function upgradeHouse(state) {
  if (!state.pets.owned.length) return fail('Cần có pet trước.');
  const next = D.HOUSE_LEVELS[state.house.level];
  if (!next) return fail('Nhà thú đã ở cấp cao nhất.');
  if (state.money < next.price) return fail(`Không đủ xu (cần ${next.price}).`);
  state.money -= next.price;
  state.house.level = next.level;
  log(state, 'house', `Nâng cấp nhà thú: ${next.name}.`);
  return okr(`Nhà thú đã thành ${next.name}!`);
}

function placeHouseDecor(state, pos, id) {
  if (!D.HOUSE_SLOTS.includes(pos)) return fail('Chỗ trang trí không hợp lệ.');
  const old = state.house.decor[pos];
  if (id) {
    const d = D.HOUSE_DECOR_BY_ID[id];
    if (!d || d.place !== pos) return fail('Món này không đặt ở đây được.');
    if (!(state.inventory.houseDecor[id] > 0)) return fail('Bạn chưa có món này.');
    state.inventory.houseDecor[id] -= 1;
  }
  if (old) state.inventory.houseDecor[old] = (state.inventory.houseDecor[old] || 0) + 1;
  state.house.decor[pos] = id || null;
  return okr(id ? `Đã đặt ${D.HOUSE_DECOR_BY_ID[id].name}.` : 'Đã cất vào kho.');
}

// ---------------------------------------------------------------- pet

/** Chọn pet ra vườn (1 vườn 1 pet); id = null để cất pet đi. */
function setPet(state, id) {
  if (id && !state.pets.owned.includes(id)) return fail('Bạn chưa có pet này.');
  state.pets.active = id || null;
  return okr(id ? `${C.PETS_BY_ID[id].name} đã ra vườn.` : 'Đã cho pet vào nhà.');
}

function petInfo(state, now = Date.now()) {
  const id = state.pets.active;
  if (!id || !C.PETS_BY_ID[id]) return null;
  const st = state.pets.status[id] || { sleepUntil: 0, blocks: 0 };
  const sleepMs = Math.max(0, (st.sleepUntil || 0) - now);
  return { id, name: C.PETS_BY_ID[id].name, sleeping: sleepMs > 0, sleepMs, blocks: st.blocks || 0 };
}

function gainExp(state, n) {
  state.exp += n;
  let up = false;
  while (state.exp >= C.expToNext(state.level)) {
    state.exp -= C.expToNext(state.level);
    state.level += 1;
    up = true;
    log(state, 'level', `Lên cấp ${state.level}!`);
  }
  return up;
}

// ---------------------------------------------------------------- khách ghé (LAN)

/**
 * Khách hái trộm hoa đã nở. Hoa bị lấy đi và để lại dấu vết trên ô.
 * Trả về phần thưởng cho kẻ trộm (để máy của họ cộng vào).
 */
function visitSteal(state, idx, by, rng = Math.random, now = Date.now()) {
  const slot = getSlot(state, idx);
  const p = slot && slot.plant;
  if (!p || p.dead || !p.bloomed) return fail('Không có hoa nở để hái.');
  if (p.faded) return fail('Hoa đã tàn, không đáng hái.');
  const sp = C.SPECIES_BY_ID[p.species];
  // Pet đang thức chặn chắc chắn 1 lần, rồi về nhà ngủ (thời gian thực, tuỳ cấp nhà thú).
  const pet = petInfo(state, now);
  if (pet && !pet.sleeping) {
    const st = state.pets.status[pet.id] || (state.pets.status[pet.id] = { sleepUntil: 0, blocks: 0 });
    const mins = houseLevel(state).sleepMin;
    st.sleepUntil = now + mins * 60000;
    st.blocks = (st.blocks || 0) + 1;
    log(state, 'guarded', `${pet.name} đã đuổi ${by} khỏi ${sp.name} (ô ${idx + 1})! Pet về nhà ngủ ${mins} phút.`, { by });
    return fail(`Bị ${pet.name} đuổi đi!`, { blockedBy: pet.id });
  }
  const fx = mods(slot);
  if (rng() < fx.guard) {
    log(state, 'guarded', `${by} định hái trộm ${sp.name} (ô ${idx + 1}) nhưng bị đuổi đi!`);
    return fail('Bị bảo vệ vườn đuổi đi!');
  }
  const v = harvestValue(state, slot);
  const loot = { money: Math.round(v.money * C.RULES.stealShare), exp: Math.round(v.exp * C.RULES.stealShare) };
  slot.theftMark = { by, at: Date.now(), species: sp.id };
  afterPick(slot);
  state.stats.stolenFromMe += 1;
  log(state, 'stolen', `${by} đã hái trộm ${sp.name} ở ô ${idx + 1}!`, { by });
  return okr(`Hái trộm ${sp.name}: +${loot.money} xu`, { loot });
}

function visitWater(state, idx, by) {
  return water(state, idx, by);
}

// ---------------------------------------------------------------- nhóm chơi chung (máy chủ Supabase)

/**
 * Phần vườn máy chủ nhóm cần để tự xử lý hái trộm khi chủ vườn tắt máy:
 * tiền/EXP kẻ trộm nhận cho từng hoa đang nở, tỉ lệ đồ trang trí chặn trộm, và pet canh vườn.
 */
function remoteGuard(state, now = Date.now()) {
  const slots = state.slots.map((slot) => {
    const p = slot && slot.plant;
    const guard = slot ? Math.round(mods(slot).guard * 100) / 100 : 0;
    if (!p || p.dead || !p.bloomed || p.faded) return { loot: null, guard };
    const v = harvestValue(state, slot);
    return { loot: { money: Math.round(v.money * C.RULES.stealShare), exp: Math.round(v.exp * C.RULES.stealShare) }, guard };
  });
  const pet = petInfo(state, now);
  const st = pet && state.pets.status[pet.id];
  return { slots, guard: { pet: !!pet, petSleepUntil: st ? st.sleepUntil || 0 : 0, petSleepMs: houseLevel(state).sleepMin * 60000 } };
}

/**
 * Áp 1 lượt thăm vườn máy chủ nhóm đã quyết định (chủ vườn có thể đang tắt máy lúc đó).
 * ev = { kind: 'water'|'steal', result: 'ok'|'pet'|'guard', slot, species, by, at }
 */
function applyRemoteVisit(state, ev, now = Date.now()) {
  const by = String((ev && ev.by) || 'Người chơi').slice(0, 24);
  const idx = Number(ev && ev.slot);
  const slot = getSlot(state, idx);
  const p = slot && slot.plant;
  const sp = C.SPECIES_BY_ID[ev && ev.species];
  const spName = sp ? sp.name : 'cây';
  if (ev.kind === 'water') {
    if (ev.result === 'ok' && p && p.species === ev.species) water(state, idx, by);
    return;
  }
  if (ev.kind !== 'steal') return;
  if (ev.result === 'pet') {
    const pet = petInfo(state, now);
    if (!pet) return;
    const st = state.pets.status[pet.id] || (state.pets.status[pet.id] = { sleepUntil: 0, blocks: 0 });
    const mins = houseLevel(state).sleepMin;
    st.sleepUntil = Math.max(st.sleepUntil || 0, (Number(ev.at) || now) + mins * 60000);
    st.blocks = (st.blocks || 0) + 1;
    log(state, 'guarded', `${pet.name} đã đuổi ${by} khỏi ${spName} (ô ${idx + 1})! Pet về nhà ngủ ${mins} phút.`, { by });
    return;
  }
  if (ev.result === 'guard') {
    log(state, 'guarded', `${by} định hái trộm ${spName} (ô ${idx + 1}) nhưng bị đuổi đi!`);
    return;
  }
  if (ev.result !== 'ok') return;
  if (p && !p.dead && p.bloomed && p.species === ev.species) {
    slot.theftMark = { by, at: Number(ev.at) || now, species: ev.species };
    afterPick(slot);
  }
  state.stats.stolenFromMe += 1;
  log(state, 'stolen', `${by} đã hái trộm ${spName} ở ô ${idx + 1}!`, { by });
}

// ---------------------------------------------------------------- hiển thị

function stageOf(p) {
  if (!p) return 'empty';
  if (p.dead) return 'dead';
  if (p.bloomed) return p.faded ? 'faded' : 'bloom';
  if (p.old) return 'young';
  if (p.progress >= 1) return 'bud';
  if (p.progress >= 0.7) return 'bud';
  if (p.progress >= 0.35) return 'young';
  if (p.progress >= 0.1) return 'sprout';
  return 'seed';
}

/** Dữ liệu tính sẵn để giao diện vẽ. */
function view(state, now = Date.now()) {
  const fx = decorFx(state);
  const schedule = state.settings.schedule;
  const slots = state.slots.map((slot, i) => {
    const p = slot.plant;
    const mm = mods(slot);
    const base = { i, pot: slot.pot, theftMark: slot.theftMark || null, decor: slot.decor || [null, null, null, null], mods: mm };
    if (!p) return { ...base, stage: 'empty' };
    const sp = C.SPECIES_BY_ID[p.species];
    const drain = drainPerMin(sp, mm);
    const v = { ...base, species: sp.id, name: sp.name, stage: stageOf(p), water: Math.round(p.water), health: Math.round(p.health),
      fert: p.fert, waiting: p.waiting, old: p.old, harvests: p.harvests, visitors: p.visitors.slice(0, 3),
      progress: p.progress, wilting: p.water <= 0 && !p.bloomed, thirsty: p.water < C.RULES.thirstyAt && !p.dead && !p.bloomed };
    v.thirstyInMin = p.water > C.RULES.thirstyAt ? (p.water - C.RULES.thirstyAt) / drain : 0;
    if (!p.bloomed && !p.old && !p.dead) {
      v.bloomInMin = ((1 - p.progress) * sp.bloomMinutes) / growthMult(p, mm);
    }
    if (p.bloomed) v.thirstyInMin = 0;
    if (p.bloomed) v.value = harvestValue(state, slot);
    if (hasWindow(sp, schedule)) v.window = sp.window;
    return v;
  });
  return {
    money: state.money, exp: state.exp, level: state.level, expNext: C.expToNext(state.level),
    pet: petInfo(state, now), pets: { owned: state.pets.owned, status: state.pets.status },
    slots, house: state.pets.owned.length ? { ...state.house, info: houseLevel(state) } : null, scene: state.scene, inventory: state.inventory, unlocks: state.unlocks, stats: state.stats,
    log: state.log.slice(0, 40), settings: state.settings, fx,
    nextSlotPrice: state.slots.length < C.RULES.maxSlots ? C.RULES.slotPrice(state.slots.length) : null,
    nextSlotLevel: state.slots.length < C.RULES.maxSlots ? C.RULES.slotLevel(state.slots.length) : null,
    wheel: { pityEpic: state.wheel.pityEpic, pityLeg: state.wheel.pityLeg, spins: state.wheel.spins, free: state.wheel.freeDay !== dayKey(now), history: state.wheel.history.slice(0, 12), pending: state.wheel.pending },
    arena: state.arena, minigames: MG.info(state, now), unlocked: state.unlocked, daily: { available: dailyAvailable(state, now), streak: state.daily.streak },
    clock: S.describeNow(now, schedule), now,
  };
}

module.exports = {
  createState, migrate, advance, view, stageOf, decorFx,
  plantSeed, water, waterAll, harvest, fertilize, removePlant, clearTheft,
  buy, equipScene, buySlot, unlock, spinWheel, ackSpin, wheelPool, upgradeHouse, placeHouseDecor, houseLevel, mods, claimDaily, dailyAvailable, dayKey, placePot, placeDecor, setPet, petInfo, gainExp, fastForward, admin, visitSteal, visitWater, harvestValue,
  remoteGuard, applyRemoteVisit, equipPower, arenaBag, arenaTransfer, treeChest,
};

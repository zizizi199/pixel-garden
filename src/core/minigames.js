'use strict';
/**
 * Mini game kiếm vật phẩm: Bắt sâu, Ghép cặp hoa, Câu cá ao vườn.
 * Trò chơi chạy ở giao diện; tiến trình chính quyết định phần thưởng: mỗi lượt phải "bắt đầu" ở đây
 * (trừ lượt trong ngày, tạo đề bài / con cá sẽ cắn câu) rồi mới "kết thúc" bằng đúng mã lượt đó,
 * kết quả gửi lên bị kẹp trong giới hạn hợp lý. Mỗi trò có số lượt mỗi ngày.
 */
const C = require('./catalog');

const LIMITS = { bugs: 3, memory: 3, fish: 5 };
const NAMES = { bugs: 'Bắt sâu', memory: 'Ghép cặp hoa', fish: 'Câu cá ao vườn' };

/** Cá: tier theo bậc độ hiếm chung; price = giá bán 1 con; diff = độ khó khi kéo (0 dễ → 1 rất khó). */
const FISH = [
  { id: 'ca_ro', name: 'Cá rô', tier: 0, price: 15, icon: '🐟', diff: 0.15 },
  { id: 'ca_diec', name: 'Cá diếc', tier: 0, price: 18, icon: '🐟', diff: 0.2 },
  { id: 'ca_bong', name: 'Cá bống', tier: 0, price: 20, icon: '🐟', diff: 0.2 },
  { id: 'ca_chep', name: 'Cá chép', tier: 1, price: 45, icon: '🐠', diff: 0.3 },
  { id: 'ca_loc', name: 'Cá lóc', tier: 1, price: 55, icon: '🐟', diff: 0.35 },
  { id: 'tom_cang', name: 'Tôm càng', tier: 1, price: 60, icon: '🦐', diff: 0.35 },
  { id: 'ca_vang', name: 'Cá vàng', tier: 2, price: 120, icon: '🐠', diff: 0.45 },
  { id: 'cua_dong', name: 'Cua đồng', tier: 2, price: 140, icon: '🦀', diff: 0.5 },
  { id: 'ca_koi', name: 'Cá koi', tier: 3, price: 320, icon: '🎏', diff: 0.6 },
  { id: 'luon_vang', name: 'Lươn vàng', tier: 3, price: 360, icon: '🐍', diff: 0.65 },
  { id: 'ca_rong', name: 'Cá rồng', tier: 4, price: 900, icon: '🐉', diff: 0.75 },
  { id: 'rua_ngoc', name: 'Rùa ngọc', tier: 5, price: 2200, icon: '🐢', diff: 0.85 },
  { id: 'ca_than', name: 'Cá thần ao vườn', tier: 6, price: 6000, icon: '🐋', diff: 0.95 },
];
const FISH_BY_ID = Object.fromEntries(FISH.map((f) => [f.id, f]));
const FISH_RATES = [52, 28, 13, 5, 1.6, 0.35, 0.05]; // % theo bậc (không hiển thị cho người chơi)
const CHEST_CHANCE = 0.06;

const dayKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const ok = (msg, extra = {}) => ({ ok: true, msg, ...extra });
const fail = (msg) => ({ ok: false, msg });

function ensure(state, now) {
  if (!state.minigames || typeof state.minigames !== 'object') state.minigames = { day: null, plays: {}, pending: null, best: {} };
  const mg = state.minigames;
  mg.plays = mg.plays || {}; mg.best = mg.best || {};
  if (mg.day !== dayKey(now)) { mg.day = dayKey(now); mg.plays = {}; }
  if (!state.inventory.fish) state.inventory.fish = {};
  return mg;
}

function info(state, now = Date.now()) {
  const mg = ensure(state, now);
  return Object.fromEntries(Object.keys(LIMITS).map((g) => [g, { left: Math.max(0, LIMITS[g] - (mg.plays[g] || 0)), limit: LIMITS[g], best: mg.best[g] || 0 }]));
}

/** Pet canh vườn giúp câu cá: pet bậc cao tăng nhẹ tỉ lệ cá hiếm; họ mèo kéo cá dễ hơn. */
function petBonus(state) {
  const pet = state.pets.active && C.PETS_BY_ID[state.pets.active];
  if (!pet) return { rare: 0, easy: 0, name: null };
  const cat = /meo/.test(pet.id);
  return { rare: Math.min(0.3, pet.tier * 0.05), easy: cat ? 0.25 : 0.05 * Math.min(pet.tier, 3), name: pet.name, cat };
}

function rollFish(state, rng) {
  if (rng() < CHEST_CHANCE) return { kind: 'chest', tier: 3, diff: 0.55 };
  const bonus = petBonus(state).rare;
  const rates = FISH_RATES.map((r, i) => (i >= 2 ? r * (1 + bonus * 4) : r));
  let x = rng() * rates.reduce((a, b) => a + b, 0);
  let tier = 0;
  for (; tier < rates.length - 1; tier++) { x -= rates[tier]; if (x < 0) break; }
  const f = pick(FISH.filter((y) => y.tier === tier), rng);
  return { kind: 'fish', id: f.id, tier: f.tier, diff: f.diff };
}

/** Bắt đầu 1 lượt: trừ lượt trong ngày và tạo đề bài. */
function start(state, game, now = Date.now(), rng = Math.random) {
  if (!LIMITS[game]) return fail('Trò chơi không hợp lệ.');
  const mg = ensure(state, now);
  if ((mg.plays[game] || 0) >= LIMITS[game]) return fail(`Hôm nay đã hết lượt ${NAMES[game]} – mai quay lại nhé!`);
  mg.plays[game] = (mg.plays[game] || 0) + 1;
  const token = `${game}-${now}-${Math.floor(rng() * 1e9)}`;
  const p = { game, token, at: now };
  const out = { token, left: LIMITS[game] - mg.plays[game] };
  if (game === 'bugs') {
    p.goldenAt = 6 + Math.floor(rng() * 18); // giây xuất hiện bọ vàng
    p.golden = rng() < 0.6; // không phải lượt nào cũng có
    Object.assign(out, { seconds: 30, goldenAt: p.golden ? p.goldenAt : null });
  } else if (game === 'memory') {
    const unlocked = state.unlocked.species.filter((id) => C.SPECIES_BY_ID[id]);
    const extra = C.SPECIES.filter((s) => !s.wheel && !unlocked.includes(s.id)).sort((a, b) => a.level - b.level).map((s) => s.id);
    const pool = [...unlocked].sort(() => rng() - 0.5).slice(0, 6);
    while (pool.length < 6 && extra.length) pool.push(extra.shift());
    const deck = [...pool, ...pool].map((id) => ({ id })).sort(() => rng() - 0.5);
    p.board = pool;
    Object.assign(out, { deck: deck.map((c) => c.id), maxTries: 14 });
  } else {
    const c = rollFish(state, rng);
    const b = petBonus(state);
    p.catch = c;
    Object.assign(out, { tier: c.tier, diff: Math.max(0.05, c.diff - b.easy), wait: 2 + rng() * 4, pet: b.name, petCat: !!b.cat });
  }
  mg.pending = p;
  return ok('Bắt đầu!', out);
}

function seedReward(state, id, n) {
  state.inventory.seeds[id] = (state.inventory.seeds[id] || 0) + n;
  return `${n} hạt ${C.SPECIES_BY_ID[id].name}`;
}
function itemReward(state, id, n) {
  state.inventory.items[id] = (state.inventory.items[id] || 0) + n;
  return `${n} ${C.ITEMS_BY_ID[id].name}`;
}

/** Bắt sâu: điểm càng cao phân càng xịn; bọ vàng rơi 1 hạt giống hiếm (Rare+). */
function rewardBugs(state, p, result, rng) {
  const score = Math.max(0, Math.min(90, Math.round(Number(result.score) || 0)));
  const gifts = [];
  if (score >= 45) gifts.push(itemReward(state, 'phan_sieu_toc', 1), itemReward(state, 'phan_npk', 1));
  else if (score >= 30) gifts.push(itemReward(state, 'phan_npk', 2));
  else if (score >= 18) gifts.push(itemReward(state, 'phan_npk', 1), itemReward(state, 'phan_bon', 1));
  else if (score >= 8) gifts.push(itemReward(state, 'phan_bon', 2));
  else if (score >= 1) gifts.push(itemReward(state, 'phan_bon', 1));
  if (p.golden && result.golden === true) {
    const rare = C.SPECIES.filter((s) => s.tier >= 2 && s.tier <= 4);
    gifts.push(seedReward(state, pick(rare, rng).id, 1));
  }
  return { score, gifts };
}

/** Ghép cặp: mỗi cặp ghép được → 1 hạt loài đó; ít lần lật thì nhiều sao, 3 sao thêm 1 hạt. */
function rewardMemory(state, p, result, rng) {
  const pairs = [...new Set(Array.isArray(result.pairs) ? result.pairs : [])].filter((id) => p.board.includes(id));
  const tries = Math.max(pairs.length, Math.min(14, Math.round(Number(result.tries) || 0)));
  const stars = pairs.length < p.board.length ? 0 : tries <= 9 ? 3 : tries <= 11 ? 2 : 1;
  const gifts = pairs.map((id) => seedReward(state, id, 1));
  if (stars === 3) gifts.push(seedReward(state, pick(pairs, rng), 1));
  return { score: pairs.length * 10 + stars * 5, stars, gifts };
}

function openChest(state, rng) {
  if (rng() < 0.5) {
    const powers = C.POWERS.filter((x) => !x.wheel && x.price && !state.inventory.powers[x.id] && x.tier <= 3);
    if (powers.length) {
      const pw = pick(powers, rng);
      state.inventory.powers[pw.id] = 1;
      return `chưởng lực ${pw.name}`;
    }
  }
  const pots = C.POTS.filter((x) => x.id !== 'nhua' && x.tier <= 3);
  const pot = pick(pots, rng);
  state.inventory.pots[pot.id] = (state.inventory.pots[pot.id] || 0) + 1;
  return `1 ${pot.name}`;
}

function rewardFish(state, p, result, rng) {
  if (result.caught !== true) return { score: 0, gifts: [], escaped: true };
  const c = p.catch;
  if (c.kind === 'chest') return { score: 1, gifts: [`Rương báu: ${openChest(state, rng)}`], chest: true };
  const f = FISH_BY_ID[c.id];
  state.inventory.fish[f.id] = (state.inventory.fish[f.id] || 0) + 1;
  return { score: 1, gifts: [`${f.icon} ${f.name}`], fish: f.id, tier: f.tier };
}

/** Kết thúc lượt đang chơi (đúng mã lượt) và nhận thưởng. */
function finish(state, game, token, result = {}, now = Date.now(), rng = Math.random) {
  const mg = ensure(state, now);
  const p = mg.pending;
  if (!p || p.game !== game || p.token !== token) return fail('Lượt chơi không hợp lệ hoặc đã kết thúc.');
  mg.pending = null;
  const r = game === 'bugs' ? rewardBugs(state, p, result || {}, rng)
    : game === 'memory' ? rewardMemory(state, p, result || {}, rng) : rewardFish(state, p, result || {}, rng);
  if (r.score > (mg.best[game] || 0) && game !== 'fish') mg.best[game] = r.score;
  const text = r.gifts.length ? `Nhận: ${r.gifts.join(', ')}` : 'Không nhận được gì lần này.';
  state.log.unshift({ at: now, type: 'minigame', text: `${NAMES[game]}: ${text}` });
  if (state.log.length > 200) state.log.length = 200;
  return ok(text, { result: r });
}

function sellFish(state, id, all = false) {
  const f = FISH_BY_ID[id];
  const have = f ? state.inventory.fish[id] || 0 : 0;
  if (!have) return fail('Không có con cá này.');
  const n = all ? have : 1;
  state.inventory.fish[id] = have - n;
  state.money += f.price * n;
  return ok(`Bán ${n} ${f.name}: +${f.price * n} xu`, { money: f.price * n });
}

module.exports = { LIMITS, NAMES, FISH, FISH_BY_ID, info, start, finish, sellFish, petBonus };

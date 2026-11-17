'use strict';
/**
 * Mini game kiếm vật phẩm: Bắt sâu, Ghép cặp hoa, Câu cá ao vườn.
 * Trò chơi chạy ở giao diện; tiến trình chính quyết định phần thưởng: mỗi lượt phải "bắt đầu" ở đây
 * (trừ lượt trong ngày, tạo đề bài / con cá sẽ cắn câu) rồi mới "kết thúc" bằng đúng mã lượt đó,
 * kết quả gửi lên bị kẹp trong giới hạn hợp lý. Mỗi trò có số lượt mỗi ngày.
 */
const C = require('./catalog');
const CL = require('./clock');

const LIMITS = { bugs: 3, memory: 3, fish: 5, blackjack: 5, baucua: 5 };
const NAMES = { bugs: 'Bắt sâu', memory: 'Ghép cặp hoa', fish: 'Câu cá ao vườn', blackjack: 'Hoa 21', baucua: 'Bầu cua tôm cá' };

// Hoa 21 và Bầu cua: cược xu, thắng nhận lại xu (chỉ xu trong game). Giới hạn mức cược + số ván/ngày để giữ cân bằng.
const BET = { min: 10, max: 500 };
// Bầu cua: 6 mặt xúc xắc là 6 con pet trong cửa hàng.
const BAUCUA = ['ga_con', 'vit_con', 'ca_koi', 'tho_trang', 'meo_muop', 'cho_co'];

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

const dayKey = (ms) => { const d = CL.parts(ms); return `${d.y}-${d.mo + 1}-${d.d}`; };
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
function start(state, game, now = Date.now(), rng = Math.random, opts = {}) {
  if (!LIMITS[game]) return fail('Trò chơi không hợp lệ.');
  const mg = ensure(state, now);
  if ((mg.plays[game] || 0) >= LIMITS[game]) return fail(`Hôm nay đã hết lượt ${NAMES[game]} – mai quay lại nhé!`);
  let bet = 0; let bets = null;
  if (game === 'blackjack') {
    bet = Math.round(Number(opts.bet) || 0);
    if (bet < BET.min || bet > BET.max) return fail(`Mức cược từ ${BET.min} đến ${BET.max} xu.`);
  } else if (game === 'baucua') { // tối đa 3 đồng xu, mỗi đồng đặt lên 1 con (có thể chồng lên cùng 1 con)
    bets = (Array.isArray(opts.bets) ? opts.bets : []).slice(0, 4).map((b) => ({ face: b && b.face, amount: Math.round(Number(b && b.amount) || 0) }));
    if (!bets.length || bets.length > 3) return fail('Đặt từ 1 đến 3 đồng xu lên bàn.');
    if (bets.some((b) => !BAUCUA.includes(b.face) || b.amount < BET.min || b.amount > BET.max)) return fail(`Mỗi đồng xu từ ${BET.min} đến ${BET.max} xu.`);
    bet = bets.reduce((a, b) => a + b.amount, 0);
  }
  if (bet) {
    if (state.money < bet) return fail(`Không đủ xu để cược ${bet}.`);
    state.money -= bet; // trừ cược ngay khi vào ván (bỏ ngang = mất cược)
  }
  mg.plays[game] = (mg.plays[game] || 0) + 1;
  const token = `${game}-${now}-${Math.floor(rng() * 1e9)}`;
  const p = { game, token, at: now, bet, bets };
  const out = { token, left: LIMITS[game] - mg.plays[game] };
  if (game === 'bugs') {
    p.goldenAt = 6 + Math.floor(rng() * 18); // giây xuất hiện bọ vàng
    p.golden = rng() < 0.6; // không phải lượt nào cũng có
    Object.assign(out, { seconds: 30, goldenAt: p.golden ? p.goldenAt : null });
  } else if (game === 'blackjack') {
    // bộ 52 lá xáo ở đây; giao diện chỉ thấy bài đã lật và gửi Rút/Dằn
    const deck = [];
    for (let su = 0; su < 4; su++) for (let r = 1; r <= 13; r++) deck.push({ r, s: su });
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    p.deck = deck; p.player = [deck.pop(), deck.pop()]; p.dealer = [deck.pop(), deck.pop()];
    if (bjScore(p.player) === 21 || bjScore(p.dealer) === 21) { // blackjack ngay 2 lá đầu
      mg.pending = p;
      return finishBJ(state, p, now, rng, out);
    }
    Object.assign(out, bjView(p, false), { bet });
  } else if (game === 'baucua') {
    Object.assign(out, { faces: BAUCUA, bet });
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

// ---------------------------------------------------------------- Hoa 21 (Blackjack thường, không cược)
function bjScore(cards) {
  let total = 0; let aces = 0;
  for (const c of cards) { if (c.r === 1) { aces += 1; total += 11; } else total += Math.min(10, c.r); }
  while (total > 21 && aces) { total -= 10; aces -= 1; }
  return total;
}
function bjView(p, reveal) {
  return { player: p.player, playerScore: bjScore(p.player), dealer: reveal ? p.dealer : [p.dealer[0]], dealerScore: reveal ? bjScore(p.dealer) : null };
}
function finishBJ(state, p, now, rng, out = {}) {
  const ps = bjScore(p.player);
  const natural = p.player.length === 2 && ps === 21;
  if (ps <= 21 && !natural) while (bjScore(p.dealer) < 17) p.dealer.push(p.deck.pop()); // nhà cái rút tới 17
  const ds = bjScore(p.dealer);
  const dNatural = p.dealer.length === 2 && ds === 21;
  let outcome;
  if (ps > 21) outcome = 'bust';
  else if (natural && !dNatural) outcome = 'blackjack';
  else if (dNatural && !natural) outcome = 'lose';
  else if (ds > 21 || ps > ds) outcome = 'win';
  else if (ps === ds) outcome = 'push';
  else outcome = 'lose';
  p.resolved = outcome; // chỉ kết quả tính ở đây mới được nhận thưởng
  const r = finish(state, 'blackjack', p.token, {}, now, rng);
  return { ...r, ...out, ...bjView(p, true), outcome, done: true };
}
/** Hoa 21: Rút (hit) hoặc Dằn (stand). */
function move(state, game, token, action, now = Date.now(), rng = Math.random) {
  const mg = ensure(state, now);
  const p = mg.pending;
  if (game !== 'blackjack' || !p || p.game !== game || p.token !== token) return fail('Ván bài không hợp lệ hoặc đã kết thúc.');
  if (action === 'hit') {
    p.player.push(p.deck.pop());
    if (bjScore(p.player) >= 21) return finishBJ(state, p, now, rng);
    return ok('Rút thêm 1 lá.', bjView(p, false));
  }
  if (action === 'stand') return finishBJ(state, p, now, rng);
  return fail('Hành động không hợp lệ.');
}

const BJ_TEXT = { blackjack: '🌟 Blackjack!', win: '🎉 Thắng!', push: '🤝 Hoà', lose: '😿 Thua', bust: '💥 Quá 21 – quắc!' };
const BJ_PAY = { blackjack: 2.5, win: 2, push: 1, lose: 0, bust: 0 }; // nhận lại = cược × hệ số
function rewardBJ(state, p) {
  // kết quả do finishBJ tính từ bài thật trong lượt này (giao diện không gửi kết quả)
  const o = BJ_TEXT[p.resolved] ? p.resolved : 'lose'; // gọi gameFinish thẳng từ giao diện = thua
  const back = Math.floor(p.bet * BJ_PAY[o]);
  state.money += back;
  const net = back - p.bet;
  return { score: 0, gifts: back ? [`+${back} xu`] : [], outcome: o, title: BJ_TEXT[o], bet: p.bet, back, net };
}

// ---------------------------------------------------------------- Bầu cua tôm cá (không cược)
function rewardBauCua(state, p, result, rng) {
  // mặt đặt cược lấy từ lúc bắt đầu lượt (p.bets); xúc xắc lắc ở đây
  const dice = [0, 1, 2].map(() => pick(BAUCUA, rng));
  const lines = p.bets.map((b) => {
    const hits = dice.filter((d) => d === b.face).length;
    return { face: b.face, amount: b.amount, hits, back: hits ? b.amount * (1 + hits) : 0 };
  });
  const back = lines.reduce((a, x) => a + x.back, 0);
  state.money += back;
  return { score: 0, gifts: back ? [`+${back} xu`] : [], dice, lines, hits: lines.reduce((a, x) => a + x.hits, 0), bet: p.bet, back, net: back - p.bet };
}

/** Kết thúc lượt đang chơi (đúng mã lượt) và nhận thưởng. */
function finish(state, game, token, result = {}, now = Date.now(), rng = Math.random) {
  const mg = ensure(state, now);
  const p = mg.pending;
  if (!p || p.game !== game || p.token !== token) return fail('Lượt chơi không hợp lệ hoặc đã kết thúc.');
  mg.pending = null;
  const r = game === 'bugs' ? rewardBugs(state, p, result || {}, rng)
    : game === 'memory' ? rewardMemory(state, p, result || {}, rng)
      : game === 'blackjack' ? rewardBJ(state, p)
        : game === 'baucua' ? rewardBauCua(state, p, result || {}, rng) : rewardFish(state, p, result || {}, rng);
  if (r.score > (mg.best[game] || 0) && !['fish', 'blackjack', 'baucua'].includes(game)) mg.best[game] = r.score;
  const text = r.bet ? (r.net > 0 ? `Thắng ${r.net} xu (nhận lại ${r.back})` : r.net === 0 ? `Hoà – nhận lại ${r.back} xu` : `Thua ${-r.net} xu`)
    : r.gifts.length ? `Nhận: ${r.gifts.join(', ')}` : 'Không nhận được gì lần này.';
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

module.exports = { LIMITS, NAMES, FISH, FISH_BY_ID, BAUCUA, BET, info, start, finish, move, sellFish, petBonus, bjScore };

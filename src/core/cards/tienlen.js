'use strict';
/**
 * Tiến lên miền Nam – luật phổ biến:
 *  - Bộ: lẻ, đôi, sám (3 lá), tứ quý, sảnh (≥3 lá liền, không có 2), đôi thông (≥3 đôi liền, không có 2).
 *  - Đánh đè cùng loại cùng độ dài, lá cao nhất lớn hơn (so cả chất ♠ < ♣ < ♦ < ♥).
 *  - Chặt: 3 đôi thông chặt 1 heo; tứ quý chặt heo, đôi heo, 3 đôi thông; 4 đôi thông chặt heo, đôi heo, 3 đôi thông, tứ quý.
 *    Bị chặt trả: heo đen 1, heo đỏ 2, 3 đôi thông 3, tứ quý 4, 4 đôi thông 5 (× mức cược). Chặt chồng: người bị chặt cuối chịu cả.
 *  - Về nhất ăn bét 2 (4 người: ba trả nhì 1). Cóng (chưa đánh lá nào khi có người về nhất): trả nhất 4.
 *  - Thối heo/hàng (bét hoặc cóng còn giữ): trả nhất theo bảng chặt.
 *  - Tới trắng ngay khi chia: tứ quý 2, sảnh rồng (3→A), 6 đôi, 5 đôi thông → mỗi người trả 4.
 *  - Ván đầu: ai giữ lá nhỏ nhất (thường 3♠) đi trước và phải đánh kèm lá đó; ván sau người thắng đi trước.
 */
const { rankOf, isRed, takeFrom, name } = require('./deck');

const HEO = 12;
const isHang = (c) => c && (c.type === 'quad' || (c.type === 'dstraight' && c.len >= 3));

function classify(cards) {
  const cs = [...cards].sort((a, b) => a - b);
  const n = cs.length;
  if (!n) return null;
  const rs = cs.map(rankOf);
  const top = cs[n - 1];
  if (rs.every((r) => r === rs[0])) return [null, 'single', 'pair', 'triple', 'quad'][n] ? { type: [null, 'single', 'pair', 'triple', 'quad'][n], len: n, top } : null;
  if (n >= 3 && rs[n - 1] < HEO && rs.every((r, i) => i === 0 || r === rs[i - 1] + 1)) return { type: 'straight', len: n, top };
  if (n >= 6 && n % 2 === 0 && rs[n - 1] < HEO) {
    let ok = true;
    for (let i = 0; i < n / 2 && ok; i++) ok = rs[2 * i] === rs[2 * i + 1] && (i === 0 || rs[2 * i] === rs[2 * i - 2] + 1);
    if (ok) return { type: 'dstraight', len: n / 2, top };
  }
  return null;
}

function beats(prev, cur) {
  if (!prev) return true;
  if (cur.type === prev.type && cur.len === prev.len) return cur.top > prev.top;
  const heo1 = prev.type === 'single' && rankOf(prev.top) === HEO;
  const heo2 = prev.type === 'pair' && rankOf(prev.top) === HEO;
  if (heo1) return cur.type === 'quad' || (cur.type === 'dstraight' && cur.len >= 3);
  if (heo2 || (prev.type === 'dstraight' && prev.len === 3)) return cur.type === 'quad' || (cur.type === 'dstraight' && cur.len >= 4);
  if (prev.type === 'quad') return cur.type === 'dstraight' && cur.len >= 4;
  if (prev.type === 'dstraight' && prev.len >= 4) return cur.type === 'dstraight' && cur.len > prev.len;
  return false;
}

/** Giá trị (× cược) khi bộ này bị chặt / bị thối. */
function chopValue(combo, cards) {
  if (rankOf(combo.top) === HEO && (combo.type === 'single' || combo.type === 'pair')) return cards.reduce((s, c) => s + (isRed(c) ? 2 : 1), 0);
  if (combo.type === 'quad') return 4;
  if (combo.type === 'dstraight') return combo.len >= 4 ? 5 : 3;
  return 0;
}
const isHeoCombo = (c) => (c.type === 'single' || c.type === 'pair') && rankOf(c.top) === HEO;

function countRanks(hand) { const cnt = Array(13).fill(0); for (const c of hand) cnt[rankOf(c)]++; return cnt; }
/** Đôi thông dài nhất trong bài (không tính 2). */
function longestPairRun(cnt) {
  let best = 0; let run = 0;
  for (let r = 0; r < HEO; r++) { run = cnt[r] >= 2 ? run + 1 : 0; best = Math.max(best, run); }
  return best;
}

/** Thối: heo + hàng còn trên tay. */
function thoiValue(hand) {
  let v = hand.filter((c) => rankOf(c) === HEO).reduce((s, c) => s + (isRed(c) ? 2 : 1), 0);
  const cnt = countRanks(hand);
  for (let r = 0; r < HEO; r++) if (cnt[r] === 4) v += 4;
  // đôi thông (mỗi chuỗi ≥3 đôi liền tính 1 lần)
  let run = 0;
  for (let r = 0; r <= HEO; r++) {
    if (r < HEO && cnt[r] >= 2) { run++; continue; }
    if (run >= 3) v += run >= 4 ? 5 : 3;
    run = 0;
  }
  return v;
}

function instantWin(hand) {
  const cnt = countRanks(hand);
  if (cnt[HEO] === 4) return 'Tứ quý 2';
  if (cnt.slice(0, HEO).every((x) => x > 0)) return 'Sảnh rồng';
  if (cnt.reduce((s, x) => s + Math.floor(x / 2), 0) >= 6) return '6 đôi';
  if (longestPairRun(cnt) >= 5) return '5 đôi thông';
  return null;
}

const UNITS = {
  2: [[1, 0, 2]],
  3: [[2, 0, 2], [1, 0, 1]],
  4: [[3, 0, 2], [2, 1, 1]],
};

function pushEvent(pub, ev) {
  pub.eventId += 1;
  pub.events.push({ id: pub.eventId, ...ev });
  if (pub.events.length > 30) pub.events.splice(0, pub.events.length - 30);
}

/**
 * Chia bài. opts.first = ván đầu (ai giữ lá nhỏ nhất đi trước), opts.leader = người thắng ván trước.
 * Trả về { hands, pub } – hands là bí mật của từng người.
 */
function deal(n, deck, opts = {}) {
  const hands = Array.from({ length: n }, (_, i) => deck.slice(i * 13, i * 13 + 13).sort((a, b) => a - b));
  const pub = { kind: 'tienlen', n, turn: 0, table: null, passed: Array(n).fill(false), out: [], cong: [], left: hands.map((h) => h.length),
    played: Array(n).fill(false), mustCard: null, pending: null, ledger: [], events: [], eventId: 0, over: false, places: null, instant: null };
  pushEvent(pub, { kind: 'deal' });
  for (let k = 0; k < n; k++) { // tới trắng (xét từ người đi trước)
    const s = ((opts.leader || 0) + k) % n;
    const why = instantWin(hands[s]);
    if (why) {
      pub.instant = { seat: s, why };
      pub.over = true;
      pub.places = [s, ...Array.from({ length: n }, (_, i) => i).filter((i) => i !== s)];
      for (let i = 0; i < n; i++) if (i !== s) pub.ledger.push({ from: i, to: s, units: 4, why: `Tới trắng (${why})` });
      pushEvent(pub, { kind: 'instant', seat: s, cards: hands[s], text: `Tới trắng – ${why}!` });
      return { hands, pub };
    }
  }
  if (opts.first || !Number.isInteger(opts.leader) || opts.leader >= n) {
    const min = Math.min(...hands.flat());
    pub.turn = hands.findIndex((h) => h.includes(min));
    pub.mustCard = min;
  } else pub.turn = opts.leader;
  return { hands, pub };
}

function nextActive(pub, from) {
  for (let i = 1; i <= pub.n; i++) { const s = (from + i) % pub.n; if (!pub.out.includes(s) && !pub.cong.includes(s)) return s; }
  return from;
}

function endRound(pub) {
  if (pub.pending) { pub.ledger.push(pub.pending); pub.pending = null; }
  const leader = pub.out.includes(pub.table.seat) || pub.cong.includes(pub.table.seat) ? nextActive(pub, pub.table.seat) : pub.table.seat;
  pub.table = null;
  pub.passed = Array(pub.n).fill(false);
  pub.turn = leader;
  pushEvent(pub, { kind: 'round', seat: leader });
}

/** Sau khi `seat` đánh/bỏ: tìm người kế tiếp; quay về người đánh cuối = hết vòng. */
function advance(pub, seat) {
  for (let i = 1; i <= pub.n; i++) {
    const s = (seat + i) % pub.n;
    if (pub.table && s === pub.table.seat) { endRound(pub); return; }
    if (!pub.out.includes(s) && !pub.cong.includes(s) && !pub.passed[s]) { pub.turn = s; return; }
  }
  endRound(pub);
}

function finish(game) {
  const { pub, hands } = game;
  if (pub.pending) { pub.ledger.push(pub.pending); pub.pending = null; }
  const rest = Array.from({ length: pub.n }, (_, i) => i).filter((s) => !pub.out.includes(s) && !pub.cong.includes(s));
  pub.places = [...pub.out, ...rest, ...pub.cong];
  const first = pub.places[0];
  const table = UNITS[pub.n] || UNITS[4];
  for (const [loserIdx, winnerIdx, units] of table) {
    const from = pub.places[loserIdx]; const to = pub.places[winnerIdx];
    if (pub.cong.includes(from)) continue; // cóng trả riêng bên dưới
    pub.ledger.push({ from, to, units, why: winnerIdx === 0 ? 'Về nhất' : 'Về nhì' });
  }
  for (const s of pub.cong) pub.ledger.push({ from: s, to: first, units: 4, why: 'Cóng' });
  for (const s of [...rest, ...pub.cong]) {
    const v = thoiValue(hands[s]);
    if (v) pub.ledger.push({ from: s, to: first, units: v, why: 'Thối heo/hàng' });
  }
  pub.over = true;
  pub.table = null;
  pushEvent(pub, { kind: 'over', seat: first, reveal: hands.map((h) => [...h]) });
}

/** move = { kind: 'play', cards } | { kind: 'pass' } */
function move(game, seat, mv) {
  const { pub, hands } = game;
  if (pub.over) return { ok: false, msg: 'Ván đã kết thúc.' };
  if (seat !== pub.turn) return { ok: false, msg: 'Chưa tới lượt bạn.' };
  if (mv && mv.kind === 'pass') {
    if (!pub.table) return { ok: false, msg: 'Bạn đang được đi – hãy đánh 1 bộ.' };
    pub.passed[seat] = true;
    pushEvent(pub, { kind: 'pass', seat });
    advance(pub, seat);
    return { ok: true };
  }
  if (!mv || mv.kind !== 'play') return { ok: false, msg: 'Nước đi không hợp lệ.' };
  const cards = takeFrom(hands[seat], mv.cards);
  if (!cards) return { ok: false, msg: 'Lá bài không hợp lệ.' };
  const combo = classify(cards);
  if (!combo) return { ok: false, msg: 'Các lá này không thành bộ.' };
  if (pub.mustCard != null && !cards.includes(pub.mustCard)) return { ok: false, msg: `Ván đầu phải đánh kèm ${name(pub.mustCard)}.` };
  const prev = pub.table;
  if (prev && !beats(prev.combo, combo)) return { ok: false, msg: 'Bộ này không chặn được bài trên bàn.' };
  let chop = null;
  if (prev && ((isHeoCombo(prev.combo) && isHang(combo)) || (isHang(prev.combo) && isHang(combo)))) {
    const units = chopValue(prev.combo, prev.cards);
    const chain = pub.pending && pub.pending.to === prev.seat ? pub.pending.units : 0;
    pub.pending = { from: prev.seat, to: seat, units: units + chain, why: chain ? 'Bị chặt chồng' : 'Bị chặt' };
    chop = { from: prev.seat, units: units + chain };
  }
  pub.mustCard = null;
  game.hands[seat] = hands[seat].filter((c) => !cards.includes(c));
  pub.left[seat] = game.hands[seat].length;
  pub.played[seat] = true;
  pub.table = { seat, cards, combo };
  pushEvent(pub, { kind: chop ? 'chop' : 'play', seat, cards, combo: combo.type, from: chop ? chop.from : undefined });
  if (!game.hands[seat].length) {
    pub.out.push(seat);
    if (pub.out.length === 1) { // có người về nhất: ai chưa đánh lá nào là cóng
      for (let s = 0; s < pub.n; s++) if (s !== seat && !pub.played[s]) pub.cong.push(s);
      if (pub.cong.length) pushEvent(pub, { kind: 'cong', seats: [...pub.cong] });
    }
    pushEvent(pub, { kind: 'finish', seat, place: pub.out.length });
    if (pub.out.length + pub.cong.length >= pub.n - 1) { finish(game); return { ok: true }; }
  }
  advance(pub, seat);
  return { ok: true };
}

/** Hết giờ: đang được đi thì đánh lá nhỏ nhất, không thì bỏ lượt. */
function autoMove(game, seat) {
  const { pub, hands } = game;
  if (pub.table) return { kind: 'pass' };
  if (pub.mustCard != null) return { kind: 'play', cards: [pub.mustCard] };
  return { kind: 'play', cards: [Math.min(...hands[seat])] };
}

module.exports = { classify, beats, chopValue, thoiValue, instantWin, deal, move, autoMove };

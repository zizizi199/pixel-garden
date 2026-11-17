'use strict';
/**
 * Phỏm (tá lả) – luật phổ biến, 2–4 người:
 *  - Chia 9 lá (người đi đầu 10 lá, đánh luôn). Mỗi lượt: ăn lá người trước vừa đánh (nếu tạo được phỏm) hoặc bốc,
 *    rồi đánh 1 lá. Mỗi người đánh 4 lá; lá thứ 4 (lượt cuối) game tự hạ phỏm và gửi bài vào phỏm người khác.
 *  - Phỏm: ≥3 lá cùng số, hoặc ≥3 lá liền nhau cùng chất (A chỉ đứng trước 2). 2 lá đã ăn không chung 1 phỏm.
 *  - Bị ăn: trả người ăn 1 cược; bị ăn cây chốt (lá đánh thứ 4) trả 4.
 *  - Ù (toàn bộ bài thành phỏm, chừa tối đa 1 lá) hoặc ù khan (chia ra không có phỏm, không có cạ): mỗi người trả 5.
 *    Ù nhờ ăn bài của ai thì người đó đền cho cả làng.
 *  - Hết ván: tính điểm lá rác (A = 1 … K = 13), ít điểm nhất về nhất; móm (không hạ được phỏm) xếp cuối.
 *    Nhì trả nhất 1, ba trả 2, bét trả 3, móm trả 4.
 */
const { phomRank, suitOf, takeFrom } = require('./deck');

const pts = (cards) => cards.reduce((s, c) => s + phomRank(c), 0);

function isMeld(cards) {
  if (cards.length < 3) return false;
  const rs = cards.map(phomRank);
  if (rs.every((r) => r === rs[0])) return true;
  const s0 = suitOf(cards[0]);
  if (!cards.every((c) => suitOf(c) === s0)) return false;
  const sorted = [...rs].sort((a, b) => a - b);
  return sorted.every((r, i) => i === 0 || r === sorted[i - 1] + 1);
}

/** Mọi phỏm có thể lập từ các lá trên tay. */
function allMelds(hand) {
  const out = [];
  const byRank = {};
  for (const c of hand) (byRank[phomRank(c)] = byRank[phomRank(c)] || []).push(c);
  for (const cs of Object.values(byRank)) {
    if (cs.length >= 3) {
      if (cs.length === 4) { out.push([...cs]); for (let i = 0; i < 4; i++) out.push(cs.filter((_, j) => j !== i)); } else out.push([...cs]);
    }
  }
  for (let s = 0; s < 4; s++) {
    const cs = hand.filter((c) => suitOf(c) === s).sort((a, b) => phomRank(a) - phomRank(b));
    for (let i = 0; i < cs.length; i++) {
      for (let j = i + 2; j < cs.length; j++) {
        const seg = cs.slice(i, j + 1);
        if (phomRank(seg[seg.length - 1]) - phomRank(seg[0]) !== seg.length - 1) break;
        out.push(seg);
      }
    }
  }
  return out;
}

/**
 * Cách xếp phỏm tốt nhất: mọi lá đã ăn (`must`) phải nằm trong phỏm, mỗi phỏm tối đa 1 lá ăn;
 * ít điểm rác nhất, rồi nhiều lá trong phỏm nhất. Trả về null nếu không xếp được.
 */
function best(hand, must = []) {
  const melds = allMelds(hand).filter((m) => m.filter((c) => must.includes(c)).length <= 1);
  let bestR = null;
  const used = new Set();
  const chosen = [];
  function rec(i) {
    if (must.every((c) => used.has(c))) {
      const dead = hand.filter((c) => !used.has(c));
      const p = pts(dead);
      if (!bestR || p < bestR.points || (p === bestR.points && dead.length < bestR.dead.length)) {
        bestR = { melds: chosen.map((m) => [...m]), dead, points: p };
      }
    }
    for (let k = i; k < melds.length; k++) {
      const m = melds[k];
      if (m.some((c) => used.has(c))) continue;
      m.forEach((c) => used.add(c)); chosen.push(m);
      rec(k + 1);
      chosen.pop(); m.forEach((c) => used.delete(c));
    }
  }
  rec(0);
  return bestR;
}

/** Ù khan: không có phỏm và không có cạ (2 lá cùng số, hoặc cùng chất cách nhau ≤ 2). */
function uKhan(hand) {
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      const a = hand[i]; const b = hand[j];
      if (phomRank(a) === phomRank(b)) return false;
      if (suitOf(a) === suitOf(b) && Math.abs(phomRank(a) - phomRank(b)) <= 2) return false;
    }
  }
  return true;
}

function canExtend(meld, c) {
  return isMeld([...meld, c]);
}

function pushEvent(pub, ev) {
  pub.eventId += 1;
  pub.events.push({ id: pub.eventId, ...ev });
  if (pub.events.length > 30) pub.events.splice(0, pub.events.length - 30);
}

function deal(n, deck, opts = {}) {
  const leader = Number.isInteger(opts.leader) && opts.leader < n ? opts.leader : 0;
  const hands = []; let k = 0;
  for (let i = 0; i < n; i++) { const take = i === leader ? 10 : 9; hands.push(deck.slice(k, k + take).sort((a, b) => a - b)); k += take; }
  const stock = deck.slice(k);
  const pub = { kind: 'phom', n, turn: leader, phase: 'discard', stock: stock.length, discards: hands.map(() => []), last: null,
    eaten: hands.map(() => []), melds: hands.map(() => []), laid: Array(n).fill(false), layOrder: [], done: Array(n).fill(0),
    left: hands.map((h) => h.length), ledger: [], events: [], eventId: 0, over: false, places: null, points: null, mom: [], u: null };
  pushEvent(pub, { kind: 'deal' });
  const game = { pub, hands, stock };
  for (let i = 0; i < n; i++) {
    const s = (leader + i) % n;
    if (uKhan(hands[s])) { declareU(game, s, 'Ù khan', null); return game; }
  }
  const b = best(hands[leader]);
  if (b && b.dead.length <= 1) declareU(game, leader, 'Ù tròn', null);
  return game;
}

function declareU(game, seat, why, den) {
  const { pub, hands } = game;
  pub.over = true;
  pub.u = { seat, why, den };
  const others = Array.from({ length: pub.n }, (_, i) => i).filter((i) => i !== seat);
  pub.places = [seat, ...others];
  if (den != null) pub.ledger.push({ from: den, to: seat, units: 5 * others.length, why: `Đền ${why}` });
  else for (const o of others) pub.ledger.push({ from: o, to: seat, units: 5, why });
  pushEvent(pub, { kind: 'u', seat, text: `${why}!`, reveal: hands.map((h) => [...h]) });
}

function checkU(game, seat, den) {
  const b = best(game.hands[seat], game.pub.eaten[seat]);
  if (b && b.dead.length <= 1) { declareU(game, seat, 'Ù', den); return true; }
  return false;
}

/** Lượt cuối: hạ phỏm (bài trừ lá sẽ đánh) và gửi lá rác vào phỏm người khác đã hạ. */
function layDown(game, seat, keep) {
  const { pub } = game;
  const hand = game.hands[seat].filter((c) => c !== keep);
  const b = best(hand, pub.eaten[seat]) || { melds: [], dead: hand };
  pub.melds[seat] = b.melds.map((m) => [...m].sort((x, y) => x - y));
  pub.laid[seat] = true; pub.layOrder.push(seat);
  if (!b.melds.length) pub.mom.push(seat);
  let dead = [...b.dead].sort((x, y) => phomRank(y) - phomRank(x));
  const sent = [];
  let changed = true;
  while (changed && b.melds.length) { // chỉ người có phỏm mới được gửi
    changed = false;
    for (const c of dead) {
      const target = pub.melds.findIndex((ms, s) => s !== seat && ms.some((m) => canExtend(m, c)));
      if (target < 0) continue;
      const m = pub.melds[target].find((mm) => canExtend(mm, c));
      m.push(c); m.sort((x, y) => x - y);
      sent.push({ card: c, to: target });
      dead = dead.filter((x) => x !== c); changed = true;
      break;
    }
  }
  game.hands[seat] = [...dead, keep].sort((x, y) => x - y);
  pushEvent(pub, { kind: 'lay', seat, melds: pub.melds[seat], sent, mom: !b.melds.length });
}

function finish(game) {
  const { pub, hands } = game;
  pub.points = hands.map((h) => pts(h));
  const order = pub.layOrder.length === pub.n ? pub.layOrder : Array.from({ length: pub.n }, (_, i) => i);
  const ok = order.filter((s) => !pub.mom.includes(s)).sort((a, b) => pub.points[a] - pub.points[b] || order.indexOf(a) - order.indexOf(b));
  pub.places = [...ok, ...order.filter((s) => pub.mom.includes(s))];
  const first = pub.places[0];
  pub.places.forEach((s, k) => {
    if (k === 0) return;
    if (pub.mom.includes(s)) pub.ledger.push({ from: s, to: first, units: 4, why: 'Móm' });
    else if (k === pub.n - 1) pub.ledger.push({ from: s, to: first, units: 3, why: 'Về bét' });
    else pub.ledger.push({ from: s, to: first, units: k, why: k === 1 ? 'Về nhì' : 'Về ba' });
  });
  pub.over = true;
  pushEvent(pub, { kind: 'over', seat: first, reveal: hands.map((h) => [...h]) });
}

/** move = { kind: 'draw' } | { kind: 'eat' } | { kind: 'discard', card } */
function move(game, seat, mv) {
  const { pub } = game;
  if (pub.over) return { ok: false, msg: 'Ván đã kết thúc.' };
  if (seat !== pub.turn) return { ok: false, msg: 'Chưa tới lượt bạn.' };
  const kind = mv && mv.kind;
  if (pub.phase === 'draw') {
    if (kind === 'eat') {
      const l = pub.last;
      if (!l) return { ok: false, msg: 'Không có lá để ăn.' };
      const hand = [...game.hands[seat], l.card];
      const must = [...pub.eaten[seat], l.card];
      if (!best(hand, must)) return { ok: false, msg: 'Lá này không ghép được phỏm với bài của bạn.' };
      game.hands[seat] = hand.sort((a, b) => a - b);
      pub.eaten[seat].push(l.card);
      pub.discards[l.seat] = pub.discards[l.seat].filter((c) => c !== l.card);
      pub.ledger.push({ from: l.seat, to: seat, units: l.chot ? 4 : 1, why: l.chot ? 'Bị ăn chốt' : 'Bị ăn bài' });
      pushEvent(pub, { kind: 'eat', seat, from: l.seat, card: l.card, chot: l.chot });
      pub.last = null;
      pub.left[seat] = game.hands[seat].length;
      if (checkU(game, seat, l.seat)) return { ok: true };
    } else if (kind === 'draw') {
      if (!game.stock.length) { // hết nọc (hiếm): ai chưa hạ thì hạ luôn, tính điểm
        for (let i = 0; i < pub.n; i++) if (!pub.laid[i]) { const h = game.hands[i]; layDown(game, i, h[h.length - 1]); }
        finish(game); return { ok: true };
      }
      const c = game.stock.pop();
      game.hands[seat] = [...game.hands[seat], c].sort((a, b) => a - b);
      pub.stock = game.stock.length;
      pub.last = null;
      pub.left[seat] = game.hands[seat].length;
      pushEvent(pub, { kind: 'draw', seat });
      if (checkU(game, seat, null)) return { ok: true };
    } else return { ok: false, msg: 'Hãy bốc bài hoặc ăn lá vừa đánh.' };
    pub.phase = 'discard';
    return { ok: true };
  }
  if (kind !== 'discard') return { ok: false, msg: 'Hãy chọn 1 lá để đánh.' };
  const c = mv.card;
  if (!takeFrom(game.hands[seat], [c])) return { ok: false, msg: 'Lá bài không hợp lệ.' };
  if (pub.eaten[seat].includes(c)) return { ok: false, msg: 'Không được đánh lá đã ăn.' };
  if (!best(game.hands[seat].filter((x) => x !== c), pub.eaten[seat])) return { ok: false, msg: 'Đánh lá này thì lá đã ăn không còn thành phỏm.' };
  const final = pub.done[seat] === 3;
  if (final) layDown(game, seat, c);
  game.hands[seat] = game.hands[seat].filter((x) => x !== c);
  pub.discards[seat].push(c);
  pub.done[seat] += 1;
  pub.left[seat] = game.hands[seat].length;
  pub.last = { card: c, seat, chot: final };
  pushEvent(pub, { kind: 'discard', seat, card: c, chot: final });
  if (pub.done.every((d) => d >= 4)) { pub.last = null; finish(game); return { ok: true }; }
  pub.turn = (seat + 1) % pub.n;
  pub.phase = 'draw';
  return { ok: true };
}

/** Lá nên đánh: lá rác điểm cao nhất (không phải lá đã ăn, không làm hỏng phỏm có lá ăn). */
function suggestDiscard(game, seat) {
  const hand = game.hands[seat]; const eaten = game.pub.eaten[seat];
  const cands = hand.filter((c) => !eaten.includes(c) && best(hand.filter((x) => x !== c), eaten));
  let pick = null; let bestPts = Infinity;
  for (const c of cands) {
    const b = best(hand.filter((x) => x !== c), eaten);
    if (b.points < bestPts || (b.points === bestPts && phomRank(c) > phomRank(pick))) { bestPts = b.points; pick = c; }
  }
  return pick == null ? hand.find((c) => !eaten.includes(c)) : pick;
}

/** Hết giờ: tự bốc, tự đánh lá rác. */
function autoMove(game, seat) {
  if (game.pub.phase === 'draw') return { kind: 'draw' };
  return { kind: 'discard', card: suggestDiscard(game, seat) };
}

/** Có ăn được lá vừa đánh không (để giao diện hiện nút Ăn). */
function canEat(game, seat) {
  const { pub } = game;
  if (pub.over || pub.turn !== seat || pub.phase !== 'draw' || !pub.last) return false;
  return !!best([...game.hands[seat], pub.last.card], [...pub.eaten[seat], pub.last.card]);
}

module.exports = { isMeld, allMelds, best, uKhan, deal, move, autoMove, canEat, suggestDiscard, pts };

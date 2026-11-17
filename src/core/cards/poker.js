'use strict';
/**
 * Poker Texas Hold'em không giới hạn (No-limit), 2–6 người.
 *  - Mỗi ván mỗi người mang vào STACK × big blind (máy chủ giữ làm cọc), hết ván trả lại số chip còn lại.
 *  - Small blind = ½ big blind (big blind = mức cược của bàn). Nút chia bài xoay vòng mỗi ván.
 *  - Vòng cược: preflop → flop (3 lá) → turn → river → so bài. Bỏ bài / xem (check) / theo (call) / tố (raise) / tất tay (all-in).
 *  - Có pot phụ khi có người tất tay; hoà thì chia đều, chip lẻ cho người ngồi gần nút nhất (theo chiều đánh).
 *  - Hết giờ: xem nếu được, không thì bỏ bài.
 */
const STACK = 40;
const HAND_NAMES = ['Mậu thầu', 'Đôi', 'Thú (2 đôi)', 'Sám cô', 'Sảnh', 'Thùng', 'Cù lũ', 'Tứ quý', 'Thùng phá sảnh'];

// lá: rank Tiến lên 0..12 = 3..2 → giá trị poker 0..12 = 2..A
const pv = (c) => { const r = c >> 2; return r === 12 ? 0 : r + 1; };
const suit = (c) => c & 3;

/** Đánh giá 5 lá → mảng so sánh được [loại, ...kicker]. */
function eval5(cs) {
  const vals = cs.map(pv).sort((a, b) => b - a);
  const flush = cs.every((c) => suit(c) === suit(cs[0]));
  const uniq = [...new Set(vals)];
  let straightTop = -1;
  if (uniq.length === 5) {
    if (vals[0] - vals[4] === 4) straightTop = vals[0];
    else if (vals[0] === 12 && vals[1] === 3) straightTop = 3; // A-2-3-4-5
  }
  const cnt = {};
  vals.forEach((v) => { cnt[v] = (cnt[v] || 0) + 1; });
  const groups = Object.entries(cnt).map(([v, n]) => [n, Number(v)]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const byGroup = groups.map((g) => g[1]);
  if (straightTop >= 0 && flush) return [8, straightTop];
  if (groups[0][0] === 4) return [7, ...byGroup];
  if (groups[0][0] === 3 && groups[1][0] === 2) return [6, ...byGroup];
  if (flush) return [5, ...vals];
  if (straightTop >= 0) return [4, straightTop];
  if (groups[0][0] === 3) return [3, ...byGroup];
  if (groups[0][0] === 2 && groups[1][0] === 2) return [2, ...byGroup];
  if (groups[0][0] === 2) return [1, ...byGroup];
  return [0, ...vals];
}
const cmp = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; };

/** Bài mạnh nhất từ 5–7 lá: { score, cards, name }. */
function bestHand(cards) {
  let best = null;
  const n = cards.length;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) for (let e = d + 1; e < n; e++) {
    const five = [cards[a], cards[b], cards[c], cards[d], cards[e]];
    const s = eval5(five);
    if (!best || cmp(s, best.score) > 0) best = { score: s, cards: five };
  }
  if (!best) return null;
  best.name = HAND_NAMES[best.score[0]];
  return best;
}

function pushEvent(pub, ev) {
  pub.eventId += 1;
  pub.events.push({ id: pub.eventId, ...ev });
  if (pub.events.length > 40) pub.events.splice(0, pub.events.length - 40);
}

const live = (pub, s) => !pub.folded[s];
const canAct = (pub, s) => !pub.folded[s] && !pub.allin[s];
const nextFrom = (pub, from, ok) => { for (let i = 1; i <= pub.n; i++) { const s = (from + i) % pub.n; if (ok(s)) return s; } return -1; };

function put(pub, s, amount) {
  const x = Math.max(0, Math.min(amount, pub.stacks[s]));
  pub.stacks[s] -= x; pub.bets[s] += x; pub.total[s] += x;
  if (pub.stacks[s] === 0) pub.allin[s] = true;
  return x;
}

/**
 * Chia ván. opts.leader = ghế giữ nút chia bài, opts.stake = big blind.
 * game.stock giữ phần còn lại của bộ bài (5 lá chung lấy từ đây).
 */
function deal(n, deck, opts = {}) {
  const bb = Math.max(2, Math.round(Number(opts.stake) || 10));
  const sbAmt = Math.floor(bb / 2);
  const dealer = Number.isInteger(opts.leader) && opts.leader < n ? opts.leader : 0;
  const hands = Array.from({ length: n }, (_, i) => [deck[i], deck[i + n]].sort((a, b) => a - b));
  const stock = deck.slice(2 * n);
  const stack = bb * STACK;
  const pub = { kind: 'poker', n, bb, stage: 'preflop', board: [], dealer, stacks: Array(n).fill(stack), start: Array(n).fill(stack),
    bets: Array(n).fill(0), total: Array(n).fill(0), folded: Array(n).fill(false), allin: Array(n).fill(false), acted: Array(n).fill(false),
    maxBet: 0, minRaise: bb, turn: 0, pot: 0, events: [], eventId: 0, over: false, places: null, net: null, show: null, winners: null };
  const sb = n === 2 ? dealer : (dealer + 1) % n;
  const bbSeat = (sb + 1) % n;
  pub.sb = sb; pub.bbSeat = bbSeat;
  put(pub, sb, sbAmt); put(pub, bbSeat, bb);
  pub.maxBet = bb;
  pub.pot = pub.total.reduce((a, b) => a + b, 0);
  pushEvent(pub, { kind: 'deal', dealer, sb, bb: bbSeat });
  pub.turn = nextFrom(pub, bbSeat, (s) => canAct(pub, s));
  const game = { pub, hands, stock };
  if (pub.turn < 0 || !needsAction(pub)) runOut(game);
  return game;
}

function needsAction(pub) {
  const actors = Array.from({ length: pub.n }, (_, s) => s).filter((s) => canAct(pub, s));
  if (Array.from({ length: pub.n }, (_, s) => s).filter((s) => live(pub, s)).length <= 1) return false;
  if (!actors.length) return false;
  if (actors.length === 1 && pub.bets[actors[0]] >= pub.maxBet) return false;
  return actors.some((s) => !pub.acted[s] || pub.bets[s] < pub.maxBet);
}

/** Không ai còn phải quyết định: lật hết bài chung rồi so bài (hoặc 1 người còn lại thắng). */
function runOut(game) {
  const { pub } = game;
  if (Array.from({ length: pub.n }, (_, s) => s).filter((s) => live(pub, s)).length > 1) {
    while (pub.board.length < 5) nextStreet(game, true);
  }
  showdown(game);
}

function nextStreet(game, silent) {
  const { pub } = game;
  pub.bets = Array(pub.n).fill(0);
  pub.acted = Array(pub.n).fill(false);
  pub.maxBet = 0; pub.minRaise = pub.bb;
  const add = pub.board.length === 0 ? 3 : 1;
  const cards = game.stock.splice(0, add);
  pub.board.push(...cards);
  pub.stage = pub.board.length === 3 ? 'flop' : pub.board.length === 4 ? 'turn' : 'river';
  pushEvent(pub, { kind: 'board', stage: pub.stage, cards });
  if (!silent) pub.turn = nextFrom(pub, pub.dealer, (s) => canAct(pub, s));
}

function showdown(game) {
  const { pub, hands } = game;
  const players = Array.from({ length: pub.n }, (_, s) => s);
  const alive = players.filter((s) => live(pub, s));
  const won = Array(pub.n).fill(0);
  const best = {};
  if (alive.length > 1) for (const s of alive) best[s] = bestHand([...hands[s], ...pub.board]);
  // pot chính + pot phụ theo mức góp
  const levels = [...new Set(pub.total.filter((x) => x > 0))].sort((a, b) => a - b);
  let prev = 0;
  const pots = [];
  for (const lv of levels) {
    const amount = players.reduce((sum, s) => sum + Math.max(0, Math.min(pub.total[s], lv) - prev), 0);
    const elig = alive.filter((s) => pub.total[s] >= lv);
    prev = lv;
    if (!amount) continue;
    if (!elig.length) { pots.push({ amount, elig: alive }); continue; } // người góp nhiều nhất đã bỏ bài
    pots.push({ amount, elig });
  }
  const order = (s) => (s - pub.dealer - 1 + pub.n) % pub.n;
  for (const p of pots) {
    let win = p.elig;
    if (p.elig.length > 1 && alive.length > 1) {
      let top = null;
      for (const s of p.elig) { const sc = best[s].score; if (!top || cmp(sc, top) > 0) { top = sc; win = [s]; } else if (cmp(sc, top) === 0) win.push(s); }
    }
    win = [...win].sort((a, b) => order(a) - order(b));
    const each = Math.floor(p.amount / win.length);
    win.forEach((s, i) => { won[s] += each + (i < p.amount - each * win.length ? 1 : 0); });
  }
  players.forEach((s) => { pub.stacks[s] += won[s]; });
  pub.net = players.map((s) => pub.stacks[s] - pub.start[s]);
  pub.winners = players.filter((s) => won[s] > 0);
  pub.won = won;
  pub.places = [...players].sort((a, b) => pub.net[b] - pub.net[a]);
  pub.show = alive.length > 1 ? Object.fromEntries(alive.map((s) => [s, { cards: hands[s], name: best[s].name, best: best[s].cards }])) : null;
  pub.stage = 'showdown';
  pub.over = true;
  pub.pot = 0;
  pushEvent(pub, { kind: 'showdown', winners: pub.winners, won, show: pub.show });
}

/** move = { kind: 'fold' | 'check' | 'call' | 'allin' } | { kind: 'raise', to } */
function move(game, seat, mv) {
  const { pub } = game;
  if (pub.over) return { ok: false, msg: 'Ván đã kết thúc.' };
  if (seat !== pub.turn) return { ok: false, msg: 'Chưa tới lượt bạn.' };
  const kind = mv && mv.kind;
  const toCall = pub.maxBet - pub.bets[seat];
  if (kind === 'fold') {
    pub.folded[seat] = true;
    pushEvent(pub, { kind: 'fold', seat });
  } else if (kind === 'check') {
    if (toCall > 0) return { ok: false, msg: `Phải theo ${toCall} hoặc bỏ bài.` };
    pushEvent(pub, { kind: 'check', seat });
  } else if (kind === 'call') {
    if (toCall <= 0) return { ok: false, msg: 'Không có gì để theo – hãy xem (check).' };
    const x = put(pub, seat, toCall);
    pushEvent(pub, { kind: pub.allin[seat] ? 'allin' : 'call', seat, amount: x });
  } else if (kind === 'raise' || kind === 'allin') {
    const maxTo = pub.bets[seat] + pub.stacks[seat];
    let to = kind === 'allin' ? maxTo : Math.round(Number(mv.to) || 0);
    if (to > maxTo) to = maxTo;
    if (to <= pub.maxBet) {
      if (kind === 'allin' && to > pub.bets[seat]) { const x = put(pub, seat, to - pub.bets[seat]); pushEvent(pub, { kind: 'allin', seat, amount: x }); }
      else return { ok: false, msg: 'Mức tố phải cao hơn mức cược hiện tại.' };
    } else {
      const raise = to - pub.maxBet;
      if (raise < pub.minRaise && to < maxTo) return { ok: false, msg: `Tố ít nhất lên ${pub.maxBet + pub.minRaise}.` };
      put(pub, seat, to - pub.bets[seat]);
      if (raise >= pub.minRaise) { pub.minRaise = raise; pub.acted = pub.acted.map(() => false); }
      pub.maxBet = to;
      pushEvent(pub, { kind: pub.allin[seat] ? 'allin' : 'raise', seat, to });
    }
  } else return { ok: false, msg: 'Nước đi không hợp lệ.' };
  pub.acted[seat] = true;
  pub.pot = pub.total.reduce((a, b) => a + b, 0);
  advance(game, seat);
  return { ok: true };
}

function advance(game, seat) {
  const { pub } = game;
  const alive = Array.from({ length: pub.n }, (_, s) => s).filter((s) => live(pub, s));
  if (alive.length === 1) { showdown(game); return; }
  if (needsAction(pub)) {
    pub.turn = nextFrom(pub, seat, (s) => canAct(pub, s) && (!pub.acted[s] || pub.bets[s] < pub.maxBet));
    return;
  }
  // hết vòng cược
  const actors = alive.filter((s) => canAct(pub, s));
  if (pub.board.length === 5) { showdown(game); return; }
  if (actors.length <= 1) { runOut(game); return; }
  nextStreet(game, false);
}

function autoMove(game, seat) {
  const { pub } = game;
  return pub.maxBet - pub.bets[seat] > 0 ? { kind: 'fold' } : { kind: 'check' };
}

module.exports = { STACK, HAND_NAMES, eval5, bestHand, deal, move, autoMove, cmp };

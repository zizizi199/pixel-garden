'use strict';
/**
 * Bàn bài nhiều người (Tiến lên miền Nam, Phỏm) – logic thuần, máy chủ trò chơi (server/cards.js) lưu và gọi.
 * - Chủ bàn chọn trò + mức cược, mời người trong nhóm; 2–4 người; chủ bàn bấm Bắt đầu.
 * - Đầu mỗi ván máy chủ giữ "cọc" = DEPOSIT × cược của mỗi người; hết ván trả lại cọc ± tiền thắng thua.
 *   Thua tối đa bằng cọc; người thắng nhận đúng phần người thua thực trả (tổng luôn bằng 0).
 * - Mỗi lượt 20 giây; hết giờ (hoặc người đã rời bàn) thì máy chủ tự đánh hộ.
 */
const D = require('./deck');
const TL = require('./tienlen');
const PH = require('./phom');
const PK = require('./poker');

// deposit: cọc mỗi ván = deposit × mức cược (Poker: mang vào 40 big blind)
const GAMES = {
  tienlen: { name: 'Tiến lên miền Nam', engine: TL, min: 2, max: 4, deposit: 12 },
  phom: { name: 'Phỏm', engine: PH, min: 2, max: 4, deposit: 12 },
  poker: { name: 'Poker Texas Hold\'em', engine: PK, min: 2, max: 6, deposit: PK.STACK },
};
const TURN_MS = 20000;
const AWAY_MS = 1500;
const DEPOSIT = 12;
const STAKE = { min: 10, max: 500 };
const cleanName = (s) => String(s || '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 24) || 'Người chơi';

function create({ id, group, game, stake, host, name, now }) {
  if (!GAMES[game]) return { ok: false, msg: 'Trò chơi không hợp lệ.' };
  stake = Math.round(Number(stake) || 0);
  if (stake < STAKE.min || stake > STAKE.max) return { ok: false, msg: `Mức cược từ ${STAKE.min} đến ${STAKE.max} xu.` };
  return { ok: true, room: { id, group, game, stake, deposit: stake * GAMES[game].deposit, host, seats: [{ id: host, name: cleanName(name), away: false }], invited: [], status: 'waiting',
    hand: 0, leaderId: null, pub: null, hands: null, secret: {}, deadline: 0, result: null, escrow: {}, created: now, updated: now } };
}

const seatOf = (room, uid) => room.seats.findIndex((s) => s.id === uid);

function join(room, uid, name) {
  if (seatOf(room, uid) >= 0) { room.seats[seatOf(room, uid)].away = false; return { ok: true, msg: 'Đã vào lại bàn.' }; }
  if (room.status !== 'waiting') return { ok: false, msg: 'Bàn đang chơi, đợi hết ván nhé.' };
  if (room.seats.length >= GAMES[room.game].max) return { ok: false, msg: 'Bàn đã đủ người.' };
  room.seats.push({ id: uid, name: cleanName(name), away: false });
  room.invited = room.invited.filter((x) => x !== uid);
  return { ok: true, msg: 'Đã vào bàn.' };
}

function leave(room, uid) {
  const i = seatOf(room, uid);
  if (i < 0) return { ok: true };
  if (room.status === 'waiting') {
    room.seats.splice(i, 1);
    if (!room.seats.length) room.status = 'closed';
    else if (room.host === uid) room.host = room.seats[0].id;
    return { ok: true, msg: 'Đã rời bàn.' };
  }
  room.seats[i].away = true; // đang chơi: máy chủ đánh hộ tới hết ván rồi mới cho rời
  if (room.status === 'playing' && room.pub && room.pub.turn === i) room.deadline = Math.min(room.deadline, Date.now() + AWAY_MS);
  return { ok: true, msg: 'Bạn sẽ rời bàn khi hết ván (máy tự đánh hộ phần còn lại).' };
}

function invite(room, uid, ids) {
  if (room.host !== uid) return { ok: false, msg: 'Chỉ chủ bàn mới mời được.' };
  const list = (Array.isArray(ids) ? ids : []).filter((x) => typeof x === 'string' && seatOf(room, x) < 0).slice(0, 10);
  room.invited = [...new Set([...room.invited, ...list])].slice(-20);
  return { ok: true, msg: list.length ? 'Đã gửi lời mời.' : 'Chưa chọn ai để mời.' };
}

function game(room) { return { pub: room.pub, hands: room.hands, stock: room.secret.stock || [] }; }

function setDeadline(room, now) {
  const s = room.seats[room.pub.turn];
  room.deadline = now + (s && s.away ? AWAY_MS : TURN_MS);
  room.pub.deadline = room.deadline;
}

/** Chia ván mới (máy chủ đã giữ cọc của mọi người). */
function startHand(room, now, rng = Math.random) {
  const n = room.seats.length;
  const leader = room.leaderId ? seatOf(room, room.leaderId) : -1;
  const eng = GAMES[room.game].engine;
  const g = eng.deal(n, D.shuffled(rng), { first: room.hand === 0 || leader < 0, leader: leader < 0 ? 0 : leader, stake: room.stake });
  room.hand += 1;
  room.status = 'playing';
  room.pub = g.pub; room.hands = g.hands; room.secret = { ...room.secret, stock: g.stock || [] };
  room.result = null;
  room.pub.hand = room.hand;
  if (room.pub.over) return afterOver(room);
  setDeadline(room, now);
  return { ok: true };
}

/** Quy đổi sổ nợ (đơn vị cược) ra xu, giới hạn mỗi người thua tối đa bằng cọc. */
function settle(room) {
  const n = room.seats.length;
  if (Array.isArray(room.pub.net)) { // Poker: chip thắng thua chính là xu (đã cân, không quá số mang vào)
    const lines = (room.pub.winners || []).map((s) => ({ from: -1, to: s, units: 0, xu: room.pub.won[s],
      why: room.pub.show && room.pub.show[s] ? `Thắng với ${room.pub.show[s].name}` : 'Thắng (mọi người bỏ bài)' }));
    return { net: [...room.pub.net], places: room.pub.places, lines };
  }
  const units = Array(n).fill(0);
  for (const l of room.pub.ledger) { units[l.from] -= l.units; units[l.to] += l.units; }
  const cap = depositOf(room);
  const loss = units.map((u) => (u < 0 ? Math.min(cap, -u * room.stake) : 0));
  const paid = loss.reduce((a, b) => a + b, 0);
  const gainUnits = units.reduce((a, u) => a + Math.max(0, u), 0);
  const net = units.map((u, i) => (u < 0 ? -loss[i] : 0));
  let given = 0;
  units.forEach((u, i) => { if (u > 0) { const x = Math.floor((paid * u) / gainUnits); net[i] = x; given += x; } });
  if (paid - given > 0) net[room.pub.places[0]] += paid - given;
  return { net, places: room.pub.places, lines: room.pub.ledger.map((l) => ({ ...l, xu: l.units * room.stake })) };
}

function afterOver(room) {
  room.status = 'settling';
  room.result = { hand: room.hand, ...settle(room), names: room.seats.map((s) => s.name), ids: room.seats.map((s) => s.id) };
  room.leaderId = room.game === 'poker' ? room.seats[(room.pub.dealer + 1) % room.seats.length].id : room.seats[room.pub.places[0]].id;
  room.deadline = 0; room.pub.deadline = 0;
  return { ok: true, over: true };
}

/** Máy chủ đã trả xu xong → bàn chờ ván mới; ai đã rời bàn thì rời hẳn. */
function settled(room) {
  room.status = 'waiting';
  room.escrow = {};
  room.seats = room.seats.filter((s) => !s.away);
  if (!room.seats.length) room.status = 'closed';
  else if (seatOf(room, room.host) < 0) room.host = room.seats[0].id;
}

function play(room, uid, mv, now) {
  if (room.status !== 'playing') return { ok: false, msg: 'Ván chưa bắt đầu.' };
  const seat = seatOf(room, uid);
  if (seat < 0) return { ok: false, msg: 'Bạn không ngồi bàn này.' };
  const r = GAMES[room.game].engine.move(game(room), seat, mv);
  if (!r.ok) return r;
  room.seats[seat].away = false;
  if (room.pub.over) return afterOver(room);
  setDeadline(room, now);
  return { ok: true };
}

/** Hết giờ: đánh hộ người đang tới lượt (lặp nếu người kế tiếp đã rời bàn). Trả về số nước đã đánh hộ. */
function tick(room, now) {
  let moves = 0;
  while (room.status === 'playing' && now >= room.deadline && moves < 400) {
    const seat = room.pub.turn;
    const eng = GAMES[room.game].engine;
    const g = game(room);
    const r = eng.move(g, seat, eng.autoMove(g, seat));
    if (!r.ok) throw new Error(`Tự đánh lỗi: ${r.msg}`);
    moves++;
    if (room.pub.over) { afterOver(room); break; }
    // người đã rời bàn: đánh liền; người đang chơi: tính giờ lại từ lúc hết lượt trước
    const s = room.seats[room.pub.turn];
    room.deadline = s && s.away ? room.deadline + AWAY_MS : Math.max(now, room.deadline) + TURN_MS;
    room.pub.deadline = room.deadline;
    if (!(s && s.away)) break;
  }
  return moves;
}

const depositOf = (room) => room.stake * (GAMES[room.game] || GAMES.tienlen).deposit;

/** Phần người xem được (bài trên tay chỉ của chính mình). */
function viewFor(room, uid, now) {
  const seat = seatOf(room, uid);
  const v = { id: room.id, game: room.game, stake: room.stake, host: room.host, seats: room.seats, invited: room.invited, status: room.status,
    hand: room.hand, pub: room.pub, result: room.result, seat, now, deposit: depositOf(room) };
  v.cards = seat >= 0 && room.hands && room.status === 'playing' ? room.hands[seat] : [];
  if (room.game === 'phom' && seat >= 0 && room.status === 'playing') {
    v.canEat = PH.canEat(game(room), seat);
    v.suggest = room.pub.turn === seat && room.pub.phase === 'discard' ? PH.suggestDiscard(game(room), seat) : null;
  }
  return v;
}

module.exports = { GAMES, TURN_MS, AWAY_MS, DEPOSIT, STAKE, depositOf, create, join, leave, invite, startHand, play, tick, settle, settled, viewFor, seatOf };

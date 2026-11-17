'use strict';
/**
 * Máy chủ bàn bài nhiều người (Tiến lên miền Nam, Phỏm). Bàn lưu ở vp_card_rooms (có phiên bản),
 * xu của người chơi sửa qua mutate() của server/game.js với khoá chống trả 2 lần (state.serverSeen.cards).
 */
const R = require('../src/core/cards/room');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OTHER = { tz: NaN, group: null }; // sửa vườn người khác: giữ múi giờ của họ, không gửi ảnh chụp vườn
const fail = (msg) => ({ ok: true, r: { ok: false, msg } });

function cleanMove(m) {
  if (!m || typeof m !== 'object') return null;
  const kind = String(m.kind || '');
  if (!['play', 'pass', 'draw', 'eat', 'discard', 'fold', 'check', 'call', 'raise', 'allin'].includes(kind)) return null;
  const out = { kind };
  if (kind === 'play') out.cards = Array.isArray(m.cards) ? m.cards.slice(0, 13).map(Number) : [];
  if (kind === 'discard') out.card = Number(m.card);
  if (kind === 'raise') out.to = Math.round(Number(m.to) || 0);
  return out;
}

function createCards({ rpc, mutate, snapshot, now, rng, newId }) {
  async function getRoom(id) {
    const r = await rpc('vp_card_get', { p_id: id });
    return r && r.data ? { room: r.data, version: Number(r.version) } : null;
  }
  const saveRoom = async (room, version) => (await rpc('vp_card_save', { p_id: room.id, p_group: room.group, p_status: room.status, p_data: room, p_version: version })) === true;

  /** Đọc bàn → sửa (đồng bộ) → ghi có phiên bản; đụng độ thì làm lại. */
  async function withRoom(id, fn) {
    for (let attempt = 0; attempt < 8; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 20 + Math.floor(rng() * 60 * attempt)));
      const rec = await getRoom(id);
      if (!rec) return { ok: false, msg: 'Bàn này không còn nữa.' };
      const out = fn(rec.room) || { ok: true };
      if (out.noSave) return { ...out, room: rec.room };
      if (await saveRoom(rec.room, rec.version)) return { ...out, room: rec.room };
    }
    return { ok: false, msg: 'Bàn đang bận, thử lại.' };
  }

  /** Cộng/trừ xu 1 người, mỗi khoá chỉ 1 lần. delta < 0 mà không đủ xu → ok:false. */
  async function pay(uid, key, delta, text) {
    const m = await mutate(uid, OTHER, (state, t) => {
      const seen = state.serverSeen.cards || (state.serverSeen.cards = []);
      if (seen.includes(key)) return { r: { ok: true }, skipSave: true };
      if (delta < 0 && state.money < -delta) return { r: { ok: false }, skipSave: true };
      state.money += delta;
      seen.push(key);
      state.serverSeen.cards = seen.slice(-200);
      if (text) state.log.unshift({ at: t, type: 'system', text });
      return { r: { ok: true }, push: false };
    });
    return m.out.r.ok;
  }

  async function settleRoom(id) {
    const rec = await getRoom(id);
    if (!rec || rec.room.status !== 'settling') return;
    const { room } = rec;
    const res = room.result; const esc = room.escrow || {};
    const game = R.GAMES[room.game].name;
    let all = true;
    for (let i = 0; i < res.ids.length; i++) {
      const back = (esc.amount || 0) + res.net[i];
      const d = res.net[i];
      const text = `${game}: ${d > 0 ? `thắng +${d}` : d < 0 ? `thua ${d}` : 'hoà 0'} xu (ván ${res.hand}).`;
      try { if (!(await pay(res.ids[i], `${id}:${res.hand}:${esc.nonce}:out`, back, text))) all = false; } catch (_) { all = false; }
    }
    if (all) await withRoom(id, (r) => { if (r.status !== 'settling' || !r.result || r.result.hand !== res.hand) return { noSave: true }; R.settled(r); return { ok: true }; });
  }

  async function act(uid, a, ctx) {
    const group = ctx.group;
    if (!UUID.test(String(group || ''))) return fail('Hãy vào nhóm trước.');
    const t = now();
    if (a.type === 'cardCreate' || a.type === 'cardJoin') {
      const mine = await rpc('vp_card_mine', { p_uid: uid, p_group: group });
      if (!mine || !mine.member) return fail('Bạn không còn trong nhóm.');
      if (mine.room && mine.room !== a.room) return fail('Bạn đang ngồi ở một bàn khác – rời bàn đó trước.');
      if (a.type === 'cardCreate') {
        const c = R.create({ id: newId(), group, game: a.game, stake: a.stake, host: uid, name: mine.name, now: t });
        if (!c.ok) return fail(c.msg);
        R.invite(c.room, uid, a.invite);
        if (!(await saveRoom(c.room, 0))) return fail('Không tạo được bàn, thử lại.');
        return { ok: true, r: { ok: true, msg: 'Đã mở bàn.', room: c.room.id } };
      }
      if (!UUID.test(String(a.room))) return fail('Bàn không hợp lệ.');
      const out = await withRoom(a.room, (room) => {
        if (room.group !== group) return { ok: false, msg: 'Bàn này không thuộc nhóm của bạn.', noSave: true };
        const r = R.join(room, uid, mine.name);
        return r.ok ? r : { ...r, noSave: true };
      });
      return { ok: true, r: { ok: out.ok, msg: out.msg, room: a.room } };
    }
    if (!UUID.test(String(a.room))) return fail('Bàn không hợp lệ.');
    switch (a.type) {
      case 'cardLeave':
      case 'cardInvite': {
        const out = await withRoom(a.room, (room) => {
          const r = a.type === 'cardLeave' ? R.leave(room, uid) : R.invite(room, uid, a.ids);
          return r.ok ? r : { ...r, noSave: true };
        });
        if (out.room && out.room.status === 'settling') await settleRoom(a.room);
        return { ok: true, r: { ok: out.ok, msg: out.msg } };
      }
      case 'cardStart': {
        const rec = await getRoom(a.room);
        if (!rec) return fail('Bàn này không còn nữa.');
        const room0 = rec.room;
        if (room0.host !== uid) return fail('Chỉ chủ bàn mới bắt đầu được.');
        if (room0.status !== 'waiting') return fail('Ván đang chơi.');
        if (room0.seats.length < R.GAMES[room0.game].min) return fail('Cần ít nhất 2 người.');
        const amount = R.depositOf(room0);
        const nonce = Math.floor(rng() * 1e9).toString(36);
        const ids = room0.seats.map((s) => s.id);
        const hand = room0.hand + 1;
        const done = []; let short = null;
        for (const s of room0.seats) {
          if (await pay(s.id, `${a.room}:${hand}:${nonce}:in`, -amount, null)) done.push(s.id); else { short = s.name; break; }
        }
        const refund = async () => { for (const id of done) await pay(id, `${a.room}:${hand}:${nonce}:refund`, amount, null).catch(() => {}); };
        if (short) { await refund(); return fail(`${short} không đủ ${amount} xu để giữ cọc (${R.GAMES[room0.game].deposit} × mức cược).`); }
        const out = await withRoom(a.room, (room) => {
          if (room.status !== 'waiting' || room.seats.map((s) => s.id).join() !== ids.join()) return { ok: false, msg: 'Bàn vừa thay đổi, bấm Bắt đầu lại.', noSave: true };
          room.escrow = { nonce, amount, ids };
          return R.startHand(room, t, rng);
        });
        if (!out.ok) { await refund(); return fail(out.msg); }
        if (out.room.status === 'settling') await settleRoom(a.room);
        return { ok: true, r: { ok: true, msg: 'Chia bài!' }, own: await snapshot(uid) };
      }
      case 'cardMove':
      case 'cardTick': {
        const mv = a.type === 'cardMove' ? cleanMove(a.move) : null;
        if (a.type === 'cardMove' && !mv) return fail('Nước đi không hợp lệ.');
        const out = await withRoom(a.room, (room) => {
          if (room.status === 'settling') return { ok: true, noSave: true };
          const auto = room.status === 'playing' ? R.tick(room, t) : 0;
          if (!mv) return auto ? { ok: true } : { ok: true, noSave: true };
          if (room.status !== 'playing') return { ok: false, msg: 'Ván đã kết thúc.', noSave: !auto };
          const r = R.play(room, uid, mv, t);
          return r.ok ? r : { ...r, noSave: !auto };
        });
        let own = null;
        if (out.room && out.room.status === 'settling') { await settleRoom(a.room); own = await snapshot(uid); }
        return { ok: true, r: { ok: out.ok, msg: out.msg }, own };
      }
      default:
        return fail('Hành động bàn bài không hợp lệ.');
    }
  }

  return { act, settleRoom };
}

const CARD_TYPES = new Set(['cardCreate', 'cardJoin', 'cardLeave', 'cardInvite', 'cardStart', 'cardMove', 'cardTick']);

module.exports = { createCards, CARD_TYPES };

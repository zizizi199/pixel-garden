'use strict';
/**
 * Máy chủ trò chơi (chạy trên Supabase Edge Function "game", xem supabase/functions/game).
 * Mọi chỉ số người chơi (xu, EXP, đồ, cây…) nằm trong bảng vp_saves; game trên máy người chơi chỉ gửi
 * hành động, máy chủ tự tính bằng đúng logic src/core rồi lưu lại → không thể sửa chỉ số từ phía người chơi.
 *
 * Yêu cầu: POST { a: { type, ... }, tz, group, init } – header Authorization: Bearer <token đăng nhập ẩn danh>.
 * Lệnh Admin: { admin: { payload, sig } } – payload = JSON {uid, ts, a}, ký Ed25519 bằng khoá bí mật trên máy admin.
 * Trả về { ok, r, state, mg } – state đã bỏ phần bí mật (bộ bài Hoa 21 đang chơi…), game dùng để vẽ vườn.
 */
const G = require('../src/core/garden');
const MG = require('../src/core/minigames');
const C = require('../src/core/catalog');
const A = require('../src/core/actions');
const CL = require('../src/core/clock');
const { groupGarden } = require('../src/core/snapshot');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ADMIN_WINDOW_MS = 2 * 60 * 1000;
const SEEN_MAX = 300;

class HttpError extends Error {
  constructor(status, msg) { super(msg); this.status = status; }
}

const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Kiểm tra chữ ký Ed25519 (WebCrypto có sẵn trong Deno và Node 22). */
async function verifyEd25519(publicKeyB64, data, sigB64) {
  try {
    const key = await crypto.subtle.importKey('spki', b64(publicKeyB64), { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify({ name: 'Ed25519' }, key, b64(sigB64), new TextEncoder().encode(data));
  } catch (_) { return false; }
}

/** Bản state gửi về game: bỏ phần bí mật của ván minigame đang chơi (bộ bài, vị trí bọ vàng, cá sắp cắn câu). */
function publicState(state) {
  const s = JSON.parse(JSON.stringify(state));
  if (s.minigames) s.minigames.pending = null;
  delete s.serverSeen;
  return s;
}

function createHandler({ url, serviceKey, adminPublicKey, fetch = globalThis.fetch, now = Date.now, rng = Math.random }) {
  const base = String(url || '').replace(/\/+$/, '');
  const svcHeaders = { apikey: serviceKey, 'content-type': 'application/json' };
  if (/^eyJ/.test(serviceKey || '')) svcHeaders.authorization = `Bearer ${serviceKey}`;
  const tokenCache = new Map(); // token → { uid, until }

  async function rest(path, body, headers = svcHeaders) {
    const res = await fetch(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }
    if (!res.ok) throw new HttpError(res.status >= 500 ? 502 : 400, String((data && (data.message || data.msg)) || `Lỗi cơ sở dữ liệu (${res.status}).`).slice(0, 200));
    return data;
  }
  const rpc = (fn, args) => rest(`/rest/v1/rpc/${fn}`, args);
  const srv = (uid, fn, args) => rpc('vp_srv', { p_uid: uid, p_fn: fn, p_args: args });

  async function userOf(req) {
    const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization') || '');
    if (!m) throw new HttpError(401, 'Chưa đăng nhập.');
    const token = m[1];
    const hit = tokenCache.get(token);
    if (hit && hit.until > now()) return hit.uid;
    const res = await fetch(`${base}/auth/v1/user`, { headers: { apikey: serviceKey, authorization: `Bearer ${token}` } });
    const u = res.ok ? await res.json().catch(() => null) : null;
    if (!u || !UUID.test(String(u.id))) throw new HttpError(401, 'Phiên đăng nhập hết hạn.');
    if (tokenCache.size > 5000) tokenCache.clear();
    tokenCache.set(token, { uid: u.id, until: now() + 5 * 60 * 1000 });
    return u.id;
  }

  async function load(uid) {
    const rec = await rpc('vp_save_get', { p_uid: uid });
    return rec && rec.state ? { state: rec.state, version: Number(rec.version) } : null;
  }

  function prepare(rec, ctx) {
    const t = now();
    let state;
    if (rec) state = G.migrate(rec.state, t);
    else {
      state = G.createState(t);
      const init = ctx.init && typeof ctx.init === 'object' ? ctx.init : {};
      if (init.settings && typeof init.settings === 'object') {
        const { schedule, ownerName, notify, usePacks, music, sfx, petTalk, talkRate, volume, position, barWidth, alwaysOnTop, autoStart } = init.settings;
        A.updateSettings(state, { schedule, ownerName, notify, usePacks, music, sfx, petTalk, talkRate, volume, position, barWidth, alwaysOnTop, autoStart }, t);
      }
      state.log.unshift({ at: t, type: 'system', text: 'Vườn của bạn giờ được lưu trên máy chủ nhóm (chống sửa chỉ số).' });
    }
    if (Number.isFinite(ctx.tz) && ctx.tz >= -720 && ctx.tz <= 840) state.settings.tzOffset = Math.round(ctx.tz);
    if (!state.serverSeen || typeof state.serverSeen !== 'object') state.serverSeen = { visits: [], duels: [] };
    CL.setOffset(state.settings.tzOffset);
    return { state, t };
  }

  /**
   * Đọc → sửa (đồng bộ, không await) → ghi có kiểm tra phiên bản; đụng độ thì đọc lại và làm lại.
   * fn(state, t) trả về kết quả; có thể trả { replaceState } để thay cả vườn (Admin chơi lại từ đầu).
   */
  async function mutate(uid, ctx, fn) {
    for (let attempt = 0; attempt < 8; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 15 + Math.floor(rng() * 60 * attempt)));
      const rec = await load(uid);
      const { state, t } = prepare(rec, ctx);
      const out = fn(state, t) || {};
      const next = out.replaceState || state;
      if (out.replaceState) next.serverSeen = state.serverSeen;
      // tính hết phần phụ thuộc múi giờ ngay đây (CL.setOffset là biến chung, sau await có thể đã đổi)
      const pub = publicState(next);
      const mg = MG.info(next, t);
      if (out.skipSave && rec) return { out, state: next, pub, mg, garden: null, t };
      const garden = ctx.group && out.push !== false ? groupGarden(next, t) : null;
      const ok = await rpc('vp_save_put', { p_uid: uid, p_state: next, p_version: rec ? rec.version : 0 });
      if (ok === true) return { out, state: next, pub, mg, garden, t };
    }
    throw new HttpError(409, 'Máy chủ đang bận, thử lại.');
  }

  const reply = (m, extra = {}) => ({ ok: true, ...extra, state: m.pub, mg: m.mg });

  async function pushGarden(uid, group, garden) {
    if (!group || !garden) return [];
    try { const ev = await srv(uid, 'push', { group, garden }); return Array.isArray(ev) ? ev : []; } catch (_) { return []; }
  }

  // ---------------------------------------------------------------- các loại yêu cầu
  async function gameAction(uid, a, ctx, isAdmin) {
    const m = await mutate(uid, ctx, (state, t) => {
      const { r, state: next } = A.run(state, a, { now: t, rng, admin: isAdmin });
      return next !== state ? { r, replaceState: next } : { r };
    });
    if (m.out.r && m.out.r.ok) await pushGarden(uid, ctx.group, m.garden);
    return reply(m, { r: m.out.r });
  }

  /** Nhịp đồng bộ ~1 phút: tua vườn, gửi ảnh chụp vườn cho nhóm, áp các lượt tưới hộ / hái trộm. */
  async function tick(uid, ctx) {
    let m = await mutate(uid, ctx, (state, t) => { G.advance(state, t); return { r: { ok: true } }; });
    const events = (await pushGarden(uid, ctx.group, m.garden)).filter((e) => e && Number.isSafeInteger(e.id));
    if (events.length) {
      m = await mutate(uid, ctx, (state, t) => {
        G.advance(state, t);
        const seen = state.serverSeen.visits;
        for (const ev of events) {
          if (seen.includes(ev.id)) continue;
          G.applyRemoteVisit(state, ev, t);
          seen.push(ev.id);
        }
        state.serverSeen.visits = seen.slice(-SEEN_MAX);
        return { r: { ok: true } };
      });
      await srv(uid, 'ack', { group: ctx.group, ids: events.map((e) => e.id) }).catch(() => {});
      await pushGarden(uid, ctx.group, m.garden);
    }
    return reply(m, { r: { ok: true }, applied: events.length });
  }

  const gain = (state, money, exp) => { state.money += money; if (exp) G.gainExp(state, exp); };
  const clampLoot = (x) => Math.max(0, Math.min(10000, Math.round(Number(x) || 0)));

  async function groupAction(uid, a, ctx) {
    const group = ctx.group;
    if (!UUID.test(String(group || ''))) throw new HttpError(400, 'Hãy vào nhóm trước.');
    switch (a.type) {
      case 'visit': {
        if (!UUID.test(String(a.target)) || !['water', 'steal'].includes(a.kind) || !Number.isInteger(a.slot) || a.slot < 0 || a.slot > 11) {
          return { ok: true, r: { ok: false, msg: 'Hành động không hợp lệ.' } };
        }
        const v = await srv(uid, 'visit', { group, owner: a.target, kind: a.kind, slot: a.slot });
        const r = { ok: !!(v && v.ok), msg: String((v && v.msg) || 'Không thực hiện được.').slice(0, 200) };
        if (!r.ok || !v.loot) return { ok: true, r };
        const loot = { money: clampLoot(v.loot.money), exp: clampLoot(v.loot.exp) };
        const m = await mutate(uid, ctx, (state) => { gain(state, loot.money, loot.exp); return { r }; });
        if (a.kind === 'steal') r.loot = loot;
        return reply(m, { r });
      }
      case 'treeWater': {
        const v = await srv(uid, 'tree_give', { group, kind: 'water', amount: 0 });
        if (!v || !v.ok) return { ok: true, r: { ok: false, msg: String((v && v.msg) || 'Không tưới được.') } };
        const m = await mutate(uid, ctx, (state) => { G.gainExp(state, 5); return { r: { ok: true, msg: `${v.msg} +5 EXP` } }; });
        return reply(m, { r: m.out.r });
      }
      case 'treeFert': {
        const it = C.ITEMS_BY_ID[a.item];
        if (!it || !it.fert) return { ok: true, r: { ok: false, msg: 'Loại phân không hợp lệ.' } };
        const take = await mutate(uid, ctx, (state) => {
          if ((state.inventory.items[it.id] || 0) <= 0) return { r: { ok: false, msg: `Bạn không có ${it.name}.` }, skipSave: true };
          state.inventory.items[it.id] -= 1; // trừ trước rồi mới góp → không góp "chay" được
          return { r: { ok: true }, push: false };
        });
        if (!take.out.r.ok) return reply(take, { r: take.out.r });
        let v = null;
        try { v = await srv(uid, 'tree_give', { group, kind: 'fert', amount: it.fert }); } catch (e) { v = { ok: false, msg: e.message }; }
        const exp = Math.max(1, Math.round(it.fert * C.RULES.fertExpPerMin));
        const m = await mutate(uid, ctx, (state) => {
          if (!v || !v.ok) { state.inventory.items[it.id] = (state.inventory.items[it.id] || 0) + 1; return { r: { ok: false, msg: String((v && v.msg) || 'Không góp được.') }, push: false }; }
          G.gainExp(state, exp);
          return { r: { ok: true, msg: `${v.msg} +${exp} EXP` }, push: false };
        });
        return reply(m, { r: m.out.r });
      }
      case 'treeClaim':
      case 'treeClaimTop': {
        const top = a.type === 'treeClaimTop';
        const v = await srv(uid, top ? 'tree_claim_top' : 'tree_claim', top ? { group } : { group, milestone: Number(a.milestone) });
        if (!v || !v.ok) return { ok: true, r: { ok: false, msg: String((v && v.msg) || 'Không nhận được.') } };
        const m = await mutate(uid, ctx, (state) => ({ r: top ? G.treeTopChest(state, Number(v.rank), rng) : G.treeChest(state, Number(v.milestone), rng) }));
        return reply(m, { r: m.out.r });
      }
      case 'duelInvite':
      case 'duelRespond': {
        const rec = await load(uid);
        const { state } = prepare(rec, ctx);
        const pet = state.pets.active || null;
        const power = state.arena.power || 'cu_huc';
        const accept = a.type === 'duelInvite' || a.accept === true;
        if (accept && !pet) return { ok: true, r: { ok: false, msg: 'Bạn cần có pet đang ra vườn để vào đấu trường.' } };
        if (a.type === 'duelInvite') {
          if (!UUID.test(String(a.target))) return { ok: true, r: { ok: false, msg: 'Người chơi không hợp lệ.' } };
          const id = await srv(uid, 'duel_invite', { group, opponent: a.target, pet, power });
          return { ok: true, r: { ok: true, id, msg: 'Đã gửi lời thách đấu, chờ đối thủ đồng ý…' } };
        }
        if (!UUID.test(String(a.id))) return { ok: true, r: { ok: false, msg: 'Không tìm thấy lời mời.' } };
        await srv(uid, 'duel_respond', { duel: a.id, accept, pet, power });
        return { ok: true, r: { ok: true, msg: accept ? 'Vào đấu trường!' : 'Đã từ chối lời thách đấu.' } };
      }
      case 'duelSettle': { // trận đã xong (và người thắng đã lật bài) → nhận/mất món
        if (!UUID.test(String(a.id))) return { ok: true, r: { ok: false, msg: 'Trận không hợp lệ.' } };
        const d = await srv(uid, 'duel_state', { duel: a.id });
        if (!d || d.status !== 'finished' || d.applied) return { ok: true, r: { ok: true, applied: !!(d && d.applied) } };
        const meId = d[d.me] && d[d.me].id;
        if (d.winner && !Number.isInteger(d.pick)) return { ok: true, r: { ok: true, applied: false } };
        const opp = d.me === 'a' ? d.b : d.a;
        const m = await mutate(uid, ctx, (state) => {
          const seen = state.serverSeen.duels;
          if (seen.includes(d.id)) return { r: { ok: true, applied: true }, skipSave: true };
          if (d.winner) G.arenaTransfer(state, d.prize, d.winner === meId, String((opp && opp.name) || 'đối thủ').slice(0, 24));
          seen.push(d.id);
          state.serverSeen.duels = seen.slice(-SEEN_MAX);
          return { r: { ok: true, applied: true } };
        });
        await srv(uid, 'duel_ack', { duel: a.id });
        return reply(m, { r: m.out.r });
      }
      default:
        return { ok: true, r: { ok: false, msg: 'Hành động nhóm không hợp lệ.' } };
    }
  }

  // ---------------------------------------------------------------- bảng tài khoản (chỉ Admin)
  async function adminAccounts(uid, a, ctx) {
    if (a.type === 'adminList') {
      const list = await rpc('vp_admin_list', {});
      return { ok: true, r: { ok: true, accounts: Array.isArray(list) ? list.map((x) => ({ ...x, me: x.id === uid })) : [] } };
    }
    const target = String(a.target || '');
    const inner = a.a && typeof a.a === 'object' ? a.a : null;
    if (!UUID.test(target) || !inner || !['admin', 'adminReset'].includes(inner.type)) return { ok: true, r: { ok: false, msg: 'Lệnh không hợp lệ.' } };
    if (!(await load(target))) return { ok: true, r: { ok: false, msg: 'Không tìm thấy tài khoản này.' } };
    const self = target === uid;
    // vườn người khác: giữ múi giờ của họ, không gửi ảnh chụp vườn
    const m = await mutate(target, self ? ctx : { tz: NaN, group: null }, (state, t) => {
      const { r, state: next } = A.run(state, inner, { now: t, rng, admin: true });
      return next !== state ? { r, replaceState: next } : { r };
    });
    return self ? reply(m, { r: m.out.r }) : { ok: true, r: m.out.r };
  }

  const GROUP_TYPES = new Set(['visit', 'treeWater', 'treeFert', 'treeClaim', 'treeClaimTop', 'duelInvite', 'duelRespond', 'duelSettle']);

  async function handle(body, uid) {
    if (!body || typeof body !== 'object') throw new HttpError(400, 'Yêu cầu không hợp lệ.');
    if (body.v !== A.PROTOCOL) throw new HttpError(426, 'Phiên bản game đã cũ – hãy tải bản mới nhất để chơi tiếp.');
    const ctx = { tz: Number(body.tz), group: UUID.test(String(body.group || '')) ? body.group : null, init: body.init };
    let a = body.a;
    let isAdmin = false;
    if (body.admin) {
      const { payload, sig } = body.admin;
      if (!adminPublicKey || typeof payload !== 'string' || typeof sig !== 'string' || !(await verifyEd25519(adminPublicKey, payload, sig))) {
        throw new HttpError(403, 'Chữ ký Admin không hợp lệ.');
      }
      const p = JSON.parse(payload);
      if (p.uid !== uid || !(Math.abs(now() - Number(p.ts)) < ADMIN_WINDOW_MS)) throw new HttpError(403, 'Lệnh Admin đã hết hạn.');
      a = p.a; isAdmin = true;
    }
    if (!a || typeof a !== 'object' || typeof a.type !== 'string') throw new HttpError(400, 'Hành động không hợp lệ.');
    if (A.ADMIN_TYPES.has(a.type) && !isAdmin) return { ok: true, r: { ok: false, msg: 'Admin đã tắt.' } };
    if (a.type === 'adminList' || a.type === 'adminUser') return adminAccounts(uid, a, ctx);
    if (a.type === 'tick') return tick(uid, ctx);
    if (GROUP_TYPES.has(a.type)) return groupAction(uid, a, ctx);
    return gameAction(uid, a, ctx, isAdmin);
  }

  return async function handler(req) {
    const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
    if (req.method !== 'POST') return json(405, { ok: false, msg: 'Chỉ nhận POST.' });
    try {
      const uid = await userOf(req);
      const body = await req.json().catch(() => null);
      return json(200, await handle(body, uid));
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e);
      return json(status, { ok: false, msg: status === 500 ? 'Lỗi máy chủ trò chơi.' : e.message });
    }
  };
}

module.exports = { createHandler, publicState, verifyEd25519 };

'use strict';
// Nhóm chơi chung qua Supabase: chat nhóm + thăm vườn (tưới hộ / hái trộm) kể cả khi chủ vườn tắt máy.
// Chỉ gọi các hàm RPC vp_* trong supabase/schema.sql (bảng bị khoá bằng RLS).
// - Đăng nhập ẩn danh (Supabase Anonymous Sign-ins); refresh token lưu trong lan.sec (đã mã hoá).
// - Mã nhóm không gửi lên server: chỉ gửi SHA-256. Chat mã hoá AES-256-GCM bằng khoá suy ra từ mã nhóm.
// - Vườn, tiền, đồ… của người chơi lưu ở máy chủ (Edge Function "game", server/game.js): mọi hành động
//   có cộng/trừ đồ đi qua game() → máy chủ tự tính; ảnh chụp vườn cho nhóm cũng do máy chủ tạo.
// - Phần còn lại (chat, ai đang online, xem vườn, trả lời đấu trường) gọi thẳng RPC vp_poll/vp_send_chat/vp_duel_*.
const crypto = require('node:crypto');
const { PROTOCOL } = require('../core/actions');
const PH = require('../core/cards/phom');
const PK = require('../core/cards/poker');
const GAME_ID = (g) => (['tienlen', 'phom', 'poker'].includes(g) ? g : 'tienlen');

const TABLE_MS = 1000; // xem bàn bài 1 giây/lần khi đang ngồi bàn
const CARD_TYPES = new Set(['cardCreate', 'cardJoin', 'cardLeave', 'cardInvite', 'cardStart', 'cardMove']);
const { safeGarden } = require('./lan');

const SYNC_MS = 3000;
const IDLE_OFFLINE_S = 30;
const cleanName = (s) => String(s || '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 24) || 'Người chơi';
const cleanText = (s) => String(s || '').replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '').trim().slice(0, 300);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ I, O, 0, 1 cho dễ đọc

function newGroupCode() {
  const bytes = crypto.randomBytes(20);
  const chars = [...bytes].map((b) => B32[b % 32]).join('');
  return `VP-${chars.match(/.{4}/g).join('-')}`;
}
function normalizeCode(code) {
  const c = String(code || '').toUpperCase().replace(/\s+/g, '');
  if (!/^VP(-[A-Z0-9]{4}){5}$/.test(c)) throw new Error('Mã nhóm không hợp lệ (dạng VP-XXXX-XXXX-XXXX-XXXX-XXXX).');
  return c;
}
const codeHash = (code) => crypto.createHash('sha256').update(`vuon-pixel-group|${code}`).digest('hex');
const chatKey = (code) => Buffer.from(crypto.hkdfSync('sha256', code, 'vuon-pixel-chat', 'v1', 32));

function encryptChat(key, text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return `v1.${Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64url')}`;
}
function decryptChat(key, body) {
  try {
    if (typeof body !== 'string' || !body.startsWith('v1.')) return null;
    const raw = Buffer.from(body.slice(3), 'base64url');
    if (raw.length < 29) return null;
    const d = crypto.createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8');
  } catch (_) { return null; }
}

function validSupabase(cfg) {
  // https://<dự án>.supabase.co, hoặc Supabase chạy thử trên máy (supabase start → http://127.0.0.1:54321)
  return !!cfg && typeof cfg.url === 'string'
    && /^(https:\/\/[a-z0-9-]+\.supabase\.(co|in)|http:\/\/(127\.0\.0\.1|localhost):\d{2,5})\/?$/i.test(cfg.url.trim())
    && typeof cfg.anonKey === 'string' && cfg.anonKey.trim().length > 20;
}

class GroupRoom {
  constructor({ config, saveConfig, changed, supabase, fetch, now, applyServer }) {
    this.applyServer = applyServer || (() => {}); // nhận state mới từ máy chủ trò chơi
    this.duels = []; this.duel = null; this.duelTimer = null; this.duelBusy = false;
    this.tree = null; // tóm tắt Thần mộc (từ vp_sync)
    this.rooms = []; this.table = null; this.tableTimer = null; this.tableId = null; this.tickAsked = 0; this.resultSeen = 0;
    this.config = { alias: 'Người chơi', friends: [], group: null, auth: null, ...config };
    this.saveConfig = saveConfig;
    this.changed = changed;
    this.fetch = fetch || globalThis.fetch;
    this.now = now || Date.now;
    this.sb = validSupabase(supabase) ? { url: supabase.url.trim().replace(/\/+$/, ''), key: supabase.anonKey.trim() } : null;
    this.session = null; // { access, exp }
    this.away = false;
    this.members = [];
    this.messages = [];
    this.lastMsg = 0;
    this.watchId = null;
    this.watched = null;
    this.timer = null; this.syncing = null; this.error = ''; this.stopped = true;
  }

  get configured() { return !!this.sb; }
  get inGroup() { return !!(this.config.group && this.config.group.id); }

  status() {
    const uid = this.config.auth && this.config.auth.uid;
    const players = this.members.map((m) => ({ id: m.id, name: m.name, status: m.status, keeper: !!m.keeper,
      garden: m.id === this.watchId ? this.watched : null }));
    return { mode: 'group', online: this.configured, role: this.inGroup ? 'member' : null, selfId: uid || null,
      groupCode: this.inGroup ? this.config.group.code : '', away: this.away, alias: this.config.alias,
      joined: false, players, friends: this.config.friends, messages: this.messages.slice(-100), error: this.error,
      duels: this.duels, duel: this.duel, tree: this.inGroup ? this.tree : null,
      rooms: this.inGroup ? this.rooms : [], table: this.inGroup ? this.table : null };
  }

  emit() { this.changed(this.status()); }

  // ------------------------------------------------------------ HTTP / đăng nhập
  async http(path, { method = 'POST', body, auth = true, timeout = 12000 } = {}) {
    if (!this.sb) throw new Error('Bản này chưa cấu hình Supabase.');
    const headers = { apikey: this.sb.key, 'content-type': 'application/json' };
    if (auth) headers.authorization = `Bearer ${await this.accessToken()}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    let res;
    try {
      res = await this.fetch(`${this.sb.url}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctrl.signal });
    } catch (e) {
      throw new Error(e.name === 'AbortError' ? 'Máy chủ nhóm phản hồi quá chậm.' : 'Không kết nối được máy chủ nhóm (kiểm tra Internet).');
    } finally { clearTimeout(t); }
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }
    if (!res.ok) {
      const msg = (data && (data.message || data.msg || data.error_description || data.error)) || `Lỗi máy chủ (${res.status}).`;
      throw Object.assign(new Error(String(msg).slice(0, 200)), { status: res.status });
    }
    return data;
  }

  accessToken() {
    if (this.session && this.session.exp - 60000 > this.now()) return Promise.resolve(this.session.access);
    // chỉ 1 lần làm mới token tại 1 thời điểm (refresh token dùng 2 lần cùng lúc sẽ bị Supabase từ chối)
    if (!this.tokenP) this.tokenP = this.login().finally(() => { this.tokenP = null; });
    return this.tokenP;
  }

  async login() {
    const a = this.config.auth;
    let r = null;
    if (a && a.refresh) {
      try { r = await this.http('/auth/v1/token?grant_type=refresh_token', { body: { refresh_token: a.refresh }, auth: false }); }
      catch (e) { if ([400, 401, 403].includes(e.status)) r = null; else throw e; } // 429/5xx/mất mạng: giữ tài khoản, thử lại sau
    }
    if (!r) r = await this.http('/auth/v1/signup', { body: { data: {} }, auth: false }).catch((e) => {
      throw new Error(/anonymous/i.test(e.message) ? 'Supabase chưa bật "Anonymous Sign-ins".' : e.message);
    });
    if (!r || !r.access_token || !r.user || !UUID.test(r.user.id)) throw new Error('Đăng nhập máy chủ nhóm thất bại.');
    const changedUser = !a || a.uid !== r.user.id;
    this.session = { access: r.access_token, exp: this.now() + (Number(r.expires_in) || 3600) * 1000 };
    // vườn trên máy chủ gắn với tài khoản này; nếu buộc phải tạo tài khoản mới thì nhớ mã cũ để Admin khôi phục
    const prev = a && a.uid && a.uid !== r.user.id ? [...((a && a.prev) || []), a.uid].slice(-5) : ((a && a.prev) || []);
    this.config.auth = { uid: r.user.id, refresh: r.refresh_token, prev };
    await this.saveConfig(this.config);
    // tài khoản ẩn danh mới (token cũ hết hạn) → tự vào lại nhóm bằng mã đã lưu
    if (changedUser && a && this.inGroup && !this.rejoining) {
      this.rejoining = true;
      try { await this.rpc('vp_join_group', { p_code_hash: codeHash(this.config.group.code), p_name: this.config.alias }); }
      finally { this.rejoining = false; }
    }
    return this.session.access;
  }

  async rpc(name, args) {
    try { return await this.http(`/rest/v1/rpc/${name}`, { body: args }); }
    catch (e) {
      if (e.status !== 401) throw e;
      this.session = null;
      return this.http(`/rest/v1/rpc/${name}`, { body: args });
    }
  }

  // ------------------------------------------------------------ máy chủ trò chơi (Edge Function "game")
  /** Gửi 1 yêu cầu cho máy chủ trò chơi. body: { a } hoặc { admin }, thêm { init } lần đầu. */
  async game(body) {
    const send = () => this.http('/functions/v1/game', { timeout: 20000, body: {
      v: PROTOCOL, tz: -new Date().getTimezoneOffset(), group: this.inGroup ? this.config.group.id : null, ...body } });
    let res;
    try { res = await send(); } catch (e) {
      if (e.status !== 401) throw Object.assign(new Error(e.status === 404 ? 'Máy chủ trò chơi chưa được cài (xem supabase/README.md).' : e.message), { status: e.status });
      this.session = null;
      res = await send();
    }
    if (!res || typeof res !== 'object') throw new Error('Máy chủ trò chơi trả về dữ liệu lạ.');
    if (res.state) this.applyServer(res);
    return res;
  }

  /** Hành động cần máy chủ tính (thăm vườn, Thần mộc, đấu trường…) → kết quả { ok, msg, ... }. */
  async server(a) {
    const res = await this.game({ a });
    return res.r && typeof res.r === 'object' ? res.r : { ok: false, msg: 'Không thực hiện được.' };
  }

  // ------------------------------------------------------------ nhóm
  async createGroup() {
    if (this.inGroup) throw new Error('Hãy rời nhóm hiện tại trước.');
    const code = newGroupCode();
    const id = await this.rpc('vp_create_group', { p_code_hash: codeHash(code), p_name: this.config.alias });
    await this.enter(id, code);
    return { ok: true, code, msg: 'Đã tạo nhóm. Gửi riêng mã nhóm cho đồng nghiệp để họ vào.' };
  }

  async joinGroup(input) {
    if (this.inGroup) throw new Error('Hãy rời nhóm hiện tại trước.');
    const code = normalizeCode(input);
    const id = await this.rpc('vp_join_group', { p_code_hash: codeHash(code), p_name: this.config.alias });
    await this.enter(id, code);
    return { ok: true, msg: 'Đã vào nhóm.' };
  }

  async enter(id, code) {
    if (!UUID.test(String(id))) throw new Error('Máy chủ nhóm trả về dữ liệu lạ.');
    this.config.group = { id, code };
    this.messages = []; this.lastMsg = 0; this.members = [];
    await this.saveConfig(this.config);
    this.start();
    await this.syncNow();
  }

  async leave() {
    const g = this.config.group;
    this.stop();
    if (g) await this.rpc('vp_leave_group', { p_group: g.id }).catch(() => {});
    this.config.group = null;
    this.members = []; this.messages = []; this.watchId = null; this.watched = null; this.error = '';
    await this.saveConfig(this.config);
    this.emit();
    return { ok: true, msg: 'Đã rời nhóm.' };
  }

  async setAlias(name) {
    this.config.alias = cleanName(name);
    await this.saveConfig(this.config);
    if (this.inGroup) await this.rpc('vp_set_name', { p_group: this.config.group.id, p_name: this.config.alias });
    await this.syncNow().catch(() => {});
    return { ok: true, msg: 'Đã đổi biệt danh.' };
  }

  setAway(v) { this.away = !!v; this.emit(); return { ok: true }; }

  async friend(id) {
    if (!UUID.test(String(id))) throw new Error('Người chơi không hợp lệ.');
    const list = new Set(this.config.friends);
    if (list.has(id)) list.delete(id); else list.add(id);
    this.config.friends = [...list];
    await this.saveConfig(this.config);
    this.emit();
    return { ok: true, msg: list.has(id) ? 'Đã thêm bạn.' : 'Đã bỏ khỏi danh sách bạn.' };
  }

  async chat(text) {
    text = cleanText(text);
    if (!text) throw new Error('Nhập tin nhắn trước khi gửi.');
    if (!this.inGroup) throw new Error('Hãy vào nhóm trước.');
    await this.rpc('vp_send_chat', { p_group: this.config.group.id, p_body: encryptChat(chatKey(this.config.group.code), text) });
    await this.syncNow().catch(() => {});
    return { ok: true, msg: 'Đã gửi.' };
  }

  watch(id) {
    this.watchId = id && UUID.test(String(id)) ? id : null;
    this.watched = null;
    if (this.watchId) this.syncNow().catch(() => {});
    this.emit();
    return { ok: true };
  }

  async visit(target, kind, slot) {
    if (!this.inGroup) throw new Error('Hãy vào nhóm trước.');
    if (!UUID.test(String(target)) || !['water', 'steal'].includes(kind) || !Number.isInteger(slot) || slot < 0 || slot > 11) {
      throw new Error('Hành động không hợp lệ.');
    }
    const r = await this.server({ type: 'visit', target, kind, slot });
    const out = { ok: !!r.ok, msg: cleanText(r.msg) || 'Không thực hiện được.' };
    if (out.ok && r.loot) out.loot = r.loot;
    await this.syncNow().catch(() => {});
    return out;
  }

  // ------------------------------------------------------------ Thần mộc (cây chung của nhóm)
  async treeState() {
    if (!this.inGroup) throw new Error('Hãy vào nhóm trước.');
    const r = await this.rpc('vp_tree_state', { p_group: this.config.group.id });
    return { ok: true, tree: {
      season: Number(r.season) || 1, growth: Number(r.growth) || 0, marks: Array.isArray(r.marks) ? r.marks.map(Number) : [],
      resetAt: r.resetAt || null, helped: !!r.helped,
      today: { water: Number(r.today && r.today.water) || 0, fert: Number(r.today && r.today.fert) || 0, fertMax: Number(r.today && r.today.fertMax) || 100 },
      claimed: Array.isArray(r.claimed) ? r.claimed.map(Number) : [],
      top: (Array.isArray(r.top) ? r.top : []).slice(0, 3).map((x) => ({ rank: Number(x.rank) || 0, total: Number(x.total) || 0,
        name: cleanName(x.name), me: !!x.me, claimed: !!x.claimed })),
      board: (Array.isArray(r.board) ? r.board : []).slice(0, 15).map((x) => ({ name: cleanName(x.name), total: Number(x.total) || 0, me: !!x.me })),
    } };
  }

  /** Tưới / bón / nhận rương Thần mộc: máy chủ trò chơi trừ phân, cộng EXP, mở rương. */
  async treeAction(a) {
    if (!this.inGroup) throw new Error('Hãy vào nhóm trước.');
    const r = await this.server(a);
    this.syncNow().catch(() => {});
    return { ...r, ok: !!r.ok, msg: cleanText(r.msg) };
  }

  // ------------------------------------------------------------ đấu trường thú
  async duelInvite(target) {
    if (!this.inGroup) throw new Error('Hãy vào nhóm trước.');
    if (!UUID.test(String(target))) throw new Error('Người chơi không hợp lệ.');
    const r = await this.server({ type: 'duelInvite', target });
    if (!r.ok) return { ok: false, msg: cleanText(r.msg) };
    await this.openDuel(r.id);
    await this.syncNow().catch(() => {});
    return { ok: true, msg: 'Đã gửi lời thách đấu, chờ đối thủ đồng ý…' };
  }

  async duelRespond(id, accept) {
    if (!UUID.test(String(id))) throw new Error('Không tìm thấy lời mời.');
    const r = await this.server({ type: 'duelRespond', id, accept: !!accept });
    if (!r.ok) return { ok: false, msg: cleanText(r.msg) };
    if (accept) await this.openDuel(id); else if (this.duel && this.duel.id === id) this.duel = null;
    await this.syncNow().catch(() => {});
    return { ok: true, msg: accept ? 'Vào đấu trường!' : 'Đã từ chối lời thách đấu.' };
  }

  async duelAnswer(guess) {
    const d = this.duel;
    if (!d || d.status !== 'playing') throw new Error('Không có trận đang diễn ra.');
    const r = await this.rpc('vp_duel_answer', { p_duel: d.id, p_round: d.round, p_guess: String(guess || '').slice(0, 40) });
    await this.refreshDuel();
    return { ok: !!(r && r.ok), correct: !!(r && r.correct), msg: cleanText(r && r.msg) };
  }

  async duelPick(idx) {
    const d = this.duel;
    if (!d) throw new Error('Không có trận đấu.');
    await this.rpc('vp_duel_pick', { p_duel: d.id, p_idx: Number(idx) });
    await this.refreshDuel();
    return { ok: true };
  }

  async duelForfeit() {
    const d = this.duel;
    if (!d) return { ok: true };
    await this.rpc('vp_duel_forfeit', { p_duel: d.id });
    await this.refreshDuel();
    return { ok: true, msg: d.status === 'invited' ? 'Đã huỷ lời mời.' : 'Bạn đã bỏ cuộc.' };
  }

  closeDuel() {
    const d = this.duel;
    const meId = d && d[d.me] && d[d.me].id;
    const waitingPick = d && d.status === 'finished' && d.winner && d.winner !== meId && d.pick === null; // chờ người thắng lật bài
    if (d && (d.status === 'playing' || (d.status === 'finished' && !d.applied && !waitingPick))) return { ok: false, msg: 'Trận đấu chưa xong.' };
    this.duel = null; clearTimeout(this.duelTimer); this.duelTimer = null;
    this.emit();
    return { ok: true };
  }

  async openDuel(id) {
    if (!UUID.test(String(id))) return;
    this.duel = { id, status: 'loading' };
    await this.refreshDuel();
    this.duelLoop();
  }

  // trận đang diễn ra / vừa kết thúc chưa nhận thưởng → tự mở đấu trường
  watchDuels() {
    const active = this.duels.find((d) => d.status === 'playing' || (d.status === 'finished' && (!d.winner || d.picked || d.winner === this.config.auth.uid)));
    if (active && (!this.duel || this.duel.id !== active.id) && !this.duelBusy) this.openDuel(active.id).catch(() => {});
  }

  duelLoop() {
    clearTimeout(this.duelTimer);
    this.duelTimer = setTimeout(async () => {
      if (!this.duel) return;
      try { await this.refreshDuel(); } catch (_) { /* thử lại */ }
      const s = this.duel && this.duel.status;
      if (s === 'playing' || s === 'invited' || s === 'loading' || (s === 'finished' && !this.duel.applied)) this.duelLoop();
    }, 1000);
  }

  async refreshDuel() {
    const cur = this.duel;
    if (!cur) return;
    this.duelBusy = true;
    try {
      const r = await this.rpc('vp_duel_state', { p_duel: cur.id });
      if (!this.duel || this.duel.id !== cur.id || !r) return;
      const side = (x) => ({ id: x && x.id, name: cleanName(x && x.name), pet: x && x.pet, power: (x && x.power) || 'cu_huc', score: Number(x && x.score) || 0 });
      this.duel = { id: r.id, status: r.status, me: r.me === 'a' ? 'a' : 'b', a: side(r.a), b: side(r.b), round: Number(r.round) || 0,
        pattern: typeof r.pattern === 'string' ? r.pattern.slice(0, 12) : '', left: Number(r.left) || 0, roundOver: !!r.roundOver,
        roundWinner: r.roundWinner || null, word: typeof r.word === 'string' ? r.word.slice(0, 12) : null, tries: Number(r.tries) || 0,
        history: Array.isArray(r.history) ? r.history.slice(-30) : [], winner: r.winner || null,
        cards: r.cards, pick: Number.isInteger(r.pick) ? r.pick : null, prize: r.prize || null, applied: !!r.applied };
      const d = this.duel;
      if (d.status === 'finished' && !d.applied && (!d.winner || d.pick !== null)) {
        const s = await this.server({ type: 'duelSettle', id: d.id }); // máy chủ trao/trừ món rồi đánh dấu đã nhận
        d.applied = !!s.applied;
      }
    } finally { this.duelBusy = false; this.emit(); }
  }

  // ------------------------------------------------------------ bàn bài (Tiến lên, Phỏm)
  async cardAction(a) {
    if (!this.inGroup) throw new Error('Hãy vào nhóm trước.');
    if (!a || !CARD_TYPES.has(a.type)) throw new Error('Hành động bàn bài không hợp lệ.');
    const r = await this.server({ ...a, room: a.room || this.tableId || undefined });
    if (r.ok && r.room && a.type !== 'cardLeave') this.openTable(r.room);
    if (a.type === 'cardLeave' && r.ok) { await this.refreshTable().catch(() => {}); if (this.table && this.table.status === 'waiting') this.closeTable(); }
    else await this.refreshTable().catch(() => {});
    this.syncNow().catch(() => {});
    return { ok: !!r.ok, msg: cleanText(r.msg) };
  }

  openTable(id) {
    if (!UUID.test(String(id))) return;
    if (this.tableId !== id) { this.tableId = id; this.table = null; this.resultSeen = 0; }
    if (!this.tableTimer) this.tableLoop();
    this.refreshTable().catch(() => {});
  }

  closeTable() {
    clearTimeout(this.tableTimer); this.tableTimer = null;
    this.tableId = null; this.table = null;
    this.emit();
    return { ok: true };
  }

  tableLoop() {
    this.tableTimer = setTimeout(async () => {
      this.tableTimer = null;
      if (!this.tableId) return;
      try { await this.refreshTable(); } catch (_) { /* thử lại */ }
      if (this.tableId) this.tableLoop();
    }, TABLE_MS);
  }

  async refreshTable() {
    const id = this.tableId;
    if (!id) return;
    const v = await this.rpc('vp_card_view', { p_room: id });
    if (this.tableId !== id) return;
    if (!v) { this.closeTable(); return; }
    const skew = Number(v.now) - this.now();
    const pub = v.pub && typeof v.pub === 'object' ? v.pub : null;
    const cards = Array.isArray(v.cards) ? v.cards.filter((c) => Number.isInteger(c) && c >= 0 && c < 52) : [];
    const seat = Number.isInteger(v.seat) ? v.seat : -1;
    const t = { id: v.id, game: GAME_ID(v.game), stake: Number(v.stake) || 0, host: v.host, status: String(v.status),
      hand: Number(v.hand) || 0, seats: (Array.isArray(v.seats) ? v.seats : []).slice(0, 6).map((p) => ({ id: p.id, name: cleanName(p.name), away: !!p.away })),
      invited: Array.isArray(v.invited) ? v.invited : [], seat, cards, pub, result: v.result || null, skew,
      deposit: Number(v.deposit) || (Number(v.stake) || 0) * 12, me: this.config.auth && this.config.auth.uid };
    if (t.game === 'phom' && pub && seat >= 0 && t.status === 'playing') {
      const hands = []; hands[seat] = cards;
      const g = { pub, hands };
      try {
        t.canEat = PH.canEat(g, seat);
        t.suggest = pub.turn === seat && pub.phase === 'discard' ? PH.suggestDiscard(g, seat) : null;
        const b = PH.best(cards, Array.isArray(pub.eaten && pub.eaten[seat]) ? pub.eaten[seat] : []);
        t.melds = b ? b.melds : []; // phỏm đang có trên tay (để tô màu, xếp bài)
        t.points = b ? b.points : null;
      } catch (_) { t.canEat = false; t.suggest = null; t.melds = []; }
    }
    if (t.game === 'poker' && pub && seat >= 0 && cards.length === 2) {
      const bh = PK.bestHand([...cards, ...(Array.isArray(pub.board) ? pub.board : [])]);
      t.handName = bh && (pub.board || []).length ? bh.name : null;
    }
    this.table = t;
    // hết giờ mà máy chủ chưa đánh hộ → nhắc máy chủ (ai đang xem bàn cũng nhắc được)
    if (t.status === 'playing' && pub && pub.deadline && this.now() + skew > pub.deadline + 700 && this.tickAsked !== pub.deadline) {
      this.tickAsked = pub.deadline;
      this.server({ type: 'cardTick', room: id }).catch(() => {});
    }
    if (t.status === 'settling' && this.tickAsked !== -t.hand) { this.tickAsked = -t.hand; this.server({ type: 'cardTick', room: id }).catch(() => {}); }
    // vừa xong 1 ván: lấy lại vườn của mình để thấy xu mới
    if (t.result && t.status === 'waiting' && t.result.hand > this.resultSeen) {
      this.resultSeen = t.result.hand;
      this.game({ a: { type: 'tick' } }).catch(() => {});
    }
    this.emit();
  }

  // ------------------------------------------------------------ đồng bộ định kỳ
  start() {
    if (!this.configured || !this.inGroup) return;
    this.stopped = false;
    if (!this.timer) this.loop();
  }

  stop() { this.stopped = true; clearTimeout(this.timer); this.timer = null; }

  loop() {
    this.timer = setTimeout(async () => {
      this.timer = null;
      if (this.stopped) return;
      try { await this.syncNow(); } catch (_) { /* lỗi đã ghi vào this.error */ }
      if (!this.stopped) this.loop();
    }, this.error ? SYNC_MS * 3 : SYNC_MS);
  }

  syncNow() {
    if (!this.syncing) this.syncing = this.sync().finally(() => { this.syncing = null; });
    return this.syncing;
  }

  async sync() {
    if (!this.inGroup) return;
    const g = this.config.group;
    let r;
    try {
      r = await this.rpc('vp_poll', { p_group: g.id, p_away: this.away, p_since: this.lastMsg, p_watch: this.watchId });
    } catch (e) {
      this.error = e.message;
      if (/không còn trong nhóm/i.test(e.message)) { this.stop(); this.config.group = null; await this.saveConfig(this.config); }
      this.emit();
      throw e;
    }
    this.error = '';
    const key = chatKey(g.code);
    this.members = (Array.isArray(r && r.members) ? r.members : []).filter((m) => m && UUID.test(m.id)).slice(0, 60)
      .map((m) => ({ id: m.id, name: cleanName(m.name), keeper: m.keeper === true,
        status: Number(m.idle) > IDLE_OFFLINE_S ? 'Ngoại tuyến' : m.away ? 'Vắng mặt' : 'Đang chơi' }));
    for (const m of (Array.isArray(r && r.messages) ? r.messages : [])) {
      if (!m || !Number.isSafeInteger(m.id) || m.id <= this.lastMsg) continue;
      this.lastMsg = m.id;
      const textMsg = decryptChat(key, m.body);
      this.messages.push({ id: String(m.id), byId: String(m.by), by: cleanName(m.name), text: textMsg == null ? '[không giải mã được]' : cleanText(textMsg) });
    }
    this.messages = this.messages.slice(-100);
    if (this.watchId) this.watched = safeGarden(r && r.garden);
    this.duels = (Array.isArray(r && r.duels) ? r.duels : []).filter((d) => d && UUID.test(d.id)).slice(0, 10)
      .map((d) => ({ id: d.id, status: String(d.status), a: d.a, b: d.b, aName: cleanName(d.aName), bName: cleanName(d.bName),
        winner: d.winner || null, picked: !!d.picked }));
    this.watchDuels();
    this.rooms = (Array.isArray(r && r.cards) ? r.cards : []).filter((x) => x && UUID.test(x.id)).slice(0, 20)
      .map((x) => ({ id: x.id, game: GAME_ID(x.game), stake: Number(x.stake) || 0, status: String(x.status), host: x.host,
        seats: (Array.isArray(x.seats) ? x.seats : []).slice(0, 6).map((p) => ({ id: p.id, name: cleanName(p.name) })), invited: !!x.invited, mine: !!x.mine }));
    const mine = this.rooms.find((x) => x.mine);
    if (mine && this.tableId !== mine.id) this.openTable(mine.id);
    if (!mine && this.tableId && !(this.table && this.table.result)) this.closeTable();
    const t = r && r.tree;
    this.tree = t ? { season: Number(t.season) || 1, growth: Number(t.growth) || 0, max: Number(t.max) || 1, watered: !!t.watered, claimable: Number(t.claimable) || 0 } : null;
    this.emit();
  }
}

module.exports = { GroupRoom, newGroupCode, normalizeCode, codeHash, chatKey, encryptChat, decryptChat, validSupabase };

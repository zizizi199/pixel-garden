'use strict';
// Nhóm chơi chung qua Supabase: chat nhóm + thăm vườn (tưới hộ / hái trộm) kể cả khi chủ vườn tắt máy.
// Chỉ gọi các hàm RPC vp_* trong supabase/schema.sql (bảng bị khoá bằng RLS).
// - Đăng nhập ẩn danh (Supabase Anonymous Sign-ins); refresh token lưu trong lan.sec (đã mã hoá).
// - Mã nhóm không gửi lên server: chỉ gửi SHA-256. Chat mã hoá AES-256-GCM bằng khoá suy ra từ mã nhóm.
// - Không gửi lịch hoạt động; ảnh chụp vườn chỉ gồm trường hiển thị + phần thưởng/khả năng chặn trộm.
const crypto = require('node:crypto');
const { safeGarden } = require('./lan');

const SYNC_MS = 3000;
const IDLE_OFFLINE_S = 30;
const GARDEN_REFRESH_MS = 60000;
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
  constructor({ config, saveConfig, getGarden, applyEvents, applyReward, changed, supabase, fetch, now }) {
    this.config = { alias: 'Người chơi', friends: [], group: null, auth: null, ...config };
    this.saveConfig = saveConfig;
    this.getGarden = getGarden;
    this.applyEvents = applyEvents;
    this.applyReward = applyReward;
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
    this.sentGarden = ''; this.sentAt = 0;
    this.timer = null; this.syncing = null; this.error = ''; this.stopped = true;
  }

  get configured() { return !!this.sb; }
  get inGroup() { return !!(this.config.group && this.config.group.id); }

  status() {
    const uid = this.config.auth && this.config.auth.uid;
    const players = this.members.map((m) => ({ id: m.id, name: m.name, status: m.status,
      garden: m.id === this.watchId ? this.watched : null }));
    return { mode: 'group', online: this.configured, role: this.inGroup ? 'member' : null, selfId: uid || null,
      groupCode: this.inGroup ? this.config.group.code : '', away: this.away, alias: this.config.alias,
      joined: false, players, friends: this.config.friends, messages: this.messages.slice(-100), error: this.error };
  }

  emit() { this.changed(this.status()); }

  // ------------------------------------------------------------ HTTP / đăng nhập
  async http(path, { method = 'POST', body, auth = true } = {}) {
    if (!this.sb) throw new Error('Bản này chưa cấu hình Supabase.');
    const headers = { apikey: this.sb.key, 'content-type': 'application/json' };
    if (auth) headers.authorization = `Bearer ${await this.accessToken()}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
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

  async accessToken() {
    if (this.session && this.session.exp - 60000 > this.now()) return this.session.access;
    const a = this.config.auth;
    let r = null;
    if (a && a.refresh) {
      try { r = await this.http('/auth/v1/token?grant_type=refresh_token', { body: { refresh_token: a.refresh }, auth: false }); }
      catch (e) { if (e.status && e.status < 500) r = null; else throw e; }
    }
    if (!r) r = await this.http('/auth/v1/signup', { body: { data: {} }, auth: false }).catch((e) => {
      throw new Error(/anonymous/i.test(e.message) ? 'Supabase chưa bật "Anonymous Sign-ins".' : e.message);
    });
    if (!r || !r.access_token || !r.user || !UUID.test(r.user.id)) throw new Error('Đăng nhập máy chủ nhóm thất bại.');
    const changedUser = !a || a.uid !== r.user.id;
    this.session = { access: r.access_token, exp: this.now() + (Number(r.expires_in) || 3600) * 1000 };
    this.config.auth = { uid: r.user.id, refresh: r.refresh_token };
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
    this.messages = []; this.lastMsg = 0; this.members = []; this.sentGarden = '';
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
    const r = await this.rpc('vp_visit', { p_group: this.config.group.id, p_owner: target, p_kind: kind, p_slot: slot });
    const out = { ok: !!(r && r.ok), msg: cleanText(r && r.msg) || 'Không thực hiện được.' };
    if (out.ok && r.loot) {
      const loot = { money: Math.max(0, Math.min(10000, Math.round(Number(r.loot.money) || 0))), exp: Math.max(0, Math.min(10000, Math.round(Number(r.loot.exp) || 0))) };
      await this.applyReward(loot);
      if (kind === 'steal') out.loot = loot;
    }
    await this.syncNow().catch(() => {});
    return out;
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
    const garden = this.getGarden();
    const text = JSON.stringify(garden);
    const sendGarden = text !== this.sentGarden || this.now() - this.sentAt > GARDEN_REFRESH_MS;
    let r;
    try {
      r = await this.rpc('vp_sync', { p_group: g.id, p_away: this.away, p_garden: sendGarden ? garden : null,
        p_since: this.lastMsg, p_watch: this.watchId });
    } catch (e) {
      this.error = e.message;
      if (/không còn trong nhóm/i.test(e.message)) { this.stop(); this.config.group = null; await this.saveConfig(this.config); }
      this.emit();
      throw e;
    }
    if (sendGarden) { this.sentGarden = text; this.sentAt = this.now(); }
    this.error = '';
    const key = chatKey(g.code);
    this.members = (Array.isArray(r && r.members) ? r.members : []).filter((m) => m && UUID.test(m.id)).slice(0, 60)
      .map((m) => ({ id: m.id, name: cleanName(m.name),
        status: Number(m.idle) > IDLE_OFFLINE_S ? 'Ngoại tuyến' : m.away ? 'Vắng mặt' : 'Đang chơi' }));
    for (const m of (Array.isArray(r && r.messages) ? r.messages : [])) {
      if (!m || !Number.isSafeInteger(m.id) || m.id <= this.lastMsg) continue;
      this.lastMsg = m.id;
      const textMsg = decryptChat(key, m.body);
      this.messages.push({ id: String(m.id), byId: String(m.by), by: cleanName(m.name), text: textMsg == null ? '[không giải mã được]' : cleanText(textMsg) });
    }
    this.messages = this.messages.slice(-100);
    if (this.watchId) this.watched = safeGarden(r && r.garden);
    const events = (Array.isArray(r && r.events) ? r.events : []).filter((e) => e && Number.isSafeInteger(e.id));
    if (events.length) {
      await this.applyEvents(events);
      await this.rpc('vp_ack_events', { p_group: g.id, p_ids: events.map((e) => e.id) });
    }
    this.emit();
  }
}

module.exports = { GroupRoom, newGroupCode, normalizeCode, codeHash, chatKey, encryptChat, decryptChat, validSupabase };

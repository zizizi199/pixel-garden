'use strict';
// Phòng chơi chung: LAN (kết nối thẳng giữa các máy) hoặc Internet (qua máy trung chuyển relay/).
// Hai chế độ dùng chung giao thức đã mã hoá; chỉ nhận các thông điệp game đã định nghĩa.
const { RelayLink } = require('./relay-link');
const http = require('node:http');
const os = require('node:os');
const net = require('node:net');
const crypto = require('node:crypto');

const PORT = 47321;
const MAX_BODY = 48 * 1024;
const MAX_REPLY = 512 * 1024; // phản hồi của chủ phòng (danh sách vườn + 50 tin chat) có thể lớn hơn yêu cầu
const CLOCK_SKEW = 10 * 60000; // chấp nhận đồng hồ hai máy lệch tối đa 10 phút
const VIRTUAL_NIC = /vethernet|wsl|hyper-v|virtualbox|vmware|docker|loopback|vpn|tap|tun|zerotier|tailscale|hamachi/i;
const AAD = Buffer.from('pixel-garden-lan-v1');
const cleanName = (s) => String(s || '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 24) || 'Người chơi';
const cleanText = (s) => String(s || '').replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '').trim().slice(0, 300);
const randomId = (n = 12) => crypto.randomBytes(n).toString('base64url');

function privateIP(ip) {
  if (net.isIP(ip) !== 4) return false;
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

// IPv4 nội bộ của máy, xếp card mạng thật (Wi-Fi/Ethernet) lên trước, card ảo và 127.x xuống cuối.
function addresses() {
  const rank = (name, ip) => (ip.startsWith('127.') ? 9 : 0) + (VIRTUAL_NIC.test(name) ? 4 : 0)
    + (ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : 2);
  const all = Object.entries(os.networkInterfaces()).flatMap(([name, list]) => (list || [])
    .filter((x) => x && (x.family === 'IPv4' || x.family === 4) && privateIP(x.address)).map((x) => ({ ip: x.address, r: rank(name, x.address) })));
  all.sort((a, b) => a.r - b.r);
  return [...new Set(all.map((x) => x.ip))];
}

const PEER_ID = /^[A-Za-z0-9_-]{8,32}$/;

function checkKey(text) {
  const key = Buffer.from(text, 'base64url');
  if (key.length !== 32 || key.toString('base64url') !== text) throw new Error('Khoá lời mời không hợp lệ.');
}

// Địa chỉ trạm trung chuyển trong mã mời chỉ là tên máy; localhost dùng ws:// để thử trên máy, còn lại luôn wss://.
const relayHostOf = (url) => String(url).replace(/^wss?:\/\//, '').replace(/\/+$/, '');
const relayUrlFromHost = (host) => `${/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? 'ws' : 'wss'}://${host}`;
function validRelayUrl(url) {
  return typeof url === 'string' && /^(wss:\/\/[a-z0-9.-]{1,253}(:\d{1,5})?|ws:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?)\/?$/i.test(url.trim());
}

function parseInvite(code) {
  const parts = String(code || '').replace(/\s+/g, '').split('|');
  if (parts[0] === 'PG2') {
    if (parts.length !== 5 || !/^[a-z0-9.-]{1,253}(:\d{1,5})?$/i.test(parts[1]) || !/^[A-Za-z0-9_-]{16,40}$/.test(parts[2])
      || !PEER_ID.test(parts[3])) throw new Error('Mã mời Internet không hợp lệ.');
    checkKey(parts[4]);
    return { mode: 'online', relayHost: parts[1], relay: relayUrlFromHost(parts[1]), room: parts[2], id: parts[3], key: parts[4] };
  }
  const ips = parts.length === 5 ? parts[1].split(',').filter(Boolean) : [];
  if (parts.length !== 5 || parts[0] !== 'PG1' || !ips.length || ips.length > 4 || !ips.every(privateIP) || !/^\d{1,5}$/.test(parts[2])
    || Number(parts[2]) < 1 || Number(parts[2]) > 65535 || !PEER_ID.test(parts[3])) throw new Error('Mã mời không hợp lệ (cần bắt đầu bằng PG1| hoặc PG2|).');
  checkKey(parts[4]);
  return { mode: 'lan', ip: ips[0], ips, port: Number(parts[2]), id: parts[3], key: parts[4] };
}

function seal(key, data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(AAD);
  const bytes = Buffer.from(JSON.stringify({ v: 1, at: Date.now(), ...data }), 'utf8');
  const payload = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return { iv: iv.toString('base64url'), tag: cipher.getAuthTag().toString('base64url'), data: payload.toString('base64url') };
}

function open(key, envelope, max = MAX_BODY) {
  if (!envelope || typeof envelope !== 'object') throw new Error('Dữ liệu LAN không hợp lệ.');
  const iv = Buffer.from(envelope.iv || '', 'base64url');
  const tag = Buffer.from(envelope.tag || '', 'base64url');
  const data = Buffer.from(envelope.data || '', 'base64url');
  if (iv.length !== 12 || tag.length !== 16 || data.length > max
    || iv.toString('base64url') !== envelope.iv || tag.toString('base64url') !== envelope.tag
    || data.toString('base64url') !== envelope.data) throw new Error('Dữ liệu LAN không hợp lệ.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(AAD);
  decipher.setAuthTag(tag);
  const msg = JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8'));
  if (msg.v !== 1 || !Number.isFinite(msg.at) || Math.abs(Date.now() - msg.at) > CLOCK_SKEW) throw new Error('Tin nhắn LAN đã hết hạn.');
  return msg;
}

// Danh sách trường cho phép trên mạng. Không sao chép trực tiếp G.view(state).
function publicGarden(view) {
  return {
    slots: (view.slots || []).slice(0, 12).map((s) => ({ pot: s.pot, decor: (s.decor || []).slice(0, 4), species: s.species || null, stage: s.stage,
      water: Math.round(Number(s.water) || 0), thirsty: !!s.thirsty })),
    pet: view.pet ? view.pet.id : null,
    house: view.house ? { level: view.house.level, decor: view.house.decor } : null,
    scene: { object: view.scene && view.scene.object || null, background: view.scene && view.scene.background || null },
  };
}

function safeGarden(value) {
  if (!value || !Array.isArray(value.slots)) return null;
  const id = (s) => typeof s === 'string' && /^[a-z0-9_]{1,40}$/.test(s) ? s : null;
  const stages = new Set(['empty', 'seed', 'sprout', 'young', 'bud', 'bloom', 'faded', 'dead']);
  return {
    slots: value.slots.slice(0, 12).map((s) => ({
      pot: id(s && s.pot) || 'nhua',
      decor: Array.from({ length: 4 }, (_, i) => id(s && Array.isArray(s.decor) && s.decor[i])),
      species: id(s && s.species),
      stage: stages.has(s && s.stage) ? s.stage : 'empty',
      water: Number.isFinite(s && s.water) ? Math.max(0, Math.min(100, Math.round(s.water))) : 100,
      thirsty: !!(s && s.thirsty === true),
    })),
    pet: id(value.pet),
    scene: { object: id(value.scene && value.scene.object), background: id(value.scene && value.scene.background) },
    house: value.house && Number.isInteger(value.house.level) && value.house.level >= 1 && value.house.level <= 4
      ? { level: value.house.level, decor: Object.fromEntries(['roof', 'window', 'side', 'front'].map((k) => [k, id(value.house.decor && value.house.decor[k])])) }
      : null,
  };
}

// Đổi lỗi kỹ thuật thành lời nhắn người chơi tự xử lý được.
function lanErrorText(e, client) {
  if (e.code === 'HOST_OFFLINE') return 'Chủ phòng hiện không trực tuyến (chưa mở game hoặc đã đóng phòng). Thử lại khi chủ phòng mở phòng Internet.';
  if (e.code === 'RELAY_DENIED') return e.message || 'Máy trung chuyển từ chối kết nối.';
  if (e.code === 'RELAY_DOWN') return `${e.message} Kiểm tra máy có vào được Internet không (mạng công ty có thể chặn).`;
  const online = client && client.mode === 'online';
  const where = online ? 'chủ phòng qua Internet' : client ? `${client.ip}:${client.port}` : 'máy chủ phòng';
  if (online && (e.code === 'ETIMEDOUT' || /quá thời gian/.test(e.message))) return 'Chủ phòng không phản hồi. Thử lại sau ít giây.';
  if (e.status === 403) return 'Chủ phòng từ chối: mã mời đã hết hạn (15 phút), đã bị thu hồi, hoặc đồng hồ hai máy lệch nhau quá 10 phút. Xin mã mời mới.';
  if (e.status === 429) return 'Gửi yêu cầu quá nhanh, thử lại sau ít giây.';
  if (e.code === 'ECONNREFUSED') return `Không có phòng nào mở tại ${where}. Kiểm tra chủ phòng vẫn đang mở phòng LAN.`;
  if (e.code === 'EHOSTUNREACH' || e.code === 'ENETUNREACH') return `Không tới được ${where}: hai máy không cùng mạng LAN.`;
  if (e.code === 'ETIMEDOUT' || /quá thời gian/.test(e.message)) return `Không tới được ${where}. Hai máy phải cùng mạng LAN, và máy chủ phòng cần cho phép Vườn Pixel trong Tường lửa Windows (mạng Private).`;
  if (/Unsupported state|authenticate/i.test(e.message)) return 'Khoá mã mời không khớp. Hãy dán lại đầy đủ mã mời.';
  return e.message;
}

class LanRoom {
  constructor({ config, saveConfig, getGarden, handleVisit, applyReward, changed, relayUrl = '', createLink }) {
    this.relayUrl = validRelayUrl(relayUrl) ? relayUrl.trim().replace(/\/+$/, '') : '';
    this.createLink = createLink || ((o) => new RelayLink(o));
    this.link = null;
    this.mode = null;
    this.config = { alias: 'Người chơi', invites: {}, joined: null, friends: [], known: {}, ...config };
    this.saveConfig = saveConfig;
    this.getGarden = getGarden;
    this.handleVisit = handleVisit;
    this.applyReward = applyReward;
    this.changed = changed;
    this.role = null;
    this.away = false;
    this.server = null;
    this.hostIP = null;
    this.client = null;
    this.roster = [];
    this.messages = [];
    this.peers = new Map();
    this.pending = new Map();
    this.completed = new Map();
    this.timer = null;
    this.polling = false;
    this.error = '';
  }

  status() {
    const roster = this.role === 'host' ? this.hostRoster() : this.roster;
    const known = Object.entries(this.config.known || {}).map(([id, name]) => ({ id, name, status: 'Mất kết nối' }));
    const players = [...roster, ...known.filter((x) => !roster.some((p) => p.id === x.id))];
    return { role: this.role, selfId: this.role === 'host' ? 'host' : this.client && this.client.id,
      away: this.away, alias: this.config.alias, addresses: addresses(),
      hostIP: this.mode === 'online' ? 'Internet' : this.hostIP, mode: this.mode, online: !!this.relayUrl,
      joined: !!this.config.joined, players,
      friends: this.config.friends, messages: this.messages.slice(-50), error: this.error };
  }

  emit() { this.changed(this.status()); }

  hostRoster() {
    const now = Date.now();
    const host = { id: 'host', name: cleanName(this.config.alias), status: this.away ? 'Vắng mặt' : 'Đang chơi', garden: this.getGarden() };
    const live = [...this.peers.values()].filter((p) => p.name).map((p) => ({
      id: p.id, name: p.name, status: now - p.lastSeen < 8000 ? (p.away ? 'Vắng mặt' : 'Đang chơi') : 'Mất kết nối',
      garden: now - p.lastSeen < 8000 ? p.garden : null,
    }));
    const offline = Object.entries(this.config.invites).filter(([id, x]) => x.name && !this.peers.has(id))
      .map(([id, x]) => ({ id, name: cleanName(x.name), status: 'Mất kết nối', garden: null }));
    return [host, ...live, ...offline];
  }

  async host(ip, port = PORT) {
    if (this.role) throw new Error('Hãy rời phòng hiện tại trước.');
    if (!addresses().includes(ip)) throw new Error('Chọn địa chỉ IPv4 trên máy này.');
    const server = http.createServer({ maxHeaderSize: 4096, requestTimeout: 20000, headersTimeout: 10000 }, (req, res) => {
      this.onRequest(req, res).catch(() => { if (!res.destroyed) { res.writeHead(400); res.end(); } });
    });
    server.maxHeadersCount = 12;
    server.on('clientError', (_e, socket) => socket.destroy());
    // Nghe trên mọi card mạng: bạn vào được dù mã mời có nhiều địa chỉ; onRequest vẫn chỉ nhận IP nội bộ.
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '0.0.0.0', () => { server.off('error', reject); resolve(); }); })
      .catch((e) => { throw new Error(e.code === 'EADDRINUSE' ? `Cổng ${port} đang bị chương trình khác dùng. Hãy đóng bản Vườn Pixel khác rồi thử lại.` : e.message); });
    this.server = server; this.role = 'host'; this.mode = 'lan'; this.hostIP = ip; this.error = '';
    this.timer = setInterval(() => this.emit(), 2500);
    this.emit();
    return { ok: true, msg: `Đã mở phòng LAN tại ${ip}:${server.address().port}. Nếu Windows hỏi Tường lửa, hãy bấm Cho phép (Allow) để bạn bè vào được.` };
  }

  // Phòng Internet: chủ phòng giữ 1 kết nối tới trạm trung chuyển; mã phòng + khoá chủ phòng được lưu
  // (đã mã hoá trong lan.sec) để mở lại đúng phòng cũ, khách đã ghép cặp không cần mã mời mới.
  async hostOnline() {
    if (this.role) throw new Error('Hãy rời phòng hiện tại trước.');
    if (!this.relayUrl) throw new Error('Bản này chưa cấu hình máy trung chuyển Internet (relayUrl trong package.json).');
    const saved = this.config.online;
    const o = saved && saved.relay === this.relayUrl ? saved : { relay: this.relayUrl, room: randomId(18), token: randomId(24) };
    this.config.online = o;
    await this.saveConfig(this.config);
    const link = this.createLink({ url: o.relay, room: o.room, role: 'host', token: o.token,
      onRequest: (from, body) => this.handleSealed(from, body),
      onState: (up) => { this.error = up ? '' : 'Mất kết nối tới máy trung chuyển, đang thử lại…'; this.emit(); } });
    try { await link.open(); } catch (e) { link.close(); throw new Error(lanErrorText(e)); }
    this.link = link; this.role = 'host'; this.mode = 'online'; this.hostIP = null; this.error = '';
    this.timer = setInterval(() => this.emit(), 2500);
    this.emit();
    return { ok: true, msg: 'Đã mở phòng Internet. Bấm "Tạo mã mời bạn" rồi gửi riêng mã cho người muốn mời.' };
  }

  async invite() {
    if (this.role !== 'host') throw new Error('Cần mở phòng trước.');
    if (Object.keys(this.config.invites).length >= 20) throw new Error('Phòng đã đủ 20 lời mời. Thu hồi lời mời cũ trước.');
    const id = randomId(9);
    const key = randomId(32);
    this.config.invites[id] = { key, expires: Date.now() + 15 * 60000, name: '' };
    await this.saveConfig(this.config);
    const msg = 'Mã mời có hiệu lực 15 phút để ghép cặp lần đầu.';
    if (this.mode === 'online') {
      const o = this.config.online;
      return { ok: true, code: `PG2|${relayHostOf(o.relay)}|${o.room}|${id}|${key}`, msg };
    }
    const ips = [this.hostIP, ...addresses().filter((x) => x !== this.hostIP && !x.startsWith('127.'))].slice(0, 4);
    return { ok: true, code: `PG1|${ips.join(',')}|${this.server.address().port}|${id}|${key}`, msg };
  }

  async join(code) {
    if (this.role) throw new Error('Hãy rời phòng hiện tại trước.');
    const entry = parseInvite(code);
    const old = this.config.joined;
    this.role = 'guest';
    this.mode = entry.mode;
    try {
      if (entry.mode === 'online') await this.joinOnline(entry); else await this.joinLan(entry);
    } catch (e) {
      if (this.link) this.link.close();
      this.link = null; this.config.joined = old; this.client = null; this.role = null; this.mode = null;
      throw e;
    }
    this.config.joined = this.client;
    await this.saveConfig(this.config);
    this.timer = setInterval(() => this.poll().catch((e) => {
      this.roster = this.roster.map((p) => ({ ...p, status: 'Mất kết nối', garden: null }));
      this.error = e.message; this.emit();
    }), 2500);
    this.emit();
    return { ok: true, msg: this.mode === 'online' ? 'Đã vào phòng Internet.' : 'Đã vào phòng LAN.' };
  }

  async joinLan(entry) {
    let lastError = null;
    for (const ip of entry.ips || [entry.ip]) {
      this.client = { ...entry, ip };
      try { await this.poll(4000); lastError = null; break; } catch (e) { lastError = e; }
    }
    if (lastError) throw lastError;
    entry.ip = this.client.ip;
    entry.ips = [this.client.ip, ...(entry.ips || []).filter((x) => x !== this.client.ip)];
    this.client = entry;
  }

  async joinOnline(entry) {
    this.client = entry;
    this.link = this.createLink({ url: entry.relay, room: entry.room, role: 'guest', peer: entry.id });
    try { await this.link.open(); } catch (e) { throw new Error(lanErrorText(e, entry)); }
    await this.poll(8000);
  }

  async reconnect() {
    if (!this.config.joined) throw new Error('Chưa có phòng đã ghép cặp.');
    const x = this.config.joined;
    return this.join(x.mode === 'online'
      ? `PG2|${x.relayHost}|${x.room}|${x.id}|${x.key}`
      : `PG1|${(x.ips || [x.ip]).join(',')}|${x.port}|${x.id}|${x.key}`);
  }

  async leave() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.resolve({ ok: false, msg: 'Phòng đã đóng.' }); }
    this.pending.clear(); this.peers.clear(); this.roster = []; this.messages = []; this.error = '';
    if (this.server) await new Promise((resolve) => this.server.close(resolve));
    if (this.link) this.link.close();
    this.server = null; this.link = null; this.client = null; this.role = null; this.mode = null; this.away = false;
    this.emit();
    return { ok: true, msg: 'Đã rời phòng.' };
  }

  async setAlias(name) {
    this.config.alias = cleanName(name);
    await this.saveConfig(this.config);
    this.emit();
    return { ok: true, msg: 'Đã đổi biệt danh.' };
  }

  setAway(value) { this.away = !!value; this.emit(); return { ok: true, msg: this.away ? 'Bạn đang Vắng mặt.' : 'Bạn đang chơi.' }; }

  async friend(id) {
    if (!/^(host|[A-Za-z0-9_-]{8,32})$/.test(String(id))) throw new Error('Người chơi không hợp lệ.');
    const list = new Set(this.config.friends);
    if (list.has(id)) list.delete(id); else list.add(id);
    this.config.friends = [...list];
    await this.saveConfig(this.config);
    this.emit();
    return { ok: true, msg: list.has(id) ? 'Đã thêm bạn.' : 'Đã bỏ khỏi danh sách bạn.' };
  }

  async revoke(id) {
    if (this.role !== 'host' || !this.config.invites[id]) throw new Error('Không tìm thấy lời mời cần thu hồi.');
    delete this.config.invites[id];
    this.peers.delete(id);
    this.config.friends = this.config.friends.filter((x) => x !== id);
    for (const [taskId, task] of this.pending) if (task.owner === id) {
      clearTimeout(task.timer); this.pending.delete(taskId); task.resolve({ ok: false, msg: 'Bạn đã bị ngắt khỏi phòng.' });
    }
    await this.saveConfig(this.config);
    this.emit();
    return { ok: true, msg: 'Đã thu hồi lời mời của người chơi này.' };
  }

  async chat(text) {
    text = cleanText(text);
    if (!text) throw new Error('Nhập tin nhắn trước khi gửi.');
    if (!this.role) throw new Error('Hãy vào phòng trước.');
    if (this.role === 'host') this.addChat('host', this.config.alias, text);
    else { const r = await this.rpc({ op: 'chat', text }); if (!r.ok) throw new Error(r.msg); await this.poll(); }
    this.emit();
    return { ok: true, msg: 'Đã gửi.' };
  }

  addChat(id, name, text) {
    this.messages.push({ id: randomId(8), byId: id, by: cleanName(name), text: cleanText(text) });
    this.messages = this.messages.slice(-50);
    this.emit();
  }

  async visit(target, kind, slot) {
    if (!this.role) throw new Error('Hãy vào phòng trước.');
    if (!['water', 'steal'].includes(kind) || !Number.isInteger(slot) || slot < 0 || slot > 11) throw new Error('Hành động không hợp lệ.');
    if (target === (this.role === 'host' ? 'host' : this.client.id)) throw new Error('Không thể thăm vườn của mình.');
    const r = this.role === 'host'
      ? await this.routeVisit('host', this.config.alias, target, kind, slot)
      : await this.rpc({ op: 'visit', target, kind, slot }, 20000);
    if (r.ok) await this.applyReward(kind === 'water' ? { money: 0, exp: 2 } : r.loot);
    this.emit();
    return r;
  }

  async routeVisit(byId, by, target, kind, slot) {
    if (!['water', 'steal'].includes(kind) || !Number.isInteger(slot) || slot < 0 || slot > 11) return { ok: false, msg: 'Hành động không hợp lệ.' };
    if (target === byId) return { ok: false, msg: 'Không thể thăm vườn của mình.' };
    if (target === 'host') return this.handleVisit({ kind, slot, by, away: this.away });
    const peer = this.peers.get(target);
    if (!peer || Date.now() - peer.lastSeen >= 8000) return { ok: false, msg: 'Chủ vườn không kết nối.' };
    if (kind === 'steal' && !peer.away) return { ok: false, msg: 'Chỉ hái hoa khi chủ vườn Vắng mặt.' };
    const id = randomId(12);
    return new Promise((resolve) => {
      const timer = setTimeout(() => { this.pending.delete(id); resolve({ ok: false, msg: 'Chủ vườn chưa phản hồi.' }); }, 15000);
      this.pending.set(id, { id, owner: target, by: cleanName(by), kind, slot, resolve, timer });
    });
  }

  async poll(timeout) {
    if (this.role !== 'guest' || this.polling) return;
    this.polling = true;
    try {
      const r = await this.rpc({ op: 'poll', alias: this.config.alias, away: this.away, garden: this.getGarden() }, timeout);
      if (!r.ok) throw new Error(r.msg || 'Không kết nối được.');
      const validId = (id) => typeof id === 'string' && /^(host|[A-Za-z0-9_-]{8,32})$/.test(id)
        && !['__proto__', 'constructor', 'prototype'].includes(id);
      this.roster = (Array.isArray(r.players) ? r.players : []).slice(0, 21).filter((p) => p && validId(p.id))
        .map((p) => ({ id: p.id, name: cleanName(p.name), status: ['Đang chơi', 'Vắng mặt', 'Mất kết nối'].includes(p.status) ? p.status : 'Mất kết nối', garden: safeGarden(p.garden) }));
      this.messages = (Array.isArray(r.messages) ? r.messages : []).slice(-50).filter((m) => m && validId(m.byId))
        .map((m) => ({ id: String(m.id || '').slice(0, 32), byId: m.byId, by: cleanName(m.by), text: cleanText(m.text) }));
      this.error = '';
      let knownChanged = false;
      for (const p of this.roster) if (p.id !== this.client.id && this.config.known[p.id] !== p.name) {
        this.config.known[p.id] = cleanName(p.name); knownChanged = true;
      }
      if (knownChanged) await this.saveConfig(this.config);
      for (const task of (Array.isArray(r.tasks) ? r.tasks : []).slice(0, 10)) {
        if (!task || !validId(task.id) || !['water', 'steal'].includes(task.kind)
          || !Number.isInteger(task.slot) || task.slot < 0 || task.slot > 11) continue;
        let result = this.completed.get(task.id);
        if (!result) {
          result = await this.handleVisit({ kind: task.kind, slot: task.slot, by: task.by, away: this.away });
          this.completed.set(task.id, result);
          if (this.completed.size > 100) this.completed.delete(this.completed.keys().next().value);
        }
        await this.rpc({ op: 'complete', id: task.id, result });
      }
      this.emit();
    } finally { this.polling = false; }
  }

  async rpc(payload, timeout = 10000) {
    try { return await this.rpcRaw(payload, timeout); } catch (e) { throw new Error(lanErrorText(e, this.client)); }
  }

  async rpcRaw(payload, timeout) {
    if (!this.client) throw new Error('Chưa có phòng LAN.');
    const key = Buffer.from(this.client.key, 'base64url');
    const rid = randomId(12);
    const body = Buffer.from(JSON.stringify(seal(key, { rid, ...payload })));
    const response = this.mode === 'online' ? await this.relayRequest(body, timeout) : await this.httpRequest(body, timeout);
    const msg = open(key, response, MAX_REPLY);
    if (msg.rid !== rid) throw new Error('Phản hồi LAN không khớp.');
    return msg.result;
  }

  async relayRequest(body, timeout) {
    const r = await this.link.request(body.toString('utf8'), timeout);
    if (r.status !== 200) throw Object.assign(new Error('Máy chủ từ chối kết nối.'), { status: r.status });
    if (typeof r.body !== 'string' || r.body.length > MAX_REPLY * 2) throw new Error('Phản hồi quá dài.');
    return JSON.parse(r.body);
  }

  httpRequest(body, timeout) {
    return new Promise((resolve, reject) => {
      const req = http.request({ host: this.client.ip, port: this.client.port, path: '/rpc', method: 'POST', timeout,
        headers: { 'content-type': 'application/json', 'content-length': body.length, 'x-pg-peer': this.client.id } }, (res) => {
        const parts = []; let size = 0;
        res.on('data', (chunk) => { size += chunk.length; if (size > MAX_REPLY) res.destroy(new Error('Phản hồi quá dài.')); else parts.push(chunk); });
        res.on('end', () => { try { if (res.statusCode !== 200) throw Object.assign(new Error('Máy chủ từ chối kết nối.'), { status: res.statusCode }); resolve(JSON.parse(Buffer.concat(parts).toString('utf8'))); } catch (e) { reject(e); } });
        res.on('error', reject);
      });
      req.on('timeout', () => req.destroy(new Error('Kết nối LAN quá thời gian.')));
      req.on('error', reject); req.end(body);
    });
  }

  async onRequest(req, res) {
    const reject = (code) => { res.writeHead(code); res.end(); };
    if (!privateIP(req.socket.remoteAddress)) return reject(403);
    if (req.method !== 'POST' || req.url !== '/rpc' || req.headers.origin || req.headers['content-type'] !== 'application/json') return reject(404);
    const id = req.headers['x-pg-peer'];
    const sizeHeader = Number(req.headers['content-length']);
    if (!Number.isInteger(sizeHeader) || sizeHeader < 1 || sizeHeader > MAX_BODY) return reject(413);
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > MAX_BODY) return reject(413); chunks.push(chunk); }
    if (size !== sizeHeader) return reject(400);
    const r = await this.handleSealed(id, Buffer.concat(chunks).toString('utf8'));
    if (res.destroyed) return;
    if (r.status !== 200) return reject(r.status);
    const bytes = Buffer.from(r.body);
    res.writeHead(200, { 'content-type': 'application/json', 'content-length': bytes.length, 'cache-control': 'no-store' });
    res.end(bytes);
  }

  // Xử lý 1 yêu cầu đã mã hoá của khách (dùng chung cho LAN và Internet). Trả { status, body }.
  async handleSealed(id, raw) {
    const entry = typeof id === 'string' && PEER_ID.test(id) && Object.hasOwn(this.config.invites, id) && this.config.invites[id];
    if (!entry || (!entry.name && entry.expires < Date.now())) return { status: 403 };
    if (typeof raw !== 'string' || raw.length > MAX_BODY) return { status: 413 };
    const key = Buffer.from(entry.key, 'base64url');
    let envelope; let msg;
    try { envelope = JSON.parse(raw); msg = open(key, envelope); } catch (_) { return { status: 403 }; }
    if (!/^[A-Za-z0-9_-]{8,32}$/.test(msg.rid || '')) return { status: 400 };
    let peer = this.peers.get(id);
    if (!peer) { peer = { id, seen: new Map(), lastSeen: 0, away: false, garden: null, name: '' }; this.peers.set(id, peer); }
    const nonce = envelope.iv;
    for (const [n, at] of peer.seen) if (Date.now() - at > CLOCK_SKEW) peer.seen.delete(n);
    if (peer.seen.has(nonce)) return { status: 403 };
    peer.seen.set(nonce, Date.now());
    if (peer.seen.size > 4096) peer.seen.delete(peer.seen.keys().next().value);
    peer.requests = (peer.requests || []).filter((at) => Date.now() - at < 60000);
    if (peer.requests.length >= 120) return { status: 429 };
    peer.requests.push(Date.now());
    peer.lastSeen = Date.now();
    let result;
    try { result = await this.dispatch(peer, entry, msg); }
    catch (_) { result = { ok: false, msg: 'Yêu cầu LAN không hợp lệ.' }; }
    return { status: 200, body: JSON.stringify(seal(key, { rid: msg.rid, result })) };
  }

  async dispatch(peer, entry, msg) {
    if (msg.op === 'poll') {
      peer.name = cleanName(msg.alias);
      peer.away = msg.away === true;
      peer.garden = safeGarden(msg.garden);
      if (entry.name !== peer.name) {
        entry.name = peer.name;
        await this.saveConfig(this.config);
      }
      const tasks = [...this.pending.values()].filter((x) => x.owner === peer.id).map(({ id, kind, slot, by }) => ({ id, kind, slot, by }));
      this.emit();
      return { ok: true, players: this.hostRoster().filter((p) => p.status !== 'Mất kết nối' || p.id === peer.id),
        messages: this.messages.slice(-50), tasks };
    }
    if (!peer.name) return { ok: false, msg: 'Hãy vào phòng trước.' };
    if (msg.op === 'chat') {
      const text = cleanText(msg.text);
      if (!text) return { ok: false, msg: 'Tin nhắn trống.' };
      peer.chats = (peer.chats || []).filter((at) => Date.now() - at < 60000);
      if (peer.chats.length >= 20 || (peer.lastChat && Date.now() - peer.lastChat < 500)) return { ok: false, msg: 'Gửi quá nhanh.' };
      peer.chats.push(Date.now());
      peer.lastChat = Date.now(); this.addChat(peer.id, peer.name, text);
      return { ok: true };
    }
    if (msg.op === 'visit') {
      peer.visits = (peer.visits || []).filter((at) => Date.now() - at < 60000);
      if (peer.visits.length >= 10) return { ok: false, msg: 'Thăm vườn quá nhiều lần.' };
      peer.visits.push(Date.now());
      return this.routeVisit(peer.id, peer.name, msg.target, msg.kind, msg.slot);
    }
    if (msg.op === 'complete') {
      const task = this.pending.get(msg.id);
      if (!task || task.owner !== peer.id) return { ok: false, msg: 'Lượt thăm không hợp lệ.' };
      const r = msg.result;
      const safe = { ok: r && r.ok === true, msg: cleanText(r && r.msg) };
      if (safe.ok && task.kind === 'steal') {
        const money = r && r.loot && r.loot.money;
        const exp = r && r.loot && r.loot.exp;
        if (!Number.isInteger(money) || money < 0 || money > 10000 || !Number.isInteger(exp) || exp < 0 || exp > 10000) return { ok: false, msg: 'Phần thưởng không hợp lệ.' };
        safe.loot = { money, exp };
      }
      clearTimeout(task.timer); this.pending.delete(msg.id); task.resolve(safe);
      return { ok: true };
    }
    return { ok: false, msg: 'Hành động LAN không hợp lệ.' };
  }
}

module.exports = { LanRoom, privateIP, addresses, parseInvite, publicGarden, safeGarden, seal, open, validRelayUrl };

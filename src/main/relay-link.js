'use strict';
// Kết nối WebSocket tới máy trung chuyển Internet (Cloudflare Worker trong thư mục relay/).
// Máy trung chuyển chỉ chuyển tiếp dữ liệu ĐÃ MÃ HOÁ giữa chủ phòng và khách, không đọc được nội dung.
//
// Khung tin (JSON):
//   khách → trạm: { to: 'host', n, body }            trạm → chủ: { from: <mã khách>, n, body }
//   chủ → trạm:   { to: <mã khách>, n, status, body } trạm → khách: { from: 'host', n, status, body }
//   trạm → khách: { sys: 'host-offline', n }  khi chủ phòng không trực tuyến

const MAX_FRAME = 768 * 1024;
const relayError = (code, message) => Object.assign(new Error(message), { code });

function relayUrlOf(base, room, query) {
  const u = new URL(`${String(base).replace(/\/+$/, '')}/room/${room}`);
  for (const [k, v] of Object.entries(query)) if (v) u.searchParams.set(k, v);
  return u.toString();
}

class RelayLink {
  constructor({ url, room, role, peer, token, onRequest, onState }) {
    this.url = url; this.room = room; this.role = role; this.peer = peer; this.token = token;
    this.onRequest = onRequest; this.onState = onState || (() => {});
    this.ws = null; this.n = 0; this.waiting = new Map(); this.closed = false;
    this.retry = 0; this.retryTimer = null; this.opening = null;
  }

  get connected() { return !!this.ws && this.ws.readyState === 1; }

  open(timeout = 8000) {
    if (this.connected) return Promise.resolve();
    if (this.opening) return this.opening;
    if (typeof WebSocket !== 'function') return Promise.reject(relayError('RELAY_DOWN', 'Máy này không hỗ trợ WebSocket.'));
    this.closed = false;
    this.opening = new Promise((resolve, reject) => {
      const ws = new WebSocket(relayUrlOf(this.url, this.room, { role: this.role, peer: this.peer, token: this.token }));
      let settled = false;
      const done = (err) => {
        if (settled) return; settled = true; clearTimeout(timer); this.opening = null;
        if (err) { try { ws.close(); } catch (_) { /* đã đóng */ } reject(err); } else resolve();
      };
      const timer = setTimeout(() => done(relayError('RELAY_DOWN', 'Máy trung chuyển không phản hồi.')), timeout);
      // Chỉ coi là đã vào khi trạm gửi {sys:'ready'} (trạm có thể nhận rồi đóng ngay nếu từ chối).
      this.onReady = () => { this.ws = ws; this.retry = 0; this.onState(true); done(); };
      this.onDenied = (reason) => { this.closed = true; done(relayError('RELAY_DENIED', reason)); };
      ws.addEventListener('error', () => done(relayError('RELAY_DOWN', 'Không kết nối được máy trung chuyển.')));
      ws.addEventListener('message', (ev) => this.onFrame(ev.data));
      ws.addEventListener('close', (ev) => {
        done(relayError(ev.code === 4403 ? 'RELAY_DENIED' : 'RELAY_DOWN', ev.reason || 'Máy trung chuyển đã đóng kết nối.'));
        this.onReady = null;
        if (this.ws !== ws) return;
        this.ws = null;
        for (const w of this.waiting.values()) { clearTimeout(w.timer); w.reject(relayError('RELAY_DOWN', 'Mất kết nối tới máy trung chuyển.')); }
        this.waiting.clear();
        if (!this.closed) { this.onState(false); this.scheduleReconnect(); }
      });
    });
    return this.opening;
  }

  // Chủ phòng phải luôn có mặt ở trạm → tự kết nối lại (1 s, 2 s, 4 s … tối đa 30 s).
  scheduleReconnect() {
    if (this.role !== 'host' || this.closed || this.retryTimer) return;
    const wait = Math.min(30000, 1000 * 2 ** this.retry++);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.open().catch(() => this.scheduleReconnect());
    }, wait);
  }

  onFrame(data) {
    if (typeof data !== 'string' || data.length > MAX_FRAME) return;
    let msg;
    try { msg = JSON.parse(data); } catch (_) { return; }
    if (!msg || typeof msg !== 'object') return;
    if (msg.sys === 'denied') { if (this.onDenied) this.onDenied(String(msg.reason || 'Máy trung chuyển từ chối.').slice(0, 200)); return; }
    if (msg.sys === 'ready') { if (this.onReady) { const f = this.onReady; this.onReady = null; f(); } return; }
    if (this.role === 'guest') {
      const w = this.waiting.get(msg.n);
      if (!w) return;
      this.waiting.delete(msg.n); clearTimeout(w.timer);
      if (msg.sys === 'host-offline') w.reject(relayError('HOST_OFFLINE', 'Chủ phòng không trực tuyến.'));
      else if (msg.from === 'host') w.resolve({ status: Number(msg.status) || 0, body: msg.body });
      else w.reject(relayError('RELAY_DOWN', 'Phản hồi lạ từ máy trung chuyển.'));
      return;
    }
    if (typeof msg.from !== 'string' || !Number.isInteger(msg.n) || typeof msg.body !== 'string') return;
    Promise.resolve()
      .then(() => this.onRequest(msg.from, msg.body))
      .catch(() => ({ status: 400 }))
      .then((r) => this.send({ to: msg.from, n: msg.n, status: r.status, body: r.body || '' }));
  }

  send(frame) {
    const text = JSON.stringify(frame);
    if (!this.connected || text.length > MAX_FRAME) return false;
    this.ws.send(text);
    return true;
  }

  // Khách gửi 1 yêu cầu (đã mã hoá) cho chủ phòng và chờ đúng phản hồi của nó.
  async request(body, timeout = 10000) {
    await this.open(Math.min(timeout, 8000));
    const n = ++this.n;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.waiting.delete(n); reject(relayError('ETIMEDOUT', 'Kết nối quá thời gian.')); }, timeout);
      this.waiting.set(n, { resolve, reject, timer });
      if (!this.send({ to: 'host', n, body })) {
        clearTimeout(timer); this.waiting.delete(n);
        reject(relayError('RELAY_DOWN', 'Mất kết nối tới máy trung chuyển.'));
      }
    });
  }

  close() {
    this.closed = true;
    clearTimeout(this.retryTimer); this.retryTimer = null;
    for (const w of this.waiting.values()) { clearTimeout(w.timer); w.reject(relayError('RELAY_DOWN', 'Đã rời phòng.')); }
    this.waiting.clear();
    if (this.ws) { try { this.ws.close(1000, 'leave'); } catch (_) { /* đã đóng */ } }
    this.ws = null;
  }
}

module.exports = { RelayLink, relayUrlOf };

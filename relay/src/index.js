// Vườn Pixel – máy trung chuyển phòng Internet (Cloudflare Worker + Durable Object).
// Chỉ chuyển tiếp khung tin giữa chủ phòng và khách. Nội dung đã được game mã hoá đầu-cuối
// (AES-256-GCM, khoá nằm trong mã mời), trạm không có khoá nên không đọc/sửa được.
// Trạm không lưu tin nhắn; chỉ lưu dấu băm khoá chủ phòng, tự xoá phòng sau 30 ngày không dùng.
import { DurableObject } from 'cloudflare:workers';

const ROOM = /^[A-Za-z0-9_-]{16,40}$/;
const PEER = /^[A-Za-z0-9_-]{8,32}$/;
const TOKEN = /^[A-Za-z0-9_-]{24,64}$/;
const MAX_GUEST_FRAME = 128 * 1024;   // yêu cầu của khách (game giới hạn 48 KB)
const MAX_HOST_FRAME = 768 * 1024;    // phản hồi của chủ phòng (game giới hạn 512 KB)
const MAX_SOCKETS = 40;
const IDLE_MS = 30 * 24 * 3600 * 1000;

const text = (status, body) => new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

async function sha256(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') return text(200, 'Vuon Pixel relay OK');
    const m = url.pathname.match(/^\/room\/([^/]+)$/);
    if (!m || !ROOM.test(m[1])) return text(404, 'Not found');
    if (request.headers.get('upgrade') !== 'websocket') return text(426, 'WebSocket only');
    const role = url.searchParams.get('role');
    if (role === 'host' ? !TOKEN.test(url.searchParams.get('token') || '') : role !== 'guest' || !PEER.test(url.searchParams.get('peer') || '')) {
      return text(400, 'Bad request');
    }
    const stub = env.ROOMS.get(env.ROOMS.idFromName(m[1]));
    return stub.fetch(request);
  },
};

export class Room extends DurableObject {
  async fetch(request) {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    if (this.ctx.getWebSockets().length >= MAX_SOCKETS) return text(429, 'Room full');
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    let tag;
    if (role === 'host') {
      const hash = await sha256(url.searchParams.get('token'));
      const owner = await this.ctx.storage.get('host');
      if (owner && owner !== hash) {
        server.accept();
        server.send(JSON.stringify({ sys: 'denied', reason: 'Phòng này thuộc về chủ phòng khác.' }));
        server.close(4403, 'denied');
        return new Response(null, { status: 101, webSocket: client });
      }
      if (!owner) await this.ctx.storage.put('host', hash);
      for (const old of this.ctx.getWebSockets('host')) old.close(4000, 'Chủ phòng đã kết nối ở nơi khác.');
      tag = 'host';
    } else {
      const peer = url.searchParams.get('peer');
      for (const old of this.ctx.getWebSockets(`g:${peer}`)) old.close(4000, 'Đã kết nối lại.');
      tag = `g:${peer}`;
    }
    this.ctx.acceptWebSocket(server, [tag]);
    server.serializeAttachment({ tag });
    server.send(JSON.stringify({ sys: 'ready' }));
    await this.ctx.storage.setAlarm(Date.now() + IDLE_MS);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, data) {
    const { tag } = ws.deserializeAttachment() || {};
    if (typeof data !== 'string' || !tag) return;
    const isHost = tag === 'host';
    if (data.length > (isHost ? MAX_HOST_FRAME : MAX_GUEST_FRAME)) return ws.close(1009, 'Khung tin quá lớn.');
    let msg;
    try { msg = JSON.parse(data); } catch { return; }
    if (!msg || !Number.isInteger(msg.n) || typeof msg.body !== 'string') return;
    if (isHost) {
      if (typeof msg.to !== 'string' || !PEER.test(msg.to)) return;
      const out = JSON.stringify({ from: 'host', n: msg.n, status: Number(msg.status) || 0, body: msg.body });
      for (const g of this.ctx.getWebSockets(`g:${msg.to}`)) g.send(out);
      return;
    }
    const hosts = this.ctx.getWebSockets('host');
    if (!hosts.length) return ws.send(JSON.stringify({ sys: 'host-offline', n: msg.n }));
    // "from" do trạm gắn theo kết nối, khách không tự khai được.
    const out = JSON.stringify({ from: tag.slice(2), n: msg.n, body: msg.body });
    for (const h of hosts) h.send(out);
  }

  async webSocketClose(ws, code) {
    try { ws.close(code === 1005 ? 1000 : code, 'bye'); } catch { /* đã đóng */ }
  }

  async alarm() {
    if (this.ctx.getWebSockets().length) return this.ctx.storage.setAlarm(Date.now() + IDLE_MS);
    await this.ctx.storage.deleteAll();
  }
}

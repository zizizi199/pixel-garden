'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const G = require('../src/core/garden');
const { LanRoom, parseInvite, publicGarden, safeGarden, seal, open } = require('../src/main/lan');

function room(name) {
  const state = G.createState();
  const lan = new LanRoom({ config: { alias: name }, saveConfig: async () => {}, changed: () => {},
    getGarden: () => publicGarden(G.view(state)),
    handleVisit: ({ kind, slot, by, away }) => {
      if (kind === 'steal' && !away) return { ok: false, msg: 'Chủ vườn đang chơi.' };
      return kind === 'water' ? G.visitWater(state, slot, by) : G.visitSteal(state, slot, by);
    },
    applyReward: ({ money, exp }) => { state.money += money; G.gainExp(state, exp); },
  });
  return { lan, state };
}

test('dữ liệu vườn gửi qua LAN chỉ có trường hiển thị đã cho phép', () => {
  const state = G.createState();
  state.settings.ownerName = 'Tên riêng';
  state.settings.schedule.start = '07:35';
  state.log.push({ text: 'Nhật ký riêng' });
  const sent = publicGarden(G.view(state));
  const received = safeGarden({ ...sent, settings: state.settings, log: state.log, savePath: 'C:\\private' });
  assert.deepEqual(Object.keys(received).sort(), ['house', 'pet', 'scene', 'slots']);
  assert.deepEqual(Object.keys(received.scene).sort(), ['background', 'object']);
  const bytes = JSON.stringify(received);
  for (const secret of ['Tên riêng', '07:35', 'Nhật ký riêng', 'C:\\private']) assert.ok(!bytes.includes(secret));
});

test('mã mời chỉ nhận IP LAN; dữ liệu mã hoá không chấp nhận sửa đổi', () => {
  assert.throws(() => parseInvite(`PG1|8.8.8.8|47321|abcdefgh|${crypto.randomBytes(32).toString('base64url')}`));
  const key = crypto.randomBytes(32);
  const box = seal(key, { rid: 'abcdefgh1234', op: 'chat', text: 'xin chào' });
  assert.equal(open(key, box).text, 'xin chào');
  box.data = Buffer.from('đã sửa').toString('base64url');
  assert.throws(() => open(key, box));
});

test('phòng LAN: bạn bè, chat, thăm vườn và chỉ hái hoa khi chủ Vắng mặt', async () => {
  const host = room('Chủ phòng');
  const guest = room('Bạn vườn');
  const other = room('Khách kín');
  try {
    await host.lan.host('127.0.0.1', 0);
    const invite = await host.lan.invite();
    await guest.lan.join(invite.code);
    assert.equal(host.lan.status().players.find((p) => p.name === 'Bạn vườn').status, 'Đang chơi');
    assert.ok(!host.lan.status().friends.includes(guest.lan.client.id));
    assert.ok(!guest.lan.status().friends.includes('host'));
    assert.ok((await host.lan.friend(guest.lan.client.id)).ok);
    assert.ok(host.lan.status().friends.includes(guest.lan.client.id));
    const unauthorized = await new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port: host.lan.server.address().port, path: '/rpc', method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': 2, 'x-pg-peer': 'stranger123' } }, (res) => {
        res.resume(); res.on('end', () => resolve(res.statusCode));
      });
      req.on('error', reject); req.end('{}');
    });
    assert.equal(unauthorized, 403);
    const key = Buffer.from(guest.lan.client.key, 'base64url');
    const replayBody = Buffer.from(JSON.stringify(seal(key, { rid: 'abcdefgh1234', op: 'poll', alias: 'Bạn vườn', away: false, garden: guest.lan.getGarden() })));
    const sendReplay = () => new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port: host.lan.server.address().port, path: '/rpc', method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': replayBody.length, 'x-pg-peer': guest.lan.client.id } }, (res) => {
        res.resume(); res.on('end', () => resolve(res.statusCode));
      });
      req.on('error', reject); req.end(replayBody);
    });
    assert.equal(await sendReplay(), 200);
    assert.equal(await sendReplay(), 403, 'không nhận lại cùng một yêu cầu đã gửi');
    const secondInvite = await host.lan.invite();
    await other.lan.join(secondInvite.code);
    await guest.lan.poll();
    assert.ok(guest.lan.roster.some((p) => p.name === 'Khách kín'));
    const otherId = other.lan.client.id;
    await other.lan.leave();
    host.lan.peers.get(otherId).lastSeen = 0;
    await guest.lan.poll();
    assert.ok(!guest.lan.roster.some((p) => p.id === otherId), 'không phát danh sách người đã mất kết nối cho cả phòng');

    await host.lan.chat('Chào cả phòng');
    await guest.lan.poll();
    assert.equal(guest.lan.status().messages.at(-1).text, 'Chào cả phòng');
    await guest.lan.chat('Chào chủ phòng');
    assert.equal(host.lan.status().messages.at(-1).text, 'Chào chủ phòng');

    G.plantSeed(host.state, 0, 'van_tho');
    Object.assign(host.state.slots[0].plant, { progress: 1, bloomed: true });
    assert.equal((await guest.lan.visit('host', 'steal', 0)).ok, false, 'chủ đang chơi thì không thể hái hoa');
    host.lan.setAway(true);
    assert.equal((await guest.lan.visit('host', 'steal', 0)).ok, true, 'chủ Vắng mặt thì được hái hoa');
    assert.equal(host.state.slots[0].plant, null);

    G.plantSeed(guest.state, 0, 'van_tho');
    Object.assign(guest.state.slots[0].plant, { progress: 1, bloomed: true });
    await guest.lan.poll();
    const denied = await host.lan.visit(guest.lan.client.id, 'steal', 0);
    assert.equal(denied.ok, false);
    guest.lan.setAway(true);
    await guest.lan.poll();
    const waiting = host.lan.visit(guest.lan.client.id, 'steal', 0);
    await guest.lan.poll();
    const stolen = await waiting;
    assert.equal(stolen.ok, true);
    assert.equal(guest.state.slots[0].plant, null);
    assert.ok(host.state.money > G.createState().money);

    await host.lan.revoke(guest.lan.client.id);
    await assert.rejects(() => guest.lan.poll());
  } finally {
    if (other.lan.role) await other.lan.leave();
    await guest.lan.leave();
    await host.lan.leave();
  }
});

test('mã mời có nhiều địa chỉ LAN, bỏ khoảng trắng khi dán', () => {
  const key = crypto.randomBytes(32).toString('base64url');
  const r = parseInvite(` PG1|192.168.1.5,10.0.0.7|47321|abcdefgh|${key}\n`);
  assert.deepEqual(r.ips, ['192.168.1.5', '10.0.0.7']);
  assert.equal(r.ip, '192.168.1.5');
  assert.throws(() => parseInvite(`PG1|192.168.1.5,8.8.8.8|47321|abcdefgh|${key}`));
});

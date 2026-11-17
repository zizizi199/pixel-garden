'use strict';
// Máy chủ trò chơi (server/game.js) chạy với "Supabase giả" trong bộ nhớ.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const { createHandler } = require('../server/game');
const CL = require('../src/core/clock');
const S = require('../src/core/schedule');
const { PROTOCOL } = require('../src/core/actions');

const UID = '11111111-2222-4333-8444-555555555555';
const OTHER = '99999999-2222-4333-8444-555555555555';

function fakeSupabase() {
  const saves = new Map();
  const calls = [];
  const fetch = async (url, opts = {}) => {
    const path = new URL(url).pathname;
    const body = opts.body ? JSON.parse(opts.body) : null;
    const res = (st, d) => new Response(JSON.stringify(d), { status: st });
    if (path === '/auth/v1/user') {
      const tok = (opts.headers.authorization || '').replace('Bearer ', '');
      return tok === 'tok-a' ? res(200, { id: UID }) : tok === 'tok-b' ? res(200, { id: OTHER }) : res(401, { msg: 'bad' });
    }
    const fn = path.replace('/rest/v1/rpc/', '');
    calls.push(fn);
    if (opts.headers.apikey !== 'svc') return res(401, { message: 'no' });
    if (fn === 'vp_save_get') { const r = saves.get(body.p_uid); return res(200, r ? { state: r.state, version: r.version } : null); }
    if (fn === 'vp_save_put') {
      const cur = saves.get(body.p_uid);
      if ((cur ? cur.version : 0) !== Number(body.p_version)) return res(200, false);
      saves.set(body.p_uid, { state: JSON.parse(JSON.stringify(body.p_state)), version: (cur ? cur.version : 0) + 1 });
      return res(200, true);
    }
    if (fn === 'vp_admin_list') return res(200, [...saves.entries()].map(([id, r]) => ({ id, money: r.state.money, level: r.state.level })));
    if (fn === 'vp_srv') return res(200, body.p_fn === 'push' ? [] : null);
    return res(404, { message: 'unknown' });
  };
  return { saves, calls, fetch };
}

function setup() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const db = fakeSupabase();
  const handler = createHandler({ url: 'https://x.supabase.co', serviceKey: 'svc', fetch: db.fetch,
    adminPublicKey: publicKey.export({ format: 'der', type: 'spki' }).toString('base64') });
  const send = async (tok, body) => {
    const r = await handler(new Request('https://x/functions/v1/game', { method: 'POST', headers: { authorization: `Bearer ${tok}` }, body: JSON.stringify({ v: PROTOCOL, tz: 420, ...body }) }));
    return { status: r.status, ...(await r.json()) };
  };
  const sign = (uid, a) => {
    const payload = JSON.stringify({ uid, ts: Date.now(), a });
    return { payload, sig: crypto.sign(null, Buffer.from(payload), privateKey).toString('base64') };
  };
  return { db, send, sign };
}

test('máy chủ: tạo vườn, hành động do máy chủ tính, lưu có phiên bản', async () => {
  const { db, send } = setup();
  let r = await send('tok-a', { a: { type: 'tick' }, init: { settings: { ownerName: 'An', volume: 999 } } });
  assert.equal(r.status, 200);
  assert.equal(r.state.money, 60);
  assert.equal(r.state.settings.ownerName, 'An');
  assert.equal(r.state.settings.volume, 100);
  assert.equal(r.state.settings.tzOffset, 420);
  r = await send('tok-a', { a: { type: 'plant', slot: 0, species: 'muoi_gio' } });
  assert.ok(r.r.ok);
  assert.equal(db.saves.get(UID).version, 2);
  // gửi kèm "money" trong yêu cầu không có tác dụng gì
  r = await send('tok-a', { a: { type: 'buy', kind: 'seed', id: 'muoi_gio', qty: 1, money: 99999 }, state: { money: 99999 } });
  assert.ok(r.state.money < 60);
  // không đăng nhập / game cũ
  assert.equal((await send('tok-x', { a: { type: 'tick' } })).status, 401);
  assert.equal((await send('tok-a', { v: 0, a: { type: 'tick' } })).status, 426);
});

test('máy chủ: lệnh Admin phải có chữ ký đúng người, đúng lúc', async () => {
  const { send, sign } = setup();
  await send('tok-a', { a: { type: 'tick' } });
  let r = await send('tok-a', { a: { type: 'admin', op: 'money', amount: 500 } });
  assert.equal(r.r.ok, false);
  r = await send('tok-a', { a: { type: 'adminReset' } });
  assert.equal(r.r.ok, false);
  r = await send('tok-b', { admin: sign(UID, { type: 'admin', op: 'money', amount: 500 }) }); // chữ ký của người khác
  assert.equal(r.status, 403);
  const forged = sign(UID, { type: 'admin', op: 'money', amount: 1 });
  forged.payload = forged.payload.replace('"amount":1', '"amount":100000');
  assert.equal((await send('tok-a', { admin: forged })).status, 403);
  r = await send('tok-a', { admin: sign(UID, { type: 'admin', op: 'money', amount: 500 }) });
  assert.ok(r.r.ok);
  assert.equal(r.state.money, 560);
});

test('máy chủ: không lộ bộ bài Hoa 21 đang chơi', async () => {
  const { db, send } = setup();
  const r = await send('tok-a', { a: { type: 'gameStart', game: 'blackjack', bet: 10 } });
  assert.ok(r.r.ok);
  assert.equal(r.state.minigames.pending, null);
  const saved = db.saves.get(UID).state.minigames.pending;
  assert.ok(saved === null || Array.isArray(saved.deck)); // bộ bài chỉ nằm trên máy chủ
});

test('giờ địa phương theo múi giờ người chơi (máy chủ chạy UTC)', () => {
  const sched = { start: '08:00', end: '17:00', lunch: { enabled: false, start: '12:00', end: '13:00' }, workdays: [1, 2, 3, 4, 5] };
  const t = Date.UTC(2026, 10, 16, 2, 0); // thứ Hai 09:00 giờ Việt Nam = 02:00 UTC
  try {
    CL.setOffset(420);
    assert.equal(S.isWorkTime(t, sched), true);
    assert.equal(Math.round(S.workMinutesBetween(t, t + 24 * 3600000, sched)), 9 * 60); // thứ Hai 9:00–17:00 + thứ Ba 8:00–9:00
    CL.setOffset(0);
    assert.equal(S.isWorkTime(t, sched), false);
  } finally { CL.setOffset(null); }
});

test('máy chủ: bảng tài khoản của Admin – xem danh sách, cộng xu, đặt lại lượt mini game cho người khác', async () => {
  const { db, send, sign } = setup();
  await send('tok-a', { a: { type: 'tick' } });
  await send('tok-b', { a: { type: 'gameStart', game: 'bugs' } });
  assert.equal(db.saves.get(OTHER).state.minigames.plays.bugs, 1);
  // người thường không gọi được
  assert.equal((await send('tok-b', { a: { type: 'adminList' } })).r.ok, false);
  assert.equal((await send('tok-b', { a: { type: 'adminUser', target: UID, a: { type: 'admin', op: 'money', amount: 1 } } })).r.ok, false);
  let r = await send('tok-a', { admin: sign(UID, { type: 'adminList' }) });
  assert.equal(r.r.accounts.length, 2);
  assert.ok(r.r.accounts.find((x) => x.id === UID).me);
  r = await send('tok-a', { admin: sign(UID, { type: 'adminUser', target: OTHER, a: { type: 'admin', op: 'money', amount: 300 } }) });
  assert.ok(r.r.ok);
  assert.equal(r.state, undefined); // không trả vườn người khác về máy Admin
  assert.equal(db.saves.get(OTHER).state.money, 360);
  r = await send('tok-a', { admin: sign(UID, { type: 'adminUser', target: OTHER, a: { type: 'admin', op: 'resetGames' } }) });
  assert.ok(r.r.ok);
  assert.deepEqual(db.saves.get(OTHER).state.minigames.plays, {});
  r = await send('tok-a', { admin: sign(UID, { type: 'adminUser', target: '00000000-2222-4333-8444-555555555555', a: { type: 'admin', op: 'money', amount: 1 } }) });
  assert.equal(r.r.ok, false);
  r = await send('tok-a', { admin: sign(UID, { type: 'adminUser', target: OTHER, a: { type: 'buy', kind: 'seed', id: 'muoi_gio' } }) });
  assert.equal(r.r.ok, false);
});

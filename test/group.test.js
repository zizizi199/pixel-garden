'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/core/garden');
const { newGroupCode, normalizeCode, codeHash, chatKey, encryptChat, decryptChat, validSupabase } = require('../src/main/group');

test('mã nhóm: tạo, chuẩn hoá, băm; chat mã hoá bằng khoá suy ra từ mã nhóm', () => {
  const code = newGroupCode();
  assert.match(code, /^VP(-[A-Z0-9]{4}){5}$/);
  assert.equal(normalizeCode(` ${code.toLowerCase()} `), code);
  assert.throws(() => normalizeCode('PG2|abc'));
  assert.match(codeHash(code), /^[0-9a-f]{64}$/);
  assert.notEqual(codeHash(code), codeHash(newGroupCode()));
  const box = encryptChat(chatKey(code), 'Chào cả nhóm');
  assert.ok(!box.includes('Chào'));
  assert.equal(decryptChat(chatKey(code), box), 'Chào cả nhóm');
  assert.equal(decryptChat(chatKey(newGroupCode()), box), null, 'sai mã nhóm thì không đọc được');
  assert.ok(validSupabase({ url: 'https://abcdxyz.supabase.co', anonKey: 'x'.repeat(40) }));
  assert.ok(!validSupabase({ url: 'http://abcdxyz.supabase.co', anonKey: 'x'.repeat(40) }));
  assert.ok(!validSupabase({ url: 'https://evil.com', anonKey: 'x'.repeat(40) }));
});

test('vườn gửi máy chủ nhóm có phần thưởng hoa nở; áp lượt hái trộm / pet chặn khi chủ mở lại game', () => {
  const st = G.createState();
  G.plantSeed(st, 0, 'van_tho');
  Object.assign(st.slots[0].plant, { progress: 1, bloomed: true });
  const rg = G.remoteGuard(st);
  assert.ok(rg.slots[0].loot.money > 0);
  assert.equal(rg.slots[1].loot, null);
  G.applyRemoteVisit(st, { kind: 'steal', result: 'ok', slot: 0, species: 'muoi_gio', by: 'A' });
  assert.ok(st.slots[0].plant, 'khác loài (vườn đã đổi) thì không nhổ nhầm');
  G.applyRemoteVisit(st, { kind: 'steal', result: 'ok', slot: 0, species: 'van_tho', by: 'Bạn', at: Date.now() });
  assert.equal(st.slots[0].plant, null);
  assert.equal(st.slots[0].theftMark.by, 'Bạn');
  assert.equal(st.stats.stolenFromMe, 2);
});

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/core/garden');
const MG = require('../src/core/minigames');

test('mini game: giới hạn lượt/ngày, phải bắt đầu đúng lượt mới nhận thưởng, kết quả bị kẹp', () => {
  const st = G.createState();
  const day = new Date(2026, 10, 16, 10).getTime();
  for (let i = 0; i < MG.LIMITS.bugs; i++) assert.ok(MG.start(st, 'bugs', day).ok);
  assert.equal(MG.start(st, 'bugs', day).ok, false, 'hết lượt trong ngày');
  assert.ok(MG.start(st, 'bugs', day + 24 * 3600e3).ok, 'sang ngày mới có lượt lại');
  assert.equal(MG.finish(st, 'bugs', 'gia-mao', { score: 999 }).ok, false, 'mã lượt giả');
  const r = MG.start(st, 'bugs', day + 24 * 3600e3, () => 0.1);
  const before = st.inventory.items.phan_sieu_toc || 0;
  const f = MG.finish(st, 'bugs', r.token, { score: 999, golden: true }, day, () => 0.1);
  assert.ok(f.ok && f.result.score === 90, 'điểm bị kẹp');
  assert.equal(st.inventory.items.phan_sieu_toc, before + 1);
  assert.equal(MG.finish(st, 'bugs', r.token, { score: 50 }).ok, false, 'không nhận 2 lần');
});

test('ghép cặp: chỉ nhận hạt của cặp có trong đề; câu cá: chỉ nhận cá đã định khi quăng', () => {
  const st = G.createState();
  const m = MG.start(st, 'memory');
  const board = [...new Set(m.deck)];
  assert.equal(board.length, 6);
  const seeds = { ...st.inventory.seeds };
  const res = MG.finish(st, 'memory', m.token, { pairs: [...board, 'uu_dam'], tries: 6 });
  assert.equal(res.result.stars, 3);
  assert.ok(!st.inventory.seeds.uu_dam, 'không nhận loài ngoài đề');
  assert.ok(board.every((id) => st.inventory.seeds[id] > (seeds[id] || 0)));
  const f = MG.start(st, 'fish', Date.now(), () => 0.5);
  assert.ok(f.diff > 0 && f.tier >= 0 && !f.id, 'không lộ tên cá trước khi câu');
  const got = MG.finish(st, 'fish', f.token, { caught: true }, Date.now(), () => 0.5);
  assert.ok(got.ok && got.result.fish);
  const money = st.money;
  assert.ok(MG.sellFish(st, got.result.fish, true).ok);
  assert.ok(st.money > money);
});

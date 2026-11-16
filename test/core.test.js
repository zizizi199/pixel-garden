'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const S = require('../src/core/schedule');
const G = require('../src/core/garden');
const C = require('../src/core/catalog');
const store = require('../src/core/store');

// Thứ Hai 16/11/2026 (giờ địa phương)
// gieo hạt cho test: tự cấp hạt + mở khoá giống
const plant = (st, i, id) => {
  if (!st.unlocked.species.includes(id)) st.unlocked.species.push(id);
  st.inventory.seeds[id] = (st.inventory.seeds[id] || 0) + 1;
  return G.plantSeed(st, i, id);
};

const at = (d, hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2026, 10, d, h, m, 0, 0).getTime();
};

test('đếm phút làm việc: 1 ngày đủ = 8 giờ (trừ nghỉ trưa)', () => {
  assert.strictEqual(S.workMinutesBetween(at(16, '00:00'), at(17, '00:00')), 8 * 60);
});

test('cuối tuần và ban đêm không tính', () => {
  // Thứ Sáu 20/11 17:00 → Thứ Hai 23/11 08:00
  assert.strictEqual(S.workMinutesBetween(at(20, '17:00'), at(23, '08:00')), 0);
  assert.strictEqual(S.workMinutesBetween(at(16, '12:00'), at(16, '13:00')), 0);
});

test('cây lớn đúng theo giờ làm và nở', () => {
  const st = G.createState(at(16, '08:00'));
  st.money = 999;
  assert.ok(plant(st, 0, 'van_tho', at(16, '08:00')).ok); // 3.5 giờ làm, khát sau ~2g15
  // tưới đều mỗi giờ
  for (let h = 9; h <= 12; h++) {
    G.advance(st, at(16, `${String(h).padStart(2, '0')}:00`));
    st.slots[0].plant.water = 100;
  }
  G.advance(st, at(16, '13:31'));
  assert.ok(st.slots[0].plant.bloomed, 'đã nở sau 3.5 giờ làm (08:00–12:00 + 13:00–13:30)');
  const r = G.harvest(st, 0);
  assert.ok(r.ok && r.money > 0 && r.exp > 0);
  assert.strictEqual(st.slots[0].plant, null);
});

test('qua đêm không khát, không lớn', () => {
  const st = G.createState(at(16, '16:59'));
  st.money = 999;
  st.level = 3;
  plant(st, 0, 'huong_duong');
  G.advance(st, at(17, '07:59'));
  const p = st.slots[0].plant;
  assert.ok(p.water >= 100 - 100 / 10 - 1e-9, "chỉ khát đúng 1 phút trước 17:00, qua đêm không khát thêm");
  assert.ok(p.progress <= 1 / 15 + 1e-9, "chỉ lớn đúng 1 phút trước 17:00, qua đêm không lớn thêm");
});

test('hoa mười giờ chỉ nở trong khung 10:00–15:00', () => {
  const st = G.createState(at(16, '08:00'));
  st.money = 999;
  plant(st, 0, 'muoi_gio');
  const p = st.slots[0].plant;
  p.progress = 0.999;
  G.advance(st, at(16, '09:00'));
  assert.ok(!p.bloomed && p.waiting, 'nụ chờ');
  G.advance(st, at(16, '10:02'));
  assert.ok(p.bloomed, 'nở lúc 10h');
  p.water = 100;
  G.advance(st, at(16, '15:05'));
  assert.ok(p.faded, 'hết khung giờ thì khép/tàn');
});

test('thiếu nước lâu thì chết', () => {
  const st = G.createState(at(16, '08:00'));
  st.money = 999;
  st.level = 5;
  plant(st, 0, 'hoa_sen'); // cạn sau 2 giờ làm
  for (let h = 9; h <= 17; h++) G.advance(st, at(16, `${String(h).padStart(2, '0')}:00`), { offline: false });
  for (let h = 8; h <= 17; h++) G.advance(st, at(17, `${String(h).padStart(2, '0')}:00`), { offline: false });
  assert.ok(st.slots[0].plant.dead);
});

test('tắt app cả ngày (nghỉ phép) thì cây không chết', () => {
  const st = G.createState(at(16, '08:00'));
  st.level = 5; st.money = 999;
  plant(st, 0, 'hoa_sen');
  G.advance(st, at(18, '17:00'));
  const p = st.slots[0].plant;
  assert.ok(!p.dead && p.health === C.RULES.offlineMinHealth && p.water === 0);
});

test('không tưới khi đất còn ẩm', () => {
  const st = G.createState(at(16, '08:00'));
  st.money = 999;
  plant(st, 0, 'van_tho');
  assert.strictEqual(G.water(st, 0).ok, false);
});

test('cây lâu năm ra hoa lại sau thu hoạch', () => {
  const st = G.createState(at(16, '08:00'));
  st.level = 5; st.money = 999;
  plant(st, 0, 'hoa_hong');
  Object.assign(st.slots[0].plant, { progress: 1, bloomed: true });
  G.harvest(st, 0);
  const p = st.slots[0].plant;
  assert.ok(p && !p.bloomed && p.progress > 0.4);
});

test('mua chậu, đặt chậu, lên cấp', () => {
  const st = G.createState();
  st.money = 1000;
  assert.ok(G.unlock(st, 'pot', 'dat_nung').ok);
  assert.ok(G.buy(st, 'pot', 'dat_nung').ok);
  assert.ok(G.placePot(st, 0, 'dat_nung').ok);
  assert.strictEqual(st.slots[0].pot, 'dat_nung');
  assert.strictEqual(G.buy(st, 'pot', 'vang').ok, false, 'chưa đủ cấp');
  G.gainExp(st, C.expToNext(1) + 1);
  assert.strictEqual(st.level, 2);
  st.level = 2;
  assert.ok(G.buySlot(st).ok);
  assert.strictEqual(st.slots.length, 5);
});

test('hái trộm để lại dấu vết, đồ canh vườn có thể chặn', () => {
  const st = G.createState();
  st.money = 999;
  plant(st, 0, 'van_tho');
  Object.assign(st.slots[0].plant, { progress: 1, bloomed: true });
  const r = G.visitSteal(st, 0, 'Minh', () => 0.99);
  assert.ok(r.ok && r.loot.money > 0);
  assert.strictEqual(st.slots[0].theftMark.by, 'Minh');
  assert.strictEqual(st.slots[0].plant, null);

  st.slots[1].decor[2] = 'bu_nhin';
  st.slots[1].decor[3] = 'meo_su';
  plant(st, 1, 'van_tho');
  Object.assign(st.slots[1].plant, { progress: 1, bloomed: true });
  assert.strictEqual(G.visitSteal(st, 1, 'Minh', () => 0.1).ok, false);
});

test('đọc file lưu cũ không lỗi', () => {
  const st = G.migrate({ money: 5, settings: { position: 'top' } });
  assert.strictEqual(st.money, 5);
  assert.strictEqual(st.settings.position, 'top');
  assert.ok(st.settings.schedule.start);
});

test('cảnh vườn: mua một lần, đổi cảnh, mở save cũ và nhận cảnh từ vòng quay', () => {
  const D = require('../src/core/decor');
  assert.deepStrictEqual(G.migrate({ money: 1 }).scene, { object: null, background: null });
  const st = G.createState(); st.money = 10000; st.level = 99;
  assert.deepStrictEqual(st.scene, { object: null, background: null });
  assert.ok(G.buy(st, 'scene', 'vuon_buom').ok);
  assert.equal(st.scene.object, 'vuon_buom');
  assert.equal(G.buy(st, 'scene', 'vuon_buom').ok, false);
  assert.ok(G.buy(st, 'background', 'chieu_hoa_anh_dao').ok);
  assert.equal(G.equipScene(st, 'scene', 'hanh_tinh_ti_hon').ok, false);
  assert.ok(G.equipScene(st, 'scene', null).ok);
  assert.ok(G.equipScene(st, 'scene', 'vuon_buom').ok);
  assert.equal(G.buy(st, 'background', 'cuc_quang').ok, false);
  assert.ok(G.wheelPool()[3].some((x) => x.kind === 'scene' && x.id === 'banh_xe_sao'));
  assert.ok(G.wheelPool()[3].some((x) => x.kind === 'background' && x.id === 'cuc_quang'));
  assert.ok(D.SCENE_OBJECTS.every((x) => G.wheelPool()[x.tier].some((y) => y.id === x.id) === !!x.wheel));
  const pool = G.wheelPool()[3];
  for (const [kind, id] of [['scene', 'banh_xe_sao'], ['background', 'cuc_quang']]) {
    st.wheel.pityEpic = 9;
    const index = pool.findIndex((x) => x.id === id);
    const rolls = [0.9, 0, (index + 0.5) / pool.length];
    const spin = G.spinWheel(st, 1, Date.now(), () => rolls.shift());
    assert.ok(spin.ok);
    assert.equal(spin.best.kind, kind);
    assert.equal(spin.best.id, id);
    assert.equal(kind === 'scene' ? st.scene.object : st.scene.background, id);
    assert.ok(G.ackSpin(st).ok);
  }
  const restored = G.migrate(JSON.parse(JSON.stringify(st)));
  assert.equal(restored.scene.object, 'banh_xe_sao');
  assert.equal(restored.scene.background, 'cuc_quang');
});

test('pet chặn 1 lần rồi ngủ 30 phút, sau đó chặn tiếp', () => {
  const t0 = at(16, '09:00');
  const st = G.createState(t0);
  st.money = 999; st.level = 2;
  assert.ok(G.buy(st, 'pet', 'ga_con').ok);
  assert.strictEqual(st.pets.active, 'ga_con');
  assert.strictEqual(G.buy(st, 'pet', 'ga_con').ok, false, 'không mua trùng');
  const bloom = (i) => { plant(st, i, 'van_tho'); Object.assign(st.slots[i].plant, { progress: 1, bloomed: true }); };
  bloom(0); bloom(1);
  const r1 = G.visitSteal(st, 0, 'Minh', () => 0.99, t0);
  assert.ok(!r1.ok && r1.blockedBy === 'ga_con');
  assert.ok(st.slots[0].plant.bloomed, 'hoa vẫn còn');
  assert.ok(G.petInfo(st, t0 + 29 * 60000).sleeping);
  assert.ok(G.visitSteal(st, 0, 'Minh', () => 0.99, t0 + 10 * 60000).ok, 'pet ngủ → trộm được');
  assert.ok(!G.petInfo(st, t0 + 31 * 60000).sleeping);
  assert.strictEqual(G.visitSteal(st, 1, 'Lan', () => 0.99, t0 + 31 * 60000).blockedBy, 'ga_con');
  assert.strictEqual(st.pets.status.ga_con.blocks, 2);
  assert.ok(G.setPet(st, null).ok);
  assert.strictEqual(G.petInfo(st), null);
});

test('admin: tua nhanh bỏ qua lịch, thêm tiền, cho nở', () => {
  const st = G.createState(at(21, '22:00')); // thứ Bảy, ngoài giờ
  st.money = 100;
  plant(st, 0, 'van_tho');
  G.fastForward(st, 60, at(21, '22:00'));
  assert.ok(st.slots[0].plant.progress > 0.25, 'cây lớn dù ngoài giờ');
  assert.ok(G.admin(st, { op: 'money', amount: 5000 }).ok);
  assert.strictEqual(st.money, 5100, "gieo bằng hạt, không trừ tiền");
  G.admin(st, { op: 'bloomAll' });
  assert.ok(st.slots[0].plant.bloomed);
  assert.strictEqual(G.admin(st, { op: 'xyz' }).ok, false);
});

test('admin: tăng/giảm EXP, tụt cấp khi trừ', () => {
  const st = G.createState();
  G.admin(st, { op: 'exp', amount: C.expToNext(1) + 10 });
  assert.strictEqual(st.level, 2); assert.strictEqual(st.exp, 10);
  G.admin(st, { op: 'exp', amount: -20 });
  assert.strictEqual(st.level, 1); assert.strictEqual(st.exp, C.expToNext(1) - 10);
  G.admin(st, { op: 'exp', amount: -99999 });
  assert.strictEqual(st.level, 1); assert.strictEqual(st.exp, 0);
});

test('giống cây: phải mở khoá (đủ cấp + tiền), mua hạt, 1 hạt gieo 1 lần', () => {
  const st = G.createState();
  st.money = 1000;
  assert.strictEqual(G.plantSeed(st, 0, 'van_tho').ok, true, 'có sẵn hạt khởi đầu');
  assert.strictEqual(G.buy(st, 'seed', 'cuc_zinnia').ok, false, 'chưa mở khoá');
  assert.strictEqual(G.unlock(st, 'species', 'cuc_zinnia').ok, false, 'chưa đủ cấp');
  st.level = 2;
  assert.ok(G.unlock(st, 'species', 'cuc_zinnia').ok);
  assert.strictEqual(st.money, 1000 - 120);
  assert.ok(G.buy(st, 'seed', 'cuc_zinnia', 2).ok);
  assert.strictEqual(st.inventory.seeds.cuc_zinnia, 2);
  assert.ok(G.plantSeed(st, 1, 'cuc_zinnia').ok);
  assert.ok(G.plantSeed(st, 2, 'cuc_zinnia').ok);
  assert.strictEqual(G.plantSeed(st, 3, 'cuc_zinnia').ok, false, 'hết hạt');
});

test('chậu phải mở khoá; pet không cần cấp; mở ô cần cấp', () => {
  const st = G.createState();
  st.money = 100000;
  assert.strictEqual(G.buy(st, 'pot', 'dat_nung').ok, false);
  assert.ok(G.unlock(st, 'pot', 'dat_nung').ok);
  assert.ok(G.buy(st, 'pot', 'dat_nung').ok);
  assert.ok(G.buy(st, 'pet', 'cu_meo').ok, 'pet Legendary ở cấp 1 vẫn mua được');
  assert.strictEqual(G.buy(st, 'pet', 'phuong_hoang').ok, false, 'pet vòng quay phải quay trúng');
  assert.strictEqual(G.buySlot(st).ok, false, 'ô thứ 5 cần cấp 2');
  st.level = 2;
  assert.ok(G.buySlot(st).ok);
});

test('quà hằng ngày: 1 lần/ngày, chỉ ra đồ đã mở khoá, pet hiếm', () => {
  const t = at(16, '09:00');
  const st = G.createState(t);
  const r1 = G.claimDaily(st, t, () => 0.5);
  assert.ok(r1.ok && r1.reward.kind === 'seed' && st.unlocked.species.includes(r1.reward.id));
  assert.strictEqual(G.claimDaily(st, t + 3600000).ok, false, 'cùng ngày');
  const r2 = G.claimDaily(st, t + 86400000, () => 0.001);
  assert.strictEqual(r2.reward.kind, 'pet');
  assert.strictEqual(C.PETS_BY_ID[r2.reward.id].tier, 0);
  assert.ok(!C.PETS_BY_ID[r2.reward.id].wheel);
  assert.ok(st.pets.owned.includes(r2.reward.id));
  assert.strictEqual(r2.streak, 2);
  st.unlocked.pots.push('su_trang');
  const r3 = G.claimDaily(st, t + 2 * 86400000, () => 0.2);
  assert.strictEqual(r3.reward.kind, 'pot');
  assert.ok(st.unlocked.pots.includes(r3.reward.id));
  let seen = 0; // tỉ lệ: ~1% pet trong 2000 lần
  for (let d = 0; d < 2000; d++) {
    const s2 = G.createState(t);
    s2.daily.last = null;
    if (G.claimDaily(s2, t).reward.kind === 'pet') seen++;
  }
  assert.ok(seen > 5 && seen < 45, `pet ra ${seen}/2000`);
});

test('trang trí theo từng chậu: buff riêng ô đó, đúng chỗ đặt', () => {
  const st = G.createState();
  st.money = 10000; st.level = 10;
  assert.ok(G.buy(st, 'decor', 'chu_lun').ok);
  assert.strictEqual(G.placeDecor(st, 0, 'front', 'chu_lun').ok, false, 'chú lùn chỉ đặt trên mặt đất');
  assert.ok(G.placeDecor(st, 0, 'soil', 'chu_lun').ok);
  assert.ok(Math.abs(G.mods(st.slots[0]).sell - 0.08) < 1e-9);
  assert.strictEqual(G.mods(st.slots[1]).sell, 0, 'ô khác không được buff');
  G.buy(st, 'decor', 'chong_chong'); G.buy(st, 'decor', 'chong_chong');
  assert.ok(G.placeDecor(st, 0, 'left', 'chong_chong').ok);
  assert.ok(G.placeDecor(st, 0, 'right', 'chong_chong').ok);
  assert.ok(Math.abs(G.mods(st.slots[0]).water - 1.1) < 1e-9);
  assert.ok(G.placeDecor(st, 0, 'soil', null).ok);
  assert.strictEqual(st.inventory.decor.chu_lun, 1, 'cất về kho');
});

test('nhà thú: nâng cấp giảm thời gian ngủ của pet, trang trí nhà', () => {
  const t = Date.now();
  const st = G.createState(t);
  st.money = 20000;
  assert.strictEqual(G.upgradeHouse(st).ok, false, 'chưa có pet');
  G.buy(st, 'pet', 'ga_con');
  assert.ok(G.upgradeHouse(st).ok);
  assert.strictEqual(G.houseLevel(st).sleepMin, 25);
  plant(st, 0, 'van_tho'); Object.assign(st.slots[0].plant, { progress: 1, bloomed: true });
  G.visitSteal(st, 0, 'A', () => 0.99, t);
  assert.strictEqual(st.pets.status.ga_con.sleepUntil, t + 25 * 60000);
  assert.ok(G.buy(st, 'hdecor', 'co_do').ok);
  assert.strictEqual(G.placeHouseDecor(st, 'front', 'co_do').ok, false);
  assert.ok(G.placeHouseDecor(st, 'roof', 'co_do').ok);
});

test('save cũ có trang trí chung → hoàn tiền', () => {
  const st = G.migrate({ money: 10, decor: ['den_long', null, null, null], inventory: { decor: { bu_nhin: 1 } } });
  assert.strictEqual(st.money, 10 + 150 + 420);
  assert.ok(Array.isArray(st.slots[0].decor));
  assert.strictEqual(st.decor, undefined);
});

test('vòng quay: tỉ lệ, bảo hiểm, trúng thì mở khoá + mua được', () => {
  const t = at(16, '09:00');
  const st = G.createState(t);
  st.money = 1e7;
  assert.strictEqual(G.unlock(st, 'species', 'hoa_dao').ok, false, 'không mở khoá bằng tiền');
  const r1 = G.spinWheel(st, 1, t, () => 0.5);
  assert.ok(r1.ok && r1.free, 'lượt đầu trong ngày miễn phí');
  assert.strictEqual(st.money, 1e7 + (r1.results[0].kind === 'coin' ? r1.results[0].qty : 0));
  assert.ok(G.ackSpin(st).ok);
  // ép ra Secret: rng rất cao → bậc cuối
  const r2 = G.spinWheel(st, 1, t, () => 0.99999);
  assert.strictEqual(r2.best.tier, 6);
  assert.ok(st.money < 1e7 + 1000, 'lượt thứ 2 mất phí');
  if (r2.best.kind === 'species') assert.ok(G.buy(st, 'seed', r2.best.id).ok, 'trúng rồi mua hạt được');
  // bảo hiểm: 10 lượt toàn Common → lượt 10 chắc chắn Rare+
  const st2 = G.createState(t); st2.money = 1e7;
  const r3 = G.spinWheel(st2, 10, t, () => 0.01);
  assert.ok(r3.results[9].tier >= 2, `lượt 10 bậc ${r3.results[9].tier}`);
  assert.ok(r3.results.slice(0, 9).every((x) => x.tier === 0));
  // Mô phỏng có bảo hiểm: Epic+ thực tế khoảng 4,4%, thấp hơn mức cũ khoảng 8,8%.
  const st3 = G.createState(t); st3.money = 1e9;
  let seed = 0x12345678;
  const rng = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 0x100000000; };
  let epic = 0;
  for (let i = 0; i < 10000; i++) {
    const r = G.spinWheel(st3, 10, t, rng);
    r.results.forEach((x) => { if (x.tier >= 3) epic++; });
    G.ackSpin(st3);
  }
  assert.ok(epic / 100000 > 0.035 && epic / 100000 < 0.055, `epic+ ${epic}/100000`);
});

test('phần thưởng vòng quay chờ xem vẫn còn sau khi lưu và mở lại', () => {
  const t = at(16, '09:00');
  const st = G.createState(t);
  st.money = 1000;
  const spin = G.spinWheel(st, 1, t, () => 0.01);
  assert.ok(spin.ok);
  assert.deepStrictEqual(G.view(st, t).wheel.pending.results, spin.results);
  assert.strictEqual(G.spinWheel(st, 1, t).ok, false, 'phải xem phần thưởng trước khi quay tiếp');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixel-garden-wheel-'));
  const file = path.join(dir, 'save.json');
  try {
    store.save(file, st);
    const reopened = store.load(file, t);
    assert.deepStrictEqual(G.view(reopened, t).wheel.pending.results, spin.results);
    assert.ok(G.ackSpin(reopened).ok);
    assert.strictEqual(G.view(reopened, t).wheel.pending, null);
    assert.ok(G.spinWheel(reopened, 1, t).ok);
  } finally {
    const tempRoot = fs.realpathSync(os.tmpdir());
    const target = fs.realpathSync(dir);
    assert.ok(target.startsWith(tempRoot + path.sep), 'thư mục test phải nằm trong thư mục tạm');
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

'use strict';
const test = require('node:test');
const assert = require('node:assert');
const D = require('../src/core/cards/deck');
const TL = require('../src/core/cards/tienlen');
const PH = require('../src/core/cards/phom');
const R = require('../src/core/cards/room');

const c = (rank, suit) => D.RANKS.indexOf(rank) * 4 + '♠♣♦♥'.indexOf(suit);
const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

test('Tiến lên: nhận bộ, đè bài, chặt heo, thối', () => {
  assert.equal(TL.classify([c('3', '♠'), c('4', '♦'), c('5', '♣')]).type, 'straight');
  assert.equal(TL.classify([c('Q', '♠'), c('K', '♦'), c('A', '♣'), c('2', '♥')]), null); // sảnh không có 2
  assert.equal(TL.classify([c('5', '♠'), c('5', '♦'), c('6', '♣'), c('6', '♥'), c('7', '♠'), c('7', '♦')]).type, 'dstraight');
  const heo = TL.classify([c('2', '♥')]);
  assert.ok(TL.beats(TL.classify([c('3', '♥')]), TL.classify([c('4', '♠')])));
  assert.ok(!TL.beats(TL.classify([c('3', '♥')]), TL.classify([c('3', '♦')])));
  assert.ok(TL.beats(heo, TL.classify([c('9', '♠'), c('9', '♣'), c('9', '♦'), c('9', '♥')])));
  const doi2 = TL.classify([c('2', '♠'), c('2', '♥')]);
  assert.ok(!TL.beats(doi2, TL.classify([c('5', '♠'), c('5', '♦'), c('6', '♣'), c('6', '♥'), c('7', '♠'), c('7', '♦')])));
  assert.equal(TL.chopValue(heo, [c('2', '♥')]), 2);
  assert.equal(TL.thoiValue([c('2', '♠'), c('2', '♥'), c('8', '♠'), c('8', '♣'), c('8', '♦'), c('8', '♥')]), 1 + 2 + 4);
  assert.equal(TL.instantWin([c('2', '♠'), c('2', '♣'), c('2', '♦'), c('2', '♥'), ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((r) => r * 4)]), 'Tứ quý 2');
});

test('Tiến lên: chặt heo ghi nợ cho người bị chặt, hết vòng người đánh cuối được đi', () => {
  const hands = [[c('2', '♥'), c('3', '♠')], [c('7', '♠'), c('7', '♣'), c('7', '♦'), c('7', '♥'), c('K', '♠')], [c('5', '♠'), c('9', '♦')]];
  const pub = { kind: 'tienlen', n: 3, turn: 0, table: null, passed: [false, false, false], out: [], cong: [], left: [2, 5, 2], played: [false, false, false],
    mustCard: null, pending: null, ledger: [], events: [], eventId: 0, over: false, places: null };
  const g = { pub, hands };
  assert.ok(TL.move(g, 0, { kind: 'play', cards: [c('2', '♥')] }).ok);
  assert.ok(!TL.move(g, 1, { kind: 'play', cards: [c('K', '♠')] }).ok);
  assert.ok(TL.move(g, 1, { kind: 'play', cards: [c('7', '♠'), c('7', '♣'), c('7', '♦'), c('7', '♥')] }).ok);
  assert.ok(TL.move(g, 2, { kind: 'pass' }).ok);
  assert.ok(TL.move(g, 0, { kind: 'pass' }).ok);
  assert.equal(pub.table, null);
  assert.equal(pub.turn, 1);
  assert.deepEqual(pub.ledger[0], { from: 0, to: 1, units: 2, why: 'Bị chặt' });
});

test('Phỏm: phỏm, xếp bài tốt nhất, lá ăn phải nằm trong phỏm', () => {
  assert.ok(PH.isMeld([c('A', '♠'), c('2', '♠'), c('3', '♠')]));
  assert.ok(!PH.isMeld([c('K', '♠'), c('A', '♠'), c('2', '♠')])); // A chỉ đứng trước 2
  assert.ok(PH.isMeld([c('8', '♠'), c('8', '♦'), c('8', '♥')]));
  const hand = [c('5', '♠'), c('5', '♦'), c('5', '♥'), c('6', '♠'), c('7', '♠'), c('K', '♥')];
  const b = PH.best(hand);
  assert.equal(b.points, 5 + 5 + 13); // sảnh 5♠6♠7♠ (rác 5♦ 5♥ K♥) tốt hơn sám 5 (rác 6 7 K)
  assert.equal(PH.best([c('9', '♠'), c('9', '♦')], [c('9', '♠')]), null);
  assert.ok(PH.uKhan([c('A', '♠'), c('4', '♠'), c('7', '♠'), c('10', '♠'), c('K', '♠'), c('2', '♦'), c('5', '♦'), c('8', '♦'), c('J', '♦')]));
});

test('Bàn bài: chơi hết ván tự động, tiền thắng thua luôn cân và không quá cọc', () => {
  for (const game of ['tienlen', 'phom']) {
    for (const n of [2, 3, 4]) {
      const rng = seeded(n * 7 + game.length);
      const { room } = R.create({ id: 'r', group: 'g', game, stake: 100, host: 'u0', name: 'A', now: 0 });
      for (let i = 1; i < n; i++) assert.ok(R.join(room, `u${i}`, `P${i}`).ok);
      assert.equal(R.join(room, 'u9', 'X').ok, n < 4);
      for (let hand = 0; hand < 30; hand++) {
        let t = hand * 1e7;
        R.startHand(room, t, rng);
        while (room.status === 'playing') { t += 21000; R.tick(room, t); }
        assert.equal(room.status, 'settling');
        const net = room.result.net;
        assert.equal(net.reduce((a, b) => a + b, 0), 0);
        assert.ok(Math.min(...net) >= -100 * R.DEPOSIT);
        R.settled(room);
        if (room.seats.length > n) room.seats.length = n;
      }
    }
  }
});

test('Bàn bài: rời bàn giữa ván thì máy đánh hộ, hết ván mới rời hẳn', () => {
  const { room } = R.create({ id: 'r', group: 'g', game: 'tienlen', stake: 10, host: 'a', name: 'A', now: 0 });
  R.join(room, 'b', 'B'); R.join(room, 'c', 'C');
  R.startHand(room, 1000, seeded(3));
  R.leave(room, 'b');
  assert.equal(room.seats.length, 3);
  let t = 1000;
  while (room.status === 'playing') { t += 21000; R.tick(room, t); }
  R.settled(room);
  assert.deepEqual(room.seats.map((s) => s.id), ['a', 'c']);
});

'use strict';
/* Bàn bài nhiều người: Tiến lên miền Nam & Phỏm. Dữ liệu bàn từ máy chủ (L.table), mọi nước đi gửi qua lanAct. */
(function () {
  const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
  const SUITS = ['♠', '♣', '♦', '♥'];
  const GAME_NAME = { tienlen: 'Tiến lên miền Nam', phom: 'Phỏm', poker: 'Poker Texas Hold\'em' };
  const COMBO = { single: 'Lẻ', pair: 'Đôi', triple: 'Sám', quad: 'Tứ quý', straight: 'Sảnh', dstraight: 'Đôi thông' };
  const TURN_MS = 20000;
  let sel = new Set();
  let seenEv = { key: '', id: 0 };
  let lastSig = '';
  let lastTurnKey = '';
  let busy = false;
  let order = { key: '', list: [] }; // thứ tự bài trên tay do người chơi tự xếp (kéo thả / nút xếp)
  let dragCard = null;
  let raiseTo = null;
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
  const phomRank = (c) => { const r = c >> 2; return r <= 10 ? r + 3 : r - 10; };
  const SORTS = {
    rank: (game) => (a, b) => (game === 'phom' ? phomRank(a) - phomRank(b) || (a & 3) - (b & 3) : a - b),
    suit: (game) => (a, b) => (a & 3) - (b & 3) || (game === 'phom' ? phomRank(a) - phomRank(b) : a - b),
  };
  /** Xếp phỏm: các phỏm đang có lên trước (mỗi phỏm 1 cụm), rác xếp theo số. */
  function meldOrder(T) {
    const inMeld = new Set((T.melds || []).flat());
    return [...(T.melds || []).flat(), ...T.cards.filter((c) => !inMeld.has(c)).sort(SORTS.rank('phom'))];
  }
  function handOrder(T) {
    const key = `${T.id}:${T.hand}`;
    if (order.key !== key) order = { key, list: T.game === 'phom' ? meldOrder(T) : [...T.cards].sort(SORTS.rank(T.game)) };
    const kept = order.list.filter((c) => T.cards.includes(c));
    const fresh = T.cards.filter((c) => !kept.includes(c)); // lá mới bốc / ăn: thêm cuối
    order.list = [...kept, ...fresh];
    return order.list;
  }
  const cardName = (c) => `${RANKS[c >> 2]}${SUITS[c & 3]}`;
  function cardEl(c, cls = '') {
    const d = document.createElement('div');
    if (c == null) { d.className = `pc back ${cls}`; return d; }
    d.className = `pc ${(c & 3) >= 2 ? 'red' : ''} ${cls}`;
    d.dataset.card = c;
    d.innerHTML = `<b>${RANKS[c >> 2]}</b><i>${SUITS[c & 3]}</i><b class="rev">${RANKS[c >> 2]}</b>`;
    return d;
  }
  /** Ghế của từng người tính theo chỗ mình ngồi (mình luôn ở dưới). */
  function places(n, me) {
    const pos = { 2: ['bottom', 'top'], 3: ['bottom', 'right', 'left'], 4: ['bottom', 'right', 'top', 'left'],
      5: ['bottom', 'right', 'topright', 'top', 'left'], 6: ['bottom', 'right', 'topright', 'top', 'topleft', 'left'] }[n] || ['bottom', 'right', 'top', 'left'];
    const base = me >= 0 ? me : 0;
    const out = {};
    for (let k = 0; k < n; k++) out[(base + k) % n] = pos[k];
    return out;
  }
  function center(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  /** Bay từ `from` tới vị trí hiện tại của `el`. */
  function fly(el, from, delay = 0) {
    if (!el || !from) return;
    const a = center(from); const b = center(el);
    el.style.setProperty('--fx', `${a.x - b.x}px`); el.style.setProperty('--fy', `${a.y - b.y}px`);
    el.style.animationDelay = `${delay}ms`;
    el.classList.add('fly');
  }
  function chipFly(root, from, to) {
    if (!from || !to) return;
    const rr = root.getBoundingClientRect(); const a = center(from); const b = center(to);
    for (let k = 0; k < 4; k++) {
      const ch = document.createElement('i'); ch.className = 'ct-chip';
      ch.style.left = `${b.x - rr.left - 8 + (k - 1.5) * 5}px`; ch.style.top = `${b.y - rr.top - 8}px`;
      ch.style.setProperty('--fx', `${a.x - b.x}px`); ch.style.setProperty('--fy', `${a.y - b.y}px`); ch.style.animationDelay = `${k * 60}ms`;
      root.appendChild(ch); setTimeout(() => ch.remove(), 900);
    }
  }
  function banner(root, text, cls) {
    const b = document.createElement('div'); b.className = `ct-banner ${cls || ''}`; b.textContent = text;
    root.appendChild(b); setTimeout(() => b.remove(), 1600);
  }
  function bubble(seatEl, text) {
    if (!seatEl) return;
    const b = document.createElement('div'); b.className = 'ct-bubble'; b.textContent = text;
    seatEl.appendChild(b); setTimeout(() => b.remove(), 1500);
  }
  function timerBar(T, seat) {
    const p = T.pub;
    const bar = document.createElement('div'); bar.className = 'ct-timer';
    if (T.status !== 'playing' || !p || p.turn !== seat || !p.deadline) return bar;
    const left = Math.max(0, p.deadline - (Date.now() + T.skew));
    const i = document.createElement('i');
    i.style.setProperty('--from', String(Math.min(1, left / TURN_MS)));
    i.style.animationDuration = `${left}ms`;
    if (left < 6000) bar.classList.add('hurry');
    bar.appendChild(i);
    return bar;
  }

  function seatBox(T, s, where, ctx) {
    const p = T.pub; const st = T.seats[s];
    const box = document.createElement('div'); box.className = `ct-seat ${where}`; box.dataset.seat = s;
    const active = T.status === 'playing' && p && p.turn === s;
    if (active) box.classList.add('active');
    const head = document.createElement('div'); head.className = 'ct-name';
    const tags = [];
    if (st.id === T.host) tags.push('👑');
    if (st.away) tags.push('💤');
    head.innerHTML = `${tags.join('')} ${ctx.esc(st.name)}`;
    box.appendChild(head);
    box.appendChild(timerBar(T, s));
    if (T.status === 'playing' && p) {
      const info = document.createElement('div'); info.className = 'ct-info';
      const left = p.left ? p.left[s] : 0;
      if (p.kind === 'tienlen') {
        const fin = p.out.indexOf(s);
        info.textContent = fin >= 0 ? `Về ${['nhất', 'nhì', 'ba', 'bét'][fin]}` : p.cong.includes(s) ? 'Cóng!' : p.passed[s] ? 'Bỏ lượt' : left === 1 ? '⚠ Báo 1 lá' : `${left} lá`;
      } else if (p.kind === 'phom') info.textContent = `${left} lá · đã đánh ${p.done[s]}/4${p.mom.includes(s) ? ' · móm' : ''}`;
      else info.innerHTML = `💰 ${fmt(p.stacks[s])}${p.folded[s] ? ' · <i>Bỏ bài</i>' : p.allin[s] ? ' · <b>Tất tay</b>' : ''}`;
      box.appendChild(info);
      if (p.kind === 'poker') {
        if (s === p.dealer) { const d = document.createElement('span'); d.className = 'ct-dealer'; d.textContent = 'D'; box.appendChild(d); }
        if (p.bets[s] > 0) { const b = document.createElement('div'); b.className = 'ct-bet'; b.innerHTML = `<i></i>${fmt(p.bets[s])}`; box.appendChild(b); }
        if (where !== 'bottom') {
          const two = document.createElement('div'); two.className = `ct-fan poker ${p.folded[s] ? 'folded' : ''}`;
          two.append(cardEl(null, 'mini'), cardEl(null, 'mini'));
          box.appendChild(two);
        }
        return box;
      }
      if (where !== 'bottom') {
        const fan = document.createElement('div'); fan.className = 'ct-fan';
        for (let k = 0; k < Math.min(left, 13); k++) fan.appendChild(cardEl(null, 'mini'));
        box.appendChild(fan);
      }
      if (p.kind === 'phom') box.appendChild(phomArea(p, s));
    }
    return box;
  }

  function phomArea(p, s) {
    const a = document.createElement('div'); a.className = 'ct-phom';
    const dis = document.createElement('div'); dis.className = 'ct-row discards'; dis.dataset.disc = s;
    for (const c of p.discards[s]) dis.appendChild(cardEl(c, 'mini'));
    if (p.last && p.last.seat === s && dis.lastChild) dis.lastChild.classList.add('last');
    a.appendChild(dis);
    if (p.eaten[s].length) {
      const e = document.createElement('div'); e.className = 'ct-row eaten'; e.title = 'Lá đã ăn';
      for (const c of p.eaten[s]) e.appendChild(cardEl(c, 'mini'));
      a.appendChild(e);
    }
    if (p.melds[s].length) {
      const m = document.createElement('div'); m.className = 'ct-row melds'; m.dataset.melds = s;
      for (const meld of p.melds[s]) { const g = document.createElement('span'); g.className = 'meld'; meld.forEach((c) => g.appendChild(cardEl(c, 'mini'))); m.appendChild(g); }
      a.appendChild(m);
    }
    return a;
  }

  function middle(T, ctx) {
    const p = T.pub;
    const mid = document.createElement('div'); mid.className = 'ct-mid';
    if (T.status === 'playing' && p && p.kind === 'tienlen') {
      const pile = document.createElement('div'); pile.className = 'ct-pile';
      if (p.table) {
        p.table.cards.forEach((c) => pile.appendChild(cardEl(c)));
        const lb = document.createElement('div'); lb.className = 'ct-combo';
        lb.textContent = `${COMBO[p.table.combo.type] || ''} – ${T.seats[p.table.seat].name}`;
        mid.append(pile, lb);
      } else {
        pile.innerHTML = `<span class="ct-hint">${p.turn === T.seat ? 'Bạn được đi – đánh bộ bất kỳ' : `${ctx.esc(T.seats[p.turn].name)} được đi`}${p.mustCard != null ? ` (phải có ${cardName(p.mustCard)})` : ''}</span>`;
        mid.appendChild(pile);
      }
    } else if (T.status === 'playing' && p && p.kind === 'poker') {
      const board = document.createElement('div'); board.className = 'ct-board';
      for (let k = 0; k < 5; k++) board.appendChild(p.board[k] != null ? cardEl(p.board[k]) : Object.assign(document.createElement('div'), { className: 'pc slot' }));
      const pot = document.createElement('div'); pot.className = 'ct-pot';
      pot.innerHTML = `<i></i> Pot: <b>${fmt(p.pot)}</b> xu · ${{ preflop: 'Trước flop', flop: 'Flop', turn: 'Turn', river: 'River', showdown: 'So bài' }[p.stage]}`;
      mid.append(board, pot);
    } else if (T.status === 'playing' && p && p.kind === 'phom') {
      const stock = document.createElement('div'); stock.className = 'ct-stock'; stock.title = 'Nọc – bấm để bốc';
      for (let k = 0; k < Math.min(4, p.stock); k++) stock.appendChild(cardEl(null));
      const cnt = document.createElement('span'); cnt.className = 'ct-count'; cnt.textContent = p.stock; stock.appendChild(cnt);
      if (p.turn === T.seat && p.phase === 'draw') { stock.classList.add('can'); stock.onclick = () => send(ctx, { kind: 'draw' }); }
      mid.appendChild(stock);
      const hint = document.createElement('div'); hint.className = 'ct-hint';
      hint.textContent = p.turn === T.seat
        ? (p.phase === 'draw' ? (T.canEat ? 'Ăn lá vừa đánh hoặc bốc nọc' : 'Bốc 1 lá từ nọc') : p.done[T.seat] === 3 ? 'Lượt cuối: đánh 1 lá – game tự hạ phỏm và gửi bài' : 'Chọn 1 lá để đánh')
        : `Lượt của ${T.seats[p.turn].name}`;
      mid.appendChild(hint);
    }
    return mid;
  }

  async function send(ctx, move) {
    if (busy) return;
    busy = true;
    try {
      const r = await ctx.lanAct({ type: 'cardMove', move }, true);
      if (r.ok) { sel = new Set(); ctx.Sound.play(move.kind === 'pass' ? 'click' : 'plant'); }
    } finally { busy = false; }
  }

  function myHand(T, ctx, root) {
    const p = T.pub;
    const wrap = document.createElement('div'); wrap.className = 'ct-hand';
    const cards = handOrder(T);
    sel = new Set([...sel].filter((c) => cards.includes(c)));
    const meldOf = new Map();
    (T.melds || []).forEach((m, i) => m.forEach((c) => meldOf.set(c, i % 4)));
    const eaten = p && p.kind === 'phom' ? p.eaten[T.seat] : [];
    const myTurn = T.status === 'playing' && p && p.turn === T.seat;
    cards.forEach((c, i) => {
      const el = cardEl(c);
      el.style.zIndex = i + 1;
      if (sel.has(c)) el.classList.add('sel');
      if (eaten.includes(c)) el.classList.add('eaten');
      if (T.suggest === c) el.classList.add('suggest');
      if (meldOf.has(c)) el.classList.add('meld', `m${meldOf.get(c)}`);
      // kéo thả để tự xếp bài
      el.draggable = true;
      el.ondragstart = (ev) => { dragCard = c; el.classList.add('dragging'); ev.dataTransfer.effectAllowed = 'move'; };
      el.ondragend = () => { dragCard = null; el.classList.remove('dragging'); };
      el.ondragover = (ev) => { if (dragCard != null && dragCard !== c) { ev.preventDefault(); el.classList.add('drop'); } };
      el.ondragleave = () => el.classList.remove('drop');
      el.ondrop = (ev) => {
        ev.preventDefault(); el.classList.remove('drop');
        if (dragCard == null || dragCard === c) return;
        const list = order.list.filter((x) => x !== dragCard);
        const r = el.getBoundingClientRect();
        const at = list.indexOf(c) + (ev.clientX > r.left + r.width / 2 ? 1 : 0);
        list.splice(at, 0, dragCard);
        order.list = list; dragCard = null; lastSig = ''; ctx.rerender();
      };
      el.onclick = () => {
        if (p && p.kind === 'phom') { sel = sel.has(c) ? new Set() : new Set([c]); } else if (sel.has(c)) sel.delete(c); else sel.add(c);
        ctx.Sound.play('click'); lastSig = ''; ctx.rerender();
      };
      el.ondblclick = () => { if (p && p.kind === 'phom' && myTurn && p.phase === 'discard') send(ctx, { kind: 'discard', card: c }); };
      wrap.appendChild(el);
    });
    const ctl = document.createElement('div'); ctl.className = 'ct-ctl';
    const btn = (label, cls, on, dis) => { const b = document.createElement('button'); b.textContent = label; if (cls) b.className = cls; b.disabled = !!dis; b.onclick = on; ctl.appendChild(b); return b; };
    if (T.status === 'playing' && p && T.seat >= 0) {
      if (p.kind === 'poker') {
        pokerControls(T, ctx, ctl, btn, myTurn);
        const row0 = document.createElement('div'); row0.className = 'ct-me';
        if (T.handName) { const hn = document.createElement('div'); hn.className = 'ct-handname'; hn.textContent = T.handName; wrap.appendChild(hn); }
        row0.append(wrap, ctl); root.appendChild(row0);
        return wrap;
      }
      if (p.kind === 'tienlen') {
        btn('Đánh', 'primary', () => send(ctx, { kind: 'play', cards: [...sel] }), !myTurn || !sel.size);
        btn('Bỏ lượt', '', () => send(ctx, { kind: 'pass' }), !myTurn || !p.table);
        btn('Bỏ chọn', '', () => { sel = new Set(); lastSig = ''; ctx.rerender(); }, !sel.size);
      } else {
        btn('Bốc', 'primary', () => send(ctx, { kind: 'draw' }), !myTurn || p.phase !== 'draw');
        if (T.canEat && p.last) btn(`Ăn ${cardName(p.last.card)}`, 'eat', () => send(ctx, { kind: 'eat' }), !myTurn);
        btn('Đánh', 'primary', () => send(ctx, { kind: 'discard', card: [...sel][0] }), !myTurn || p.phase !== 'discard' || sel.size !== 1);
      }
    }
    // nút xếp bài (chỉ đổi thứ tự hiển thị trên máy mình)
    if (T.cards.length > 1) {
      const sortBox = document.createElement('div'); sortBox.className = 'ct-sort';
      const sb = (label, title, fn) => { const b = document.createElement('button'); b.textContent = label; b.title = title; b.onclick = () => { order.list = fn(); lastSig = ''; ctx.rerender(); }; sortBox.appendChild(b); };
      if (T.game === 'phom') sb('Xếp phỏm', 'Gom các phỏm đang có, rác xếp sau', () => meldOrder(T));
      sb('Theo số', 'Xếp theo số', () => [...T.cards].sort(SORTS.rank(T.game)));
      sb('Theo chất', 'Xếp theo chất ♠ ♣ ♦ ♥', () => [...T.cards].sort(SORTS.suit(T.game)));
      const tip = document.createElement('span'); tip.className = 'ct-tip';
      tip.textContent = T.game === 'phom' && T.melds ? `Đang có ${T.melds.length} phỏm · rác ${T.points} điểm · kéo thả để xếp` : 'Kéo thả lá bài để xếp';
      sortBox.appendChild(tip);
      ctl.prepend(sortBox);
    }
    const row = document.createElement('div'); row.className = 'ct-me';
    row.append(wrap, ctl);
    root.appendChild(row);
    return wrap;
  }

  function pokerControls(T, ctx, ctl, btn, myTurn) {
    const p = T.pub; const s = T.seat;
    const toCall = Math.max(0, p.maxBet - p.bets[s]);
    const maxTo = p.bets[s] + p.stacks[s];
    const minTo = Math.min(maxTo, p.maxBet + p.minRaise);
    const can = myTurn && !p.folded[s] && !p.allin[s];
    if (raiseTo == null || raiseTo < minTo || raiseTo > maxTo) raiseTo = minTo;
    btn('Bỏ bài', 'fold', () => send(ctx, { kind: 'fold' }), !can);
    if (toCall > 0) btn(toCall >= p.stacks[s] ? `Theo (tất tay ${fmt(p.stacks[s])})` : `Theo ${fmt(toCall)}`, 'primary', () => send(ctx, { kind: 'call' }), !can);
    else btn('Xem', 'primary', () => send(ctx, { kind: 'check' }), !can);
    if (maxTo > p.maxBet) {
      const box = document.createElement('span'); box.className = 'ct-raise';
      const inp = document.createElement('input'); inp.type = 'range'; inp.min = minTo; inp.max = maxTo; inp.step = p.bb > 20 ? Math.round(p.bb / 2) : 1; inp.value = raiseTo; inp.disabled = !can;
      const lb = document.createElement('b'); lb.textContent = fmt(raiseTo);
      inp.oninput = () => { raiseTo = Number(inp.value); lb.textContent = fmt(raiseTo); };
      const preset = (label, v) => { const b = document.createElement('button'); b.textContent = label; b.disabled = !can; b.onclick = () => { raiseTo = Math.max(minTo, Math.min(maxTo, Math.round(v))); inp.value = raiseTo; lb.textContent = fmt(raiseTo); }; return b; };
      box.append(preset('Min', minTo), preset('½ pot', p.maxBet + p.pot / 2), preset('Pot', p.maxBet + p.pot), inp, lb);
      ctl.appendChild(box);
      btn(p.maxBet > 0 ? 'Tố' : 'Cược', 'primary', () => send(ctx, raiseTo >= maxTo ? { kind: 'allin' } : { kind: 'raise', to: raiseTo }), !can);
      btn('Tất tay', 'allin', () => send(ctx, { kind: 'allin' }), !can);
    }
  }

  function lobby(T, ctx, root) {
    const box = document.createElement('div'); box.className = 'ct-lobby';
    const isHost = T.me === T.host;
    const h = document.createElement('div'); h.className = 'ct-title';
    h.textContent = `${GAME_NAME[T.game]} · ${T.game === 'poker' ? `big blind ${T.stake} xu` : `${T.stake} xu/ván`} · ${T.seats.length}/${T.game === 'poker' ? 6 : 4} người`;
    box.appendChild(h);
    const note = document.createElement('div'); note.className = 'note';
    note.textContent = T.game === 'poker'
      ? `Big blind ${T.stake} xu, small blind ${Math.floor(T.stake / 2)} xu. Mỗi ván mang vào ${fmt(T.deposit)} xu (40 big blind), hết ván nhận lại số chip còn lại. Mỗi lượt 20 giây, hết giờ tự xem/bỏ bài.`
      : `Mỗi ván giữ cọc ${fmt(T.deposit)} xu (12 × cược), hết ván trả lại cọc ± tiền thắng thua. Mỗi lượt 20 giây, hết giờ tự đánh hộ.`;
    box.appendChild(note);
    if (T.result) {
      box.appendChild(resultBox(T, ctx));
      const rk = `${T.id}:${T.result.hand}`;
      if (lobby.shown !== rk) { // vừa hết ván: chúc mừng người thắng
        lobby.shown = rk;
        const best = T.result.places[0];
        const mine = T.result.net[T.result.ids.indexOf(T.me)];
        setTimeout(() => banner(root, `${T.result.names[best]} thắng ${fmt(T.result.net[best])} xu!`, 'u'), 50);
        ctx.Sound.play(mine > 0 ? 'levelup' : mine < 0 ? 'error' : 'click');
      }
    }
    const members = (ctx.L.players || []).filter((m) => m.id !== T.me && !T.seats.some((s) => s.id === m.id));
    if (isHost && members.length && T.seats.length < (T.game === 'poker' ? 6 : 4)) {
      const inv = document.createElement('div'); inv.className = 'ct-invite';
      inv.append('Mời: ');
      for (const m of members) {
        const b = document.createElement('button');
        const sent = T.invited.includes(m.id);
        b.textContent = `${sent ? '✓ ' : ''}${m.name}${m.status === 'Ngoại tuyến' ? ' (offline)' : ''}`;
        b.disabled = sent;
        b.onclick = () => ctx.lanAct({ type: 'cardInvite', ids: [m.id] });
        inv.appendChild(b);
      }
      box.appendChild(inv);
    }
    const ctl = document.createElement('div'); ctl.className = 'ct-ctl';
    if (isHost) {
      const go = document.createElement('button'); go.className = 'primary';
      go.textContent = T.result ? '▶ Ván mới' : '▶ Bắt đầu'; go.disabled = T.seats.length < 2 || T.status !== 'waiting';
      go.onclick = async () => { go.disabled = true; const r = await ctx.lanAct({ type: 'cardStart' }, true); if (!r.ok) go.disabled = false; };
      ctl.appendChild(go);
    } else {
      const w = document.createElement('span'); w.className = 'ct-hint'; w.textContent = T.status === 'settling' ? 'Đang trả xu…' : 'Chờ chủ bàn chia bài…'; ctl.appendChild(w);
    }
    if (T.seat >= 0) {
      const lv = document.createElement('button'); lv.textContent = 'Rời bàn';
      lv.onclick = () => ctx.lanAct({ type: 'cardLeave' });
      ctl.appendChild(lv);
    } else {
      const cl = document.createElement('button'); cl.textContent = 'Đóng'; cl.onclick = () => ctx.lanAct({ type: 'cardClose' }, true); ctl.appendChild(cl);
    }
    box.appendChild(ctl);
    root.appendChild(box);
  }

  function miniRow(cards, cls = '') {
    const r = document.createElement('span'); r.className = `ct-mini ${cls}`;
    (cards || []).forEach((c) => r.appendChild(cardEl(c, 'mini')));
    return r;
  }
  /** Bảng kết quả: thứ hạng, xu thắng/thua, lý do, và bài của từng người (phỏm đã hạ + rác / bài còn lại / bài poker). */
  function resultBox(T, ctx) {
    const R = T.result; const p = T.pub && T.pub.over ? T.pub : null;
    const box = document.createElement('div'); box.className = 'ct-result';
    const place = ['🥇 Nhất', '🥈 Nhì', '🥉 Ba', '4', '5', '6'];
    const why = {};
    for (const l of R.lines || []) if (l.from >= 0) (why[l.from] = why[l.from] || []).push(`${l.why} −${fmt(l.xu)}`);
    for (const l of R.lines || []) if (l.from < 0) (why[l.to] = why[l.to] || []).push(l.why);
    const reveal = p && ((p.events || []).slice().reverse().find((e) => e.reveal) || {}).reveal;
    if (p && p.kind === 'poker' && p.board.length) { const bd = document.createElement('div'); bd.className = 'ct-res-board'; bd.append('Bài chung: ', miniRow(p.board)); box.appendChild(bd); }
    (R.places || []).forEach((s, k) => {
      const net = R.net[s];
      const row = document.createElement('div'); row.className = `ct-res ${net > 0 ? 'win' : net < 0 ? 'lose' : ''}`;
      const label = p && p.kind === 'poker' ? (net > 0 ? '🏆' : '') : k === R.places.length - 1 && k > 0 ? 'Bét' : place[k];
      row.innerHTML = `<span>${label}</span><b>${ctx.esc(R.names[s])}${R.ids[s] === T.me ? ' (bạn)' : ''}</b>`
        + `<span class="xu">${net > 0 ? '+' : ''}${fmt(net)} xu</span><small>${ctx.esc((why[s] || []).join(' · '))}</small>`;
      const cards = document.createElement('div'); cards.className = 'ct-res-cards';
      if (p && p.kind === 'phom') {
        (p.melds[s] || []).forEach((m) => cards.appendChild(miniRow(m, 'meld')));
        const rest = reveal ? reveal[s] : [];
        if (rest && rest.length) { cards.append(miniRow(rest, 'rac')); }
        const note = document.createElement('em');
        note.textContent = p.u && p.u.seat === s ? p.u.why : p.mom.includes(s) ? 'Móm' : p.points ? `${p.points[s]} điểm` : '';
        cards.appendChild(note);
      } else if (p && p.kind === 'tienlen' && reveal && reveal[s] && reveal[s].length) {
        cards.append(miniRow(reveal[s], 'rac'));
      } else if (p && p.kind === 'poker' && p.show && p.show[s]) {
        cards.append(miniRow(p.show[s].cards));
        const note = document.createElement('em'); note.textContent = p.show[s].name; cards.appendChild(note);
      }
      if (cards.childNodes.length) row.appendChild(cards);
      box.appendChild(row);
    });
    return box;
  }

  /** Hiệu ứng cho các sự kiện mới (đánh, chặt, bốc, ăn, hạ phỏm, ù…). */
  function animate(T, root, ctx, hand) {
    const p = T.pub; if (!p) return;
    const key = `${T.id}:${T.hand}`;
    const fresh = seenEv.key === key ? p.events.filter((e) => e.id > seenEv.id) : p.events.filter((e) => e.kind === 'deal' || e.id > p.eventId - 1);
    seenEv = { key, id: p.eventId };
    const seatEl = (s) => root.querySelector(`.ct-seat[data-seat="${s}"]`);
    const mid = root.querySelector('.ct-mid');
    for (const e of fresh) {
      if (e.kind === 'deal') {
        [...hand.children].forEach((c, i) => fly(c, mid, i * 45));
        root.querySelectorAll('.ct-fan .pc').forEach((c, i) => fly(c, mid, i * 25));
        ctx.Sound.play('click');
      } else if (e.kind === 'play' || e.kind === 'chop') {
        const from = e.seat === T.seat ? hand : seatEl(e.seat);
        root.querySelectorAll('.ct-pile .pc').forEach((c, i) => fly(c, from, i * 40));
        if (e.kind === 'chop') { banner(root, 'CHẶT!', 'chop'); root.classList.add('shake'); setTimeout(() => root.classList.remove('shake'), 500); ctx.Sound.play('harvest'); }
        else ctx.Sound.play('plant');
      } else if (e.kind === 'pass') bubble(seatEl(e.seat), 'Bỏ lượt');
      else if (e.kind === 'round') bubble(seatEl(e.seat), 'Được đi');
      else if (e.kind === 'finish') { bubble(seatEl(e.seat), `Về ${['nhất', 'nhì', 'ba', 'bét'][e.place - 1]}!`); if (e.place === 1) ctx.Sound.play('levelup'); }
      else if (e.kind === 'cong') e.seats.forEach((s) => bubble(seatEl(s), 'Cóng!'));
      else if (e.kind === 'draw') {
        const target = e.seat === T.seat ? hand.lastElementChild : seatEl(e.seat);
        const ghost = cardEl(null, 'ghost'); root.appendChild(ghost);
        const tc = target ? center(target) : center(root); const rr = root.getBoundingClientRect();
        ghost.style.left = `${tc.x - rr.left - 20}px`; ghost.style.top = `${tc.y - rr.top - 28}px`;
        fly(ghost, root.querySelector('.ct-stock')); setTimeout(() => ghost.remove(), 700);
      } else if (e.kind === 'discard') {
        const row = root.querySelector(`.ct-row.discards[data-disc="${e.seat}"]`);
        fly(row && row.lastElementChild, e.seat === T.seat ? hand : seatEl(e.seat));
        if (e.chot) bubble(seatEl(e.seat), 'Cây chốt!');
      } else if (e.kind === 'eat') {
        const row = root.querySelector(`.ct-seat[data-seat="${e.seat}"] .ct-row.eaten`);
        fly(row && row.lastElementChild, root.querySelector(`.ct-row.discards[data-disc="${e.from}"]`));
        bubble(seatEl(e.seat), e.chot ? 'Ăn chốt!' : 'Ăn!'); ctx.Sound.play('coin');
      } else if (e.kind === 'lay') {
        const m = root.querySelector(`.ct-row.melds[data-melds="${e.seat}"]`);
        if (m) [...m.querySelectorAll('.pc')].forEach((c, i) => fly(c, seatEl(e.seat), i * 30));
        bubble(seatEl(e.seat), e.mom ? 'Móm!' : `Hạ ${e.melds.length} phỏm${e.sent.length ? `, gửi ${e.sent.length}` : ''}`);
      } else if (e.kind === 'u' || e.kind === 'instant') { banner(root, e.text, 'u'); ctx.Sound.play('levelup'); }
      else if (e.kind === 'fold') bubble(seatEl(e.seat), 'Bỏ bài');
      else if (e.kind === 'check') bubble(seatEl(e.seat), 'Xem');
      else if (e.kind === 'call' || e.kind === 'raise' || e.kind === 'allin') {
        const from = e.seat === T.seat ? hand : seatEl(e.seat);
        chipFly(root, from, root.querySelector('.ct-pot'));
        bubble(seatEl(e.seat), e.kind === 'call' ? `Theo ${fmt(e.amount)}` : e.kind === 'raise' ? `Tố ${fmt(e.to)}` : 'Tất tay!');
        if (e.kind === 'allin') banner(root, 'TẤT TAY!', 'chop');
        ctx.Sound.play('coin');
      } else if (e.kind === 'board') {
        const cs = [...root.querySelectorAll('.ct-board .pc:not(.slot)')].slice(-e.cards.length);
        cs.forEach((c, i) => { c.classList.add('flip'); c.style.animationDelay = `${i * 120}ms`; });
        ctx.Sound.play('click');
      }
    }
    const turnKey = `${key}:${p.turn}:${p.phase || ''}:${p.eventId}`;
    if (T.status === 'playing' && p.turn === T.seat && lastTurnKey.split(':')[2] !== String(T.seat) && turnKey !== lastTurnKey) ctx.Sound.play('bloom');
    lastTurnKey = turnKey;
  }

  function render(root, ctx) {
    const T = ctx.L && ctx.L.table;
    if (!T) { root.innerHTML = ''; return; }
    const sig = JSON.stringify([T.id, T.status, T.hand, T.cards, T.pub && T.pub.eventId, T.pub && T.pub.deadline, T.seats, T.invited, T.result && T.result.hand, T.canEat, [...sel]]);
    if (sig === lastSig) return;
    lastSig = sig;
    root.innerHTML = '';
    root.className = `ct ${T.game}`;
    const top = document.createElement('div'); top.className = 'ct-top';
    top.innerHTML = `<b>🃏 ${GAME_NAME[T.game]}</b> · ${T.stake} xu/ván${T.hand ? ` · ván ${T.hand}` : ''}`;
    const mini = document.createElement('button'); mini.className = 'ct-min'; mini.textContent = '▾'; mini.title = 'Thu nhỏ (bàn vẫn chơi tiếp)';
    mini.onclick = ctx.minimize;
    top.appendChild(mini);
    root.appendChild(top);
    if (T.status !== 'playing' || !T.pub) { lobby(T, ctx, root); return; }
    const pos = places(T.seats.length, T.seat);
    const table = document.createElement('div'); table.className = 'ct-table';
    T.seats.forEach((_, s) => { if (pos[s] !== 'bottom' || T.seat < 0) table.appendChild(seatBox(T, s, T.seat < 0 && pos[s] === 'bottom' ? 'top' : pos[s], ctx)); });
    table.appendChild(middle(T, ctx));
    root.appendChild(table);
    let hand = null;
    if (T.seat >= 0) {
      const mine = seatBox(T, T.seat, 'bottom', ctx);
      root.appendChild(mine);
      hand = myHand(T, ctx, mine);
    }
    if (hand) animate(T, root, ctx, hand);
  }

  window.CardTable = { render, reset: () => { lastSig = ''; } };
}());

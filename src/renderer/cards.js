'use strict';
/* Bàn bài nhiều người: Tiến lên miền Nam & Phỏm. Dữ liệu bàn từ máy chủ (L.table), mọi nước đi gửi qua lanAct. */
(function () {
  const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
  const SUITS = ['♠', '♣', '♦', '♥'];
  const GAME_NAME = { tienlen: 'Tiến lên miền Nam', phom: 'Phỏm' };
  const COMBO = { single: 'Lẻ', pair: 'Đôi', triple: 'Sám', quad: 'Tứ quý', straight: 'Sảnh', dstraight: 'Đôi thông' };
  const TURN_MS = 20000;
  let sel = new Set();
  let seenEv = { key: '', id: 0 };
  let lastSig = '';
  let lastTurnKey = '';
  let busy = false;

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
    const pos = { 2: ['bottom', 'top'], 3: ['bottom', 'right', 'left'], 4: ['bottom', 'right', 'top', 'left'] }[n] || ['bottom', 'right', 'top', 'left'];
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
      } else info.textContent = `${left} lá · đã đánh ${p.done[s]}/4${p.mom.includes(s) ? ' · móm' : ''}`;
      box.appendChild(info);
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
    const cards = [...T.cards].sort((a, b) => a - b);
    sel = new Set([...sel].filter((c) => cards.includes(c)));
    const eaten = p && p.kind === 'phom' ? p.eaten[T.seat] : [];
    const myTurn = T.status === 'playing' && p && p.turn === T.seat;
    cards.forEach((c, i) => {
      const el = cardEl(c);
      el.style.zIndex = i + 1;
      if (sel.has(c)) el.classList.add('sel');
      if (eaten.includes(c)) el.classList.add('eaten');
      if (T.suggest === c) el.classList.add('suggest');
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
    const row = document.createElement('div'); row.className = 'ct-me';
    row.append(wrap, ctl);
    root.appendChild(row);
    return wrap;
  }

  function lobby(T, ctx, root) {
    const box = document.createElement('div'); box.className = 'ct-lobby';
    const isHost = T.me === T.host;
    const h = document.createElement('div'); h.className = 'ct-title';
    h.textContent = `${GAME_NAME[T.game]} · ${T.stake} xu/ván · ${T.seats.length}/4 người`;
    box.appendChild(h);
    const note = document.createElement('div'); note.className = 'note';
    note.textContent = `Mỗi ván giữ cọc ${T.deposit} xu (12 × cược), hết ván trả lại cọc ± tiền thắng thua. Mỗi lượt 20 giây, hết giờ tự đánh hộ.`;
    box.appendChild(note);
    if (T.result) box.appendChild(resultBox(T, ctx));
    const members = (ctx.L.players || []).filter((m) => m.id !== T.me && !T.seats.some((s) => s.id === m.id));
    if (isHost && members.length && T.seats.length < 4) {
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

  function resultBox(T, ctx) {
    const R = T.result;
    const box = document.createElement('div'); box.className = 'ct-result';
    const place = ['🥇 Nhất', '🥈 Nhì', '🥉 Ba', 'Bét'];
    const why = {};
    for (const l of R.lines || []) {
      (why[l.from] = why[l.from] || []).push(`${l.why} −${l.xu}`);
      (why[l.to] = why[l.to] || []).push(`+${l.xu}`);
    }
    (R.places || []).forEach((s, k) => {
      const net = R.net[s];
      const row = document.createElement('div'); row.className = `ct-res ${net > 0 ? 'win' : net < 0 ? 'lose' : ''}`;
      row.innerHTML = `<span>${k === (R.places.length - 1) && k > 0 ? place[3] : place[k] || ''}</span><b>${ctx.esc(R.names[s])}${R.ids[s] === T.me ? ' (bạn)' : ''}</b>`
        + `<span class="xu">${net > 0 ? '+' : ''}${net} xu</span><small>${ctx.esc((why[s] || []).filter((x) => x.startsWith('−') || /[a-zà-ỹ]/i.test(x)).join(' · '))}</small>`;
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

'use strict';
/* Mini game: Bắt sâu (ngay trên thanh vườn), Ghép cặp hoa và Câu cá (thanh vườn cao lên).
   Tiến trình chính trừ lượt, ra đề và trả thưởng (api.action gameStart / gameFinish); file này chỉ là phần chơi. */
(function () {
  let ctx = null;
  let stopFn = null; // dừng trò đang chạy (dọn timer, phần tử)
  const TIER_COLOR = ['#9aa5b1', '#52b788', '#3a86ff', '#9d4edd', '#f4a300', '#e5383b', '#ff4fd8'];

  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };

  function stop() { if (stopFn) { const f = stopFn; stopFn = null; f(); } }
  function running() { return !!stopFn; }

  async function begin(game, bet, bets) {
    const r = await ctx.api.action({ type: 'gameStart', game, bet, bets });
    if (!r.ok) { ctx.toast(r.msg, true); ctx.Sound.play('error'); return null; }
    return r;
  }
  async function end(game, token, result) {
    const r = await ctx.api.action({ type: 'gameFinish', game, token, result });
    ctx.toast(r.msg, !r.ok);
    ctx.Sound.play(r.ok && r.result && r.result.gifts && r.result.gifts.length ? 'levelup' : 'click');
    return r;
  }

  // ---------------------------------------------------------------- 1. Bắt sâu (trên chính các chậu của mình)
  async function bugs(c) {
    ctx = c; stop();
    const r = await begin('bugs');
    if (!r) return;
    const garden = document.getElementById('garden');
    const layer = el('div', 'bug-layer'); garden.appendChild(layer);
    const hud = el('div', 'game-hud'); garden.appendChild(hud);
    let score = 0; let golden = false; let caught = 0; let missed = 0;
    const t0 = performance.now(); const total = r.seconds * 1000;
    let nextSpawn = 600; let goldenDone = r.goldenAt == null;
    const bugsAlive = new Set();
    let raf = 0; let over = false;

    const pots = () => [...document.querySelectorAll('#slots .slot:not(.buy)')];
    function spawn(kind, elapsed) {
      const list = pots(); if (!list.length) return;
      const slot = list[Math.floor(Math.random() * list.length)];
      const gr = garden.getBoundingClientRect(); const sr = slot.getBoundingClientRect();
      const b = el('button', `bug ${kind}`, kind === 'snail' ? '🐌' : kind === 'gold' ? '🪲' : '🐛');
      const x = sr.left - gr.left + sr.width * (0.25 + Math.random() * 0.5);
      const yStart = sr.bottom - gr.top - 22; const yEnd = sr.top - gr.top + sr.height * 0.18;
      const speed = Math.max(1300, 3300 - (elapsed / total) * 2000) * (kind === 'gold' ? 0.55 : kind === 'snail' ? 1.25 : 1);
      const bug = { b, x, yStart, yEnd, born: performance.now(), speed, kind };
      b.style.left = `${x}px`; b.style.top = `${yStart}px`;
      b.onpointerdown = (e) => {
        e.stopPropagation(); if (over) return;
        bugsAlive.delete(bug); b.classList.add('caught'); setTimeout(() => b.remove(), 300);
        const pts = kind === 'gold' ? 5 : kind === 'snail' ? 2 : 1;
        score += pts; caught += 1; if (kind === 'gold') golden = true;
        ctx.Sound.play(kind === 'gold' ? 'coin' : 'click');
        const f = el('div', 'bug-pop', `+${pts}`); f.style.left = `${x}px`; f.style.top = `${b.offsetTop - 10}px`; layer.appendChild(f);
        setTimeout(() => f.remove(), 700);
      };
      layer.appendChild(b); bugsAlive.add(bug);
    }
    function frame(now) {
      if (over) return;
      const elapsed = now - t0;
      if (elapsed >= nextSpawn) {
        spawn(Math.random() < 0.25 ? 'snail' : 'worm', elapsed);
        nextSpawn = elapsed + Math.max(420, 1100 - (elapsed / total) * 700) * (0.7 + Math.random() * 0.6);
      }
      if (!goldenDone && elapsed >= r.goldenAt * 1000) { goldenDone = true; spawn('gold', elapsed); }
      for (const bug of bugsAlive) {
        const k = (now - bug.born) / bug.speed;
        bug.b.style.top = `${bug.yStart + (bug.yEnd - bug.yStart) * Math.min(1, k)}px`;
        if (k >= 1) { // gặm lá rồi bò đi
          bugsAlive.delete(bug); missed += 1; bug.b.classList.add('ate');
          const f = el('div', 'bug-pop miss', 'gặm lá!'); f.style.left = `${bug.x}px`; f.style.top = `${bug.yEnd - 14}px`; layer.appendChild(f);
          setTimeout(() => { bug.b.remove(); f.remove(); }, 600);
        }
      }
      const left = Math.max(0, Math.ceil((total - elapsed) / 1000));
      hud.innerHTML = `🐛 <b>Bắt sâu</b> · ${left}s · Điểm: <b>${score}</b> · bắt ${caught} · sổng ${missed}`;
      if (elapsed >= total) { finishGame(); return; }
      raf = requestAnimationFrame(frame);
    }
    async function finishGame() {
      over = true; cancelAnimationFrame(raf);
      for (const bug of bugsAlive) bug.b.remove();
      bugsAlive.clear();
      hud.innerHTML = `🐛 Hết giờ! Điểm: <b>${score}</b>${golden ? ' · 🪲 bắt được bọ vàng!' : ''}`;
      const res = await end('bugs', r.token, { score, golden });
      if (res.ok) hud.innerHTML += ` · ${ctx.esc(res.msg)}`;
      setTimeout(() => { if (stopFn === cleanup) stop(); }, 5000);
    }
    const cleanup = () => { over = true; cancelAnimationFrame(raf); layer.remove(); hud.remove(); document.body.classList.remove('bugging'); };
    document.body.classList.add('bugging');
    stopFn = cleanup;
    ctx.Sound.play('open');
    raf = requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- khung chơi cao (Ghép cặp, Câu cá)
  function frameView(title, onClose) {
    const view = ctx.enterTall();
    view.innerHTML = '';
    const head = el('div', 'game-head');
    head.appendChild(el('b', '', title));
    const close = el('button', 'game-close', '✕'); close.title = 'Thoát';
    close.onclick = () => { stop(); ctx.exitTall(); if (onClose) onClose(); };
    head.appendChild(close);
    const body = el('div', 'game-body');
    view.append(head, body);
    return body;
  }

  // ---------------------------------------------------------------- 2. Ghép cặp hoa
  async function memory(c) {
    ctx = c; stop();
    const r = await begin('memory');
    if (!r) return;
    const body = frameView('🃏 Ghép cặp hoa – lật 2 thẻ giống nhau, ghép xong cả 6 cặp trước khi hết lượt');
    const info = el('div', 'game-info'); body.appendChild(info);
    const grid = el('div', 'mem-grid'); body.appendChild(grid);
    let open = []; let tries = 0; let lock = false; const pairs = []; let done = false;
    const cards = r.deck.map((id, i) => {
      const card = el('button', 'mem-card');
      const face = el('div', 'face'); face.appendChild(ctx.canvasOf(ctx.Sprites.plant(ctx.SP[id], 'bloom')));
      face.appendChild(el('small', '', ctx.SP[id].name));
      const back = el('div', 'back', '✿');
      card.append(back, face);
      card.onclick = () => flip(i);
      grid.appendChild(card);
      return { id, card, matched: false };
    });
    const show = () => { info.textContent = `Lượt lật: ${tries}/${r.maxTries} · Đã ghép: ${pairs.length}/6 · ≤9 lượt = ⭐⭐⭐, ≤11 = ⭐⭐`; };
    show();
    function flip(i) {
      const cd = cards[i];
      if (lock || done || cd.matched || open.includes(i)) return;
      cd.card.classList.add('open'); open.push(i); ctx.Sound.play('click');
      if (open.length < 2) return;
      tries += 1;
      const [a, b] = open.map((k) => cards[k]);
      if (a.id === b.id) {
        a.matched = b.matched = true; a.card.classList.add('matched'); b.card.classList.add('matched');
        pairs.push(a.id); open = []; ctx.Sound.play('harvest');
      } else {
        lock = true;
        setTimeout(() => { a.card.classList.remove('open'); b.card.classList.remove('open'); open = []; lock = false; }, 750);
      }
      show();
      if (pairs.length === 6 || tries >= r.maxTries) finishGame();
    }
    async function finishGame() {
      done = true;
      const res = await end('memory', r.token, { pairs, tries });
      const st = res.ok ? res.result.stars : 0;
      const box = el('div', 'game-result');
      box.innerHTML = `<b>${pairs.length === 6 ? `Hoàn thành! ${'⭐'.repeat(st)}` : `Hết lượt – ghép được ${pairs.length}/6 cặp`}</b><br>${ctx.esc(res.msg)}`;
      const again = el('button', 'primary', '🔁 Chơi lại'); again.onclick = () => memory(ctx);
      const out = el('button', '', 'Về vườn'); out.onclick = () => { stop(); ctx.exitTall(); };
      box.append(document.createElement('br'), again, out);
      body.appendChild(box);
    }
    stopFn = () => { done = true; };
  }

  // ---------------------------------------------------------------- 3. Câu cá ao vườn
  async function fishing(c) {
    ctx = c; stop();
    const body = frameView('🎣 Câu cá ao vườn – chờ phao chìm thì bấm, rồi GIỮ chuột (hoặc phím Space) để giữ cá trong vùng xanh');
    const scene = el('div', 'fish-scene'); body.appendChild(scene);
    const pond = el('div', 'fish-pond'); scene.appendChild(pond);
    const bob = el('div', 'bobber', '🔴'); pond.appendChild(bob);
    const side = el('div', 'fish-side'); scene.appendChild(side);
    const status = el('div', 'fish-status'); side.appendChild(status);
    const btn = el('button', 'primary', '🎣 Quăng câu'); side.appendChild(btn);
    const reel = el('div', 'reel hidden');
    const track = el('div', 'reel-track'); const zone = el('div', 'reel-zone'); const fish = el('div', 'reel-fish', '🐟');
    track.append(zone, fish);
    const meter = el('div', 'reel-meter'); const fill = el('b'); meter.appendChild(fill);
    reel.append(track, meter); scene.appendChild(reel);
    let timers = []; let raf = 0; let holding = false; let phase = 'idle'; let token = null;
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const plays = () => (ctx.V().minigames && ctx.V().minigames.fish) || { left: 0, limit: 5 };
    const idle = (msg) => {
      phase = 'idle'; bob.className = 'bobber'; reel.classList.add('hidden');
      status.innerHTML = `${msg ? `${msg}<br>` : ''}Còn <b>${plays().left}</b>/${plays().limit} lần câu hôm nay.`;
      btn.disabled = plays().left <= 0; btn.textContent = '🎣 Quăng câu';
    };
    idle('');
    const down = () => { holding = true; }; const up = () => { holding = false; };
    const key = (e) => { if (e.code === 'Space') { e.preventDefault(); holding = e.type === 'keydown'; if (e.type === 'keydown' && phase === 'bite') hook(); } };
    reel.addEventListener('pointerdown', down); window.addEventListener('pointerup', up);
    window.addEventListener('keydown', key); window.addEventListener('keyup', key);

    btn.onclick = async () => {
      if (phase === 'bite') { hook(); return; }
      if (phase !== 'idle') return;
      const r = await begin('fish');
      if (!r) return;
      token = r.token; phase = 'wait'; btn.disabled = false; btn.textContent = '⚡ Giật cần!';
      bob.className = 'bobber cast';
      status.textContent = r.pet ? `${r.pet} ngồi canh cùng bạn${r.petCat ? ' (mèo câu giỏi lắm!)' : ''}… chờ phao động.` : 'Chờ cá cắn câu…';
      ctx.Sound.play('water');
      phaseData = r;
      later(() => { // cá cắn câu: có ~1.3 giây để giật
        if (phase !== 'wait') return;
        phase = 'bite'; bob.className = 'bobber bite'; status.innerHTML = '<b style="color:#c1121f">❗ Cá cắn câu! Bấm giật cần ngay!</b>';
        ctx.Sound.play('thirsty');
        later(() => { if (phase === 'bite') lose('Chậm tay quá, cá ăn mồi rồi chạy mất!'); }, 1300);
      }, r.wait * 1000);
    };
    let phaseData = null;
    function hook() {
      if (phase === 'wait') { lose('Giật sớm quá, cá sợ bỏ đi mất!'); return; }
      if (phase !== 'bite') return;
      phase = 'reel'; btn.disabled = true; bob.className = 'bobber reel';
      const d = phaseData.diff;
      reel.classList.remove('hidden');
      fish.style.color = TIER_COLOR[phaseData.tier] || '#fff';
      fish.style.filter = `drop-shadow(0 0 6px ${TIER_COLOR[phaseData.tier] || '#fff'})`;
      status.innerHTML = `Đang kéo… <b style="color:${TIER_COLOR[phaseData.tier]}">${'★'.repeat(phaseData.tier + 1)}</b>`;
      const zoneH = Math.max(0.14, 0.42 - d * 0.3); // tỉ lệ chiều cao vùng xanh
      let zy = 0.5; let zv = 0; let fy = 0.5; let ft = 0.5; let prog = 0.3; let last = performance.now();
      const step = (now) => {
        if (phase !== 'reel') return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        zv += (holding ? 1.9 : -1.5) * dt; zv = Math.max(-0.9, Math.min(0.9, zv));
        zy += zv * dt; if (zy < zoneH / 2) { zy = zoneH / 2; zv = 0; } if (zy > 1 - zoneH / 2) { zy = 1 - zoneH / 2; zv = 0; }
        if (Math.random() < dt * (0.8 + d * 3)) ft = 0.08 + Math.random() * 0.84;
        fy += (ft - fy) * Math.min(1, dt * (1.2 + d * 4));
        const inside = Math.abs(fy - zy) < zoneH / 2;
        prog += (inside ? 0.32 : -(0.18 + d * 0.22)) * dt;
        zone.style.height = `${zoneH * 100}%`; zone.style.bottom = `${(zy - zoneH / 2) * 100}%`;
        zone.classList.toggle('on', inside);
        fish.style.bottom = `calc(${fy * 100}% - 12px)`;
        fill.style.height = `${Math.max(0, Math.min(1, prog)) * 100}%`;
        if (prog >= 1) { win(); return; }
        if (prog <= 0) { lose('Đứt dây! Cá thoát mất rồi.'); return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    async function win() {
      phase = 'done'; cancelAnimationFrame(raf); reel.classList.add('hidden');
      const res = await end('fish', token, { caught: true }); token = null;
      const res2 = res.ok && res.result;
      const pic = el('div', 'fish-catch', res2 && res2.chest ? '🎁' : (ctx.FISH[res2 && res2.fish] || {}).icon || '🐟');
      if (res2 && res2.tier != null) pic.style.filter = `drop-shadow(0 0 10px ${TIER_COLOR[res2.tier]})`;
      pond.appendChild(pic); later(() => pic.remove(), 2200);
      idle(`🎉 ${ctx.esc(res.msg)}`);
    }
    async function lose(msg) {
      const tk = token; token = null; phase = 'done'; cancelAnimationFrame(raf);
      ctx.Sound.play('error');
      if (tk) await end('fish', tk, { caught: false });
      idle(msg);
    }
    stopFn = () => {
      phase = 'stopped'; cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers = [];
      window.removeEventListener('pointerup', up); window.removeEventListener('keydown', key); window.removeEventListener('keyup', key);
      if (token) { ctx.api.action({ type: 'gameFinish', game: 'fish', token, result: { caught: false } }); token = null; }
    };
  }

  /** Chọn mức cược (xu trong game). */
  function betPicker(onChange) {
    const box = el('div', 'bet-box');
    const lim = (ctx.games && ctx.games.bet) || { min: 10, max: 500 };
    let bet = Math.min(50, lim.max);
    const label = el('span', 'bet-label');
    const show = () => { label.innerHTML = `Cược: <b>${bet}</b> xu · đang có ${ctx.V().money} xu`; box.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', Number(c.dataset.v) === bet)); onChange && onChange(bet); };
    for (const v of [10, 50, 100, 200, 500].filter((x) => x >= lim.min && x <= lim.max)) {
      const c = el('button', 'chip', String(v)); c.dataset.v = v;
      c.onclick = () => { bet = v; ctx.Sound.play('coin'); show(); };
      box.appendChild(c);
    }
    box.appendChild(label);
    show();
    return { el: box, get: () => bet, refresh: show };
  }

  // ---------------------------------------------------------------- 4. Hoa 21 (Blackjack, cược xu)
  const SUITS = ['hoa_hong', 'mai_vang', 'oai_huong', 'hoa_sen']; // 4 "chất" là 4 loài hoa
  const RANK = (r) => (r === 1 ? 'A' : r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : String(r));
  const FACE = { 11: '🪴', 12: '🐾', 13: '🏠' };
  function cardEl(c, hidden) {
    const d = el('div', `bj-card${hidden ? ' back' : ''}`);
    if (hidden) { d.textContent = '✿'; return d; }
    d.appendChild(el('b', '', RANK(c.r)));
    if (FACE[c.r]) d.appendChild(el('span', 'bj-face', FACE[c.r]));
    else {
      const sp = ctx.SP[SUITS[c.s]];
      if (sp) d.appendChild(ctx.canvasOf(ctx.Sprites.plant(sp, 'bloom')));
    }
    d.appendChild(el('b', 'rev', RANK(c.r)));
    return d;
  }
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  /** Bay 1 lá từ bộ bài tới hàng bài (úp hoặc ngửa). */
  async function flyCard(deckEl, row, card, hidden) {
    const target = cardEl(card, hidden);
    target.style.visibility = 'hidden';
    row.appendChild(target);
    const from = deckEl.getBoundingClientRect(); const to = target.getBoundingClientRect();
    const fly = cardEl(card, true);
    fly.classList.add('bj-fly');
    Object.assign(fly.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${to.width}px`, height: `${to.height}px` });
    document.body.appendChild(fly);
    ctx.Sound.play('click');
    await wait(20);
    fly.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) rotate(${hidden ? 0 : 360}deg)`;
    await wait(380);
    fly.remove();
    target.style.visibility = '';
    if (!hidden) target.classList.add('flip-in');
    return target;
  }

  async function blackjack(c) {
    ctx = c; stop();
    const body = frameView('🃏 Hoa 21 – cược xu, rút gần 21 nhất mà không quá 21. Thắng ×2, Blackjack ×2.5, hoà trả lại cược. Pet của bạn làm nhà cái (rút tới 17).');
    const bets = betPicker(); body.appendChild(bets.el);
    const table = el('div', 'bj-table'); body.appendChild(table);
    const dealerRow = el('div', 'bj-row'); const playerRow = el('div', 'bj-row');
    const dealerInfo = el('div', 'bj-info'); const playerInfo = el('div', 'bj-info');
    const pet = ctx.V().pet && ctx.PET[ctx.V().pet.id];
    const dealerName = pet ? `${pet.name} (nhà cái)` : 'Nhà cái';
    const petBox = el('div', 'bj-pet');
    if (pet) petBox.appendChild(ctx.canvasOf(ctx.Sprites.pet(pet, 'idle')));
    const deck = el('div', 'bj-deck'); for (let k = 0; k < 4; k++) deck.appendChild(el('i'));
    table.append(petBox, dealerInfo, dealerRow, playerInfo, playerRow, deck);
    const actions = el('div', 'bj-actions'); body.appendChild(actions);
    const hit = el('button', 'primary', '➕ Rút'); const stand = el('button', '', '✋ Dằn');
    const again = el('button', 'primary', '🃏 Đặt cược & chia bài'); const out = el('button', '', 'Về vườn');
    out.onclick = () => { stop(); ctx.exitTall(); };
    let token = null; let busy = false; let alive = true;
    let shownP = 0; let shownD = 0; let holeEl = null; // lá úp của nhà cái
    const left = () => ((ctx.V().minigames || {}).blackjack || { left: 0 }).left;
    const scoreOf = (cards) => { let t = 0; let a = 0; for (const x of cards) { if (x.r === 1) { a++; t += 11; } else t += Math.min(10, x.r); } while (t > 21 && a) { t -= 10; a--; } return t; };

    /** Hiện dần các lá mới (bay từ bộ bài). done = lật lá úp và nhà cái rút tiếp. */
    async function show(v, done) {
      if (shownP === 0 && shownD === 0) { // chia lần đầu: người – nhà cái – người – nhà cái (úp)
        await flyCard(deck, playerRow, v.player[0]); shownP = 1;
        await flyCard(deck, dealerRow, v.dealer[0]); shownD = 1;
        await flyCard(deck, playerRow, v.player[1]); shownP = 2;
        holeEl = await flyCard(deck, dealerRow, null, true);
      }
      while (alive && shownP < v.player.length) { await flyCard(deck, playerRow, v.player[shownP]); shownP++; playerInfo.textContent = `Bạn: ${scoreOf(v.player.slice(0, shownP))}`; }
      playerInfo.textContent = `Bạn: ${v.playerScore}`;
      if (!done) { dealerInfo.textContent = `${dealerName}: ?`; return; }
      if (holeEl) { // lật lá úp
        const face = cardEl(v.dealer[1]); face.classList.add('flip-in');
        holeEl.replaceWith(face); holeEl = null; shownD = 2; ctx.Sound.play('click');
        dealerInfo.textContent = `${dealerName}: ${scoreOf(v.dealer.slice(0, 2))}`;
        await wait(450);
      }
      while (alive && shownD < v.dealer.length) { // nhà cái rút từ bộ bài
        await flyCard(deck, dealerRow, v.dealer[shownD]); shownD++;
        dealerInfo.textContent = `${dealerName}: ${scoreOf(v.dealer.slice(0, shownD))}`;
        await wait(250);
      }
      dealerInfo.textContent = `${dealerName}: ${v.dealerScore}`;
    }
    const showEnd = (r) => {
      token = null;
      const res = el('div', 'game-result');
      const t = r.result && r.result.title ? r.result.title : '';
      res.innerHTML = `<b>${ctx.esc(t)}</b><br>${ctx.esc(r.msg)}<br><small>Còn ${left()} ván hôm nay · đang có ${ctx.V().money} xu</small><br>`;
      again.textContent = '🔁 Ván mới'; again.disabled = left() <= 0;
      res.append(again, out);
      body.appendChild(res);
      bets.el.classList.remove('locked');
      ctx.Sound.play(['blackjack', 'win'].includes(r.outcome) ? 'levelup' : r.outcome === 'push' ? 'coin' : 'error');
    };
    async function deal() {
      if (busy) return;
      body.querySelectorAll('.game-result').forEach((x) => x.remove());
      busy = true;
      const r = await begin('blackjack', bets.get());
      if (!r) { busy = false; actions.innerHTML = ''; actions.append(again, out); return; }
      bets.el.classList.add('locked'); setTimeout(() => bets.refresh(), 50);
      dealerRow.innerHTML = ''; playerRow.innerHTML = ''; shownP = 0; shownD = 0; holeEl = null;
      actions.innerHTML = '';
      await show(r, !!r.done);
      busy = false;
      if (r.done) { showEnd(r); return; }
      token = r.token; actions.append(hit, stand);
    }
    async function mv(action) {
      if (!token || busy) return;
      busy = true; hit.disabled = stand.disabled = true;
      const r = await ctx.api.action({ type: 'gameMove', game: 'blackjack', token, move: action });
      if (!r.ok) { busy = false; hit.disabled = stand.disabled = false; ctx.toast(r.msg, true); return; }
      await show(r, !!r.done);
      busy = false; hit.disabled = stand.disabled = false;
      if (r.done) { actions.innerHTML = ''; showEnd(r); }
    }
    hit.onclick = () => mv('hit'); stand.onclick = () => mv('stand');
    again.onclick = deal;
    stopFn = () => { token = null; alive = false; document.querySelectorAll('.bj-fly').forEach((x) => x.remove()); };
    actions.append(again, out);
    dealerInfo.textContent = `${dealerName}: chờ chia bài`; playerInfo.textContent = 'Bạn: chọn mức cược ở trên rồi chia bài';
  }

  // ---------------------------------------------------------------- 5. Bầu cua tôm cá (cược xu, mặt xúc xắc là pet trong cửa hàng)
  async function baucua(c) {
    ctx = c; stop();
    const faces = (ctx.games && ctx.games.baucua) || [];
    const name = (id) => (ctx.PET[id] ? ctx.PET[id].name : id);
    const pic = (id, cls) => { const cv = ctx.canvasOf(ctx.Sprites.pet(ctx.PET[id], 'idle')); if (cls) cv.className = cls; return cv; };
    const body = frameView('🎲 Bầu cua thú cưng – chọn mệnh giá rồi bấm vào con muốn đặt (tối đa 3 đồng xu, đặt thêm sẽ bỏ đồng đặt đầu tiên). Ra 1 mặt ×2, 2 mặt ×3, 3 mặt ×4.');
    const coins = []; // [{ face, amount }] theo thứ tự đặt
    let showInfo = () => {};
    const chips = betPicker(() => showInfo('')); body.appendChild(chips.el);
    const wrapB = el('div', 'bc-wrap'); body.appendChild(wrapB);
    const board = el('div', 'bc-board'); wrapB.appendChild(board);
    const plate = el('div', 'bc-plate'); wrapB.appendChild(plate);
    const side = el('div', 'bc-side'); wrapB.appendChild(side);
    const info = el('div', 'bc-info'); const roll = el('button', 'primary', '🎲 Lắc'); const clear = el('button', '', '↺ Bỏ hết xu');
    side.append(info, roll, clear);
    let rolling = false;
    // Đĩa + bát: 3 viên xúc xắc 3D (6 mặt = 6 con pet), gieo lăn trên đĩa rồi dừng đúng mặt máy chủ trả về.
    plate.classList.add('bc-dish');
    const bowl = el('div', 'bc-bowl'); plate.appendChild(bowl);
    const SIDE = ['front', 'back', 'right', 'left', 'top', 'bottom'];
    const FACE_ROT = { front: [0, 0], back: [0, 180], right: [0, -90], left: [0, 90], top: [-90, 0], bottom: [90, 0] };
    const dice = [0, 1, 2].map((n) => {
      const slot = el('div', `bc-die3d d${n}`); const cube = el('div', 'bc-cube');
      faces.forEach((id, k) => { const f = el('div', `bc-face ${SIDE[k]}`); f.appendChild(pic(id)); cube.appendChild(f); });
      slot.appendChild(cube); plate.appendChild(slot);
      cube.style.transform = `rotateX(${-20 + n * 15}deg) rotateY(${25 - n * 20}deg)`;
      return { slot, cube, rx: 0, ry: 0 };
    });
    const sideOf = (id) => SIDE[Math.max(0, faces.indexOf(id))];
    /** Gieo: xúc xắc tung lên rồi lăn trên đĩa, dừng ở mặt `id`. */
    function throwDie(d, id, n) {
      const [fx, fy] = FACE_ROT[sideOf(id)];
      d.rx = Math.ceil(d.rx / 360) * 360 + 720 + 360 * n + fx; // thêm vài vòng lăn
      d.ry = Math.ceil(d.ry / 360) * 360 + 1080 - 360 * n + fy;
      d.slot.classList.remove('land'); void d.slot.offsetWidth; d.slot.classList.add('land');
      d.cube.style.transition = `transform ${1.15 + n * 0.18}s cubic-bezier(.15,.65,.25,1)`;
      d.cube.style.transform = `rotateX(${d.rx}deg) rotateY(${d.ry}deg)`;
    }
    const left = () => ((ctx.V().minigames || {}).baucua || { left: 0 }).left;
    const total = () => coins.reduce((a, x) => a + x.amount, 0);
    const cells = {};
    function drawCoins() {
      for (const [id, cell] of Object.entries(cells)) {
        const stack = cell.querySelector('.bc-coins'); stack.innerHTML = '';
        coins.forEach((x, n) => { if (x.face === id) { const coin = el('span', `bc-coin${n === 0 && coins.length === 3 ? ' oldest' : ''}`, String(x.amount)); stack.appendChild(coin); } });
        cell.classList.toggle('on', coins.some((x) => x.face === id));
      }
    }
    showInfo = (msg) => {
      info.innerHTML = `${msg ? `${msg}<br>` : ''}${coins.length ? `Đặt ${coins.length}/3 đồng · tổng <b>${total()}</b> xu` : 'Chọn mệnh giá rồi bấm vào con để đặt xu'}<br>Còn <b>${left()}</b> lượt hôm nay · có ${ctx.V().money} xu`;
      roll.disabled = !coins.length || left() <= 0 || rolling || ctx.V().money < total();
      clear.disabled = !coins.length || rolling;
    };
    for (const id of faces) {
      if (!ctx.PET[id]) continue;
      const b = el('button', 'bc-cell'); b.dataset.k = id;
      b.append(pic(id, 'bc-pet'), el('small', '', name(id)), el('div', 'bc-coins'));
      b.onclick = () => {
        if (rolling) return;
        board.querySelectorAll('.bc-cell').forEach((x) => x.classList.remove('hit'));
        coins.push({ face: id, amount: chips.get() });
        if (coins.length > 3) coins.shift(); // quá 3 đồng: bỏ đồng đặt đầu tiên
        ctx.Sound.play('coin'); drawCoins(); showInfo('');
      };
      cells[id] = b; board.appendChild(b);
    }
    clear.onclick = () => { coins.length = 0; drawCoins(); showInfo(''); };
    showInfo('');
    roll.onclick = async () => {
      if (!coins.length || rolling) return;
      rolling = true; showInfo('');
      board.querySelectorAll('.bc-cell').forEach((x) => x.classList.remove('hit'));
      dice.forEach((d) => d.slot.classList.remove('hit'));
      const r = await begin('baucua', 0, coins.map((x) => ({ ...x })));
      if (!r) { rolling = false; showInfo(''); return; }
      // 1) úp bát lên đĩa và lắc  2) mở bát, xúc xắc lăn ra và dừng đúng mặt
      dice.forEach((d) => d.slot.classList.remove('hit'));
      plate.classList.add('covered'); ctx.Sound.play('click');
      await new Promise((ok) => setTimeout(ok, 350));
      plate.classList.add('shake'); ctx.Sound.play('water');
      const res = await ctx.api.action({ type: 'gameFinish', game: 'baucua', token: r.token, result: {} });
      const out = res.ok ? res.result : { dice: [], lines: [], hits: 0 };
      setTimeout(() => {
        plate.classList.remove('shake'); plate.classList.remove('covered'); ctx.Sound.play('open');
        out.dice.forEach((k, n) => throwDie(dice[n], k, n));
      }, 900);
      setTimeout(() => {
        const bet = new Set(coins.map((x) => x.face));
        out.dice.forEach((k, n) => dice[n].slot.classList.toggle('hit', bet.has(k)));
        board.querySelectorAll('.bc-cell').forEach((x) => x.classList.toggle('hit', out.dice.includes(x.dataset.k) && bet.has(x.dataset.k)));
        ctx.Sound.play(out.net > 0 ? 'levelup' : out.back ? 'coin' : 'error');
        rolling = false; chips.refresh();
        showInfo(`${out.net > 0 ? '🎉' : out.back ? '🙂' : '😿'} ${ctx.esc(res.msg)}`);
      }, 900 + 1550);
    };
    stopFn = () => {};
  }

  window.MiniGames = { bugs, memory, fishing, blackjack, baucua, stop, running };
}());

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

  async function begin(game) {
    const r = await ctx.api.action({ type: 'gameStart', game });
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

  window.MiniGames = { bugs, memory, fishing, stop, running };
}());

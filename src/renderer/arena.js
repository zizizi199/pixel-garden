'use strict';
/* Đấu trường thú (nhóm Supabase): vẽ trận đấu, ô trả lời, hiệu ứng chưởng lực và lật bài thưởng.
   Mọi luật (từ, đúng/sai, điểm, bài thưởng) do server quyết định; file này chỉ hiển thị và gửi thao tác. */
(function () {
  let draft = '';
  let animUntil = 0;
  const animated = new Set();
  let deadline = 0; let total = 30;
  let tickTimer = null;

  const FX_ICON = { bump: '💥', leaf: '🍃', water: '💧', petal: '🌸', fire: '🔥', ice: '❄', bolt: '⚡', wind: '🌪', dragon: '🐉', rainbow: '🌈', galaxy: '🌌' };

  function busy() { return performance.now() < animUntil; }

  function tick() {
    const el = document.getElementById('arena-left');
    const bar = document.getElementById('arena-bar');
    if (!el || !bar) { clearInterval(tickTimer); tickTimer = null; return; }
    const s = Math.max(0, (deadline - Date.now()) / 1000);
    el.textContent = `${Math.ceil(s)}s`;
    bar.style.width = `${Math.max(0, Math.min(100, (s / total) * 100))}%`;
    bar.classList.toggle('low', s < 8);
  }

  /** Pet tung chưởng: vật thể bay từ pet người thắng vòng sang pet đối thủ. */
  function blast(stage, fromLeft, power, ctx) {
    const pw = ctx.POWERS[power] || ctx.POWERS.cu_huc;
    const fx = document.createElement('div');
    fx.className = `arena-fx fx-${pw.fx} ${fromLeft ? 'ltr' : 'rtl'}`;
    fx.style.setProperty('--c', pw.color);
    fx.textContent = FX_ICON[pw.fx] || '💥';
    const name = document.createElement('div'); name.className = 'arena-shout'; name.style.setProperty('--c', pw.color);
    name.textContent = `${pw.name}!`;
    stage.append(fx, name);
    const target = stage.querySelector(fromLeft ? '.arena-pet.right' : '.arena-pet.left');
    setTimeout(() => target && target.classList.add('hit'), 650);
    animUntil = performance.now() + 1500;
    ctx.Sound.play(pw.tier >= 3 ? 'levelup' : 'harvest');
    setTimeout(() => { fx.remove(); name.remove(); if (target) target.classList.remove('hit'); }, 1500);
  }

  function prizeLabel(p, ctx) {
    if (!p || p.kind === 'none') return 'Không có gì (kho trống)';
    if (p.kind === 'seed') return `1 hạt ${ctx.SP[p.id] ? ctx.SP[p.id].name : p.id}`;
    if (p.kind === 'pot') return `1 ${ctx.POT[p.id] ? ctx.POT[p.id].name : p.id}`;
    return '?';
  }
  function prizePic(p, ctx) {
    if (p && p.kind === 'seed' && ctx.SP[p.id]) return ctx.canvasOf(ctx.Sprites.plant(ctx.SP[p.id], 'bloom'));
    if (p && p.kind === 'pot' && ctx.POT[p.id]) return ctx.canvasOf(ctx.Sprites.pot(ctx.POT[p.id]), 'small');
    const s = document.createElement('span'); s.textContent = '🕳'; return s;
  }

  function side(d, who, ctx, cls) {
    const box = document.createElement('div'); box.className = `arena-pet ${cls}`;
    const p = ctx.PET[who.pet];
    if (p) box.appendChild(ctx.petPic(p));
    const pw = ctx.POWERS[who.power] || ctx.POWERS.cu_huc;
    const info = document.createElement('div'); info.className = 'arena-name';
    info.innerHTML = `<b>${ctx.esc(who.name)}</b><small style="color:${pw.color}">${FX_ICON[pw.fx] || ''} ${ctx.esc(pw.name)}</small>`;
    const sc = document.createElement('div'); sc.className = 'arena-score'; sc.textContent = who.score;
    box.append(info, sc);
    return box;
  }

  function render(body, ctx) {
    const d = ctx.L.duel;
    const wrap = document.createElement('div'); wrap.className = 'arena';
    body.appendChild(wrap);
    if (!d || d.status === 'loading') { wrap.innerHTML = '<p class="meta">Đang vào đấu trường…</p>'; return; }
    const me = d[d.me]; const opp = d.me === 'a' ? d.b : d.a;
    const left = d.me === 'a' ? d.a : d.b; const right = d.me === 'a' ? d.b : d.a; // mình luôn ở bên trái

    const stage = document.createElement('div'); stage.className = 'arena-stage';
    stage.append(side(d, left, ctx, 'left'), Object.assign(document.createElement('div'), { className: 'arena-vs', textContent: 'VS' }), side(d, right, ctx, 'right'));
    wrap.appendChild(stage);

    const row = (cls) => { const x = document.createElement('div'); x.className = cls; wrap.appendChild(x); return x; };
    const btn = (label, onClick, primary) => { const b = document.createElement('button'); b.textContent = label; if (primary) b.className = 'primary'; b.onclick = onClick; return b; };

    if (d.status === 'invited') {
      const r = row('arena-msg');
      r.textContent = `Đang chờ ${opp.name} nhận lời thách đấu…`;
      r.appendChild(btn('Huỷ lời mời', () => ctx.lanAct({ type: 'duelForfeit' })));
      return;
    }
    if (['declined', 'expired', 'cancelled'].includes(d.status)) {
      const r = row('arena-msg');
      r.textContent = d.status === 'declined' ? `${opp.name} đã từ chối.` : d.status === 'expired' ? 'Lời mời đã hết hạn.' : 'Đã huỷ lời mời.';
      r.appendChild(btn('Đóng', () => ctx.lanAct({ type: 'duelClose' })));
      return;
    }

    if (d.status === 'playing') {
      const ot = d.round > 3;
      const head = row('arena-round');
      head.innerHTML = `<b>${ot ? `Hiệp phụ ${d.round - 3}` : `Vòng ${d.round}/3`}</b> · từ tiếng Anh ${d.pattern.length} chữ – điền chữ còn thiếu`;
      const tiles = row('arena-word');
      const shown = d.roundOver && d.word ? d.word : d.pattern;
      [...shown].forEach((ch, i) => {
        const t = document.createElement('span');
        const hidden = d.pattern[i] === '_';
        t.className = `tile${hidden ? ' gap' : ''}${d.roundOver && hidden ? ' answer' : ''}`;
        t.textContent = ch === '_' ? '' : ch.toUpperCase();
        tiles.appendChild(t);
      });
      const tm = row('arena-timer');
      tm.innerHTML = '<i><b id="arena-bar"></b></i><span id="arena-left"></span>';
      if (!d.roundOver) { deadline = Date.now() + d.left * 1000; total = 30; if (!tickTimer) tickTimer = setInterval(tick, 250); tick(); }
      else { deadline = 0; tick(); }

      if (d.roundOver) {
        const r = row('arena-msg');
        const won = d.roundWinner === me.id; const lost = d.roundWinner && !won;
        r.textContent = won ? `🎉 Bạn trả lời đúng trước! Từ: ${String(d.word).toUpperCase()}`
          : lost ? `😵 ${opp.name} nhanh hơn! Từ: ${String(d.word).toUpperCase()}` : `⏰ Hết giờ, không ai đúng. Từ: ${String(d.word).toUpperCase()}`;
        const key = `${d.id}|${d.round}`;
        if (d.roundWinner && !animated.has(key)) {
          animated.add(key);
          const fromLeft = d.roundWinner === left.id;
          setTimeout(() => blast(stage, fromLeft, (fromLeft ? left : right).power, ctx), 30);
        }
      } else {
        const form = document.createElement('form'); form.className = 'arena-answer';
        const input = document.createElement('input');
        input.maxLength = 12; input.placeholder = 'Gõ cả từ, vd APPLE'; input.autocomplete = 'off'; input.spellcheck = false;
        input.value = draft; input.disabled = d.tries >= 3;
        input.oninput = () => { draft = input.value; };
        const send = document.createElement('button'); send.type = 'submit'; send.className = 'primary'; send.textContent = 'Trả lời';
        send.disabled = d.tries >= 3;
        const tries = document.createElement('small'); tries.textContent = d.tries >= 3 ? 'Hết lượt – chờ đối thủ' : `Còn ${3 - d.tries} lượt`;
        form.append(input, send, tries);
        form.onsubmit = async (e) => {
          e.preventDefault();
          const guess = input.value.trim(); if (!guess) return;
          draft = '';
          const r = await ctx.lanAct({ type: 'duelAnswer', guess }, true);
          if (r && r.ok && !r.correct) { ctx.Sound.play('error'); ctx.toast(r.msg, true); }
        };
        wrap.appendChild(form);
        if (ctx.focus) setTimeout(() => { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }, 0);
      }
      const foot = row('arena-foot');
      foot.appendChild(btn('🏳 Bỏ cuộc', () => { if (!ctx.needConfirm('forfeit', 'Bấm lần nữa để bỏ cuộc (đối thủ thắng).')) ctx.lanAct({ type: 'duelForfeit' }); }));
      return;
    }

    // ------------------------------------------------ kết thúc
    const iWon = d.winner === me.id;
    const r = row('arena-result');
    r.textContent = !d.winner ? '🤝 Hoà – không ai mất gì.' : iWon ? `🏆 Bạn thắng ${opp.name} ${me.score}–${opp.score}!` : `💔 ${opp.name} thắng ${opp.score}–${me.score}.`;
    const cards = row('arena-cards');
    if (d.winner && d.pick === null) {
      if (iWon) {
        const hint = row('arena-msg'); hint.textContent = 'Lật 1 lá bài để lấy 1 món trong kho của đối thủ:';
        wrap.insertBefore(hint, cards);
        for (let i = 0; i < 3; i++) {
          const c = document.createElement('button'); c.className = 'arena-card back'; c.textContent = '🂠';
          c.onclick = () => { ctx.Sound.play('coin'); ctx.lanAct({ type: 'duelPick', idx: i }); };
          cards.appendChild(c);
        }
      } else {
        cards.textContent = `${opp.name} đang lật bài để lấy 1 món của bạn…`;
      }
    } else if (d.winner && Array.isArray(d.cards)) {
      d.cards.forEach((p, i) => {
        const c = document.createElement('div'); c.className = `arena-card face${i === d.pick ? ' chosen' : ''}`;
        c.appendChild(prizePic(p, ctx));
        const t = document.createElement('small'); t.textContent = prizeLabel(p, ctx); c.appendChild(t);
        cards.appendChild(c);
      });
      const m = row('arena-msg');
      m.textContent = iWon ? `Bạn nhận được ${prizeLabel(d.prize, ctx)}.` : `Bạn mất ${prizeLabel(d.prize, ctx)}.`;
    }
    const foot = row('arena-foot');
    foot.appendChild(btn('Rời đấu trường', () => ctx.lanAct({ type: 'duelClose' }), true));
  }

  window.Arena = { render, busy };
}());

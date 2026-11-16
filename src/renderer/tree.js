'use strict';
/* Thần mộc – cây chung của nhóm: vẽ cây pixel theo số mốc đã đạt, thanh tiến độ, góp sức, rương mốc, bảng đóng góp. */
(function () {
  const CHEST = ['2 Phân thường + 2 hạt', '2 NPK + 3 hạt', 'Phân siêu tốc + 200 xu', 'Chậu Uncommon–Rare + 2 NPK', 'Phân thần kỳ + 500 xu',
    'Chậu Rare–Epic + Phân siêu tốc', 'Chưởng lực (cửa hàng)', '2 Phân thần kỳ + hạt Epic', 'Tiên dược + chậu Epic–Legendary', 'Chưởng lực chỉ có từ vòng quay'];

  /** Vẽ cây pixel: mốc càng cao thân càng cao, tán càng rộng; mốc 6+ ra quả vàng, mốc 10 phát sáng. */
  function drawTree(canvas, stage, t) {
    const W = 64; const H = 64; const k = 3;
    canvas.width = W * k; canvas.height = H * k;
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x * k, y * k, w * k, h * k); };
    px(0, 56, W, 8, '#8d5a2b'); px(0, 56, W, 2, '#6a994e'); // đất + cỏ
    const trunkH = 6 + stage * 1.8;
    const trunkW = 2 + Math.floor(stage / 3);
    const cx = 32;
    px(cx - trunkW, 56 - trunkH, trunkW * 2, trunkH, '#6f4518');
    px(cx - trunkW, 56 - trunkH, 1, trunkH, '#8b5e34');
    if (stage >= 2) { px(cx - trunkW - 5, 56 - trunkH * 0.6, 5, 1, '#6f4518'); px(cx + trunkW, 56 - trunkH * 0.7, 6, 1, '#6f4518'); }
    const r = 4 + stage * 1.3;
    const top = 56 - trunkH;
    const sway = Math.sin(t / 900) * 0.6;
    const blobs = [[0, 0, 1], [-0.7, 0.35, 0.75], [0.7, 0.35, 0.75], [-0.35, -0.55, 0.7], [0.4, -0.5, 0.7]];
    const greens = stage >= 10 ? ['#ffd23f', '#f4a300'] : ['#52b788', '#2d6a4f'];
    for (const [dx, dy, s] of blobs) {
      const rr = r * s; const x0 = cx + dx * r + sway; const y0 = top + dy * r;
      for (let y = -rr; y <= rr; y++) {
        const w = Math.floor(Math.sqrt(rr * rr - y * y));
        px(Math.round(x0 - w), Math.round(y0 + y), w * 2, 1, y < -rr / 3 ? greens[0] : greens[1]);
      }
    }
    if (stage >= 6) { // quả vàng
      for (let i = 0; i < stage - 4; i++) {
        const a = i * 2.1 + 0.5; const fx = cx + Math.cos(a) * r * 0.75 + sway; const fy = top + Math.sin(a) * r * 0.55;
        px(Math.round(fx), Math.round(fy), 2, 2, '#ffd23f'); px(Math.round(fx), Math.round(fy), 1, 1, '#fff3b0');
      }
    }
    if (stage >= 10) { // lấp lánh
      for (let i = 0; i < 6; i++) {
        const a = t / 600 + i; px(Math.round(cx + Math.cos(a) * (r + 4)), Math.round(top + Math.sin(a * 1.3) * (r + 2)), 1, 1, '#ffffff');
      }
    }
  }

  const TOP = ['chưởng lực Vòng quay + Tiên dược + Tượng Thần mộc + danh hiệu', 'chậu Epic + 2 Phân thần kỳ', '3 Phân thần kỳ + 500 xu'];
  let animRaf = 0;
  function render(body, ctx) {
    cancelAnimationFrame(animRaf);
    const d = ctx.tree;
    const wrap = document.createElement('div'); wrap.className = 'tree-wrap'; body.appendChild(wrap);
    if (!d) { wrap.innerHTML = '<p class="meta">Đang tải Thần mộc…</p>'; return; }
    const reached = d.marks.filter((m) => d.growth >= m).length;
    const max = d.marks[d.marks.length - 1] || 1;

    const left = document.createElement('div'); left.className = 'tree-left';
    const cv = document.createElement('canvas'); cv.className = 'tree-canvas';
    left.appendChild(cv);
    const cap = document.createElement('div'); cap.className = 'tree-cap';
    cap.innerHTML = `<b>🌳 Thần mộc · mùa ${d.season}</b><br>${d.growth}/${max} điểm · mốc ${reached}/10`
      + (d.resetAt ? `<br>🍎 Đã kết trái! Mùa mới lúc ${new Date(d.resetAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}` : '');
    left.appendChild(cap);
    wrap.appendChild(left);
    const loop = (t) => { if (!cv.isConnected) return; drawTree(cv, reached, t); animRaf = requestAnimationFrame(loop); };
    animRaf = requestAnimationFrame(loop);

    const right = document.createElement('div'); right.className = 'tree-right'; wrap.appendChild(right);
    // thanh tiến độ + mốc
    const bar = document.createElement('div'); bar.className = 'tree-bar';
    const fill = document.createElement('b'); fill.style.width = `${Math.min(100, (d.growth / max) * 100)}%`; bar.appendChild(fill);
    d.marks.forEach((m, i) => {
      const dot = document.createElement('i'); dot.style.left = `${(m / max) * 100}%`; dot.title = `Mốc ${i + 1}: ${m} điểm – ${CHEST[i]}`;
      dot.className = d.growth >= m ? 'on' : ''; bar.appendChild(dot);
    });
    right.appendChild(bar);

    // góp sức hôm nay
    const act = document.createElement('div'); act.className = 'tree-act';
    const water = document.createElement('button'); water.className = 'primary';
    water.textContent = d.today.water ? '💧 Đã tưới hôm nay' : '💧 Tưới Thần mộc (+10)';
    water.disabled = !!d.today.water || !!d.resetAt;
    water.onclick = () => ctx.run({ type: 'treeWater' });
    act.appendChild(water);
    const left2 = d.today.fertMax - d.today.fert;
    for (const it of ctx.CAT.items.filter((x) => x.fert && (ctx.V.inventory.items[x.id] || 0) > 0)) {
      const b = document.createElement('button');
      b.textContent = `🌱 ${it.name} +${it.fert} (${ctx.V.inventory.items[it.id]})`;
      b.disabled = it.fert > left2 || !!d.resetAt;
      b.onclick = () => ctx.run({ type: 'treeFert', item: it.id });
      act.appendChild(b);
    }
    const note = document.createElement('small'); note.textContent = `Phân góp hôm nay: ${d.today.fert}/${d.today.fertMax} điểm. Tưới 1 lần/ngày.`;
    act.appendChild(note);
    right.appendChild(act);

    // rương mốc
    const chests = document.createElement('div'); chests.className = 'tree-chests';
    d.marks.forEach((m, i) => {
      const n = i + 1;
      const c = document.createElement('button');
      const got = d.claimed.includes(n); const ready = d.growth >= m && !got;
      c.className = `tree-chest${got ? ' got' : ready ? ' ready' : ''}`;
      c.innerHTML = `<span>${got ? '✔' : ready ? '🎁' : '🔒'}</span><small>Mốc ${n}</small>`;
      c.title = `${m} điểm – ${CHEST[i]}${got ? ' (đã nhận)' : ''}`;
      c.disabled = !ready || !d.helped;
      c.onclick = () => ctx.run({ type: 'treeClaim', milestone: n });
      chests.appendChild(c);
    });
    right.appendChild(chests);
    if (!d.helped) {
      const h = document.createElement('small'); h.className = 'tree-hint';
      h.textContent = 'Góp sức ít nhất 1 lần trong mùa này (tưới hoặc bón) để nhận rương các mốc cây đạt được.';
      right.appendChild(h);
    }

    // top 3 khi kết trái
    if (d.top && d.top.length) {
      const top = document.createElement('div'); top.className = 'tree-top';
      top.innerHTML = '<b>🏆 Top mùa này (chốt lúc kết trái)</b>';
      d.top.forEach((x) => {
        const row = document.createElement('div'); if (x.me) row.className = 'me';
        row.textContent = `${['🥇', '🥈', '🥉'][x.rank - 1]} ${x.name} – ${x.total} · ${TOP[x.rank - 1]}${x.claimed ? ' ✔' : ''}`;
        if (x.me && !x.claimed) {
          const b = document.createElement('button'); b.className = 'primary'; b.textContent = '🏆 Nhận rương top';
          b.onclick = () => ctx.run({ type: 'treeClaimTop' }); row.appendChild(b);
        }
        top.appendChild(row);
      });
      right.appendChild(top);
    }

    // bảng đóng góp
    const board = document.createElement('div'); board.className = 'tree-board';
    board.innerHTML = `<b>Đóng góp mùa này</b><br><small>Khi cây kết trái: top 3 nhận rương riêng, top 1 được danh hiệu 🌳 Người giữ Thần mộc + Tượng Thần mộc.</small>${d.board.length ? '' : '<br><small>Chưa ai góp – hãy là người đầu tiên!</small>'}`;
    d.board.forEach((x, i) => {
      const row = document.createElement('div'); if (x.me) row.className = 'me';
      row.textContent = `${['🥇', '🥈', '🥉'][i] || `${i + 1}.`} ${x.name} – ${x.total}`;
      board.appendChild(row);
    });
    wrap.appendChild(board);
  }

  window.GroupTree = { render };
}());

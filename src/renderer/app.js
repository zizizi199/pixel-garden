'use strict';
/* Giao diện thanh vườn. Mọi logic game nằm ở tiến trình chính (src/core); file này chỉ vẽ và gửi hành động. */
(async function () {
  const api = window.garden;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let CAT; let V; let L; let PACKS = [];
  let mode = 'bar';
  let tool = 'hand';
  let selected = null;
  let panel = null; // shop | bag | wiki | log | settings | detail
  let sub = null; // tab con của panel
  let panelArg = null;
  let lanPlayer = null;
  let lanInvite = '';
  let confirmTap = null; // {key, until}
  const GARDEN_SCALE = 2.5; // số px màn hình cho 1 pixel sprite trong vườn
  const SP = {}; const POT = {}; const DEC = {}; const PET = {};

  const STAGE_VI = { seed: 'Hạt', sprout: 'Mầm', young: 'Cây non', bud: 'Nụ', bloom: 'Đang nở', faded: 'Đã tàn', dead: 'Đã chết', empty: 'Trống' };
  const TOOLS = [
    { id: 'hand', icon: 'hand', title: 'Tay: bấm cây để làm việc phù hợp nhất (thu hoạch / tưới / gieo)' },
    { id: 'water', icon: 'can', title: 'Bình tưới' },
    { id: 'harvest', icon: 'shovel', title: 'Xẻng: thu hoạch' },
    { id: 'fert', icon: 'bag', title: 'Phân bón' },
    { id: 'shovel', icon: 'trash', title: 'Nhổ bỏ cây (bấm 2 lần)' },
  ];

  function dur(min) {
    min = Math.max(0, Math.round(min || 0));
    const h = Math.floor(min / 60); const m = min % 60;
    if (h && m) return `${h}g${String(m).padStart(2, '0')}`;
    if (h) return `${h}g`;
    return `${m}p`;
  }

  // ------------------------------------------------------------ hành động
  async function act(a, anchor) {
    const r = await api.action(a);
    toast(r.msg, !r.ok);
    if (!r.ok) Sound.play('error');
    else Sound.play({ water: 'water', waterAll: 'water', harvest: 'harvest', plant: 'plant', buy: 'coin', buySlot: 'coin', fertilize: 'fert', remove: 'remove', setPet: 'pet', placePot: 'plant', placeDecor: 'plant' }[a.type] || 'click');
    if (r.levelUp) setTimeout(() => Sound.play('levelup'), 350);
    if (r.ok && anchor && (r.money || r.exp)) floatText(anchor, `+${r.money} xu  +${r.exp} EXP`);
    if (r.ok && anchor) burst(anchor, a.type === 'water' ? 'drop' : a.type === 'harvest' ? 'petal' : null);
    if (r.levelUp) setTimeout(() => toast(`🎉 Lên cấp ${V.level}! Có thể đã mở khoá cây/đồ mới.`), 900);
    return r;
  }

  let toastTimer = null;
  function toast(msg, err) {
    if (!msg) return;
    const t = $('#toast');
    t.textContent = msg;
    t.className = `show${err ? ' err' : ''}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ''; }, 2200);
  }
  function floatText(anchor, text) {
    const r = anchor.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'float'; f.textContent = text;
    f.style.left = `${r.left}px`; f.style.top = `${r.top + 20}px`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1300);
  }
  /** Hiệu ứng hạt: giọt nước rơi khi tưới, cánh hoa bung khi thu hoạch. */
  function burst(anchor, kind) {
    if (!kind) return;
    const r = anchor.getBoundingClientRect();
    for (let k = 0; k < 7; k++) {
      const e = document.createElement('i');
      e.className = `burst ${kind}`;
      e.style.left = `${r.left + r.width / 2 + (Math.random() * 40 - 20)}px`;
      e.style.top = `${r.top + (kind === 'drop' ? 10 : 50) + Math.random() * 10}px`;
      e.style.setProperty('--dx', `${Math.random() * 30 - 15}px`);
      e.style.animationDelay = `${k * 0.05}s`;
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 1200);
    }
  }

  function needConfirm(key, msg) {
    const now = Date.now();
    if (confirmTap && confirmTap.key === key && confirmTap.until > now) { confirmTap = null; return false; }
    confirmTap = { key, until: now + 3000 };
    toast(msg);
    return true;
  }

  // ------------------------------------------------------------ bố cục
  function setMode(m) {
    mode = m;
    document.body.classList.remove('mode-collapsed', 'mode-bar', 'mode-panel');
    document.body.classList.add(`mode-${m}`);
    $('#tab').classList.toggle('hidden', m !== 'collapsed');
    $('#app').classList.toggle('hidden', m === 'collapsed');
    $('#panel').classList.toggle('hidden', m !== 'panel' || !panel);
    if (m !== 'panel') panel = null;
    renderMenu();
  }
  function openPanel(name, arg = null, subTab = null) {
    panel = name; panelArg = arg; sub = subTab;
    if (mode !== 'panel') api.setLayout('panel');
    $('#panel').classList.remove('hidden');
    renderPanel(); renderMenu();
  }
  function closePanel() {
    document.querySelectorAll('#panel .reveal').forEach((x) => x.remove());
    panel = null;
    api.setLayout('bar');
  }

  // ------------------------------------------------------------ HUD & thanh
  function renderHud() {
    $('#lv').textContent = `Cấp ${V.level}`;
    $('#money').textContent = `${V.money.toLocaleString('vi-VN')} xu`;
    $('#exp-fill').style.width = `${Math.min(100, (V.exp / V.expNext) * 100)}%`;
    $('#exp-text').textContent = `${V.exp} / ${V.expNext} EXP`;
    // Chỉ hiện thông tin trong game (hoa sắp nở, pet) – không hiện giờ làm việc (riêng tư).
    const clk = $('#clock');
    const next = V.slots.filter((x) => x.bloomInMin != null && !x.waiting && x.stage !== 'dead').sort((a, b) => a.bloomInMin - b.bloomInMin)[0];
    const ready = V.slots.filter((x) => x.stage === 'bloom').length;
    const lines = [];
    if (ready) lines.push(`<b>✿ ${ready} hoa đã nở</b>`);
    else if (next) lines.push(`✿ ${esc(SP[next.species].name)}: nở sau ${dur(next.bloomInMin)}`);
    else lines.push('✿ Chưa có cây đang lớn');
    if (V.pet) {
      const sl = petSleeping();
      lines.push(sl ? `💤 ${esc(V.pet.name)} ngủ, còn ${Math.ceil((V.now + V.pet.sleepMs - Date.now()) / 60000)}p` : `🛡 ${esc(V.pet.name)} đang canh`);
    }
    clk.className = '';
    clk.innerHTML = lines.map((l) => `<div>${l}</div>`).join('');
    const tools = $('#tools');
    tools.innerHTML = '';
    for (const t of TOOLS) {
      const b = document.createElement('button');
      b.title = t.title;
      const ic = document.createElement('canvas'); ic.className = 'tool-ic';
      Sprites.paint(ic, Sprites.icon(t.icon));
      b.appendChild(ic);
      if (t.id === tool) b.classList.add('on');
      if (t.id === 'fert') { const n = document.createElement('span'); n.className = 'n'; n.textContent = V.inventory.items.phan_bon || 0; b.appendChild(n); }
      b.onclick = () => { tool = t.id; renderHud(); };
      tools.appendChild(b);
    }
    if (V.unlocks.binh_lon) {
      const b = document.createElement('button');
      b.textContent = '💦 Tưới tất cả'; b.style.gridColumn = '1 / -1'; b.style.fontSize = '11px';
      b.onclick = () => act({ type: 'waterAll' });
      tools.appendChild(b);
    }
    // bầu trời theo giờ
    const h = new Date(V.now).getHours();
    $('#sky').className = h < 6 || h >= 19 ? 'night' : h < 11 ? 'morning' : h < 16 ? 'noon' : 'afternoon';
  }

  function slotStatus(s) {
    if (s.stage === 'empty') return '';
    if (s.stage === 'dead') return 'Chết';
    if (s.stage === 'bloom') return 'Nở!';
    if (s.stage === 'faded') return 'Tàn';
    if (s.thirsty) return 'Khát!';
    if (s.old) return 'Cây già';
    return '';
  }

  function slotTitle(s) {
    if (s.stage === 'empty') return `Ô ${s.i + 1}: trống – bấm để gieo hạt (${POT[s.pot].name})`;
    const lines = [`${s.name} · ${STAGE_VI[s.stage]}`, `Nước: ${s.water}% · Sức khoẻ: ${s.health}%`];
    if (s.bloomInMin != null && !s.waiting) lines.push(`Nở sau ~${dur(s.bloomInMin)} giờ`);
    if (s.waiting) lines.push(`Nụ đã sẵn, chờ khung giờ nở ${s.window[0]}–${s.window[1]}`);
    if (s.fadeInMin != null) lines.push(`Tàn sau ${dur(s.fadeInMin)}${s.window ? ` (hoặc khi hết ${s.window[1]})` : ''}`);
    if (s.thirstyInMin > 0) lines.push(`Khát sau ~${dur(s.thirstyInMin)}`);
    if (s.value) lines.push(`Thu hoạch: ${s.value.money} xu, ${s.value.exp} EXP`);
    if (s.fert > 0) lines.push(`Đang có phân bón (${dur(s.fert)})`);
    lines.push('Chuột phải: xem chi tiết');
    return lines.join('\n');
  }

  function renderSlots() {
    const box = $('#slots');
    box.innerHTML = '';
    V.slots.forEach((s) => {
      const d = document.createElement('div');
      d.className = `slot ${s.stage === 'empty' ? 'empty' : ''} ${selected === s.i ? 'selected' : ''} st-${s.stage}${s.wilting ? ' wilting' : ''}`;
      d.style.setProperty('--d', `${-((s.i * 0.73) % 3).toFixed(2)}s`);
      d.title = slotTitle(s);
      const pc = document.createElement('canvas'); pc.className = 'plant';
      const sp = SP[s.species];
      if (sp) Sprites.paint(pc, Sprites.plant(sp, s.stage, { wilting: s.wilting }), { scale: GARDEN_SCALE });
      else { pc.width = Sprites.PW; pc.height = Sprites.PH; }
      const pot = document.createElement('canvas'); pot.className = 'pot';
      Sprites.paint(pot, Sprites.pot(POT[s.pot] || POT.nhua), { scale: GARDEN_SCALE });
      d.append(pc, pot);
      (s.decor || []).forEach((id, k) => {
        if (!id) return;
        const dc = document.createElement('canvas');
        dc.className = `pdecor pd-${CAT.potSlots[k]}`; dc.dataset.decor = id;
        Sprites.paint(dc, DecorSprites.potDecor(id), { scale: GARDEN_SCALE * 0.8 });
        dc.title = `${DEC[id].name}: ${DEC[id].desc}`;
        dc.style.animationDelay = `${-((s.i + k) * 0.37) % 2}s`;
        d.appendChild(dc);
      });
      if (s.stage === 'empty') { const h = document.createElement('div'); h.className = 'hint'; h.textContent = '+'; d.appendChild(h); }
      if (s.stage === 'bloom') for (let k = 0; k < 3; k++) { const sp2 = document.createElement('i'); sp2.className = 'spark'; sp2.style.setProperty('--k', k); d.appendChild(sp2); }

      if (s.stage !== 'empty' && s.stage !== 'dead') { // thanh thời gian nở + thanh nước trên đầu cây
        const tm = document.createElement('div'); tm.className = `timer${s.waiting ? ' wait' : ''}`;
        let html = '';
        if (s.bloomInMin != null || s.waiting) {
          const pct = Math.max(0, Math.min(100, Math.round((s.progress || 0) * 100)));
          html += `<span>${s.waiting ? `chờ ${esc(s.window[0])}` : dur(s.bloomInMin)}</span><i class="grow"><b style="width:${pct}%"></b></i>`;
        }
        html += `<i class="water${s.thirsty ? ' low' : ''}" title="Nước ${s.water}%"><b style="width:${s.water}%"></b></i>`;
        tm.innerHTML = html;
        d.appendChild(tm);
      }
      const bub = s.stage === 'bloom' ? '✿' : s.stage === 'dead' ? '✝' : s.thirsty ? '💧' : s.waiting ? '⏰' : s.stage === 'faded' ? '🥀' : '';
      if (bub) { const b = document.createElement('div'); b.className = 'bubble'; b.textContent = bub; d.appendChild(b); }
      if (s.theftMark) { const t = document.createElement('div'); t.className = 'theft'; t.textContent = '👣'; t.title = `${s.theftMark.by} đã hái trộm ở đây!`; d.appendChild(t); }
      const lb = document.createElement('div'); lb.className = 'label'; lb.textContent = slotStatus(s);
      d.appendChild(lb);
      d.onclick = () => onSlot(s, d);
      d.oncontextmenu = (e) => { e.preventDefault(); selected = s.i; openPanel(s.stage === 'empty' ? 'shop' : 'detail', s.i, 'seeds'); renderSlots(); };
      box.appendChild(d);
    });
    if (V.nextSlotPrice != null) {
      const d = document.createElement('div');
      d.className = 'slot empty buy';
      const lvNeed = V.nextSlotLevel;
      d.title = V.level < lvNeed ? `Cần cấp ${lvNeed} để mở thêm ô chậu` : `Mở thêm ô chậu: ${V.nextSlotPrice} xu (bấm 2 lần)`;
      const pc = document.createElement('canvas'); pc.className = 'plant'; pc.width = Sprites.PW; pc.height = Sprites.PH;
      const pot = document.createElement('canvas'); pot.className = 'pot';
      Sprites.paint(pot, Sprites.pot(POT.nhua));
      const h = document.createElement('div'); h.className = 'hint'; h.textContent = '🔒';
      const lb = document.createElement('div'); lb.className = 'label'; lb.textContent = V.level < lvNeed ? `Cấp ${lvNeed}` : `${V.nextSlotPrice} xu`;
      d.append(pc, pot, h, lb);
      d.onclick = () => { if (!needConfirm('buySlot', `Bấm lần nữa để mở ô mới (${V.nextSlotPrice} xu)`)) act({ type: 'buySlot' }); };
      box.appendChild(d);
    }
  }

  function onSlot(s, elx) {
    selected = s.i;
    if (panel === 'bag' && sub === 'decor') { renderPanel(); renderSlots(); return; } // đang trang trí: chỉ chọn chậu
    const i = s.i;
    if (s.stage === 'empty') {
      if (s.theftMark) act({ type: 'clearTheft', slot: i });
      openPanel('shop', i, 'seeds');
      renderSlots();
      return;
    }
    let t = tool;
    if (t === 'hand') {
      if (s.theftMark) t = 'clear';
      else if (s.stage === 'bloom' || s.stage === 'faded') t = 'harvest';
      else if (s.stage === 'dead') t = 'shovel';
      else if (s.water <= CAT.rules.waterBlockAbove) t = 'water';
      else { openPanel('detail', i); renderSlots(); return; }
    }
    if (t === 'clear') act({ type: 'clearTheft', slot: i });
    if (t === 'water') act({ type: 'water', slot: i }, elx);
    if (t === 'harvest') act({ type: 'harvest', slot: i }, elx);
    if (t === 'fert') act({ type: 'fertilize', slot: i });
    if (t === 'shovel' && !needConfirm(`rm${i}`, `Bấm lần nữa để nhổ ${s.name}`)) act({ type: 'remove', slot: i });
    if (panel === 'detail') { panelArg = i; renderPanel(); }
    renderSlots();
  }

  /** Nhà thú ở góc phải (chỉ hiện khi đã có pet). Pet đang ngủ thì nằm trước cửa nhà. */
  function renderHouse() {
    const box = $('#house');
    $('#slots').style.right = V.house ? (V.scene && V.scene.object ? '235px' : '140px') : (V.scene && V.scene.object ? '108px' : '6px');
    if (!V.house) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    const lv = V.house.level;
    const key = `${lv}|${JSON.stringify(V.house.decor)}`;
    if (box.dataset.key === key) return;
    box.dataset.key = key;
    box.innerHTML = '';
    const k = GARDEN_SCALE;
    const hc = document.createElement('canvas'); hc.className = 'house-img';
    Sprites.paint(hc, DecorSprites.house(lv), { scale: k });
    box.appendChild(hc);
    const an = DecorSprites.anchors(lv);
    for (const pos of CAT.houseSlots) {
      const id = V.house.decor[pos]; if (!id) continue;
      const spr = DecorSprites.houseDecor(id);
      const c = document.createElement('canvas'); c.className = `hdecor hd-${pos}`; c.dataset.decor = id;
      Sprites.paint(c, spr, { scale: k });
      const [ax, ay] = an[pos];
      c.style.left = `${(ax - spr.sw / 2) * k}px`;
      c.style.top = `${(ay - spr.sh) * k}px`;
      c.title = HDEC[id].name;
      box.appendChild(c);
    }
    const lb = document.createElement('div'); lb.className = 'house-label'; lb.textContent = V.house.info.name;
    box.appendChild(lb);
    box.title = `${V.house.info.name} – bấm để nâng cấp / trang trí`;
    box.onclick = () => { Sound.play('open'); openPanel('house'); };
  }

  function renderScene() {
    const id = V.scene && V.scene.object;
    const spot = $('#scene-object');
    spot.classList.toggle('hidden', !id);
    if (id && spot.dataset.key !== id) {
      spot.dataset.key = id;
      spot.innerHTML = '';
      const canvas = canvasOf(SceneSprites.object(id), 'scene-model');
      spot.appendChild(canvas);
      spot.title = `${CAT.sceneObjects.find((x) => x.id === id)?.name || 'Cảnh vườn'} – bấm để đổi`;
    }
    spot.style.right = V.house ? '130px' : '8px';
    spot.onclick = () => openPanel('bag', null, 'scene');
    const sky = $('#sky');
    const bg = V.scene && V.scene.background || '';
    if (sky.dataset.scene !== bg) {
      sky.dataset.scene = bg;
      sky.innerHTML = '';
      if (bg) for (let i = 0; i < 16; i++) {
        const p = document.createElement('i'); p.className = 'scene-particle';
        p.style.setProperty('--x', `${(i * 37 + 13) % 100}%`);
        p.style.setProperty('--y', `${(i * 29 + 9) % 75}%`);
        p.style.setProperty('--delay', `${-(i * 0.73).toFixed(2)}s`);
        sky.appendChild(p);
      }
    }
  }

  function renderMenu() {
    document.querySelectorAll('#menu button').forEach((b) => b.classList.toggle('on', b.dataset.panel === panel));
  }

  /** Việc cần người dùng làm (dùng cho chấm đỏ, bảng thông báo). */
  function alerts() {
    const list = [];
    for (const x of V.slots) {
      if (x.stage === 'empty') { if (x.theftMark) list.push({ slot: x.i, level: 'red', text: `Ô ${x.i + 1}: ${x.theftMark.by} đã hái trộm!`, act: { type: 'clearTheft', slot: x.i }, label: 'Dọn' }); continue; }
      const name = `${SP[x.species].name} (ô ${x.i + 1})`;
      if (x.stage === 'dead') list.push({ slot: x.i, level: 'red', text: `${name} đã chết`, act: { type: 'remove', slot: x.i }, label: 'Nhổ' });
      else if (x.stage === 'bloom') list.push({ slot: x.i, level: 'red', text: `${name} đã nở${x.fadeInMin != null && x.fadeInMin <= 30 ? ` – sắp tàn (${dur(x.fadeInMin)})` : ''}`, act: { type: 'harvest', slot: x.i }, label: 'Thu hoạch' });
      else if (x.stage === 'faded') list.push({ slot: x.i, level: 'red', text: `${name} đã tàn, thu hoạch ngay`, act: { type: 'harvest', slot: x.i }, label: 'Thu hoạch' });
      if (x.thirsty && x.stage !== 'dead') list.push({ slot: x.i, level: 'red', text: `${name} đang khát (${x.water}%)`, act: { type: 'water', slot: x.i }, label: 'Tưới' });
      if (x.theftMark) list.push({ slot: x.i, level: 'info', text: `Ô ${x.i + 1}: ${x.theftMark.by} đã hái trộm`, act: { type: 'clearTheft', slot: x.i }, label: 'Dọn' });
    }
    if (V.wheel.free) list.unshift({ level: 'red', text: '🎡 Có 1 lượt quay may mắn miễn phí hôm nay!', open: 'wheel', label: 'Quay' });
    if (V.daily.available) list.unshift({ level: 'red', text: '🎁 Quà hằng ngày đã sẵn sàng!', open: 'gift', label: 'Mở quà' });
    if (!V.slots.some((x) => x.stage !== 'empty') && V.money >= 8) list.push({ level: 'info', text: 'Vườn đang trống – gieo hạt nhé!', open: 'shop', label: 'Gieo hạt' });
    return list;
  }
  const redCount = () => alerts().filter((a) => a.level === 'red').length;

  function renderBell() {
    $('#gift-btn').classList.toggle('ready', !!V.daily.available);
    $('#wheel-btn').classList.toggle('ready', !!V.wheel.free);
    const n = redCount();
    const b = $('#bell');
    b.querySelector('.red-badge')?.remove();
    if (n) { const r = document.createElement('span'); r.className = 'red-badge'; r.textContent = n > 9 ? '9+' : n; b.appendChild(r); }
  }

  let lastGift = null;
  function giftPic(rw) {
    if (rw.kind === 'seed') return canvasOf(Sprites.plant(SP[rw.id], 'bloom'));
    if (rw.kind === 'pot') return canvasOf(Sprites.pot(POT[rw.id]), 'small');
    return petPic(PET[rw.id]);
  }
  function renderGift(body) {
    const wrap = document.createElement('div'); wrap.className = 'gift-wrap';
    if (lastGift) {
      const rw = lastGift.reward;
      wrap.innerHTML = `<div class="gift-result ${rw.rare ? 'rare' : ''}"><div class="gift-pic"></div><div><h3>${rw.rare ? '✨ HIẾM! ✨ ' : ''}${rw.qty > 1 ? `${rw.qty} × ` : ''}${rw.kind === 'seed' ? 'Hạt ' : ''}${esc(rw.name)}</h3>`
        + `<p>${rw.kind === 'pet' ? 'Pet mới đã vào chuồng – xem ở Cửa hàng › Pet.' : rw.kind === 'pot' ? 'Chậu đã vào Kho đồ.' : 'Hạt đã vào Kho đồ › Hạt giống.'}</p>`
        + `<p class="meta">Chuỗi ngày nhận quà: <b>${lastGift.streak}</b> ngày. Mai quay lại nhé!</p></div></div>`;
      wrap.querySelector('.gift-pic').appendChild(giftPic(rw));
    } else if (V.daily.available) {
      wrap.innerHTML = '<div class="gift-box" title="Bấm để mở">🎁</div><p>Bấm vào hộp quà để mở!</p><p class="meta">Quà ra hạt giống hoặc chậu đã mở khoá; rất hiếm khi ra 1 pet Thường bạn chưa có.</p>';
      wrap.querySelector('.gift-box').onclick = async (e) => {
        e.currentTarget.classList.add('opening');
        Sound.play('open');
        await new Promise((ok) => setTimeout(ok, 700));
        const r = await api.action({ type: 'daily' });
        if (!r.ok) { toast(r.msg, true); Sound.play('error'); return; }
        lastGift = r;
        Sound.play(r.reward.rare ? 'levelup' : 'harvest');
        renderPanel();
      };
    } else {
      wrap.innerHTML = `<div class="gift-box done">🎁</div><p>Hôm nay đã nhận quà rồi. Chuỗi: <b>${V.daily.streak}</b> ngày.</p>`;
    }
    body.appendChild(wrap);
  }

  // ------------------------------------------------------------ vòng quay may mắn
  // 12 ô trên bánh xe (ô nhiều cho bậc thấp, ít cho bậc cao – tỉ lệ thật ghi ở bảng bên cạnh)
  const WHEEL_SEGS = [0, 1, 2, 0, 3, 1, 0, 4, 2, 1, 5, 6];
  let wheelAngle = 0; let spinning = false;
  function drawWheel(cv) {
    const n = WHEEL_SEGS.length; const R = cv.width / 2; const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    WHEEL_SEGS.forEach((t, i) => {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2; const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
      g.beginPath(); g.moveTo(R, R); g.arc(R, R, R - 4, a0, a1); g.closePath();
      g.fillStyle = CAT.tiers[t].color; g.fill();
      g.strokeStyle = '#2b1d0e'; g.lineWidth = 2; g.stroke();
      g.save(); g.translate(R, R); g.rotate((a0 + a1) / 2); g.fillStyle = '#fff'; g.font = 'bold 11px Segoe UI'; g.textAlign = 'right';
      g.shadowColor = '#000'; g.shadowBlur = 2; g.fillText(CAT.tiers[t].name, R - 12, 4); g.restore();
    });
    g.beginPath(); g.arc(R, R, 16, 0, Math.PI * 2); g.fillStyle = '#fff7e6'; g.fill(); g.lineWidth = 3; g.stroke();
  }
  /** Ảnh phần thưởng vòng quay. */
  function rewardPic(r) {
    if (r.kind === 'coin') return canvasOf(Sprites.icon('coin'), 'small');
    if (r.kind === 'item') return canvasOf(Sprites.icon('bag'), 'small');
    if (r.kind === 'seed' || r.kind === 'species') return canvasOf(Sprites.plant(SP[r.id], 'bloom'));
    if (r.kind === 'pot') return canvasOf(Sprites.pot(POT[r.id]), 'small');
    if (r.kind === 'decor') return canvasOf(DecorSprites.potDecor(r.id), 'small');
    if (r.kind === 'scene') return canvasOf(SceneSprites.object(r.id), 'small');
    if (r.kind === 'background') return scenePic('background', r.id);
    if (r.kind === 'pet') return petPic(PET[r.id]);
    return document.createElement('span');
  }

  function wheelOwnedItem(it) {
    if (it.kind === 'species') return V.unlocked.species.includes(it.id);
    if (it.kind === 'pot') return V.unlocked.pots.includes(it.id);
    if (it.kind === 'decor') return V.unlocked.decor.includes(it.id);
    if (it.kind === 'scene') return !!V.inventory.sceneObjects[it.id];
    if (it.kind === 'background') return !!V.inventory.backgrounds[it.id];
    return V.unlocked.pets.includes(it.id) || V.pets.owned.includes(it.id);
  }

  function renderWheel(body) {
    const W2 = CAT.wheel; const wv = V.wheel;
    const wrap = document.createElement('div'); wrap.className = 'wheel-wrap';
    const left = document.createElement('div'); left.className = `wheel-left${spinning ? ' spinning' : ''}`;
    left.innerHTML = '<div class="wheel-pointer">▼</div><div class="wheel-stage"><div class="wheel-bulbs"></div></div>';
    const stage = left.querySelector('.wheel-stage');
    const bulbs = left.querySelector('.wheel-bulbs');
    for (let i = 0; i < 18; i++) { const b = document.createElement('i'); const a = (i / 18) * Math.PI * 2; b.style.left = `${50 + Math.cos(a) * 52}%`; b.style.top = `${50 + Math.sin(a) * 52}%`; b.className = i % 2 ? 'odd' : ''; bulbs.appendChild(b); }
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 240; cv.className = 'wheel-cv';
    cv.style.transform = `rotate(${wheelAngle}deg)`;
    drawWheel(cv); stage.appendChild(cv);
    const hub = document.createElement('div'); hub.className = 'wheel-hub'; hub.textContent = '🎡'; stage.appendChild(hub);
    const right = document.createElement('div'); right.className = 'wheel-right';
    const btns = document.createElement('div'); btns.className = 'admin-row';
    const mk = (label, count, dis, primary) => { const b = document.createElement('button'); b.textContent = label; b.disabled = dis || spinning; if (primary) b.className = 'primary'; b.onclick = () => doSpin(count, cv, left); btns.appendChild(b); };
    if (wv.free) mk('🎁 Quay miễn phí', 1, false, true);
    else mk(`Quay 1 – ${W2.cost} xu`, 1, V.money < W2.cost, true);
    mk(`Quay 10 – ${W2.cost10.toLocaleString('vi-VN')} xu`, 10, V.money < W2.cost10);
    const pity = document.createElement('div'); pity.className = 'meta'; pity.style.margin = '4px 0 6px';
    pity.innerHTML = `Quay thêm <b>${W2.pityEpic - wv.pityEpic}</b> lượt chắc chắn trúng từ <span class="tier-label t2">Rare</span> trở lên.`;
    right.append(btns, pity);
    // danh sách phần thưởng có thể trúng (không hiện tỉ lệ)
    const list = document.createElement('div');
    list.innerHTML = '<div class="section-title">Phần thưởng có thể quay trúng</div>' + CAT.tiers.map((t, i) => {
      const items = W2.pool[i].map((it) => `<span class="witem ${wheelOwnedItem(it) ? 'own' : ''}">${wheelOwnedItem(it) ? '✔ ' : ''}${esc(it.name)}</span>`).join(' ');
      return `<div class="wrate">${tierBadge(i)} <span class="meta">${items}${i === 0 ? ' <span class="witem">xu, phân bón, hạt giống</span>' : ''}</span></div>`;
    }).join('');
    right.appendChild(list);
    wrap.append(left, right);
    body.appendChild(wrap);
    if (wv.pending && !spinning) showReveal(body, wv.pending);
  }

  /** Màn hình mở thưởng: tia sáng theo màu bậc, ảnh phần thưởng, pháo giấy cho Epic+. */
  function showReveal(body, r) {
    const current = document.querySelector('#panel .reveal');
    if (current && current.dataset.spins === String(V.wheel.spins)) return;
    const ov = document.createElement('div'); ov.className = `reveal t${r.best.tier}`;
    ov.dataset.spins = String(V.wheel.spins);
    ov.innerHTML = '<div class="rays"></div><div class="reveal-cards"></div><button class="primary reveal-ok">Tuyệt vời!</button>';
    const cards = ov.querySelector('.reveal-cards');
    r.results.forEach((it, k) => {
      const c = document.createElement('div'); c.className = `rcard t${it.tier}`;
      c.style.animationDelay = `${k * 0.18}s`;
      const pic = document.createElement('div'); pic.className = 'rpic'; pic.appendChild(rewardPic(it));
      const nm = document.createElement('div'); nm.className = 'rname';
      nm.innerHTML = `${tierBadge(it.tier)}<br/>${esc(it.name)}${it.bonus ? `<br/><small>+${esc(it.bonus)}</small>` : ''}${it.tier > 0 && !it.dup && it.kind !== 'coin' && it.kind !== 'item' && it.kind !== 'seed' ? '<br/><b class="new">MỚI!</b>' : ''}`;
      c.append(pic, nm);
      cards.appendChild(c);
    });
    if (r.results.length === 1) cards.classList.add('single');
    if (r.best.tier >= 3) {
      const cols = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#c77dff', '#ffffff'];
      for (let k = 0; k < 60; k++) {
        const f = document.createElement('i'); f.className = 'confetti';
        f.style.left = `${Math.random() * 100}%`; f.style.background = cols[k % cols.length];
        f.style.animationDelay = `${Math.random() * 0.8}s`; f.style.setProperty('--dx', `${Math.random() * 80 - 40}px`);
        ov.appendChild(f);
      }
    }
    ov.querySelector('.reveal-ok').onclick = async () => {
      ov.querySelector('.reveal-ok').disabled = true;
      const result = await api.action({ type: 'ackSpin' });
      if (result.ok) { ov.remove(); Sound.play('close'); }
      else { ov.querySelector('.reveal-ok').disabled = false; toast(result.msg, true); }
    };
    document.querySelectorAll('#panel .reveal').forEach((x) => x.remove());
    $('#panel').appendChild(ov);
  }

  async function doSpin(count, cv, left) {
    if (spinning) return;
    spinning = true;
    left.classList.add('spinning');
    left.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    document.querySelectorAll('#panel-body .wheel-right button').forEach((b) => { b.disabled = true; });
    Sound.play('open');
    const r = await api.action({ type: 'spin', count });
    if (!r.ok) { spinning = false; left.classList.remove('spinning'); toast(r.msg, true); Sound.play('error'); renderPanel(); return; }
    // lấy đà quay ngược một chút rồi quay mạnh, dừng ở 1 ô đúng bậc cao nhất
    const segs = WHEEL_SEGS.map((t, i) => [t, i]).filter(([t]) => t === r.best.tier).map(([, i]) => i);
    const seg = segs[Math.floor(Math.random() * segs.length)];
    const segDeg = 360 / WHEEL_SEGS.length;
    cv.style.transition = 'transform .35s ease-out';
    cv.style.transform = `rotate(${wheelAngle - 18}deg)`;
    await new Promise((ok) => setTimeout(ok, 380));
    const target = 360 - (seg + 0.5) * segDeg;
    const base = wheelAngle - (wheelAngle % 360);
    wheelAngle = base + 360 * 7 + target + (Math.random() - 0.5) * segDeg * 0.6;
    cv.style.transition = 'transform 5.2s cubic-bezier(.1,.7,.12,1)';
    cv.style.transform = `rotate(${wheelAngle}deg)`;
    const ptr = left.querySelector('.wheel-pointer');
    let delay = 60; let tStart = performance.now();
    const tick = () => { // tiếng tích + kim rung, chậm dần
      if (performance.now() - tStart > 5000) return;
      Sound.play('click'); ptr.classList.remove('tick'); void ptr.offsetWidth; ptr.classList.add('tick');
      delay *= 1.09; setTimeout(tick, delay);
    };
    tick();
    await new Promise((ok) => setTimeout(ok, 5300));
    left.classList.remove('spinning');
    left.classList.add(`win-t${r.best.tier}`);
    Sound.play(r.best.tier >= 4 ? 'levelup' : r.best.tier >= 2 ? 'harvest' : 'coin');
    await new Promise((ok) => setTimeout(ok, 700));
    spinning = false;
    renderPanel();
  }

  function renderNotify(body) {
    const list = alerts();
    if (!list.length) { body.innerHTML = '<div class="note">Không có việc gì cần làm. Vườn đang ổn 🌱</div>'; return; }
    const top = document.createElement('div'); top.className = 'admin-row'; top.style.marginBottom = '6px';
    const doAll = document.createElement('button'); doAll.className = 'primary'; doAll.textContent = 'Làm hết (tưới + thu hoạch)';
    doAll.onclick = async () => {
      for (const a of alerts()) if (a.act && (a.act.type === 'water' || a.act.type === 'harvest')) await api.action(a.act);
      Sound.play('harvest'); toast('Đã xử lý hết.');
    };
    top.appendChild(doAll); body.appendChild(top);
    const ul = document.createElement('ul'); ul.className = 'alerts';
    for (const a of list) {
      const li = document.createElement('li'); li.className = a.level;
      li.innerHTML = `<i class="dot"></i><span>${esc(a.text)}</span>`;
      const b = document.createElement('button'); b.textContent = a.label;
      b.onclick = () => (a.open ? openPanel(a.open, null, 'seeds') : act(a.act));
      li.appendChild(b); ul.appendChild(li);
    }
    body.appendChild(ul);
  }

  async function lanAct(a) {
    const r = await api.lan(a);
    if (r.code) lanInvite = r.code;
    if (r.msg) toast(r.msg, !r.ok);
    if (!r.ok) Sound.play('error');
    if (panel === 'lan') renderPanel();
    return r;
  }

  function renderLan(body) {
    const shell = document.createElement('div'); shell.className = 'lan-layout';
    body.appendChild(shell);
    const controls = document.createElement('div'); controls.className = 'lan-controls'; shell.appendChild(controls);
    const head = document.createElement('div'); head.className = 'lan-row';
    head.innerHTML = '<label>Biệt danh <input id="lan-alias" maxlength="24" /></label><button id="lan-alias-save">Lưu tên</button>';
    controls.appendChild(head);
    head.querySelector('input').value = L.alias;
    head.querySelector('button').onclick = () => lanAct({ type: 'alias', name: head.querySelector('input').value });
    const note = document.createElement('p'); note.className = 'meta';
    note.textContent = L.online
      ? 'Chỉ người có mã mời mới vào được phòng. Phòng Internet: chơi được dù khác mạng, dữ liệu mã hoá đầu-cuối qua máy trung chuyển. Phòng LAN: chỉ trong cùng mạng nội bộ.'
      : 'Chỉ những người có mã mời mới vào được phòng LAN. Không tự tìm máy và không kết nối Internet.';
    controls.appendChild(note);
    if (L.error) { const e = document.createElement('p'); e.className = 'lan-error'; e.textContent = L.error; controls.appendChild(e); }

    if (!L.role) {
      const start = document.createElement('div'); start.className = 'lan-row';
      const sel = document.createElement('select');
      for (const ip of L.addresses || []) { const o = document.createElement('option'); o.value = ip; o.textContent = ip; sel.appendChild(o); }
      const preferred = (L.addresses || []).find((x) => !x.startsWith('127.'));
      if (preferred) sel.value = preferred;
      const host = document.createElement('button'); host.className = 'primary'; host.textContent = 'Mở phòng LAN';
      host.disabled = !sel.value; host.onclick = () => lanAct({ type: 'host', ip: sel.value });
      start.append('Địa chỉ máy này:', sel, host); controls.appendChild(start);
      if (L.online) {
        const net = document.createElement('div'); net.className = 'lan-row';
        const hostNet = document.createElement('button'); hostNet.className = 'primary'; hostNet.textContent = '🌐 Mở phòng Internet';
        hostNet.onclick = () => lanAct({ type: 'hostOnline' });
        net.append(hostNet, 'Dùng khi mạng công ty chặn LAN.'); controls.insertBefore(net, start);
      }
      const join = document.createElement('div'); join.className = 'lan-row';
      const code = document.createElement('input'); code.placeholder = L.online ? 'Dán mã mời PG2|… (Internet) hoặc PG1|… (LAN)' : 'Dán mã mời PG1|…'; code.className = 'lan-code';
      const go = document.createElement('button'); go.textContent = 'Vào phòng'; go.onclick = () => lanAct({ type: 'join', code: code.value });
      join.append(code, go); controls.appendChild(join);
      if (L.joined) {
        const again = document.createElement('button'); again.textContent = 'Kết nối lại phòng đã ghép cặp';
        again.onclick = () => lanAct({ type: 'reconnect' }); controls.appendChild(again);
      }
      const empty = document.createElement('p'); empty.className = 'meta';
      empty.textContent = 'Mở phòng rồi gửi riêng mã mời cho bạn; hoặc dán mã mời của bạn vào ô trên.';
      controls.appendChild(empty);
    } else {
      const room = document.createElement('div'); room.className = 'lan-row';
      const away = document.createElement('span'); away.className = 'lan-presence';
      away.textContent = `${L.mode === 'online' ? '🌐 Phòng Internet · ' : '🏠 Phòng LAN · '}${L.away ? '💤 Vắng mặt: vườn đang thu gọn' : '🟢 Đang chơi: vườn đang mở'}`;
      const leave = document.createElement('button'); leave.textContent = 'Rời phòng'; leave.onclick = () => lanAct({ type: 'leave' });
      room.append(away, leave); controls.appendChild(room);
      if (L.role === 'host') {
        const invite = document.createElement('div'); invite.className = 'lan-row';
        const create = document.createElement('button'); create.textContent = 'Tạo mã mời bạn'; create.onclick = () => lanAct({ type: 'invite' });
        invite.appendChild(create);
        if (lanInvite) {
          const field = document.createElement('input'); field.className = 'lan-code'; field.readOnly = true; field.value = lanInvite;
          field.title = 'Chỉ gửi riêng cho người bạn muốn mời'; field.onclick = () => field.select(); invite.appendChild(field);
        }
        controls.appendChild(invite);
      }
    }

    const people = document.createElement('div'); people.className = 'lan-people'; shell.appendChild(people);
    const others = (L.players || []).filter((p) => p.id !== L.selfId);
    const friends = new Set(L.friends || []);
    for (const [title, list] of [['Bạn bè', others.filter((p) => friends.has(p.id))], ['Người chơi khác', others.filter((p) => !friends.has(p.id))]]) {
      const section = document.createElement('section');
      const h = document.createElement('h3'); h.textContent = `${title} (${list.length})`; section.appendChild(h);
      if (!list.length) { const p = document.createElement('p'); p.className = 'meta'; p.textContent = 'Chưa có ai.'; section.appendChild(p); }
      for (const p of list) {
        const row = document.createElement('div'); row.className = 'lan-person';
        const label = document.createElement('span'); label.textContent = `${p.name} · ${p.status}`;
        const friend = document.createElement('button'); friend.textContent = friends.has(p.id) ? '★ Bỏ bạn' : '☆ Kết bạn';
        friend.onclick = () => lanAct({ type: 'friend', id: p.id });
        const visit = document.createElement('button'); visit.textContent = 'Thăm vườn';
        visit.disabled = !p.garden || p.status === 'Mất kết nối';
        visit.onclick = () => { lanPlayer = p.id; renderPanel(); };
        row.append(label, friend, visit);
        if (L.role === 'host' && p.id !== 'host') {
          const revoke = document.createElement('button'); revoke.textContent = 'Chặn';
          revoke.title = 'Thu hồi mã mời; người này không thể vào lại phòng.';
          revoke.onclick = () => { if (!needConfirm(`lan-block-${p.id}`, `Bấm lần nữa để chặn ${p.name}.`)) lanAct({ type: 'revoke', id: p.id }); };
          row.appendChild(revoke);
        }
        section.appendChild(row);
      }
      people.appendChild(section);
    }

    const current = L.role && others.find((p) => p.id === lanPlayer && p.garden);
    if (current) {
      const visit = document.createElement('section'); visit.className = 'lan-visit';
      const h = document.createElement('h3'); h.textContent = `Vườn của ${current.name}`; visit.appendChild(h);
      if (current.garden.pet && PET[current.garden.pet]) {
        const pet = document.createElement('div'); pet.className = 'lan-visitor-pet';
        pet.appendChild(petPic(PET[current.garden.pet]));
        const label = document.createElement('span'); label.textContent = PET[current.garden.pet].name; pet.appendChild(label);
        visit.appendChild(pet);
      }
      if (current.garden.house && CAT.houseLevels[current.garden.house.level - 1]) {
        const house = document.createElement('p'); house.className = 'meta';
        house.textContent = `🏠 ${CAT.houseLevels[current.garden.house.level - 1].name}`; visit.appendChild(house);
      }
      if (current.garden.scene) {
        const obj = CAT.sceneObjects.find((x) => x.id === current.garden.scene.object);
        const bg = CAT.backgrounds.find((x) => x.id === current.garden.scene.background);
        if (obj || bg) {
          const scenery = document.createElement('div'); scenery.className = 'lan-scene-preview';
          if (bg) scenery.appendChild(scenePic('background', bg.id));
          if (obj) scenery.appendChild(scenePic('scene', obj.id));
          const label = document.createElement('span'); label.textContent = `${obj ? obj.name : 'Cảnh mặc định'} · ${bg ? bg.name : 'Bầu trời mặc định'}`;
          scenery.appendChild(label); visit.appendChild(scenery);
        }
      }
      const slots = document.createElement('div'); slots.className = 'lan-slots';
      current.garden.slots.forEach((s, i) => {
        const card = document.createElement('div'); card.className = 'lan-slot';
        if (POT[s.pot]) card.appendChild(canvasOf(Sprites.pot(POT[s.pot]), 'lan-pot'));
        if (s.species && SP[s.species]) card.appendChild(canvasOf(Sprites.plant(SP[s.species], s.stage), 'lan-flower'));
        const name = document.createElement('span'); name.textContent = `Ô ${i + 1}: ${s.species && SP[s.species] ? SP[s.species].name : 'Trống'}`; card.appendChild(name);
        const placed = (s.decor || []).filter((id) => id && DEC[id]);
        if (placed.length) { const d = document.createElement('small'); d.title = placed.map((id) => DEC[id].name).join(', '); d.textContent = `🎀 ${placed.length} món`; card.appendChild(d); }
        const water = document.createElement('button'); water.textContent = '💧 Tưới hộ'; water.disabled = !s.species || s.stage === 'dead';
        water.onclick = () => lanAct({ type: 'visit', target: current.id, kind: 'water', slot: i });
        const steal = document.createElement('button'); steal.textContent = '🌸 Hái hoa';
        steal.disabled = current.status !== 'Vắng mặt' || s.stage !== 'bloom';
        steal.title = 'Chỉ hái được khi chủ vườn đã thu gọn app và hoa đang nở.';
        steal.onclick = () => lanAct({ type: 'visit', target: current.id, kind: 'steal', slot: i });
        card.append(water, steal); slots.appendChild(card);
      });
      visit.appendChild(slots); shell.appendChild(visit);
    }

    const chat = document.createElement('section'); chat.className = 'lan-chat';
    const title = document.createElement('h3'); title.textContent = 'Chat thế giới · phòng LAN'; chat.appendChild(title);
    const history = document.createElement('div'); history.className = 'lan-chat-history';
    for (const m of L.messages || []) {
      const p = document.createElement('p');
      const b = document.createElement('b'); b.textContent = `${m.by}: `;
      const t = document.createElement('span'); t.textContent = m.text;
      p.append(b, t); history.appendChild(p);
    }
    chat.appendChild(history);
    const form = document.createElement('form'); form.className = 'lan-row';
    const input = document.createElement('input'); input.maxLength = 300; input.placeholder = L.role ? 'Nhắn cho người trong phòng LAN…' : 'Vào phòng LAN để chat'; input.disabled = !L.role;
    const send = document.createElement('button'); send.type = 'submit'; send.textContent = 'Gửi';
    send.disabled = !L.role;
    form.append(input, send); form.onsubmit = async (e) => { e.preventDefault(); const text = input.value; if (!text.trim()) return; input.value = ''; input.blur(); await lanAct({ type: 'chat', text }); };
    chat.appendChild(form); shell.appendChild(chat);
  }

  function renderTab() {
    const bloom = V.slots.filter((s) => s.stage === 'bloom').length;
    const thirsty = V.slots.filter((s) => s.thirsty).length;
    const dead = V.slots.filter((s) => s.stage === 'dead').length;
    const b = $('#tab-badges');
    b.innerHTML = '';
    const n = redCount();
    $('#tab').classList.toggle('alert', n > 0);
    const add = (cls, txt) => { const s = document.createElement('span'); s.className = `badge ${cls}`; s.textContent = txt; b.appendChild(s); };
    if (bloom) add('bloom', `✿ ${bloom}`);
    if (thirsty) add('thirsty', `💧 ${thirsty}`);
    if (dead) add('dead', `✝ ${dead}`);
    if (V.pet) add('', petSleeping() ? '💤' : '🛡');
    add('', `Lv${V.level}`);
    if (n) { const r = document.createElement('span'); r.className = 'red-badge'; r.textContent = n > 9 ? '9+' : n; r.title = `${n} việc cần làm`; b.appendChild(r); }
  }

  // ------------------------------------------------------------ panel
  const PANEL_TABS = {
    shop: [['seeds', 'Hạt giống'], ['pots', 'Chậu'], ['decor', 'Trang trí'], ['scene', 'Cảnh vườn'], ['pets', 'Pet'], ['items', 'Vật phẩm']],
    bag: [['seeds', 'Hạt giống'], ['pots', 'Chậu'], ['decor', 'Trang trí'], ['scene', 'Cảnh vườn']],
  };
  const PANEL_TITLE = { wheel: '🎡 Vòng quay may mắn', house: '🏠 Nhà thú', gift: '🎁 Quà hằng ngày', notify: '🔔 Việc cần làm', wiki: '📖 Sổ tay cây', log: '📜 Nhật ký vườn', settings: '⚙ Cài đặt', detail: '🔍 Chi tiết cây', lan: '🌐 Bạn bè & chat LAN', admin: '🛠 Admin – công cụ test (chỉ có ở bản chạy thử)' };

  function renderPanel() {
    if (!panel) return;
    // đang quay: không vẽ lại bảng (nếu vẽ lại, bánh xe mới sẽ đứng yên thay cho bánh xe đang quay)
    if (panel === 'wheel' && spinning && $('#panel-body .wheel-wrap')) return;
    if (panel === 'lan' && document.activeElement && document.activeElement.closest('#panel-body')
      && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const tabs = $('#panel-tabs');
    tabs.innerHTML = '';
    const list = PANEL_TABS[panel];
    if (list) {
      if (!sub || !list.some(([k]) => k === sub)) sub = list[0][0];
      for (const [k, label] of list) {
        const b = document.createElement('button');
        b.textContent = label; if (k === sub) b.classList.add('on');
        b.onclick = () => { sub = k; renderPanel(); };
        tabs.appendChild(b);
      }
    } else {
      const t = document.createElement('b'); t.textContent = PANEL_TITLE[panel] || ''; tabs.appendChild(t);
    }
    const body = $('#panel-body');
    const scroll = body.scrollTop;
    body.innerHTML = '';
    ({ shop: renderShop, bag: renderBag, wiki: renderWiki, log: renderLog, settings: renderSettings, detail: renderDetail, admin: renderAdmin, notify: renderNotify, gift: renderGift, house: renderHousePanel, wheel: renderWheel, lan: renderLan }[panel])(body);
    body.scrollTop = scroll;
  }

  const tierBadge = (t) => (t == null ? '' : `<span class="tier-label t${t}">${esc(CAT.tiers[t].name)}</span> `);
  function card({ pic, title, lines = [], tags = [], buttons = [], locked = false, extraClass = '', tier = null }) {
    const c = document.createElement('div');
    c.className = `card ${locked ? 'locked' : ''} ${extraClass} ${tier != null ? `tier-${tier}` : ''}`;
    const p = document.createElement('div'); p.className = 'pic';
    if (pic) p.appendChild(pic);
    const info = document.createElement('div');
    info.innerHTML = `<h4>${tierBadge(tier)}${esc(title)}</h4>${lines.map((l) => `<div class="meta">${l}</div>`).join('')}`
      + (tags.length ? `<div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : '');
    const acts = document.createElement('div'); acts.className = 'actions';
    for (const b of buttons) {
      const bt = document.createElement('button');
      bt.textContent = b.label; bt.disabled = !!b.disabled; if (b.primary) bt.className = 'primary';
      if (b.title) bt.title = b.title;
      bt.onclick = b.onClick;
      acts.appendChild(bt);
    }
    if (buttons.length) info.appendChild(acts);
    c.append(p, info);
    return c;
  }
  /** Ảnh pet cho thẻ cửa hàng, kèm phụ kiện (pet hiếm). */
  function petPic(p) {
    const spr = Sprites.pet(p);
    const box = document.createElement('div'); box.className = 'pet-pic-box';
    const cv = canvasOf(spr, 'pet-pic');
    const fx = document.createElement('div'); fx.className = 'pet-fx';
    box.append(cv, fx);
    const k = 54 / spr.sw;
    cv.style.filter = PackFx.applyFx(fx, spr.fx, k, PackFx.bbox(cv), spr.faces || p.faces) || '';
    return box;
  }
  function canvasOf(sprite, cls) {
    const c = document.createElement('canvas');
    Sprites.paint(c, sprite);
    if (cls) c.className = cls;
    return c;
  }
  const grid = (body) => { const g = document.createElement('div'); g.className = 'cards'; body.appendChild(g); return g; };
  const lockTxt = (lv) => (V.level < lv ? `🔒 Cần cấp ${lv}` : '');
  const workMinPerDay = () => {
    const sc = V.settings.schedule;
    const m = (t) => { const [h, mm] = t.split(':').map(Number); return h * 60 + mm; };
    let total = m(sc.end) - m(sc.start);
    if (sc.lunch && sc.lunch.enabled) total -= Math.max(0, Math.min(m(sc.end), m(sc.lunch.end)) - Math.max(m(sc.start), m(sc.lunch.start)));
    return Math.max(60, total);
  };
  function waterTimes(sp) { // số lần tưới mỗi ngày làm nếu tưới khi cây bắt đầu khát
    const per = sp.waterMinutes * (1 - CAT.rules.thirstyAt / 100);
    return Math.max(1, Math.round(workMinPerDay() / per));
  }

  function targetSlot() {
    if (panelArg != null && V.slots[panelArg] && V.slots[panelArg].stage === 'empty') return panelArg;
    const e = V.slots.find((s) => s.stage === 'empty');
    return e ? e.i : null;
  }

  function scenePic(kind, id) {
    if (kind === 'scene') return canvasOf(SceneSprites.object(id), 'scene-card-model');
    const swatch = document.createElement('div');
    swatch.className = 'scene-swatch'; swatch.dataset.scene = id;
    return swatch;
  }

  function renderSceneCatalog(body, shopping) {
    const note = document.createElement('div'); note.className = 'note';
    note.textContent = shopping
      ? 'Mô hình đứng cạnh nhà thú; phông nền phủ bầu trời phía sau chậu hoa. Mua một lần, đổi cảnh bất cứ lúc nào trong Kho đồ. Món có 🎡 nhận trực tiếp khi quay trúng.'
      : 'Bạn có thể đổi mô hình và phông nền bất cứ lúc nào. Mỗi loại dùng một món tại một thời điểm.';
    body.appendChild(note);
    for (const [kind, items, stock, selected, title] of [
      ['scene', CAT.sceneObjects, V.inventory.sceneObjects, V.scene.object, '🎠 Mô hình cạnh nhà thú'],
      ['background', CAT.backgrounds, V.inventory.backgrounds, V.scene.background, '🌄 Phông nền vườn'],
    ]) {
      const h = document.createElement('div'); h.className = 'section-title'; h.textContent = title; body.appendChild(h);
      const g = grid(body);
      if (!shopping) {
        const clear = document.createElement('button'); clear.textContent = 'Dùng cảnh mặc định';
        clear.disabled = !selected; clear.onclick = () => act({ type: 'equipScene', kind, id: null });
        body.insertBefore(clear, g);
      }
      for (const it of items) {
        const owned = !!stock[it.id];
        if (!shopping && !owned) continue;
        const active = selected === it.id;
        const buttons = owned
          ? [{ label: active ? 'Đang dùng' : 'Đặt vào vườn', primary: !active, disabled: active, onClick: () => act({ type: 'equipScene', kind, id: it.id }) }]
          : it.wheel
            ? [{ label: '🎡 Tới vòng quay', primary: true, onClick: () => openPanel('wheel') }]
            : [{ label: 'Mua & đặt', primary: true, disabled: V.level < it.level || V.money < it.price, onClick: () => act({ type: 'buy', kind, id: it.id }) }];
        g.appendChild(card({ pic: scenePic(kind, it.id), title: it.name, tier: it.tier,
          locked: shopping && !owned && (it.wheel || V.level < it.level),
          lines: [it.desc, active ? '<b>Đang ở vườn</b>' : owned ? 'Đã có trong kho' : it.wheel ? '🎡 Chỉ có từ Vòng quay may mắn' : `<span class="price">${it.price.toLocaleString('vi-VN')} xu</span> · Cấp ${it.level}`], buttons }));
      }
      if (!g.children.length) { const p = document.createElement('p'); p.className = 'meta'; p.textContent = 'Chưa có cảnh nào. Mua ở Cửa hàng › Cảnh vườn hoặc quay thưởng.'; g.appendChild(p); }
    }
  }

  function renderShop(body) {
    const g = grid(body);
    if (sub === 'scene') { g.remove(); renderSceneCatalog(body, true); return; }
    if (sub === 'seeds') {
      const ts = targetSlot();
      const plantIt = async (sp) => {
        if (!((V.inventory.seeds[sp.id] || 0) > 0)) { const b = await act({ type: 'buy', kind: 'seed', id: sp.id, qty: 1 }); if (!b.ok) return; }
        const r = await act({ type: 'plant', slot: ts, species: sp.id });
        if (r.ok) { panelArg = null; if (!V.slots.some((x) => x.stage === 'empty')) closePanel(); }
      };
      for (const sp of CAT.species) {
        const unlocked = V.unlocked.species.includes(sp.id);
        const lvOk = V.level >= sp.level;
        const have = V.inventory.seeds[sp.id] || 0;
        const tags = [`Nở sau ${dur(sp.bloomMinutes)}`, `Tưới ~${waterTimes(sp)} lần/ngày`];
        if (sp.window) tags.push(`Chỉ nở ${sp.window[0]}–${sp.window[1]}`);
        if (sp.regrow) tags.push(`Ra hoa lại ${sp.regrow.harvests} lần`);
        let lines; let buttons;
        if (!unlocked && sp.wheel) {
          lines = [`Bán ${sp.sell} xu · ${sp.exp} EXP`, '🎡 <b>Chỉ có từ Vòng quay may mắn</b> – quay trúng là mua được, không mất phí mở khoá.'];
          buttons = [{ label: '🎡 Tới vòng quay', primary: true, onClick: () => openPanel('wheel') }];
        } else if (!unlocked) {
          lines = [`Bán ${sp.sell} xu · ${sp.exp} EXP`, lvOk ? `🔒 Chưa mở khoá giống – <span class="price">${sp.unlock.toLocaleString('vi-VN')} xu</span>` : `🔒 Cần cấp ${sp.level}, rồi mở khoá ${sp.unlock.toLocaleString('vi-VN')} xu`];
          buttons = [{ label: `Mở khoá (${sp.unlock.toLocaleString('vi-VN')} xu)`, primary: true, disabled: !lvOk || V.money < sp.unlock, onClick: () => act({ type: 'unlock', kind: 'species', id: sp.id }) }];
        } else {
          lines = [`<span class="price">Hạt ${sp.seed} xu</span> · bán ${sp.sell} xu · ${sp.exp} EXP`, `Đang có: <b>${have}</b> hạt`];
          buttons = [
            { label: 'Mua 1', disabled: V.money < sp.seed, onClick: () => act({ type: 'buy', kind: 'seed', id: sp.id, qty: 1 }) },
            { label: 'Mua 5', disabled: V.money < sp.seed * 5, onClick: () => act({ type: 'buy', kind: 'seed', id: sp.id, qty: 5 }) },
            { label: ts == null ? 'Hết ô trống' : have ? `Gieo vào ô ${ts + 1}` : `Mua & gieo ô ${ts + 1}`, primary: true, disabled: ts == null || (!have && V.money < sp.seed), onClick: () => plantIt(sp) },
          ];
        }
        buttons.push({ label: 'Xem', onClick: () => openPanel('wiki', sp.id) });
        g.appendChild(card({ pic: canvasOf(Sprites.plant(sp, 'bloom')), title: sp.name, locked: !unlocked && (sp.wheel || !lvOk), lines, tags, buttons, tier: sp.tier }));
      }
    }
    if (sub === 'pots') {
      for (const p of CAT.pots.filter((x) => x.price > 0)) {
        const own = V.inventory.pots[p.id] || 0;
        const unlocked = V.unlocked.pots.includes(p.id);
        const lvOk = V.level >= p.level;
        if (!unlocked && p.wheel) {
          g.appendChild(card({ pic: canvasOf(Sprites.pot(p), 'small'), title: p.name, locked: true, tier: p.tier,
            lines: [p.desc, '🎡 <b>Chỉ có từ Vòng quay may mắn</b>'], buttons: [{ label: '🎡 Tới vòng quay', primary: true, onClick: () => openPanel('wheel') }] }));
          continue;
        }
        g.appendChild(card({
          pic: canvasOf(Sprites.pot(p), 'small'), title: p.name, locked: !unlocked && !lvOk, tier: p.tier,
          lines: [p.desc, unlocked ? `<span class="price">${p.price} xu / chậu</span> · trong kho: <b>${own}</b>` : lvOk ? `🔒 Mở khoá loại chậu: <span class="price">${p.unlock.toLocaleString('vi-VN')} xu</span>` : `🔒 Cần cấp ${p.level}, rồi mở khoá ${p.unlock.toLocaleString('vi-VN')} xu`],
          buttons: unlocked
            ? [{ label: 'Mua 1 chậu', primary: true, disabled: V.money < p.price, onClick: () => act({ type: 'buy', kind: 'pot', id: p.id }) }]
            : [{ label: `Mở khoá (${p.unlock.toLocaleString('vi-VN')} xu)`, primary: true, disabled: !lvOk || V.money < p.unlock, onClick: () => act({ type: 'unlock', kind: 'pot', id: p.id }) }],
        }));
      }
    }
    if (sub === 'decor') {
      g.remove();
      const note = document.createElement('div'); note.className = 'note';
      note.textContent = 'Mỗi chậu có 4 chỗ trang trí: mặt đất, mặt chậu, cạnh trái, cạnh phải. Đồ trang trí chỉ buff cho chậu được đặt. Mua xong vào Kho đồ › Trang trí để đặt.';
      body.appendChild(note);
      for (const [place, title] of [['soil', 'Đặt trên mặt đất'], ['front', 'Gắn mặt chậu'], ['side', 'Cắm cạnh chậu (trái/phải)']]) {
        const h = document.createElement('div'); h.className = 'section-title'; h.textContent = title; body.appendChild(h);
        const gg = grid(body);
        for (const d of CAT.potDecor.filter((x) => x.place === place)) {
          const own = V.inventory.decor[d.id] || 0;
          if (d.wheel && !V.unlocked.decor.includes(d.id)) {
            gg.appendChild(card({ pic: canvasOf(DecorSprites.potDecor(d.id), 'small'), title: d.name, locked: true, tier: d.tier,
              lines: [d.desc, '🎡 <b>Chỉ có từ Vòng quay may mắn</b>'], buttons: [{ label: '🎡 Tới vòng quay', primary: true, onClick: () => openPanel('wheel') }] }));
            continue;
          }
          gg.appendChild(card({
            pic: canvasOf(DecorSprites.potDecor(d.id), 'small'), title: d.name, locked: V.level < d.level, tier: d.tier,
            lines: [d.desc, `<span class="price">${d.price} xu</span>${own ? ` · trong kho: <b>${own}</b>` : ''}`, lockTxt(d.level)],
            buttons: [{ label: 'Mua', primary: true, disabled: V.level < d.level || V.money < d.price, onClick: () => act({ type: 'buy', kind: 'decor', id: d.id }) }],
          }));
        }
      }
      const h = document.createElement('div'); h.className = 'section-title'; h.textContent = '🏠 Nhà thú'; body.appendChild(h);
      if (!V.house) { const n2 = document.createElement('div'); n2.className = 'note'; n2.textContent = 'Có pet đầu tiên thì nhà thú sẽ xuất hiện ở góc phải vườn.'; body.appendChild(n2); return; }
      const gh = grid(body);
      const next = CAT.houseLevels[V.house.level];
      gh.appendChild(card({
        pic: canvasOf(DecorSprites.house(next ? next.level : V.house.level), 'small'), title: next ? `Nâng cấp: ${next.name}` : 'Nhà đã ở cấp cao nhất',
        lines: next ? [next.desc, `<span class="price">${next.price.toLocaleString('vi-VN')} xu</span>`] : [V.house.info.desc],
        buttons: next ? [{ label: 'Nâng cấp', primary: true, disabled: V.money < next.price, onClick: () => act({ type: 'upgradeHouse' }) }] : [],
      }));
      for (const d of CAT.houseDecor) {
        const own = V.inventory.houseDecor[d.id] || 0;
        gh.appendChild(card({
          pic: canvasOf(DecorSprites.houseDecor(d.id), 'small'), title: d.name, tier: d.tier,
          lines: [`${d.desc} (${CAT.houseSlotNames[d.place]})`, `<span class="price">${d.price} xu</span>${own ? ` · trong kho: <b>${own}</b>` : ''}`],
          buttons: [{ label: 'Mua', primary: true, disabled: V.money < d.price, onClick: () => act({ type: 'buy', kind: 'hdecor', id: d.id }) }],
        }));
      }
    }
    if (sub === 'pets') {
      g.remove();
      const note = document.createElement('div'); note.className = 'note';
      note.textContent = 'Pet không yêu cầu cấp – đủ xu là mua được (pet có 🎡 phải quay trúng ở Vòng quay may mắn trước). Mỗi vườn có 1 pet đi lại dọc vườn. Pet nào cũng chặn chắc chắn 1 lần hái trộm, sau đó ngủ 30 phút rồi tỉnh lại canh tiếp. Pet càng đắt càng đẹp, càng cầu kì.';
      body.appendChild(note);
      CAT.petTiers.forEach((tierName, t) => {
        const h = document.createElement('div'); h.className = 'section-title';
        h.innerHTML = `<span class="tier-label t${t}">${esc(tierName.toUpperCase())} · ${esc(CAT.tiers[t].vi)}</span>`;
        body.appendChild(h);
        const gg = grid(body);
        for (const p of CAT.pets.filter((x) => x.tier === t)) {
          const owned = V.pets.owned.includes(p.id);
          const active = V.pet && V.pet.id === p.id;
          const st = V.pets.status[p.id];
          const wheelLocked = p.wheel && !owned && !V.unlocked.pets.includes(p.id);
          const buttons = wheelLocked
            ? [{ label: '🎡 Tới vòng quay', primary: true, onClick: () => openPanel('wheel') }]
            : !owned
            ? [{ label: 'Mua', primary: true, disabled: V.money < p.price, onClick: () => act({ type: 'buy', kind: 'pet', id: p.id }) }]
            : active
              ? [{ label: 'Cho vào nhà', onClick: () => act({ type: 'setPet', id: null }) }]
              : [{ label: 'Cho ra vườn', primary: true, onClick: () => act({ type: 'setPet', id: p.id }) }];
          const c = card({
            pic: petPic(p), title: p.name, locked: wheelLocked, tier: t,
            lines: [
              owned ? (active ? '<b>Đang ở vườn</b>' : 'Đã có') : `<span class="price">${p.price.toLocaleString('vi-VN')} xu</span>${wheelLocked ? ' · 🎡 chỉ có từ Vòng quay' : p.wheel ? ' · 🎡 đã quay trúng' : ''}`,
              owned && st && st.blocks ? `Đã chặn trộm ${st.blocks} lần` : '',
              '',
            ],
            tags: [{ walk: 'Đi bộ', hop: 'Nhảy', fly: 'Bay', crawl: 'Bò', swim: 'Bơi' }[p.move]],
            buttons,
          });
          gg.appendChild(c);
        }
      });
    }
    if (sub === 'items') {
      for (const it of CAT.items) {
        const owned = it.once ? (V.unlocks[it.id] ? 'Đã có' : '') : `Đang có: ${V.inventory.items[it.id] || 0}`;
        g.appendChild(card({
          title: it.name, locked: V.level < it.level,
          lines: [it.desc, `<span class="price">${it.price} xu</span> · ${owned}`, lockTxt(it.level)],
          buttons: [{ label: 'Mua', primary: true, disabled: V.level < it.level || V.money < it.price || (it.once && V.unlocks[it.id]), onClick: () => act({ type: 'buy', kind: 'item', id: it.id }) }],
        }));
      }
      if (V.nextSlotPrice != null) {
        g.appendChild(card({
          title: 'Mở thêm ô chậu', lines: [`Vườn đang có ${V.slots.length}/${CAT.rules.maxSlots} ô.`, `<span class="price">${V.nextSlotPrice} xu</span> · cần cấp ${V.nextSlotLevel}`],
          buttons: [{ label: 'Mở ô', primary: true, disabled: V.money < V.nextSlotPrice || V.level < V.nextSlotLevel, onClick: () => act({ type: 'buySlot' }) }],
        }));
      }
    }
  }

  function renderBag(body) {
    if (sub === 'scene') { renderSceneCatalog(body, false); return; }
    if (sub === 'seeds') {
      const ts = targetSlot();
      const list = CAT.species.filter((x) => (V.inventory.seeds[x.id] || 0) > 0);
      if (!list.length) { body.innerHTML = '<div class="note">Kho chưa có hạt giống. Mua ở Cửa hàng hoặc mở quà hằng ngày 🎁.</div>'; return; }
      const g = grid(body);
      for (const sp of list) {
        g.appendChild(card({
          pic: canvasOf(Sprites.plant(sp, 'bloom')), title: sp.name, lines: [`Số hạt: <b>${V.inventory.seeds[sp.id]}</b>`],
          buttons: [{ label: ts == null ? 'Hết ô trống' : `Gieo vào ô ${ts + 1}`, primary: true, disabled: ts == null, onClick: () => act({ type: 'plant', slot: ts, species: sp.id }) }],
        }));
      }
      return;
    }
    if (sub === 'pots') {
      const note = document.createElement('div'); note.className = 'note';
      note.textContent = selected == null ? 'Bấm chọn một ô trong vườn (bên dưới), rồi chọn chậu để thay. Cây giữ nguyên.' : `Đang chọn ô ${selected + 1} (đang dùng ${POT[V.slots[selected].pot].name}).`;
      body.appendChild(note);
      const g = grid(body);
      const owned = CAT.pots.filter((p) => p.id === 'nhua' || (V.inventory.pots[p.id] || 0) > 0);
      for (const p of owned) {
        g.appendChild(card({
          pic: canvasOf(Sprites.pot(p), 'small'), title: p.name,
          lines: [p.desc, p.id === 'nhua' ? 'Không giới hạn' : `Số lượng: ${V.inventory.pots[p.id]}`],
          buttons: [{ label: selected == null ? 'Chọn ô trước' : `Đặt vào ô ${selected + 1}`, primary: true, disabled: selected == null, onClick: () => act({ type: 'placePot', slot: selected, pot: p.id }) }],
        }));
      }
    }
    if (sub === 'decor') {
      const note = document.createElement('div'); note.className = 'note';
      if (selected == null || !V.slots[selected]) {
        note.textContent = 'Bấm chọn một chậu trong vườn (bên dưới) để trang trí. Mỗi chậu có 4 chỗ.';
        body.appendChild(note);
      } else {
        const sl = V.slots[selected];
        const m = sl.mods;
        const pct = (x) => `${Math.round(x * 100)}%`;
        note.innerHTML = `Đang trang trí <b>chậu ô ${selected + 1}</b> (${esc(POT[sl.pot].name)}). Tổng buff chậu này: giữ ẩm x${m.water.toFixed(2)} · lớn nhanh +${pct(m.growth)} · tiền +${pct(m.sell)} · EXP +${pct(m.exp)} · chặn trộm ${pct(m.guard)}`;
        body.appendChild(note);
        const g = grid(body);
        CAT.potSlots.forEach((pos, k) => {
          const cur = sl.decor[k];
          const place = pos === 'left' || pos === 'right' ? 'side' : pos;
          const opts = CAT.potDecor.filter((d) => d.place === place && (V.inventory.decor[d.id] || 0) > 0);
          const buttons = opts.map((d) => ({ label: `${d.name} (${V.inventory.decor[d.id]})`, onClick: () => act({ type: 'placeDecor', slot: selected, pos, id: d.id }) }));
          if (cur) buttons.push({ label: 'Cất vào kho', onClick: () => act({ type: 'placeDecor', slot: selected, pos, id: null }) });
          g.appendChild(card({
            pic: cur ? canvasOf(DecorSprites.potDecor(cur), 'small') : null,
            title: CAT.slotNames[pos],
            lines: [cur ? `${esc(DEC[cur].name)}: ${esc(DEC[cur].desc)}` : 'Trống', !opts.length ? 'Kho không có món hợp chỗ này – mua ở Cửa hàng › Trang trí.' : ''],
            buttons,
          }));
        });
      }
      if (V.house) {
        const h = document.createElement('div'); h.className = 'section-title'; h.textContent = `🏠 Trang trí nhà thú (${V.house.info.name})`; body.appendChild(h);
        renderHouseSlots(body);
      }
    }
  }

  function renderWiki(body) {
    const note = document.createElement('div'); note.className = 'note';
    const sc = V.settings.schedule;
    note.innerHTML = 'Cây chỉ lớn và chỉ khát nước trong thời gian vườn hoạt động (đặt trong Cài đặt); ngoài thời gian đó cây "ngủ". '
      + 'Thời gian ra hoa được rút gọn: nhanh nhất 2 giờ, lâu nhất 8 giờ (gieo hôm nay, hôm sau nở). '
      + `Nước dưới ${CAT.rules.thirstyAt}% cây sẽ khát (lớn chậm 1 nửa); cạn nước lâu khoảng 5 giờ thì cây chết.`;
    body.appendChild(note);
    const g = grid(body); g.classList.add('wiki');
    const focus = typeof panelArg === 'string' ? panelArg : null;
    for (const sp of CAT.species) {
      const tags = [`Ngoài đời: ${sp.realDays}`, `Game: nở sau ${dur(sp.bloomMinutes)}`, `Cạn nước sau ${dur(sp.waterMinutes)}`, `~${waterTimes(sp)} lần tưới/ngày`, `Giữ hoa ${dur(sp.fadeMinutes)}`];
      if (sp.window) tags.push(`Nở ${sp.window[0]}–${sp.window[1]}`);
      if (sp.regrow) tags.push(`Lâu năm: ra nụ lại sau ${dur(sp.regrow.minutes)}, ${sp.regrow.harvests} lần`);
      tags.push(`Mở ở cấp ${sp.level}`);
      if (sp.wheel) tags.push('🎡 Vòng quay');
      const c = card({ pic: canvasOf(Sprites.plant(sp, 'bloom')), title: `${sp.name}`, lines: [`<i>${esc(sp.sci)}</i>`, esc(sp.info)], tags, locked: V.level < sp.level && !V.unlocked.species.includes(sp.id), tier: sp.tier });
      if (focus === sp.id) { c.style.outline = '3px solid var(--gold)'; setTimeout(() => c.scrollIntoView({ block: 'nearest' }), 0); }
      g.appendChild(c);
    }
  }

  function renderLog(body) {
    const st = V.stats;
    const head = document.createElement('div'); head.className = 'note';
    head.textContent = `Đã thu hoạch ${st.harvested} lần · tưới ${st.watered} lần · kiếm được ${st.earned} xu · bị hái trộm ${st.stolenFromMe} lần.`;
    body.appendChild(head);
    const ul = document.createElement('ul'); ul.className = 'log-list';
    if (!V.log.length) ul.innerHTML = '<li>Chưa có gì. Hãy gieo hạt đầu tiên!</li>';
    for (const l of V.log) {
      const li = document.createElement('li');
      const d = new Date(l.at);
      li.innerHTML = `<time>${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</time><span class="${esc(l.type)}">${esc(l.text)}</span>`;
      ul.appendChild(li);
    }
    body.appendChild(ul);
  }

  function renderSettings(body) {
    const s = V.settings; const sc = s.schedule;
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const f = document.createElement('div');
    f.className = 'form';
    f.innerHTML = `
      <label>Tên chủ vườn</label><input type="text" id="s-name" maxlength="24" value="${esc(s.ownerName)}" placeholder="Dùng khi chơi qua mạng LAN" />
      <label>Thời gian vườn hoạt động<br/><small>(riêng tư: chỉ lưu trên máy bạn, không hiện ở vườn)</small></label><span><input type="time" id="s-start" value="${esc(sc.start)}" /> đến <input type="time" id="s-end" value="${esc(sc.end)}" /></span>
      <label><input type="checkbox" id="s-lunch" ${sc.lunch.enabled ? 'checked' : ''}/> Tạm dừng giữa ngày</label>
      <span><input type="time" id="s-lstart" value="${esc(sc.lunch.start)}" /> đến <input type="time" id="s-lend" value="${esc(sc.lunch.end)}" /></span>
      <label>Ngày vườn hoạt động</label><span class="days">${days.map((d, i) => `<label><input type="checkbox" class="s-day" value="${i}" ${sc.workdays.includes(i) ? 'checked' : ''}/> ${d}</label>`).join('')}</span>
      <label>Vị trí thanh</label><select id="s-pos"><option value="bottom">Cạnh dưới màn hình</option><option value="top">Cạnh trên màn hình</option></select>
      <label>Độ rộng</label><select id="s-width"><option value="full">Hết chiều ngang</option><option value="compact">Gọn (góc phải)</option></select>
      <label>Tuỳ chọn</label><span>
        <label><input type="checkbox" id="s-top" ${s.alwaysOnTop ? 'checked' : ''}/> Luôn nằm trên cửa sổ khác</label><br/>
        <label><input type="checkbox" id="s-notify" ${s.notify ? 'checked' : ''}/> Thông báo khi cây khát / hoa nở</label><br/>
        <label><input type="checkbox" id="s-auto" ${s.autoStart ? 'checked' : ''}/> Chạy cùng Windows (bản đã đóng gói)</label><br/>
        <label><input type="checkbox" id="s-packs" ${s.usePacks ? 'checked' : ''}/> Dùng hình từ asset pack (nếu có)</label>
      </span>
      <label>Pet nói chuyện</label><span>
        <label><input type="checkbox" id="s-talk" ${s.petTalk !== false ? 'checked' : ''}/> Bật thoại của pet</label>
        <select id="s-talkrate" style="margin-left:8px"><option value="it">Ít nói</option><option value="vua">Vừa phải</option><option value="nhieu">Lắm mồm</option></select>
      </span>
      <label>Âm thanh</label><span>
        <label><input type="checkbox" id="s-music" ${s.music ? 'checked' : ''}/> Nhạc nền</label>
        <label style="margin-left:10px"><input type="checkbox" id="s-sfx" ${s.sfx ? 'checked' : ''}/> Âm thanh tương tác</label>
        <span style="margin-left:10px">Âm lượng <input type="range" id="s-vol" min="0" max="100" value="${Number(s.volume) || 0}" style="vertical-align:middle"/></span>
      </span>
      <span></span><span><button class="primary" id="s-save">Lưu cài đặt</button></span>`;
    body.appendChild(f);
    f.querySelector('#s-pos').value = s.position;
    f.querySelector('#s-width').value = s.barWidth;
    f.querySelector('#s-talkrate').value = s.talkRate || 'vua';
    f.querySelector('#s-save').onclick = async () => {
      const q = (id) => f.querySelector(id);
      const patch = {
        ownerName: q('#s-name').value.trim(),
        schedule: {
          start: q('#s-start').value, end: q('#s-end').value,
          lunch: { enabled: q('#s-lunch').checked, start: q('#s-lstart').value, end: q('#s-lend').value },
          workdays: [...f.querySelectorAll('.s-day')].filter((x) => x.checked).map((x) => Number(x.value)),
        },
        position: q('#s-pos').value, barWidth: q('#s-width').value,
        alwaysOnTop: q('#s-top').checked, notify: q('#s-notify').checked, autoStart: q('#s-auto').checked, usePacks: q('#s-packs').checked,
        petTalk: q('#s-talk').checked, talkRate: q('#s-talkrate').value,
        music: q('#s-music').checked, sfx: q('#s-sfx').checked, volume: Number(q('#s-vol').value),
      };
      const r = await act({ type: 'settings', patch });
      if (r.ok) { Sprites.setPacks(PACKS, patch.usePacks, renderAll); renderAll(); }
    };

    const t = document.createElement('div'); t.className = 'section-title'; t.textContent = 'Asset pack hình ảnh';
    body.appendChild(t);
    const pk = document.createElement('div'); pk.className = 'note';
    pk.innerHTML = PACKS.length
      ? PACKS.map((p) => `• <b>${esc(p.name)}</b>${p.author ? ` – ${esc(p.author)}` : ''}${p.license ? ` (${esc(p.license)})` : ''}`).join('<br/>')
      : 'Chưa có pack nào. Đặt pack vào thư mục <b>assets/packs/&lt;tên-pack&gt;/</b> kèm <b>manifest.json</b> (xem assets/packs/README.md). Đang dùng hình pixel mặc định.';
    body.appendChild(pk);
    const rb = document.createElement('button'); rb.textContent = 'Quét lại pack';
    rb.onclick = async () => { PACKS = await api.rescanPacks(); Sprites.setPacks(PACKS, V.settings.usePacks, renderAll); renderAll(); toast(`Tìm thấy ${PACKS.length} pack.`); };
    body.appendChild(rb);
    const q = document.createElement('button'); q.textContent = 'Thoát game'; q.style.marginLeft = '8px';
    q.onclick = () => api.quit();
    body.appendChild(q);
  }

  function renderHouseSlots(body) {
    const g = grid(body);
    for (const pos of CAT.houseSlots) {
      const cur = V.house.decor[pos];
      const opts = CAT.houseDecor.filter((d) => d.place === pos && (V.inventory.houseDecor[d.id] || 0) > 0);
      const buttons = opts.map((d) => ({ label: `${d.name} (${V.inventory.houseDecor[d.id]})`, onClick: () => act({ type: 'placeHouseDecor', pos, id: d.id }) }));
      if (cur) buttons.push({ label: 'Cất vào kho', onClick: () => act({ type: 'placeHouseDecor', pos, id: null }) });
      g.appendChild(card({
        pic: cur ? canvasOf(DecorSprites.houseDecor(cur), 'small') : null, title: CAT.houseSlotNames[pos],
        lines: [cur ? esc(HDEC[cur].name) : 'Trống', !opts.length ? 'Kho chưa có món cho chỗ này.' : ''], buttons,
      }));
    }
  }

  function renderHousePanel(body) {
    if (!V.house) { body.innerHTML = '<div class="note">Chưa có pet nên chưa có nhà thú.</div>'; return; }
    const wrap = document.createElement('div'); wrap.className = 'detail';
    const big = document.createElement('div'); big.className = 'big';
    const hc = canvasOf(DecorSprites.house(V.house.level)); hc.style.height = '120px';
    big.appendChild(hc);
    const info = document.createElement('div');
    const next = CAT.houseLevels[V.house.level];
    info.innerHTML = `<table><tr><td>Nhà hiện tại</td><td><b>${esc(V.house.info.name)}</b> (cấp ${V.house.level}/${CAT.houseLevels.length})</td></tr>`
      + `<tr><td>Pet ngủ sau khi chặn</td><td>${V.house.info.sleepMin} phút</td></tr>`
      + `<tr><td>Cấp tiếp theo</td><td>${next ? `${esc(next.name)} – ${next.price.toLocaleString('vi-VN')} xu (ngủ ${next.sleepMin} phút)` : 'Đã tối đa'}</td></tr></table>`;
    if (next) {
      const b = document.createElement('button'); b.className = 'primary'; b.style.marginTop = '8px';
      b.textContent = `Nâng cấp lên ${next.name}`; b.disabled = V.money < next.price;
      b.onclick = () => act({ type: 'upgradeHouse' });
      info.appendChild(b);
      const pv = canvasOf(DecorSprites.house(next.level)); pv.style.height = '60px'; pv.style.marginLeft = '10px'; pv.style.verticalAlign = 'middle'; pv.title = 'Nhà sau khi nâng cấp';
      info.appendChild(pv);
    }
    wrap.append(big, info); body.appendChild(wrap);
    const h = document.createElement('div'); h.className = 'section-title'; h.textContent = 'Trang trí nhà (mua đồ ở Cửa hàng › Trang trí)'; body.appendChild(h);
    renderHouseSlots(body);
  }

  function renderAdmin(body) {
    const note = document.createElement('div'); note.className = 'note';
    note.textContent = 'Dùng để test nhanh. Bảng này tự ẩn ở bản đóng gói .exe. "Tua" chạy vườn ngay cả ngoài thời gian hoạt động.';
    body.appendChild(note);
    const groups = [
      ['Tiền & cấp', [['+1.000 xu', { op: 'money', amount: 1000 }], ['+10.000 xu', { op: 'money', amount: 10000 }], ['+100.000 xu', { op: 'money', amount: 100000 }], ['+100 EXP', { op: 'exp', amount: 100 }], ['+1.000 EXP', { op: 'exp', amount: 1000 }], ['−100 EXP', { op: 'exp', amount: -100 }], ['+1 cấp', { op: 'level', amount: 1 }], ['−1 cấp', { op: 'level', amount: -1 }], ['+5 cấp', { op: 'level', amount: 5 }], ['+10 phân bón', { op: 'fert' }], ['+5 hạt mỗi giống', { op: 'seeds' }], ['Mở khoá tất cả', { op: 'unlockAll' }], ['Cho mở quà lại', { op: 'resetDaily' }], ['+1 lượt quay free', { op: 'freeSpin' }]]],
      ['Thời gian vườn', [['Tua 10 phút', { op: 'forward', minutes: 10 }], ['Tua 30 phút', { op: 'forward', minutes: 30 }], ['Tua 1 giờ', { op: 'forward', minutes: 60 }], ['Tua 3 giờ', { op: 'forward', minutes: 180 }], ['Tua 1 ngày (8 giờ)', { op: 'forward', minutes: 480 }]]],
      ['Cây & pet', [['Cho tất cả cây nở', { op: 'bloomAll' }], ['Làm tất cả cây khát', { op: 'thirstAll' }], ['Đánh thức pet', { op: 'wakePet' }], ['Giả lập hái trộm', { op: 'steal' }]]],
    ];
    for (const [title, btns] of groups) {
      const t = document.createElement('div'); t.className = 'section-title'; t.textContent = title; body.appendChild(t);
      const row = document.createElement('div'); row.className = 'admin-row';
      for (const [label, a] of btns) {
        const b = document.createElement('button'); b.textContent = label;
        b.onclick = () => act({ type: 'admin', ...a });
        row.appendChild(b);
      }
      body.appendChild(row);
    }
    const t = document.createElement('div'); t.className = 'section-title'; t.textContent = 'Tuỳ chỉnh'; body.appendChild(t);
    const row = document.createElement('div'); row.className = 'admin-row';
    row.innerHTML = 'Tiền <input type="number" id="ad-money" value="5000" style="width:90px"/> <button id="ad-money-btn">Cộng/trừ</button>'
      + ' &nbsp; EXP <input type="number" id="ad-exp" value="500" style="width:80px"/> <button id="ad-exp-btn">Cộng/trừ</button>'
      + ' &nbsp; Tua <input type="number" id="ad-min" value="45" style="width:70px"/> phút <button id="ad-min-btn">Tua</button>'
      + ' &nbsp; <button id="ad-reset" style="background:#ffd6d6">Chơi lại từ đầu</button>';
    body.appendChild(row);
    row.querySelector('#ad-money-btn').onclick = () => act({ type: 'admin', op: 'money', amount: Number(row.querySelector('#ad-money').value) });
    row.querySelector('#ad-exp-btn').onclick = () => act({ type: 'admin', op: 'exp', amount: Number(row.querySelector('#ad-exp').value) });
    row.querySelector('#ad-min-btn').onclick = () => act({ type: 'admin', op: 'forward', minutes: Number(row.querySelector('#ad-min').value) });
    row.querySelector('#ad-reset').onclick = () => { if (!needConfirm('reset', 'Bấm lần nữa để XOÁ vườn và chơi lại từ đầu.')) act({ type: 'adminReset' }); };
  }

  function renderDetail(body) {
    const s = V.slots[panelArg];
    if (!s || s.stage === 'empty') { body.textContent = 'Ô này đang trống.'; return; }
    const sp = SP[s.species];
    const wrap = document.createElement('div'); wrap.className = 'detail';
    const big = document.createElement('div'); big.className = 'big';
    big.append(canvasOf(Sprites.plant(sp, s.stage, { wilting: s.wilting })), canvasOf(Sprites.pot(POT[s.pot]), 'pot'));
    const rows = [
      ['Loài', `<b>${esc(sp.name)}</b> <i>(${esc(sp.sci)})</i>`],
      ['Giai đoạn', `${STAGE_VI[s.stage]}${s.waiting ? ` – chờ khung giờ ${s.window[0]}–${s.window[1]}` : ''}${s.old ? ' – cây đã già, không ra hoa nữa' : ''}`],
      ['Nước', `${s.water}%${s.thirstyInMin > 0 ? ` · khát sau ~${dur(s.thirstyInMin)} giờ` : s.stage !== 'dead' ? ' · <b>cần tưới!</b>' : ''}`],
      ['Sức khoẻ', `${s.health}%`],
    ];
    if (s.bloomInMin != null && !s.waiting) rows.push(['Nở sau', `~${dur(s.bloomInMin)} (nếu đủ nước)`]);
    if (s.fadeInMin != null) rows.push(['Tàn sau', `${dur(s.fadeInMin)}${s.window ? ` hoặc khi qua ${s.window[1]}` : ''}`]);
    if (s.value) rows.push(['Thu hoạch được', `${s.value.money} xu · ${s.value.exp} EXP`]);
    if (sp.regrow) rows.push(['Đã thu hoạch', `${s.harvests}/${sp.regrow.harvests} lần`]);
    if (s.fert > 0) rows.push(['Phân bón', `còn ${dur(s.fert)}`]);
    rows.push(['Chậu', `${POT[s.pot].name} – ${POT[s.pot].desc}`]);
    if (s.visitors && s.visitors.length) rows.push(['Được tưới hộ', s.visitors.map((v) => esc(v.by)).join(', ')]);
    if (s.theftMark) rows.push(['Dấu vết', `<b style="color:var(--red)">👣 ${esc(s.theftMark.by)} đã hái trộm!</b>`]);
    rows.push(['Ghi chú', esc(sp.info)]);
    const info = document.createElement('div');
    info.innerHTML = `<table>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>`;
    const acts = document.createElement('div'); acts.className = 'actions'; acts.style.marginTop = '8px';
    const add = (label, a, primary, dis) => { const b = document.createElement('button'); b.textContent = label; b.disabled = !!dis; if (primary) b.className = 'primary'; b.onclick = () => act(a); acts.appendChild(b); };
    add('💧 Tưới', { type: 'water', slot: s.i }, false, s.stage === 'dead' || s.water > CAT.rules.waterBlockAbove);
    add('✂ Thu hoạch', { type: 'harvest', slot: s.i }, true, !(s.stage === 'bloom' || s.stage === 'faded'));
    add(`🌱 Bón phân (${V.inventory.items.phan_bon || 0})`, { type: 'fertilize', slot: s.i }, false, s.stage === 'dead' || s.stage === 'bloom' || s.stage === 'faded' || s.old);
    if (s.theftMark) add('🧹 Dọn dấu vết', { type: 'clearTheft', slot: s.i });
    const dcb = document.createElement('button'); dcb.textContent = '🎀 Trang trí chậu';
    dcb.onclick = () => { selected = s.i; openPanel('bag', null, 'decor'); };
    acts.appendChild(dcb);
    const rm = document.createElement('button'); rm.textContent = '⛏ Nhổ cây';
    rm.onclick = () => { if (!needConfirm(`rm${s.i}`, 'Bấm lần nữa để nhổ cây')) act({ type: 'remove', slot: s.i }); };
    acts.appendChild(rm);
    info.appendChild(acts);
    wrap.append(big, info);
    body.appendChild(wrap);
  }

  // ------------------------------------------------------------ pet đi dạo
  const MOVE = { // tốc độ px/giây, xác suất dừng nghỉ mỗi giây
    walk: { speed: 26, rest: 0.25 }, hop: { speed: 34, rest: 0.3 }, crawl: { speed: 7, rest: 0.1 },
    fly: { speed: 32, rest: 0.12 }, swim: { speed: 20, rest: 0.15 },
  };
  const W = { id: null, x: 60, dir: 1, restUntil: 0, last: 0, nextTalk: 0, sayUntil: 0 };
  const TALK_EVERY = { it: 150000, vua: 75000, nhieu: 35000 };

  /** Pet nói 1 câu (bong bóng thoại trên đầu). */
  function petSay(text, ms = 6500) {
    const el = $('#pet .pet-say');
    if (!el || !text) return;
    el.textContent = text;
    el.classList.add('show');
    W.sayUntil = performance.now() + ms;
  }
  const petSleeping = () => !!(V && V.pet && V.pet.sleepMs > 0 && Date.now() < V.now + V.pet.sleepMs);

  function petFrame(ts) {
    requestAnimationFrame(petFrame);
    const box = $('#pet');
    const info = V && V.pet;
    if (!info || mode === 'collapsed') { box.classList.add('hidden'); W.id = null; return; }
    const p = PET[info.id];
    const cv = box.querySelector('canvas');
    const sleepingNow = petSleeping();
    const resting = ts < W.restUntil;
    const anim = sleepingNow ? 'sleep' : resting ? 'idle' : 'walk';
    const spr = Sprites.pet(p, anim);
    const frame = Math.floor(ts / (1000 / (spr.fps || 6)));
    const key = `${info.id}|${anim}|${spr.frames > 1 ? frame % spr.frames : 0}|${spr.src && spr.src.src}`;
    if (W.key !== key) {
      W.key = key;
      Sprites.paint(cv, spr, { frame, scale: GARDEN_SCALE });
    }
    if (W.id !== info.id || W.fxKey !== `${spr.sw}x${spr.sh}`) {
      W.id = info.id; W.fxKey = `${spr.sw}x${spr.sh}`;
      W.glow = PackFx.applyFx(box.querySelector('.pet-fx'), spr.fx, spr.scale || GARDEN_SCALE, PackFx.bbox(cv), spr.faces || p.faces);
      W.faces = spr.faces || p.faces;
      W.hasAnim = !!spr.hasAnim;
      box.title = p.name;
    }
    cv.style.filter = W.glow || '';
    // thoại ngẫu nhiên
    const say = box.querySelector('.pet-say');
    if (W.sayUntil && ts > W.sayUntil) { say.classList.remove('show'); W.sayUntil = 0; }
    if (V.settings.petTalk !== false) {
      const every = TALK_EVERY[V.settings.talkRate] || TALK_EVERY.vua;
      if (!W.nextTalk) W.nextTalk = ts + 8000;
      if (ts > W.nextTalk) {
        W.nextTalk = ts + every * (0.7 + Math.random() * 0.6);
        petSay(PetTalk.line({ V, CAT, SP, pet: p, sleeping: sleepingNow }));
      }
    }
    // bong bóng không tràn ra ngoài mép phải vườn
    const gw = $('#garden').clientWidth;
    say.classList.toggle('to-left', W.x > gw - 260);
    box.classList.remove('hidden');
    const dt = W.last ? Math.min(0.1, (ts - W.last) / 1000) : 0;
    W.last = ts;
    const garden = $('#garden');
    const houseW = V.house ? $('#house').clientWidth + 10 : 0;
    const maxX = Math.max(40, garden.clientWidth - houseW - cv.clientWidth - 6);
    const sleeping = sleepingNow;
    box.classList.toggle('at-home', sleeping && !!V.house);
    box.classList.toggle('sleeping', sleeping);
    const bub = box.querySelector('.pet-bubble');
    const m = MOVE[p.move] || MOVE.walk;
    let y = 0;
    if (sleeping) {
      const left = Math.ceil((V.now + V.pet.sleepMs - Date.now()) / 60000);
      bub.textContent = `💤 ${left}p`;
    } else {
      bub.textContent = '';
      if (!resting) {
        W.x += W.dir * m.speed * dt;
        if (W.x <= 4) { W.x = 4; W.dir = 1; }
        if (W.x >= maxX) { W.x = maxX; W.dir = -1; }
        if (Math.random() < m.rest * dt) {
          W.restUntil = ts + 1200 + Math.random() * 3500;
          if (Math.random() < 0.4) W.dir = -W.dir;
        }
      }
      const tt = ts / 1000;
      if (p.move === 'walk' && !resting && !W.hasAnim) y = Math.floor(tt * 6) % 2 ? 2 : 0;
      if (p.move === 'hop' && !resting) y = Math.abs(Math.sin(tt * 5)) * 12;
      if (p.move === 'fly') y = 46 + Math.sin(tt * 2.2) * 10;
      if (p.move === 'swim') y = 4 + Math.sin(tt * 3) * 3;
    }
    if (sleeping && V.house) { // về nhà ngủ: nằm trước cửa nhà thú
      const hb = $('#house');
      const door = DecorSprites.anchors(V.house.level).door;
      W.x = hb.offsetLeft + door[0] * GARDEN_SCALE - cv.clientWidth / 2;
      y = 0;
    } else if (W.x > maxX) W.x = maxX;
    const fc = W.faces || p.faces;
    const flip = fc === 'front' ? 1 : (fc === 'left' ? (W.dir > 0 ? -1 : 1) : (W.dir > 0 ? 1 : -1));
    box.style.transform = `translate(${Math.round(W.x)}px, ${-Math.round(y)}px)`;
    cv.style.transform = `scaleX(${flip})`;
    box.querySelector('.pet-fx').style.transform = `scaleX(${flip})`;
  }

  // ------------------------------------------------------------ vẽ tất cả
  let audioKey = '';
  function syncAudio() {
    const k = `${V.settings.music}|${V.settings.sfx}|${V.settings.volume}`;
    if (k === audioKey) return;
    audioKey = k;
    Sound.configure({ music: !!V.settings.music, sfx: V.settings.sfx !== false, vol: (Number(V.settings.volume) || 0) / 100 });
    const mb = $('#music-btn'); if (mb) mb.textContent = V.settings.music ? '♪ Nhạc: bật' : '♪ Nhạc: tắt';
  }

  function renderAll() {
    if (!V) return;
    syncAudio();
    renderHud(); renderSlots(); renderHouse(); renderScene(); renderTab(); renderMenu(); renderBell();
    if (panel) renderPanel();
  }

  // ------------------------------------------------------------ khởi động
  const r = await api.init();
  CAT = r.catalog; V = r.view; L = r.lan; PACKS = r.packs;
  CAT.species.forEach((x) => { SP[x.id] = x; });
  CAT.pots.forEach((x) => { POT[x.id] = x; });
  CAT.potDecor.forEach((x) => { DEC[x.id] = x; });
  const HDEC = {}; CAT.houseDecor.forEach((x) => { HDEC[x.id] = x; }); window.__HDEC = HDEC;
  CAT.pets.forEach((x) => { PET[x.id] = x; });
  Sprites.setPetCatalog(CAT.pets);
  Sprites.setPacks(PACKS, V.settings.usePacks, () => renderAll());
  Sprites.paint($('#tab-icon'), Sprites.plant(SP.van_tho, 'bloom'));

  api.onState((v) => {
    const prev = V;
    V = v;
    if (prev) {
      const was = (i, k) => prev.slots[i] && prev.slots[i][k];
      if (v.slots.some((x, i) => x.stage === 'bloom' && was(i, 'stage') !== 'bloom')) Sound.play('bloom');
      else if (v.slots.some((x, i) => x.thirsty && !was(i, 'thirsty'))) Sound.play('thirsty');
    }
    renderAll();
  });
  api.onLanState((v) => { L = v; if (panel === 'lan') renderPanel(); });
  api.onLayout(({ mode: m, position }) => {
    document.body.classList.toggle('pos-top', position === 'top');
    document.body.classList.toggle('pos-bottom', position !== 'top');
    setMode(m);
    if (m === 'panel' && panel) { $('#panel').classList.remove('hidden'); renderPanel(); }
  });

  $('#collapse').onclick = () => { panel = null; api.setLayout('collapsed'); };
  $('#wheel-btn').onclick = () => { Sound.play('open'); return panel === 'wheel' ? closePanel() : openPanel('wheel'); };
  $('#gift-btn').onclick = () => { lastGift = null; Sound.play('open'); return panel === 'gift' ? closePanel() : openPanel('gift'); };
  // cuộn ngang vườn bằng con lăn chuột (thanh cuộn được ẩn cho đẹp)
  $('#slots').addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { $('#slots').scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
  $('#bell').onclick = () => { Sound.play('open'); return panel === 'notify' ? closePanel() : openPanel('notify'); };
  $('#reset-shift').onclick = () => { if (!needConfirm('shift', 'Bấm lần nữa để vườn bắt đầu tính thời gian từ bây giờ.')) act({ type: 'resetShift' }); };
  if (r.dev) {
    $('#admin-btn').classList.remove('hidden');
    $('#admin-btn').onclick = () => (panel === 'admin' ? closePanel() : openPanel('admin'));
  }
  $('#tab').onclick = () => api.setLayout('bar');
  $('#panel-close').onclick = closePanel;
  document.querySelectorAll('#menu button[data-panel]').forEach((b) => {
    b.onclick = () => {
      Sound.play(panel === b.dataset.panel ? 'close' : 'open');
      return panel === b.dataset.panel ? closePanel() : openPanel(b.dataset.panel);
    };
  });
  $('#music-btn').onclick = () => act({ type: 'settings', patch: { music: !V.settings.music } });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (panel) closePanel(); else api.setLayout('collapsed'); }
    const n = Number(e.key);
    if (!e.target.closest('input') && n >= 1 && n <= TOOLS.length) { tool = TOOLS[n - 1].id; renderHud(); }
  });

  document.body.classList.toggle('pos-top', V.settings.position === 'top');
  setMode(r.mode || 'bar');
  renderAll();
  $('#pet').onclick = () => {
    const pi = V.pet; if (!pi) return;
    Sound.play('pet');
    petSay(PetTalk.line({ V, CAT, SP, pet: PET[pi.id], sleeping: petSleeping() }));
    toast(petSleeping()
      ? `${pi.name} đang ngủ, còn ${Math.ceil((V.now + pi.sleepMs - Date.now()) / 60000)} phút nữa mới canh vườn tiếp.`
      : `${pi.name} đang canh vườn 🛡 – sẽ chặn lần hái trộm tiếp theo (đã chặn ${pi.blocks} lần).`);
  };
  requestAnimationFrame(petFrame);
})();

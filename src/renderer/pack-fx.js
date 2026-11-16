'use strict';
/**
 * Công cụ cho ảnh từ asset pack:
 *  - deriveStage(): pack hoa chỉ có ảnh hoa nở → tự tạo các giai đoạn mầm / cây non / nụ
 *    bằng cách tách phần lá-thân (màu xanh + viền) khỏi phần hoa trong chính ảnh đó,
 *    nên giai đoạn tự vẽ luôn khớp nét và màu của pack.
 *  - FX: phụ kiện pixel (vương miện, hào quang, sừng, cánh, lấp lánh, phát sáng) để tạo
 *    pet hiếm từ ảnh thú có sẵn (kết hợp với filter đổi màu trong manifest).
 */
(function () {
  function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b); const mn = Math.min(r, g, b);
    const l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn;
    const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h;
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h * 60, s, l];
  }
  const isGreen = (r, g, b) => { const [h, s, l] = hsl(r, g, b); return h >= 55 && h <= 175 && s > 0.12 && l > 0.08 && l < 0.85; };
  const isDark = (r, g, b) => hsl(r, g, b)[2] < 0.22;

  /**
   * Tạo ảnh giai đoạn từ ảnh hoa nở (đã cắt sẵn, là canvas/ảnh w×h).
   * stage: sprout | young | bud. Trả về canvas hoặc null nếu không tách được lá.
   */
  function deriveStage(src, sx, sy, w, h, stage) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.drawImage(src, sx, sy, w, h, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h); const px = d.data;
    const kind = new Uint8Array(w * h); // 0 trong suốt, 1 lá, 2 viền, 3 hoa
    const counts = new Map();
    let fx0 = w, fx1 = -1, fy0 = h, fy1 = -1, gy0 = h, gy1 = -1;
    for (let i = 0; i < w * h; i++) {
      const r = px[i * 4], gg = px[i * 4 + 1], b = px[i * 4 + 2], a = px[i * 4 + 3];
      if (a < 40) continue;
      if (isGreen(r, gg, b)) kind[i] = 1;
      else if (isDark(r, gg, b)) kind[i] = 2;
      else {
        kind[i] = 3;
        const key = (r << 16) | (gg << 8) | b; counts.set(key, (counts.get(key) || 0) + 1);
        const x = i % w; const y = (i / w) | 0;
        fx0 = Math.min(fx0, x); fx1 = Math.max(fx1, x); fy0 = Math.min(fy0, y); fy1 = Math.max(fy1, y);
      }
      if (kind[i] === 1) { const y = (i / w) | 0; gy0 = Math.min(gy0, y); gy1 = Math.max(gy1, y); }
    }
    if (gy1 < 0) return null; // ảnh không có lá → để giao diện dùng hình mặc định
    // viền chỉ giữ khi nằm sát pixel lá
    const keep = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (kind[i] === 1) keep[i] = 1;
      else if (kind[i] === 2) {
        const x = i % w; const y = (i / w) | 0; let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h && kind[yy * w + xx] === 1) { near = true; break; }
        }
        if (near) keep[i] = 1;
      }
    }
    const height = gy1 - gy0 + 1;
    const cut = stage === 'sprout' ? gy1 - Math.max(3, Math.round(height * 0.3)) : stage === 'young' ? gy0 + Math.round(height * 0.35) : -1;
    const out = g.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const y = (i / w) | 0;
      if (keep[i] && y > cut) for (let k = 0; k < 4; k++) out.data[i * 4 + k] = px[i * 4 + k];
    }
    g.clearRect(0, 0, w, h);
    g.putImageData(out, 0, 0);
    if (stage === 'bud' && fx1 >= 0) {
      let best = 0, col = 0xcc3366;
      counts.forEach((n, k) => { if (n > best) { best = n; col = k; } });
      const hex = (v) => `#${v.toString(16).padStart(6, '0')}`;
      const dark = (v, f) => { const r = (v >> 16) * f, gg = ((v >> 8) & 255) * f, b = (v & 255) * f; return hex((r << 16) | (gg << 8) | b); };
      const cx = Math.round((fx0 + fx1) / 2);
      // đỉnh thân gần tâm hoa
      let top = fy1;
      for (let y = 0; y < h; y++) if ([cx - 1, cx, cx + 1].some((x) => x >= 0 && x < w && keep[y * w + x])) { top = y; break; }
      const by = Math.max(2, Math.min(top, fy1) - 1);
      g.fillStyle = dark(col, 0.55); g.fillRect(cx - 1, by - 3, 3, 4);
      g.fillStyle = hex(col); g.fillRect(cx, by - 3, 1, 3);
      g.fillStyle = dark(col, 0.35); g.fillRect(cx - 1, by + 1, 3, 1);
    }
    return c;
  }

  // ---------------------------------------------------------------- phụ kiện pet
  const ACC = {
    crown: { rows: ['y.y.y', 'yryby', 'yyyyy'], pal: { y: '#ffd23f', r: '#e63946', b: '#4cc9f0' }, at: 'top' },
    halo: { rows: ['.yyyyy.', 'y.....y', '.yyyyy.'], pal: { y: '#fff3b0' }, at: 'top', lift: 3 },
    horn: { rows: ['..y', '.yY', 'yY.', 'Y..'], pal: { y: '#ffe066', Y: '#f4a300' }, at: 'head' },
    wings: { rows: ['ww...', 'wWw..', 'wWWw.', '.wWWw', '..www'], pal: { w: '#ffffff', W: '#cfe8ff' }, at: 'back' },
    bow: { rows: ['p.p', 'pPp', 'p.p'], pal: { p: '#ff8fab', P: '#e63973' }, at: 'head' },
    flame: { rows: ['.o.', 'oyo', 'oyo', '.r.'], pal: { o: '#ff8c1a', y: '#ffd23f', r: '#e63946' }, at: 'tail' },
  };

  function accCanvas(id) {
    const a = ACC[id]; if (!a) return null;
    const w = Math.max(...a.rows.map((r) => r.length));
    const c = document.createElement('canvas'); c.width = w; c.height = a.rows.length;
    const g = c.getContext('2d');
    a.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (a.pal[ch]) { g.fillStyle = a.pal[ch]; g.fillRect(x, y, 1, 1); } }));
    return { c, at: a.at, lift: a.lift || 0 };
  }

  /**
   * Gắn phụ kiện vào khung pet. box: phần tử chứa canvas pet (position: relative).
   * fx: mảng như ["crown", "glow:#ffd23f", "sparkle", "wings"]. scale: số px màn hình mỗi pixel.
   * bb: khung chứa pixel thật của sprite {x0, y0, w, h}. faces: hướng nhìn của sprite gốc (left/right).
   */
  function applyFx(layer, fx, scale, bb, faces) {
    layer.innerHTML = '';
    const glow = [];
    for (const f of fx || []) {
      const [id, arg] = String(f).split(':');
      if (id === 'glow') { glow.push(arg || '#ffd23f'); continue; }
      if (id === 'sparkle') {
        for (let i = 0; i < 4; i++) {
          const s = document.createElement('i');
          s.className = 'fx-sparkle';
          s.style.left = `${10 + ((i * 37) % 80)}%`; s.style.top = `${(i * 23) % 70}%`;
          s.style.animationDelay = `${i * 0.35}s`;
          if (arg) s.style.background = arg;
          layer.appendChild(s);
        }
        continue;
      }
      const a = accCanvas(id); if (!a) continue;
      a.c.className = 'fx-acc';
      a.c.style.width = `${a.c.width * scale}px`;
      const front = faces === 'left' ? 0.25 : 0.75; // vị trí đầu theo hướng nhìn
      let left = 0.5; let top = bb.y0 - a.c.height - a.lift;
      if (a.at === 'head') { left = front; top = bb.y0 - a.c.height + 2; }
      if (a.at === 'back') { left = 0.5; top = bb.y0 + Math.round(bb.h * 0.2) - a.c.height + 1; }
      if (a.at === 'tail') { left = 1 - front; top = bb.y0 + Math.round(bb.h * 0.2) - a.c.height; }
      a.c.style.left = `${(bb.x0 + left * bb.w) * scale - (a.c.width * scale) / 2}px`;
      a.c.style.top = `${top * scale}px`;
      a.c.style.zIndex = a.at === 'back' ? '0' : '2';
      layer.appendChild(a.c);
    }
    return glow.map((col) => `drop-shadow(0 0 ${Math.max(2, scale)}px ${col})`).join(' ');
  }

  /** Khung pixel không trong suốt của canvas. */
  function bbox(cv) {
    const w = cv.width, h = cv.height;
    const d = cv.getContext('2d').getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return x1 < 0 ? { x0: 0, y0: 0, w, h } : { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  window.PackFx = { bbox, deriveStage, applyFx, ACC: Object.keys(ACC) };
})();

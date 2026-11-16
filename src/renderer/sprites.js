'use strict';
/**
 * Sprite pixel.
 *  1. Nếu có asset pack (assets/packs/<tên>/manifest.json) khai báo ảnh cho cây/chậu/đồ trang trí → dùng ảnh đó.
 *  2. Nếu không, vẽ sprite pixel mặc định bằng code (không vướng bản quyền).
 * Mọi sprite trả về { src: HTMLCanvasElement|HTMLImageElement, sx, sy, sw, sh, filter }.
 */
(function () {
  const PW = 20; // kích thước sprite cây mặc định
  const PH = 30;

  // ------------------------------------------------------------ màu
  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex([r, g, b]) {
    return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  function shade(h, k) { // k<0 tối hơn, k>0 sáng hơn
    const c = hexToRgb(h);
    return rgbToHex(c.map((v) => (k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  }
  function fade(h) { // màu hoa tàn: nhạt + ngả nâu
    const [r, g, b] = hexToRgb(h);
    const gray = (r + g + b) / 3;
    return rgbToHex([gray * 0.6 + 140 * 0.4, gray * 0.55 + 100 * 0.45, gray * 0.5 + 70 * 0.5]);
  }

  const LEAF = '#3f8f3a';
  const LEAF_L = '#72c04b';
  const LEAF_D = '#25602a';
  const STEM = '#2f7a34';
  const DRY = '#b08a3c';
  const DRY_D = '#7a5a28';
  const DEAD = '#6b4f32';

  // ------------------------------------------------------------ bút vẽ pixel
  function Pix(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    return {
      c, w, h,
      p(x, y, col) { if (col && x >= 0 && y >= 0 && x < w && y < h) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); } },
      r(x, y, rw, rh, col) { g.fillStyle = col; g.fillRect(x, y, rw, rh); },
      disc(cx, cy, rad, col) {
        for (let y = -Math.ceil(rad); y <= Math.ceil(rad); y++) {
          for (let x = -Math.ceil(rad); x <= Math.ceil(rad); x++) {
            if (x * x + y * y <= rad * rad + 0.3) this.p(cx + x, cy + y, col);
          }
        }
      },
      map(x0, y0, rows, pal) { // vẽ từ ma trận ký tự
        rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) this.p(x0 + x, y0 + y, pal[ch]); }));
      },
    };
  }

  /**
   * Viền chọn lọc: mỗi pixel trong suốt sát pixel màu được tô bằng màu đó làm tối đi.
   * Tạo nét viền kiểu pixel art "có tâm" mà không phải vẽ tay viền cho từng sprite.
   */
  function outline(c, k = 0.5) {
    const w = c.width, h = c.height;
    const g = c.getContext('2d');
    const src = g.getImageData(0, 0, w, h); const d = src.data;
    const out = g.createImageData(w, h); out.data.set(d);
    const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (A(x, y) > 40) continue;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => A(x + dx, y + dy) > 40);
      if (!nb) continue;
      const j = ((y + nb[1]) * w + (x + nb[0])) * 4; const i = (y * w + x) * 4;
      out.data[i] = d[j] * k; out.data[i + 1] = d[j + 1] * k; out.data[i + 2] = d[j + 2] * k; out.data[i + 3] = 255;
    }
    g.putImageData(out, 0, 0);
    return c;
  }

  // ------------------------------------------------------------ icon công cụ (12x12)
  const ICONS = {
    coin: { rows: ['...kkkk...', '..kyyyyk..', '.kyYYyyyk.', 'kyYyyyyyyk', 'kyYyykyyyk', 'kyyyykyyyk', 'kyyyykyyyk', '.kyyyyyyk.', '..kyyyyk..', '...kkkk...'], pal: { k: '#7a4f01', y: '#ffd23f', Y: '#fff3b0' } },
    hand: { rows: ['....kk......', '...kwwk.....', '...kwwk.....', '...kwwkkk...', '...kwwkwwkk.', '.kkkwwkwwkwk', 'kwwkwwwwwkwk', 'kwwwwwwwwwwk', '.kwwwwwwwwwk', '..kwwwwwwwk.', '...kwwwwwwk.', '....kkkkkk..'], pal: { k: '#3a2516', w: '#ffd9b3' } },
    can: { rows: ['............', '..kkk.......', '.k...k......', '.kkkkkkk...k', 'kbBBBBBbk.kb', 'kbBBBBBbkkbk', 'kbbBBBBbbbk.', 'kbbbBBBbk...', 'kbbbbbbbk...', 'kbbbbbbbk...', '.kkkkkkk....', '............'], pal: { k: '#1d3557', b: '#3a86ff', B: '#8ecae6' } },
    shovel: { rows: ['........kkk.', '.......kwwk.', '........kk..', '.......kbk..', '......kbk...', '.....kbk....', '..kkkbk.....', '.kSsskk.....', 'kSssk.......', 'kSssk.......', 'kssk........', '.kk.........'], pal: { k: '#3a2516', w: '#c08552', b: '#8d5a2b', s: '#adb5bd', S: '#e9ecef' } },
    bag: { rows: ['............', '...kkkkk....', '..kgggggk...', '..kkkkkkk...', '.kyyyyyyyk..', '.kyyGyyyyk..', '.kyGGGyyyk..', '.kyyGyyyyk..', '.kyyyyyyyk..', '.kyyyyyyyk..', '..kkkkkkk...', '............'], pal: { k: '#3a2516', g: '#6a994e', y: '#e9c46a', G: '#40916c' } },
    trash: { rows: ['....kkkk....', '.kkkkkkkkkk.', '.kssssssssk.', '..kkkkkkkk..', '..kgsgsgsk..', '..kgsgsgsk..', '..kgsgsgsk..', '..kgsgsgsk..', '..kgsgsgsk..', '...kkkkkk...', '............', '............'], pal: { k: '#2b2d42', s: '#adb5bd', g: '#6c757d' } },
  };
  function icon(name) {
    const d = ICONS[name]; const P = Pix(12, 12);
    if (d) P.map(0, 0, d.rows, d.pal);
    return { src: P.c, sx: 0, sy: 0, sw: 12, sh: 12 };
  }

  // ------------------------------------------------------------ thân & lá
  function stem(P, x, yBottom, height, opt) {
    const col = opt.dead ? DEAD : opt.dry ? DRY_D : STEM;
    let cx = x;
    for (let i = 0; i < height; i++) {
      const y = yBottom - i;
      if (opt.dry && i > height * 0.6) cx = x + Math.min(3, Math.floor((i - height * 0.6) / 2) + 1);
      P.p(cx, y, col);
    }
    return { topX: cx, topY: yBottom - height + 1 };
  }
  function leaf(P, x, y, dir, size, opt) {
    const a = opt.dead ? DEAD : opt.dry ? DRY : LEAF;
    const b = opt.dead ? DEAD : opt.dry ? DRY_D : LEAF_D;
    const l = opt.dead ? DEAD : opt.dry ? DRY : LEAF_L;
    const sy = opt.dry ? 1 : 0; // lá rũ khi khô
    for (let i = 1; i <= size; i++) {
      P.p(x + dir * i, y - (i < size ? 1 : 0) + (i > 1 ? sy : 0), i === size ? b : a);
      if (i < size - 1) P.p(x + dir * i, y + (i > 1 ? sy : 0), l);
    }
  }
  function leaves(P, x, yBottom, height, opt, every = 4, size = 3) {
    let side = 1;
    for (let i = 3; i < height - 2; i += every) {
      leaf(P, x, yBottom - i, side, size, opt);
      side = -side;
    }
  }
  function bud(P, x, y, col) {
    P.p(x, y - 2, shade(col, -0.2));
    P.r(x - 1, y - 1, 3, 2, shade(col, -0.25));
    P.p(x, y - 1, col);
    P.p(x - 1, y + 1, LEAF_D); P.p(x + 1, y + 1, LEAF_D); P.p(x, y + 1, LEAF);
  }

  // ------------------------------------------------------------ đầu hoa theo kiểu
  const HEADS = {
    star(P, x, y, [a, b]) {
      P.map(x - 2, y - 2, [' a a ', 'aAcAa', ' AcA ', 'a A a'], { a, A: shade(a, -0.15), c: b });
    },
    pompom(P, x, y, [a, b]) {
      P.disc(x, y, 3.6, shade(a, -0.25));
      P.disc(x, y - 0.5, 2.8, a);
      P.disc(x - 0.5, y - 1, 1.6, b);
      P.p(x - 2, y - 2, shade(b, 0.4)); P.p(x + 2, y, shade(a, -0.35)); P.p(x - 3, y + 1, shade(a, -0.35));
    },
    daisy(P, x, y, [a, b]) {
      const d = shade(a, -0.2);
      P.map(x - 4, y - 4, [
        '   a a   ', '  aada   ', ' a ddd a ', 'aad c daa', ' dd c dd ', 'aad c daa', ' a ddd a ', '   ada   ', '   a a   ',
      ], { a, d, c: b });
      P.r(x - 1, y - 1, 3, 3, b); P.p(x, y, shade(b, -0.35));
    },
    pansy(P, x, y, [a, b]) {
      const d = shade(a, -0.3);
      P.map(x - 4, y - 4, [
        ' aa   aa ', 'aaaa aaaa', 'aaaaaaaaa', ' bbbbbbb ', 'bbdbbbdbb', 'bbbdkdbbb', ' bbbkbbb ', '  bbbbb  ',
      ], { a, b, d, k: '#2b1d0e' });
    },
    sunflower(P, x, y, [a, b]) {
      P.disc(x, y, 5.6, shade(a, -0.15));
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        P.p(x + Math.round(Math.cos(ang) * 6), y + Math.round(Math.sin(ang) * 6), a);
      }
      P.disc(x, y, 4.4, a);
      P.disc(x, y, 3, b);
      for (const [dx, dy] of [[-1, -1], [1, 0], [0, 1], [-2, 1], [2, -2]]) P.p(x + dx, y + dy, shade(b, -0.4));
      P.p(x - 1, y - 2, shade(b, 0.3));
    },
    spike(P, x, y, [a, b]) {
      for (let i = 0; i < 9; i++) {
        const yy = y + 4 - i;
        const w = i > 6 ? 0 : 1;
        P.p(x, yy, i % 2 ? a : shade(a, -0.2));
        if (w) { P.p(x - 1 - (i % 2), yy, i % 3 ? a : b); P.p(x + 1 + ((i + 1) % 2), yy, shade(a, 0.25)); }
      }
      P.p(x, y - 5, shade(a, 0.3));
    },
    lotus(P, x, y, [a, b]) {
      P.map(x - 4, y - 5, [
        '    a    ', '   aAa   ', '  aaAaa  ', ' a aAa a ', 'aa aAa aa', 'aaaaAaaaa', ' aaaAaaa ', '  ayyya  ', '   ggg   ',
      ], { a: b, A: a, y: '#ffd23f', g: LEAF_D });
    },
    rose(P, x, y, [a, b]) {
      const d = shade(a, -0.35);
      P.map(x - 3, y - 3, [' aaaa ', 'aaddaa', 'adbbda', 'adbdda', 'aaddaa', ' aaaa '], { a, d, b });
      P.p(x - 3, y + 3, LEAF_D); P.p(x + 2, y + 3, LEAF_D);
    },
    trumpet(P, x, y, [a, b]) { // hoa hình phễu (bìm bìm)
      const d = shade(a, -0.3);
      P.map(x - 4, y - 3, ['aaaaaaaaa', 'aaabbbaaa', '.aabwbaa.', '..aabaa..', '...ada...', '....d....'], { a, b, w: '#fff7c2', d });
    },
    cluster(P, x, y, [a, b]) { // chùm hoa tròn (cẩm tú cầu)
      P.disc(x, y, 4.6, shade(a, -0.25));
      P.disc(x - 0.5, y - 0.5, 3.8, a);
      for (const [dx, dy] of [[-2, -2], [1, -3], [2, 0], [-3, 1], [0, 2], [-1, -1], [3, -2], [1, 3]]) P.p(x + dx, y + dy, b);
      for (const [dx, dy] of [[-1, -3], [2, -1], [-2, 2]]) P.p(x + dx, y + dy, shade(a, -0.4));
    },
    dahlia(P, x, y, [a, b]) { // thược dược: nhiều lớp cánh nhọn
      const d = shade(a, -0.3);
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        P.p(x + Math.round(Math.cos(ang) * 5), y + Math.round(Math.sin(ang) * 5), d);
        P.p(x + Math.round(Math.cos(ang) * 4), y + Math.round(Math.sin(ang) * 4), a);
      }
      P.disc(x, y, 3.4, a);
      for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2 + 0.3; P.p(x + Math.round(Math.cos(ang) * 2.6), y + Math.round(Math.sin(ang) * 2.6), b); }
      P.disc(x, y, 1.2, shade(a, -0.45));
    },
    cup(P, x, y, [a, b]) {
      P.map(x - 3, y - 4, ['a  a  a', 'aa aa a', 'aaaaaaa', 'aabaaad', 'aabaaad', ' aaaad ', '  aad  '], { a, b, d: shade(a, -0.3) });
    },
  };

  // ------------------------------------------------------------ cây theo kiểu
  function drawPlant(sp, stage, flags) {
    const P = Pix(PW, PH);
    const cols = stage === 'faded' ? sp.colors.map(fade) : sp.colors;
    const opt = { dry: flags.wilting && stage !== 'dead', dead: stage === 'dead' };
    const base = PH - 1;
    const x = 10;

    if (stage === 'seed') {
      P.r(7, base, 6, 1, '#6b4423');
      P.p(8, base - 1, '#4e2f16'); P.p(11, base - 1, '#4e2f16'); P.p(10, base, '#c99b5f');
      return P.c;
    }
    if (stage === 'sprout') {
      stem(P, x, base, 4, opt);
      leaf(P, x, base - 3, -1, 2, opt); leaf(P, x, base - 3, 1, 2, opt);
      return P.c;
    }

    const shape = sp.shape;
    const fullH = { sunflower: 22, spike: 16, lotus: 17, orchid: 18, cactus: 0, bract: 0, night: 0, star: 9, pansy: 12, trumpet: 15, cluster: 14, dahlia: 18 }[shape] ?? 16;

    if (shape === 'branch') { // mai / đào: cây cảnh thân gỗ, hoa nở trên cành
      const tr = opt.dead ? DEAD : '#6b4226'; const tl = opt.dead ? DEAD : '#8d5a2b';
      const h = stage === 'young' ? 10 : 16;
      for (let i = 0; i < h; i++) { const cx = x + (i > 6 ? (i > 11 ? 1 : -1) : 0); P.p(cx, base - i, tr); if (i < 5) P.p(cx + 1, base - i, tl); }
      const tips = [[-6, h - 2], [-3, h + 1], [3, h], [6, h - 3], [-5, h - 7], [5, h - 8]];
      const twig = (dx, dy) => { const steps = Math.max(Math.abs(dx), 2); for (let k = 1; k <= steps; k++) P.p(x + Math.round((dx * k) / steps), base - Math.round(h - 4 + ((dy - h + 4) * k) / steps), tr); };
      tips.forEach(([dx, dy]) => twig(dx, dy));
      if (stage === 'young') { tips.slice(0, 3).forEach(([dx, dy]) => P.p(x + dx, base - dy, opt.dry ? DRY : LEAF)); return P.c; }
      tips.forEach(([dx, dy], k) => {
        const fx = x + dx; const fy = base - dy;
        if (stage === 'bud') { P.p(fx, fy, shade(cols[0], -0.3)); if (k % 2) P.p(fx + 1, fy + 1, shade(cols[0], -0.3)); return; }
        if (stage === 'bloom' || stage === 'faded') {
          P.map(fx - 2, fy - 2, ['.a.a.', 'aaaaa', '.aba.', 'aaaaa', '.a.a.'], { a: cols[0], b: cols[1] === '#ffe5ec' ? '#d6336c' : '#c1440e' });
        }
      });
      return P.c;
    }

    // --- dạng đặc biệt (không phải 1 thân 1 hoa) ---
    if (shape === 'cactus') {
      const h = stage === 'young' ? 9 : 13;
      const g = opt.dead ? DEAD : opt.dry ? DRY : '#3a8f5c';
      const gd = opt.dead ? DEAD : opt.dry ? DRY_D : '#22603b';
      for (let i = 0; i < h; i++) {
        const w = i === h - 1 ? 3 : 5;
        P.r(x - Math.floor(w / 2), base - i, w, 1, g);
        P.p(x + 2 - (i === h - 1 ? 1 : 0), base - i, gd);
        if (i % 3 === 1) { P.p(x - 3, base - i, '#e9edc9'); P.p(x + 3, base - i, '#e9edc9'); }
      }
      P.p(x - 1, base - h + 2, shade(g, 0.3));
      if (stage === 'bud') bud(P, x, base - h - 1, cols[0]);
      if (stage === 'bloom' || stage === 'faded') {
        P.map(x - 3, base - h - 5, [' a a a ', 'aaAaAaa', ' aAyAa ', '  aaa  ', '   g   '], { a: cols[0], A: shade(cols[0], -0.2), y: '#fff3b0', g: LEAF });
      }
      return P.c;
    }
    if (shape === 'bract') {
      const h = stage === 'young' ? 10 : 15;
      stem(P, x, base, h, opt);
      for (let i = 2; i < h; i += 2) { leaf(P, x, base - i, i % 4 ? 1 : -1, 3 + (i % 3), opt); }
      if (stage === 'bud') { bud(P, x - 3, base - h + 3, cols[0]); bud(P, x + 3, base - h + 1, cols[0]); }
      if (stage === 'bloom' || stage === 'faded') {
        for (const [dx, dy] of [[-4, 3], [3, 1], [0, -1], [-2, 6], [4, 6], [-5, 9], [2, 9]]) {
          P.map(x + dx - 1, base - h + dy - 1, [' a ', 'aba', ' a '], { a: cols[0], b: '#fff' });
          P.p(x + dx + 1, base - h + dy + 1, cols[1]);
        }
      }
      return P.c;
    }
    if (shape === 'night') { // hoa quỳnh: thân dẹt dạng lá
      const lf = opt.dead ? DEAD : opt.dry ? DRY : '#4c9a2a';
      const lfd = opt.dead ? DEAD : opt.dry ? DRY_D : '#2d6a1f';
      P.map(x - 7, base - 13, [
        '        aa    ', '       aab    ', '      aab  aa ', ' aa  aab  aab ', 'aab aab  aab  ',
        ' aabaab aab   ', '  aaab aab    ', '   aab ab     ', '    aaab      ', '     aab      ',
        '     ab       ', '     ab       ', '     ab       ', '     ab       ',
      ], { a: lf, b: lfd });
      if (stage === 'bud') { P.p(x + 5, base - 9, '#f1e3d3'); P.r(x + 5, base - 8, 2, 2, '#e8c9b0'); P.p(x + 4, base - 6, '#c08a6e'); }
      if (stage === 'bloom' || stage === 'faded') {
        P.map(x - 1, base - 25, [
          '  a   a  ', ' aaa aaa ', 'aaaaWaaaa', ' aWyyyWa ', 'aaayyyaaa', ' aWyyyWa ', 'aaaaWaaaa', ' aaa aaa ', '  a   a  ', '    r    ', '    r    ', '   r     ', '   r     ',
        ], { a: cols[0], W: shade(cols[0], -0.12), y: cols[1], r: '#c08a6e' });
      }
      return P.c;
    }
    if (shape === 'orchid') {
      // lá gốc to
      const lf = opt.dead ? DEAD : opt.dry ? DRY : '#3f8f3a';
      P.map(x - 7, base - 3, ['aaa        aaa', 'aaaaa    aaaaa', ' aaaaaaaaaaaa ', '   aaaaaaaa   '], { a: lf });
      if (stage === 'young') return P.c;
      const h = 17;
      for (let i = 3; i < h; i++) P.p(x - 1 + Math.floor((i - 3) / 6), base - i, opt.dead ? DEAD : STEM);
      // cành cong ngang
      for (let i = 0; i < 7; i++) P.p(x + 1 + i, base - h + (i > 3 ? Math.floor((i - 3) / 2) : 0), opt.dead ? DEAD : STEM);
      if (stage === 'bud') { bud(P, x + 5, base - h + 2, cols[0]); bud(P, x + 8, base - h + 4, cols[0]); }
      if (stage === 'bloom' || stage === 'faded') {
        const fl = (fx, fy) => P.map(fx - 3, fy - 2, ['bb bb ', 'bbabbb', ' bpab ', 'bbabbb', ' b  b '], { a: cols[0], b: cols[1] === '#ffffff' ? '#ffd6ec' : cols[1], p: '#ffe066' });
        fl(x + 1, base - h - 1); fl(x + 6, base - h + 2); fl(x + 9, base - h + 6);
      }
      return P.c;
    }

    // --- dạng 1 thân + hoa ---
    const h = stage === 'young' ? Math.round(fullH * 0.6) : fullH;
    if (shape === 'lotus') { // lá sen tròn
      const lf = opt.dead ? DEAD : opt.dry ? DRY : '#4f9d3a';
      P.map(x - 9, base - 5, ['   aaaaa  ', ' aaaabaaaa', 'aaaaabaaaa', ' aaaabaaa '], { a: lf, b: shade(lf, -0.3) });
    }
    if (shape === 'star') { // mười giờ: cây bò thấp, nhiều nhánh lá kim
      for (const dx of [-4, 0, 4]) {
        const hh = stage === 'young' ? 4 : 6 + (dx === 0 ? 2 : 0);
        const t = stem(P, x + dx, base, hh, opt);
        P.p(t.topX - 1, t.topY + 2, opt.dry ? DRY : LEAF_L); P.p(t.topX + 1, t.topY + 3, opt.dry ? DRY : LEAF_L);
        if (stage === 'bud') bud(P, t.topX, t.topY - 1, cols[0]);
        if (stage === 'bloom' || stage === 'faded') HEADS.star(P, t.topX, t.topY - 2, cols);
      }
      return P.c;
    }

    const t = stem(P, x, base, h, opt);
    leaves(P, x, base, h, opt, shape === 'sunflower' ? 5 : 4, shape === 'sunflower' ? 4 : 3);
    if (stage === 'young' || stage === 'dead') {
      if (stage === 'dead') { P.p(t.topX + 1, t.topY + 1, DEAD); P.p(t.topX + 2, t.topY + 2, DEAD); }
      return P.c;
    }
    if (stage === 'bud') { bud(P, t.topX, t.topY - 1, cols[0]); return P.c; }
    const drop = stage === 'faded' || opt.dry ? 1 : 0;
    const headY = { sunflower: t.topY - 5, spike: t.topY - 4, lotus: t.topY - 3, pansy: t.topY - 3, rose: t.topY - 3, cup: t.topY - 3, cluster: t.topY - 4, dahlia: t.topY - 5, trumpet: t.topY - 2 }[shape] ?? t.topY - 3;
    (HEADS[shape] || HEADS.daisy)(P, t.topX + drop, Math.max(6, headY + drop), cols);
    return P.c;
  }

  // ------------------------------------------------------------ chậu
  /**
   * Chậu 18x13: đất có hạt, vành bo có vệt bóng, bóng đổ dưới vành, thân thuôn có đổ bóng 3 tông,
   * chân đế; hoạ tiết riêng theo loại chậu; viền chọn lọc cho mềm nét.
   */
  function drawPot(pot) {
    const W = 18; const H = 13;
    const P = Pix(W, H);
    const c = pot.color;
    const l2 = shade(c, 0.55); const l1 = shade(c, 0.25);
    const d1 = shade(c, -0.18); const d2 = shade(c, -0.36);
    // đất
    P.r(3, 0, 12, 1, '#7a4f2a'); P.r(2, 1, 14, 1, '#4a2c17');
    [4, 7, 11, 13].forEach((x) => P.p(x, 0, '#9c6b3f'));
    [5, 9, 12].forEach((x) => P.p(x, 1, '#2f1c0e'));
    // vành
    P.r(1, 2, 16, 2, c);
    P.r(2, 2, 14, 1, l1);
    P.r(3, 2, 3, 1, l2);
    P.p(16, 2, d1); P.p(16, 3, d2); P.p(15, 3, d1); P.p(1, 3, d1);
    // bóng dưới vành
    P.r(2, 4, 14, 1, d2);
    // thân
    const insets = [2, 2, 3, 3, 3, 4, 4];
    insets.forEach((ins, i) => {
      const y = 5 + i; const w = W - ins * 2;
      P.r(ins, y, w, 1, c);
      P.p(ins + 1, y, l1);
      P.p(ins + w - 2, y, d1); P.p(ins + w - 1, y, d2);
    });
    P.p(3, 5, l2); P.p(3, 6, l2); P.p(4, 7, l1);
    // chân đế
    P.r(4, 12, 10, 1, d2); P.r(5, 12, 8, 1, d1);
    // hoạ tiết
    if (pot.pattern === 'stripe') {
      P.r(3, 6, 12, 1, '#f1f5f9'); P.r(4, 9, 10, 1, '#f1f5f9');
      for (let x = 4; x < 14; x += 3) { P.p(x, 7, '#f1f5f9'); P.p(x + 1, 8, '#cfe2f3'); }
    }
    if (pot.pattern === 'shine') {
      P.p(5, 6, '#ffffff'); P.p(5, 7, l2); P.p(6, 6, l2);
      P.p(12, 9, l2); P.p(13, 8, '#ffffff');
    }
    if (pot.pattern === 'floral') { // gốm trắng vẽ hoa lam
      P.r(3, 6, 12, 1, '#2f5d9b'); P.r(4, 10, 10, 1, '#2f5d9b');
      [[5, 8], [9, 8], [13, 8]].forEach(([x, y]) => { P.p(x, y, '#2f5d9b'); P.p(x - 1, y, '#5b8fd6'); P.p(x + 1, y, '#5b8fd6'); P.p(x, y - 1, '#5b8fd6'); P.p(x, y + 1, '#5b8fd6'); });
    }
    if (pot.pattern === 'crystal') { // pha lê: mặt cắt sáng
      for (let y = 5; y < 12; y++) { P.p(6 + (y % 3), y, '#e0f7ff'); P.p(12 - (y % 2), y, '#7fcfee'); }
      P.p(4, 6, '#ffffff'); P.p(5, 5, '#ffffff'); P.p(13, 9, '#ffffff'); P.r(2, 2, 3, 1, '#ffffff');
    }
    if (pot.pattern === 'rainbow') { // các dải màu cầu vồng
      ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#c77dff'].forEach((col, i) => {
        const y = 5 + i; const ins = [2, 2, 3, 3, 3, 4, 4][i]; P.r(ins, y, 18 - ins * 2, 1, col); P.p(ins + 1, y, shade(col, 0.4));
      });
      P.r(1, 2, 16, 2, '#ffffff'); P.r(2, 2, 14, 1, '#ffe5f1');
    }
    if (pot.pattern === 'drip') { // sành men chảy
      P.r(1, 2, 16, 2, '#5c3d2e'); [3, 6, 9, 12, 15].forEach((x, i) => { P.r(x, 4, 1, 2 + (i % 3), '#3e2723'); });
      P.p(4, 8, d1); P.p(11, 9, d1);
    }
    if (pot.pattern === 'weave') { // tre đan
      for (let y = 5; y < 12; y++) for (let x = 3; x < 15; x++) if ((x + y) % 4 === 0) P.p(x, y, d1); else if ((x - y + 20) % 4 === 0) P.p(x, y, l1);
      P.r(1, 2, 16, 2, '#a0703d'); P.r(2, 2, 14, 1, '#c9a26b');
    }
    if (pot.pattern === 'marble') { // vân đá cẩm thạch
      [[3, 6], [4, 7], [5, 7], [6, 8], [8, 8], [9, 9], [10, 9], [12, 6], [13, 7], [7, 10], [11, 11]].forEach(([x, y], i) => P.p(x, y, i % 2 ? '#adb5bd' : '#7fb8a8'));
      P.r(1, 2, 16, 1, '#ffd23f'); P.r(4, 12, 10, 1, '#ffd23f');
    }
    if (pot.pattern === 'galaxy') { // ngân hà: nền tím đậm, sao lấp lánh
      [[4, 6], [8, 7], [12, 6], [6, 9], [10, 10], [13, 9], [7, 11], [9, 5]].forEach(([x, y], i) => P.p(x, y, i % 3 ? '#ffffff' : '#ffd6ff'));
      P.p(11, 8, '#7b2cbf'); P.p(5, 8, '#9d4edd'); P.r(1, 2, 16, 1, '#c77dff');
    }
    if (pot.id === 'go') { for (let x = 4; x < 14; x += 3) P.r(x, 5, 1, 7, d1); P.r(1, 3, 16, 1, d1); }
    if (pot.id === 'su_trang') { P.r(3, 7, 12, 1, '#8fb3de'); P.p(8, 9, '#8fb3de'); P.p(9, 9, '#8fb3de'); }
    if (pot.id === 'dat_nung') { [[5, 8], [10, 7], [12, 10], [7, 10]].forEach(([x, y]) => P.p(x, y, d1)); }
    if (pot.id === 'nhua') { P.r(3, 8, 12, 1, d1); }
    return outline(P.c, 0.42);
  }

  // ------------------------------------------------------------ đồ trang trí (16x16)
  const DECOR_MAP = {
    hang_rao: { rows: ['                ', '  a     a     a ', ' aba   aba   ab', ' aba   aba   ab', 'ccccccccccccccc', ' aba   aba   ab', ' aba   aba   ab', ' aba   aba   ab', 'ccccccccccccccc', ' aba   aba   ab', ' aba   aba   ab', ' aba   aba   ab'], pal: { a: '#c08552', b: '#8d5a2b', c: '#a0703d' } },
    den_long: { rows: ['       k        ', '      kkk       ', '     yyyyy      ', '    rrrrrrr     ', '   rrRrrrRrr    ', '   rrRryrRrr    ', '   rrRrrrRrr    ', '   rrRrrrRrr    ', '    rrrrrrr     ', '     yyyyy      ', '      y y       ', '      y y       '], pal: { k: '#333', y: '#ffd23f', r: '#d62828', R: '#9d0208' } },
    chuong_gio: { rows: ['      bbbb      ', '     bbbbbb     ', '      s  s      ', '    s s  s s    ', '    s g  g s    ', '    g g  g g    ', '    g    g g    ', '    g      g    ', '       ss       ', '       pp       ', '       pp       '], pal: { b: '#8d5a2b', s: '#bbb', g: '#e9c46a', p: '#90e0ef' } },
    ech_gom: { rows: ['                ', '                ', '                ', '    ee    ee    ', '   eWke  eWke   ', '   gggggggggg   ', '  gggggggggggg  ', '  ggrrrrrrrrgg  ', '  gggggggggggg  ', ' Lggg gggg gggL ', ' LL gg    gg LL ', '                '], pal: { e: '#52b788', W: '#fff', k: '#111', g: '#40916c', r: '#2d6a4f', L: '#2d6a4f' } },
    ghe_da: { rows: ['                ', '                ', '                ', '                ', ' aaaaaaaaaaaaaa ', ' bbbbbbbbbbbbbb ', '                ', ' aaaaaaaaaaaaaa ', ' bbbbbbbbbbbbbb ', '  cc        cc  ', '  cc        cc  ', '  cc        cc  '], pal: { a: '#adb5bd', b: '#6c757d', c: '#495057' } },
    meo_ngu: { rows: ['                ', '                ', '                ', '                ', '  o o           ', '  ooo  oooooo   ', ' oooooooooooooo ', ' oko kooOOoOoooo', ' oooooooooooooo ', '  oooooooooooo t', '               t', '                '], pal: { o: '#f4a261', O: '#e76f51', k: '#3d2c1e', t: '#e76f51' } },
    bu_nhin: { rows: ['     yyyyy      ', '    yyyyyyy     ', '     ffff       ', '     fkfk       ', '     ffff       ', ' bbbbbbbbbbbb   ', '   rrrrrrr      ', '   rrbbbrr      ', '   rrrrrrr      ', '      b         ', '      b         ', '      b         '], pal: { y: '#e9c46a', f: '#f4d6a0', k: '#222', b: '#8d5a2b', r: '#457b9d' } },
    dai_phun: { rows: ['       w        ', '      w w       ', '     w   w      ', '      ss        ', '      ss        ', '    ssssss      ', '   wwwwwwww     ', '  ssssssssss    ', '  swwwwwwwws    ', '  ssssssssss    ', '    ssssss      ', '    ssssss      '], pal: { w: '#90e0ef', s: '#adb5bd' } },
  };
  function drawDecor(id) {
    const d = DECOR_MAP[id];
    const P = Pix(16, 12);
    if (d) P.map(0, 0, d.rows, d.pal);
    return P.c;
  }

  // ------------------------------------------------------------ asset pack
  const imgCache = new Map();
  function loadImg(url) {
    if (imgCache.has(url)) return imgCache.get(url);
    const img = new Image();
    const entry = { img, ok: false, waiters: [] };
    img.onload = () => { entry.ok = true; entry.waiters.forEach((f) => f()); entry.waiters = []; };
    img.onerror = () => { entry.failed = true; };
    img.src = url;
    imgCache.set(url, entry);
    return entry;
  }

  let packs = [];
  let usePacks = true;
  let onPackImageLoaded = () => {};

  function packRef(group, id, stage) {
    if (!usePacks) return null;
    for (let i = packs.length - 1; i >= 0; i--) { // pack sau ghi đè pack trước
      const g = packs[i][group];
      const ent = g && g[id];
      if (!ent) continue;
      const ref = stage ? ent[stage] : ent;
      if (ref && ref.url) return ref;
    }
    return null;
  }

  /** Ô ảnh từ manifest. ref có thể có: x,y,w,h (cắt), frames,dx,fps (hoạt ảnh ngang), filter (đổi màu CSS), scale. */
  function fromRef(ref, filter) {
    const e = loadImg(ref.url);
    if (e.failed) return null;
    if (!e.ok) { e.waiters.push(() => onPackImageLoaded()); return null; }
    const f = [ref.filter, filter].filter(Boolean).join(' ');
    return {
      src: e.img, sx: ref.x || 0, sy: ref.y || 0, sw: ref.w || e.img.naturalWidth, sh: ref.h || e.img.naturalHeight,
      filter: f, fromPack: true, scale: ref.scale || null, frames: ref.frames || 1, dx: ref.dx || ref.w || 0, fps: ref.fps || 6,
    };
  }

  /** Giai đoạn tự tạo từ ảnh hoa nở của pack (xem pack-fx.js). */
  function derived(ref, stage) {
    const s = fromRef(ref, '');
    if (!s || !window.PackFx) return null;
    const key = `dv:${ref.url}:${s.sx}:${s.sy}:${s.sw}:${s.sh}:${stage}`;
    const c = cached(key, () => window.PackFx.deriveStage(s.src, s.sx, s.sy, s.sw, s.sh, stage));
    return c ? { ...whole(c), filter: ref.filter || '', fromPack: true, scale: ref.scale || null } : null;
  }

  // ------------------------------------------------------------ API
  const cache = new Map();
  function cached(key, fn) {
    if (!cache.has(key)) cache.set(key, fn());
    return cache.get(key);
  }
  const whole = (c) => ({ src: c, sx: 0, sy: 0, sw: c.width, sh: c.height });

  function plant(sp, stage, flags = {}) {
    if (stage === 'empty') return null;
    let ref = packRef('plants', sp.id, stage);
    let filter = '';
    if (!ref && ['sprout', 'young', 'bud'].includes(stage)) {
      const bloom = packRef('plants', sp.id, 'bloom');
      const d = bloom && derived(bloom, stage);
      if (d) {
        if (flags.wilting) d.filter = `${d.filter} sepia(0.6) saturate(0.6)`.trim();
        return d;
      }
    }
    if (!ref && stage === 'faded') { ref = packRef('plants', sp.id, 'bloom'); filter = 'saturate(0.35) sepia(0.45) brightness(0.9)'; }
    if (ref) {
      if (flags.wilting) filter += ' sepia(0.6) saturate(0.6)';
      const s = fromRef(ref, filter.trim());
      if (s) return s;
    }
    const key = `p:${sp.id}:${stage}:${flags.wilting ? 1 : 0}`;
    return whole(cached(key, () => outline(drawPlant(sp, stage, flags), 0.45)));
  }

  function pot(p) {
    const ref = packRef('pots', p.id);
    const s = ref && fromRef(ref, '');
    return s || whole(cached(`pot:${p.id}`, () => drawPot(p)));
  }

  function decor(id) {
    const ref = packRef('decor', id);
    const s = ref && fromRef(ref, '');
    return s || whole(cached(`d:${id}`, () => outline(drawDecor(id), 0.45)));
  }

  /**
   * Tạo dải khung hình chuyển động cho pet vẽ bằng code:
   *  walk: 4 khung – chân bước (2 hàng dưới lệch trái/phải), thân nhún lên 1px.
   *  idle: 2 khung – thở (thân hạ 1px). sleep: 2 khung thở chậm.
   */
  function drawPetFrames(p, anim) {
    const rows = p.rows;
    const w = Math.max(...rows.map((r) => r.length)) + 2;
    const h = rows.length + 1;
    const pal = {};
    for (const [k, v] of Object.entries(p.pal)) if (k !== '.') pal[k] = v;
    const filled = rows.map((r) => /[^.\s]/.test(r));
    const last = filled.lastIndexOf(true);
    const legStart = Math.max(0, last - 1); // 2 hàng cuối là chân
    const n = anim === 'walk' ? 4 : 2;
    const P = Pix(w * n, h);
    for (let f = 0; f < n; f++) {
      const x0 = f * w + 1;
      let bodyDy = 1; let legDx = 0;
      if (anim === 'walk') { bodyDy = f % 2 ? 0 : 1; legDx = f === 1 ? 1 : f === 3 ? -1 : 0; }
      if (anim !== 'walk' && f === 1) bodyDy = 1;
      rows.forEach((row, y) => {
        const isLeg = y >= legStart && anim === 'walk' && p.move !== 'fly' && p.move !== 'swim';
        const dx = isLeg ? legDx : 0;
        const dy = isLeg ? 1 : (anim === 'walk' ? bodyDy : (f === 1 && y < legStart ? 1 : 0) + (anim === 'walk' ? 0 : 0));
        [...row].forEach((ch, x) => {
          if (!pal[ch]) return;
          P.p(x0 + x + dx, y + (anim === 'walk' ? dy : (f === 1 && y < legStart ? 1 : 0)), pal[ch]);
          // thân nhún lên thì kéo dài hàng chân trên cùng để không hở khe giữa thân và chân
          if (isLeg && bodyDy === 0 && y === legStart) P.p(x0 + x, y, pal[ch]);
        });
      });
    }
    return { c: P.c, w, h, n };
  }

  function drawPetRows(p) {
    const w = Math.max(...p.rows.map((r) => r.length));
    const P = Pix(w, p.rows.length);
    const pal = {};
    for (const [k, v] of Object.entries(p.pal)) if (k !== '.') pal[k] = v;
    P.map(0, 0, p.rows, pal);
    return P.c;
  }

  /**
   * Sprite pet. Manifest pet có thể là 1 ảnh, hoặc { walk, idle, sleep, filter, fx, faces, scale }.
   * anim: walk | idle | sleep. Kết quả có thêm fx (phụ kiện) và faces (hướng nhìn) để giao diện dùng.
   */
  function pet(p, anim = 'walk') {
    if (usePacks) {
      for (let i = packs.length - 1; i >= 0; i--) {
        const ent = packs[i].pets && packs[i].pets[p.id];
        if (!ent) continue;
        const ref = ent.url ? ent : (ent[anim] || ent.walk || ent.idle || ent.sleep);
        if (!ref || !ref.url) continue;
        const s = fromRef({ ...ref, filter: [ent.filter, ref.filter].filter(Boolean).join(' '), scale: ref.scale || ent.scale }, '');
        if (s) return { ...s, fx: ent.fx || [], faces: ent.faces || ref.faces || 'right', hasAnim: !ent.url };
      }
    }
    if (p.base && PET_BY_ID[p.base]) { // pet hiếm: dựng từ pet có sẵn + đổi màu + phụ kiện
      const b = PET_BY_ID[p.base];
      const s = pet(b, anim);
      return { ...s, filter: [s.filter, p.filter].filter(Boolean).join(' '), fx: p.fx || [], faces: s.faces || b.faces };
    }
    const fr = cached(`petf:${p.id}:${anim}`, () => drawPetFrames(p, anim));
    return {
      src: fr.c, sx: 0, sy: 0, sw: fr.w, sh: fr.h, frames: fr.n, dx: fr.w,
      fps: anim === 'walk' ? (p.move === 'crawl' ? 3 : 7) : anim === 'idle' ? 1.5 : 0.8,
      fx: p.fx || [], faces: p.faces, hasAnim: true,
    };
  }
  const PET_BY_ID = {};
  function setPetCatalog(list) { (list || []).forEach((p) => { PET_BY_ID[p.id] = p; }); }

  /** Vẽ sprite vào <canvas>: canvas lấy đúng kích thước sprite, CSS phóng to bằng image-rendering: pixelated. */
  function paint(canvas, s, opt = {}) {
    if (!s) { canvas.width = 1; canvas.height = 1; canvas.getContext('2d').clearRect(0, 0, 1, 1); return; }
    canvas.width = s.sw; canvas.height = s.sh;
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, s.sw, s.sh);
    const frame = s.frames > 1 ? (opt.frame || 0) % s.frames : 0;
    g.filter = s.filter || 'none'; // nướng filter đổi màu vào ảnh
    g.drawImage(s.src, s.sx + frame * (s.dx || s.sw), s.sy, s.sw, s.sh, 0, 0, s.sw, s.sh);
    g.filter = 'none';
    canvas.style.filter = '';
    canvas.classList.toggle('from-pack', !!s.fromPack);
    if (opt.scale) { // giữ cùng một tỉ lệ pixel cho mọi sprite trong vườn
      const k = s.scale || opt.scale;
      canvas.style.width = `${s.sw * k}px`;
      canvas.style.height = `${s.sh * k}px`;
    }
  }

  function setPacks(list, enabled, onLoaded) {
    packs = list || [];
    usePacks = enabled !== false;
    onPackImageLoaded = onLoaded || (() => {});
  }

  /** Ảnh PNG data-URL (dùng làm icon). */
  function iconDataUrl(sp, scale = 4) {
    const src = drawPlant(sp, 'bloom', {});
    const c = document.createElement('canvas');
    c.width = src.width * scale; c.height = src.height * scale;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }

  window.Sprites = { plant, pot, decor, pet, icon, setPetCatalog, outline, Pix, paint, setPacks, iconDataUrl, PW, PH };
})();
